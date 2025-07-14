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
            self.target_language = 'en'
            # Fast path buffer (short, for instant transcription)
            self.audio_buffer = []
            self.buffer_task = None
            self.buffer_processing_interval = 2  # Fast path: every 2 seconds
            # Slow path buffer (long, for enrichment)
            self.long_audio_buffer = []
            self.enrichment_task = None
            self.enrichment_interval = 12  # Slow path: every 12 seconds
            # Store recent transcripts for enrichment
            self.recent_transcripts = []
            logger.info("MeetingConsumer initialized with fast/slow path buffering")
        except Exception as e:
            logger.error(f"Failed to initialize MeetingConsumer: {e}")
            self.audio_processor = None

    async def connect(self):
        try:
            await self.accept()
            self.buffer_task = asyncio.create_task(self._process_buffer_task())
            self.enrichment_task = asyncio.create_task(self._enrichment_task())
            logger.info("WebSocket connection established, fast/slow path tasks started")
        except Exception as e:
            logger.error(f"Failed to establish WebSocket connection: {e}")
            try:
                await self.close()
            except:
                pass

    async def _process_buffer_task(self):
        """
        Fast path: runs every 2s, does VAD+Whisper, sends preliminary transcript.
        """
        try:
            while True:
                await asyncio.sleep(self.buffer_processing_interval)
                if self.audio_buffer:
                    try:
                        combined_audio = np.concatenate(self.audio_buffer)
                        self.audio_buffer = []
                        if self.audio_processor is not None:
                            result = await asyncio.to_thread(
                                self.audio_processor.process_chunk_for_transcription,
                                audio_chunk=combined_audio
                            )
                            if result:
                                # Store for enrichment
                                self.recent_transcripts.append(result)
                                # Also add to long buffer for slow path
                                self.long_audio_buffer.append(combined_audio)
                                processed_data = {
                                    'type': 'preliminary_transcript',
                                    'data': result
                                }
                                logger.info(f"[BACKEND->FRONTEND] Sending fast path data: {processed_data}")
                                await self.send(text_data=json.dumps(processed_data))
                                logger.debug("[FAST PATH] Sent preliminary transcript to client")
                            else:
                                logger.debug("[FAST PATH] No speech detected in fast path")
                        else:
                            logger.warning("AudioProcessor not available for fast path")
                    except Exception as e:
                        logger.error(f"Error in fast path processing: {e}")
                        self.audio_buffer = []
        except asyncio.CancelledError:
            logger.info("Fast path buffer processing task cancelled")
        except Exception as e:
            logger.error(f"Unexpected error in fast path buffer processing: {e}")

    async def _enrichment_task(self):
        """
        Slow path: runs every 12s, does diarization, translation, insights, sends enriched data.
        """
        try:
            while True:
                logger.info("[SLOW PATH] Enrichment task checking for work...")
                await asyncio.sleep(self.enrichment_interval)
                if self.long_audio_buffer and self.recent_transcripts:
                    try:
                        # Combine all audio for slow path 
                        combined_long_audio = np.concatenate(self.long_audio_buffer)
                        self.long_audio_buffer = []
                        # Copy and clear recent transcripts for this batch
                        batch_transcripts = self.recent_transcripts.copy()
                        self.recent_transcripts = []
                        if self.audio_processor is not None:
                            enriched = await asyncio.to_thread(
                                self.audio_processor.enrich_transcript_batch,
                                audio_chunk=combined_long_audio,
                                transcript_list=batch_transcripts,
                                target_language=self.target_language
                            )
                            insights = []
                            if enriched and enriched.get('enriched_transcripts'):
                                # Concatenate all original transcripts for Gemini
                                transcript_text = '\n'.join([
                                    t.get('original_transcript', '')
                                    for t in enriched['enriched_transcripts']
                                ])
                                if transcript_text.strip():
                                    insights = await extract_insights_with_gemini(transcript_text)
                            if enriched:
                                processed_data = {
                                    'type': 'enriched_transcripts',
                                    'data': enriched,
                                    'insights': insights
                                }
                                logger.info(f"[BACKEND->FRONTEND] Sending slow path data: {processed_data}")
                                await self.send(text_data=json.dumps(processed_data))
                                logger.debug("[SLOW PATH] Sent enriched transcripts and insights to client")
                            else:
                                logger.debug("[SLOW PATH] No enrichment result")
                        else:
                            logger.warning("AudioProcessor not available for slow path")
                    except Exception as e:
                        logger.error(f"Error in slow path enrichment: {e}")
                        self.long_audio_buffer = []
                        self.recent_transcripts = []
        except asyncio.CancelledError:
            logger.info("Slow path enrichment task cancelled")
        except Exception as e:
            logger.error(f"Unexpected error in slow path enrichment: {e}")

    async def disconnect(self, close_code):
        try:
            # Cancel both background tasks
            if self.buffer_task and not self.buffer_task.done():
                self.buffer_task.cancel()
                try:
                    await self.buffer_task
                except asyncio.CancelledError:
                    pass
                logger.info("Fast path buffer processing task cancelled during disconnect")
            if self.enrichment_task and not self.enrichment_task.done():
                self.enrichment_task.cancel()
                try:
                    await self.enrichment_task
                except asyncio.CancelledError:
                    pass
                logger.info("Slow path enrichment task cancelled during disconnect")
            logger.info(f"WebSocket connection closed with code: {close_code}")
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def receive(self, text_data=None, bytes_data=None):
        try:
            if bytes_data:
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
                try:
                    if self.audio_processor is None:
                        logger.error("AudioProcessor not available")
                        await self.send(text_data=json.dumps({
                            'error': 'Audio processing service not available'
                        }))
                        return
                    # Add to both fast and slow path buffers
                    self.audio_buffer.append(audio_chunk)
                except Exception as e:
                    logger.error(f"Failed to add audio chunk to buffer: {e}")
                    await self.send(text_data=json.dumps({
                        'error': 'Failed to buffer audio data',
                        'details': str(e)
                    }))
            elif text_data:
                try:
                    data = json.loads(text_data)
                    if 'target_language' in data:
                        lang_value = data['target_language']
                        if lang_value in LANGUAGE_CODES:
                            self.target_language = lang_value
                        elif lang_value in LANGUAGE_MAP:
                            self.target_language = LANGUAGE_MAP[lang_value]
                        else:
                            logger.warning(f"Unknown language received: {lang_value}, defaulting to 'en'")
                            self.target_language = 'en'
                        await self.send(text_data=json.dumps({
                            'status': 'language_changed',
                            'target_language': self.target_language
                        }))
                        logger.info(f"Target language changed to: {self.target_language}")
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
