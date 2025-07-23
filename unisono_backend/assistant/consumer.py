import json
import numpy as np
import asyncio
from datetime import datetime, timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from .audio_processor import AudioProcessor
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
import os
import logging
from django.conf import settings
from .mongodb_client import mongodb_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Singleton AudioProcessor Instance ---
# This singleton instance will be created only once when the server starts.
# All WebSocket connections will share this same instance, avoiding model reloading.
audio_processor_singleton = None
_audio_processor_lock = asyncio.Lock()

def get_audio_processor():
    """Get the singleton AudioProcessor instance, creating it if necessary."""
    global audio_processor_singleton
    if audio_processor_singleton is None:
        logger.info("🚀 Creating singleton AudioProcessor instance (this may take a few minutes for first load)...")
        
        # Configure Gemini API (now that Django settings are available)
        try:
            api_key = getattr(settings, 'GEMINI_API_KEY', None)
            if not api_key:
                logger.error("GEMINI_API_KEY not configured in Django settings")
                api_key = "dummy-key"  # Will cause error later but allows initialization
            genai.configure(api_key=api_key)  # type: ignore
            logger.info("✅ Gemini API configured successfully")
        except Exception as e:
            logger.error(f"❌ Failed to configure Gemini API: {e}")
        
        try:
            audio_processor_singleton = AudioProcessor()
            logger.info("✅ Singleton AudioProcessor instance created successfully - all models loaded and ready!")
        except Exception as e:
            logger.error(f"❌ Failed to create singleton AudioProcessor: {e}")
            raise
    else:
        logger.debug("♻️  Returning existing singleton AudioProcessor instance")
    return audio_processor_singleton

# Initialize the singleton at module import time (when Django app is ready)
logger.info("🔄 Consumer module imported - AudioProcessor singleton will be created on first use")

# Gemini API will be configured when the singleton is first created

# --- Tool Definitions for Gemini ---

# 1. Key Point Extraction
extract_key_point_func = FunctionDeclaration(
    name="extract_key_point",
    description="Extracts a key point or important topic from the meeting discussion.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "point": {
                "type": "STRING",
                "description": "A concise summary of the key point or topic."
            },
        },
        "required": ["point"]
    },
)

# 2. Decision Extraction
extract_decision_func = FunctionDeclaration(
    name="extract_decision",
    description="Extracts a final decision made by the meeting participants.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "decision": {
                "type": "STRING",
                "description": "A clear statement of the decision that was made."
            },
        },
        "required": ["decision"]
    },
)

# 3. Action Item Extraction
extract_action_item_func = FunctionDeclaration(
    name="extract_action_item",
    description="Extracts a specific task or action item, its assignee, and due date.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "task": {
                "type": "STRING",
                "description": "The specific task or action to be completed."
            },
            "assignee": {
                "type": "STRING",
                "description": "Optional. The person or team responsible for the task."
            },
            "due_date": {
                "type": "STRING",
                "description": "Optional. The deadline for the action item (e.g., 'Next Friday', 'July 15, 2025')."
            },
        },
        "required": ["task"]
    },
)

# Combine all functions into a single Tool object
meeting_tools = Tool(
    function_declarations=[
        extract_key_point_func,
        extract_decision_func,
        extract_action_item_func,
    ],
)

async def extract_insights_with_gemini(transcript_text: str) -> list:
    """
    Extract insights from transcript text using Gemini API with function calling.
    
    Args:
        transcript_text: The transcript text to analyze
        
    Returns:
        List of extracted insights
    """
    try:
        # Check if API key is configured
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            logger.error("GEMINI_API_KEY not configured in Django settings")
            return []
            
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare the prompt
        prompt = f"""
        Analyze this meeting transcript and extract insights using the available tools.
        Look for key points, decisions, and action items.
        
        Transcript:
        {transcript_text}
        
        Please extract any relevant insights from this conversation.
        """
        
        # Make API call with function calling
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            tools=[meeting_tools],
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=1024,
            )
        )
        
        # Parse the response
        insights = []
        
        if response.candidates and response.candidates[0].content:
            content = response.candidates[0].content
            
            # Check for function calls in the response
            if hasattr(content, 'parts') and content.parts:
                for part in content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        function_call = part.function_call
                        
                        # Extract function name and arguments
                        function_name = function_call.name
                        function_args = function_call.args
                        
                        # Create insight object
                        insight = {
                            "type": "insight",
                            "data": {
                                "insight_type": function_name.replace("extract_", ""),
                                **function_args
                            }
                        }
                        
                        insights.append(insight)
        
        return insights
        
    except Exception as e:
        logger.error(f"Error extracting insights with Gemini: {e}")
        return []

LANGUAGE_MAP = {
    "English": "en",
    "Spanish": "es",
    "Chinese": "zh",
    "French": "fr",
}
LANGUAGE_CODES = set(LANGUAGE_MAP.values())

class MeetingConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        try:
            super().__init__(*args, **kwargs)
            self.audio_processor = get_audio_processor()
            self.target_languages = {}  # Dict: recording_id -> target_language
            self.is_processing = False  # Prevent concurrent jobs
            self.audio_chunks = []  # Store all audio chunks for multi-recording
            self.meeting_id = None  # Track current meeting ID
            self.meeting_title = "Untitled Meeting"  # Default meeting title
            logger.info("MeetingConsumer initialized for batch processing")
        except Exception as e:
            logger.error(f"Failed to initialize MeetingConsumer: {e}")
            self.audio_processor = None

    async def connect(self):
        try:
            await self.accept()
            logger.info("[MEETING] User connected and started a meeting (WebSocket accepted)")
        except Exception as e:
            logger.error(f"Failed to establish WebSocket connection: {e}")
            try:
                await self.close()
            except:
                pass

    async def disconnect(self, close_code):
        logger.info(f"[MEETING] User closed the meeting (WebSocket disconnected, code: {close_code})")

    async def receive(self, text_data=None, bytes_data=None):
        try:
            if bytes_data:
                if self.is_processing:
                    logger.info("[RECORDING] User attempted to start a new recording while processing is in progress.")
                    await self.send(text_data=json.dumps({
                        'error': 'Processing already in progress. Please wait for the current job to finish.'
                    }))
                    return
                if not bytes_data or len(bytes_data) == 0:
                    logger.warning("Empty audio data received")
                    await self.send(text_data=json.dumps({
                        'error': 'Empty audio data received'
                    }))
                    return
                try:
                    audio_chunk = np.frombuffer(bytes_data, dtype=np.float32)
                    if len(audio_chunk) == 0:
                        logger.warning("Empty audio chunk after conversion")
                        return
                except Exception as e:
                    logger.error(f"Failed to convert audio bytes to numpy array: {e}")
                    await self.send(text_data=json.dumps({
                        'error': 'Invalid audio data format'
                    }))
                    return
                if self.audio_processor is None:
                    logger.error("AudioProcessor not available")
                    await self.send(text_data=json.dumps({
                        'error': 'Audio processing service not available'
                    }))
                    return
                logger.info("[RECORDING] User ended a recording and sent audio for processing.")
                self.is_processing = True
                
                # Send immediate acknowledgment to keep connection alive
                await self.send(text_data=json.dumps({
                    'type': 'processing_started',
                    'message': 'Audio processing has started'
                }))
                
                self.audio_chunks.append(audio_chunk)  # Save for per-recording retranslation
                recording_id = len(self.audio_chunks) - 1
                # Set default target language for this recording
                self.target_languages[recording_id] = 'en'
                # Start background task for processing
                asyncio.create_task(self.process_audio_in_background(audio_chunk, self.target_languages[recording_id], recording_id))

            elif text_data:
                try:
                    data = json.loads(text_data)
                    if data.get('type') == 'retranslate' and 'target_language' in data:
                        lang_value = data['target_language']
                        recording_id = data.get('recording_id', None)
                        if recording_id is not None:
                            if lang_value in LANGUAGE_CODES:
                                self.target_languages[recording_id] = lang_value
                            elif lang_value in LANGUAGE_MAP:
                                self.target_languages[recording_id] = LANGUAGE_MAP[lang_value]
                            else:
                                logger.warning(f"Unknown language received: {lang_value}, defaulting to 'en'")
                                self.target_languages[recording_id] = 'en'
                        # Re-translate the selected recording
                        if self.audio_processor and recording_id is not None and 0 <= recording_id < len(self.audio_chunks):
                            target_lang = self.target_languages.get(recording_id, 'en')
                            logger.info(f"[RETRANSLATE] Re-translating recording {recording_id} to {target_lang}")
                            audio_chunk = self.audio_chunks[recording_id]
                            result = await asyncio.to_thread(self.audio_processor.enrich_transcript_batch, audio_chunk, None, target_lang)
                            await self.send(text_data=json.dumps({
                                'type': 'enriched_transcripts',
                                'data': result,
                                'recording_id': recording_id
                            }))
                        else:
                            await self.send(text_data=json.dumps({
                                'error': 'No audio to retranslate for this recording.'
                            }))
                        return
                    if data.get('type') == 'start_meeting':
                        # Create a new meeting in MongoDB
                        meeting_data = {
                            'title': data.get('title', 'Untitled Meeting'),
                            'source_language': data.get('source_language', 'en'),
                            'target_language': data.get('target_language', 'en'),
                        }
                        self.meeting_id = mongodb_client.save_meeting(meeting_data)
                        self.meeting_title = meeting_data['title']
                        logger.info(f"[MEETING] Created new meeting with ID: {self.meeting_id}")
                        await self.send(text_data=json.dumps({
                            'type': 'meeting_created',
                            'meeting_id': self.meeting_id,
                            'title': self.meeting_title
                        }))
                    elif data.get('type') == 'end_meeting':
                        # End the current meeting
                        logger.info(f"[MEETING] Received end_meeting message for meeting: {self.meeting_id}")
                        if self.meeting_id:
                            mongodb_client.update_meeting_end(self.meeting_id)
                            logger.info(f"[MEETING] Ended meeting: {self.meeting_id}")
                            await self.send(text_data=json.dumps({
                                'type': 'meeting_ended',
                                'meeting_id': self.meeting_id
                            }))
                        else:
                            logger.warning("[MEETING] Received end_meeting but no meeting_id found")
                    elif data.get('type') == 'update_meeting_title':
                        # Update meeting title
                        logger.info(f"[MEETING] Received update_meeting_title message: {data.get('title')}")
                        if self.meeting_id:
                            mongodb_client.update_meeting_title(self.meeting_id, data.get('title', ''))
                            self.meeting_title = data.get('title', '')
                            logger.info(f"[MEETING] Updated title for meeting: {self.meeting_id}")
                            await self.send(text_data=json.dumps({
                                'type': 'title_updated',
                                'title': self.meeting_title
                            }))
                        else:
                            logger.warning("[MEETING] Received update_meeting_title but no meeting_id found")
                    elif 'target_language' in data:
                        lang_value = data['target_language']
                        # This branch is for legacy/whole-meeting language change, keep for compatibility
                        logger.info(f"[LANGUAGE] Received global target_language change (not per-recording): {lang_value}")
                        await self.send(text_data=json.dumps({
                            'status': 'language_changed',
                            'target_language': lang_value
                        }))
                    else:
                        logger.warning(f"Unknown text command received: {data}")
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON format in text data: {e}")
                    await self.send(text_data=json.dumps({
                        'error': 'Invalid JSON format'
                    }))
                except Exception as e:
                    logger.error(f"Error processing text data: {e}")
                    await self.send(text_data=json.dumps({
                        'error': 'Failed to process text command'
                    }))
            else:
                logger.warning("Received empty data")
        except Exception as e:
            logger.error(f"Unexpected error in receive method: {e}")
            try:
                await self.send(text_data=json.dumps({
                    'error': 'Internal server error'
                }))
            except:
                pass

    async def process_audio_in_background(self, audio_chunk, target_language, recording_id=None):
        try:
            logger.info("[PROCESSING] System started processing the recording (background task).")
            result = await asyncio.to_thread(self.run_full_pipeline, audio_chunk, target_language)
            logger.info("[PROCESSING] System finished processing the recording (background task).")
            # Always include recording_id in the response for frontend mapping
            if recording_id is not None:
                result['recording_id'] = recording_id
                
                # Save recording to MongoDB if meeting exists
                if self.meeting_id and result.get('data', {}).get('enriched_transcripts'):
                    try:
                        recording_data = {
                            'meeting_id': self.meeting_id,
                            'recording_id': str(recording_id),
                            'transcripts': result['data']['enriched_transcripts'],
                            'insights': result.get('insights', []),
                            'target_language': target_language,
                            'duration': len(audio_chunk) / 16000  # Approximate duration in seconds
                        }
                        saved_recording_id = mongodb_client.save_recording(recording_data)
                        if saved_recording_id:
                            logger.info(f"[MONGODB] Saved recording {recording_id} with ID: {saved_recording_id}")
                        else:
                            logger.warning(f"[MONGODB] Failed to save recording {recording_id}")
                    except Exception as e:
                        logger.error(f"[MONGODB] Error saving recording: {e}")
            
            await self.send(text_data=json.dumps(result))
        except Exception as e:
            logger.error(f"Error in batch processing (background task): {e}")
            await self.send(text_data=json.dumps({
                'error': 'Failed to process audio batch',
                'details': str(e)
            }))
        finally:
            self.is_processing = False

    def run_full_pipeline(self, audio_chunk, target_language):
        """
        Sequentially process the audio chunk: transcription, diarization, translation, Gemini insights.
        Returns a single dictionary with all results.
        """
        try:
            # 1. Transcription + Diarization + Translation (enrich_transcript_batch)
            enriched = self.audio_processor.enrich_transcript_batch(
                audio_chunk=audio_chunk,
                transcript_list=None,  # Let the processor generate transcripts from scratch
                target_language=target_language
            )
            insights = []
            if enriched and enriched.get('enriched_transcripts'):
                transcript_text = '\n'.join([
                    t.get('original_transcript', '')
                    for t in enriched['enriched_transcripts']
                ])
                if transcript_text.strip():
                    # Gemini insights (sync call in thread)
                    try:
                        # Create a new event loop for this thread
                        import asyncio
                        try:
                            loop = asyncio.get_event_loop()
                        except RuntimeError:
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                        
                        insights = loop.run_until_complete(extract_insights_with_gemini(transcript_text))
                    except Exception as e:
                        logger.error(f"Gemini insights extraction failed: {e}")
                        insights = []
            return {
                'type': 'enriched_transcripts',
                'data': enriched,
                'insights': insights
            }
        except Exception as e:
            logger.error(f"Full pipeline failed: {e}")
            return {
                'error': 'Full pipeline failed',
                'details': str(e)
            }
