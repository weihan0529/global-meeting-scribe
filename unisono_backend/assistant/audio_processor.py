import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, AutoTokenizer, AutoModelForSeq2SeqLM
from pyannote.audio import Pipeline as PyannotePipeline
import numpy as np
import logging
from django.conf import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        try:
            logger.info("Loading Silero VAD model...")
            self.vad_model = torch.hub.load(
                repo_or_dir='snakers4/silero-vad',
                model='silero_vad',
                force_reload=False
            )
            self.get_speech_timestamps = self.vad_model.get_speech_timestamps  # type: ignore[attr-defined]
            logger.info("Silero VAD model loaded successfully.")
        except Exception as e:
            logger.error(f"CRITICAL: Failed to load Silero VAD model: {e}. Using fallback.")
            self.vad_model = None
            self.get_speech_timestamps = None

        try:
            # Load pyannote speaker diarization model
            logger.info("Loading pyannote speaker diarization model...")
            # Get HuggingFace API token from Django settings
            hf_token = getattr(settings, 'HUGGINGFACE_API_KEY', None)
            self.speaker_diarization = PyannotePipeline.from_pretrained(
                'pyannote/speaker-diarization-3.1',
                use_auth_token=hf_token
            )
            self.speaker_embeddings = {}
            self.speaker_counter = 1
            logger.info("Speaker diarization model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load speaker diarization model: {e}")
            self.speaker_diarization = None

        try:
            # Load Whisper model and processor for transcription
            logger.info("Loading Whisper model...")
            # Get HuggingFace API token from Django settings
            hf_token = getattr(settings, 'HUGGINGFACE_API_KEY', None)
            self.whisper_processor = AutoProcessor.from_pretrained(
                'distil-whisper/distil-large-v2',
                token=hf_token
            )
            self.whisper_model = AutoModelForSpeechSeq2Seq.from_pretrained(
                'distil-whisper/distil-large-v2',
                token=hf_token
            )
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            self.whisper_processor = None
            self.whisper_model = None

        try:
            # Load translation models and tokenizers
            logger.info("Loading translation models...")
            self.translation_models = {}
            translation_model_names = {
                ('en', 'es'): 'Helsinki-NLP/opus-mt-en-es',
                ('en', 'fr'): 'Helsinki-NLP/opus-mt-en-fr',
                ('en', 'zh'): 'Helsinki-NLP/opus-mt-en-zh',
                ('zh', 'en'): 'Helsinki-NLP/opus-mt-zh-en',
                ('es', 'en'): 'Helsinki-NLP/opus-mt-es-en',
                ('fr', 'en'): 'Helsinki-NLP/opus-mt-fr-en',
            }
            for (src, tgt), model_name in translation_model_names.items():
                try:
                    # Get HuggingFace API token from Django settings
                    hf_token = getattr(settings, 'HUGGINGFACE_API_KEY', None)
                    model = AutoModelForSeq2SeqLM.from_pretrained(
                        model_name,
                        token=hf_token
                    )
                    tokenizer = AutoTokenizer.from_pretrained(
                        model_name,
                        token=hf_token
                    )
                    self.translation_models[(src, tgt)] = {
                        'model': model,
                        'tokenizer': tokenizer
                    }
                    logger.info(f"Translation model {src}->{tgt} loaded successfully")
                except Exception as e:
                    logger.error(f"Failed to load translation model {src}->{tgt}: {e}")
            logger.info("Translation models loading completed")
        except Exception as e:
            logger.error(f"Failed to load translation models: {e}")
            self.translation_models = {}

        # Persistent speaker mapping state
        self.speaker_map = {}
        self.next_speaker_id = 1

    def _get_speech_timestamps_from_audio(self, audio_chunk, sampling_rate=16000):
        """
        Uses the loaded Silero VAD utility to get speech timestamps.
        """
        if self.get_speech_timestamps is None:
            logger.warning("VAD model not available, using simple energy fallback.")
            return self._simple_vad_fallback(audio_chunk, model=None, sampling_rate=sampling_rate)
        
        try:
            # Convert audio to a torch tensor for the VAD model
            audio_tensor = torch.tensor(audio_chunk, dtype=torch.float32)
            
            # Get speech timestamps from the utility function
            speech_timestamps = self.get_speech_timestamps(audio_tensor, self.vad_model, sampling_rate=sampling_rate)
            return speech_timestamps
            
        except Exception as e:
            logger.error(f"VAD processing failed with error: {e}, using fallback.")
            return self._simple_vad_fallback(audio_chunk, model=None, sampling_rate=sampling_rate)

    def process_chunk(self, audio_chunk, target_language, sample_rate=16000):
        """
        Sophisticated multilingual transcription and translation pipeline.
        Automatically detects source language and performs intelligent translation.
        """
        logger.info("✅ --- PROCESSING WITH LATEST PIVOT TRANSLATION LOGIC --- ✅")
        try:
            # Validate input
            if audio_chunk is None or len(audio_chunk) == 0:
                logger.warning("Empty audio chunk received")
                return None

            # 1. Voice Activity Detection (VAD) - using our self-contained implementation
            speech_timestamps = self._get_speech_timestamps_from_audio(audio_chunk, sample_rate)
            if not speech_timestamps:
                logger.debug("No speech detected in audio chunk")
                return None  # No speech detected

            # 2. Speaker Diarization
            speaker_label = f"Speaker_{self.speaker_counter}"
            if self.speaker_diarization is not None:
                try:
                    diarization = self.speaker_diarization({'waveform': torch.tensor(audio_chunk).unsqueeze(0), 'sample_rate': sample_rate})
                    # Get speaker label (use first segment for simplicity)
                    for turn, _, speaker in diarization.itertracks(yield_label=True):
                        speaker_label = speaker
                        break
                except Exception as e:
                    logger.error(f"Speaker diarization failed: {e}")
                    # Use default speaker label
            else:
                logger.warning("Speaker diarization model not available, using default speaker")
            
            self.speaker_counter += 1

            # 3. Transcription and Language Detection (Whisper)
            if self.whisper_processor is None or self.whisper_model is None:
                logger.error("Whisper model not available, cannot transcribe")
                return None

            try:
                inputs = self.whisper_processor(audio_chunk, sampling_rate=sample_rate, return_tensors="pt")
                
                # Configure Whisper for multilingual language detection
                with torch.no_grad():
                    generated_ids = self.whisper_model.generate(
                        **inputs,
                        task="transcribe",
                        language=None,  # Let Whisper auto-detect language
                        return_timestamps=False
                    )
                
                # Decode to get transcript and extract language information
                decoded_result = self.whisper_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
                
                # Extract language from the model's language tokens
                # Whisper models include language tokens in the output
                language_tokens = self.whisper_processor.tokenizer.convert_ids_to_tokens(generated_ids[0])
                
                # Find the language token (usually at the beginning)
                detected_source_language = 'en'  # Default fallback
                for token in language_tokens:
                    if token.startswith('<|') and token.endswith('|>') and len(token) > 4:
                        # Extract language code from token like <|en|>, <|es|>, etc.
                        detected_source_language = token[2:-2]
                        break
                
                original_transcript = decoded_result.strip()
                
                if not original_transcript:
                    logger.warning("Empty transcript generated")
                    return None
                
                logger.info(f"Detected language: {detected_source_language}, Transcript: {original_transcript[:50]}...")
                    
            except Exception as e:
                logger.error(f"Transcription failed: {e}")
                return None

            # 4. Intelligent Translation Logic
            translated_transcript = self._perform_intelligent_translation(
                original_transcript, 
                detected_source_language, 
                target_language
            )

            return {
                "speaker_label": speaker_label,
                "original_transcript": original_transcript,
                "translated_transcript": translated_transcript,
                "detected_language": detected_source_language
            }

        except Exception as e:
            logger.error(f"Audio processing failed: {e}")
            return None

    def process_chunk_for_transcription(self, audio_chunk, sample_rate=16000):
        """
        Fast path: VAD + Whisper only. Returns transcript(s) with generic speaker label.
        """
        try:
            # 1. Voice Activity Detection (VAD)
            speech_timestamps = self._get_speech_timestamps_from_audio(audio_chunk, sample_rate)
            if not speech_timestamps:
                logger.debug("No speech detected in audio chunk (fast path)")
                return None

            # 2. Transcription (Whisper)
            if self.whisper_processor is None or self.whisper_model is None:
                logger.error("Whisper model not available, cannot transcribe (fast path)")
                return None

            try:
                inputs = self.whisper_processor(audio_chunk, sampling_rate=sample_rate, return_tensors="pt")
                with torch.no_grad():
                    generated_ids = self.whisper_model.generate(
                        **inputs,
                        task="transcribe",
                        language=None,
                        return_timestamps=False
                    )
                decoded_result = self.whisper_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
                language_tokens = self.whisper_processor.tokenizer.convert_ids_to_tokens(generated_ids[0])
                detected_source_language = 'en'
                for token in language_tokens:
                    if token.startswith('<|') and token.endswith('|>') and len(token) > 4:
                        detected_source_language = token[2:-2]
                        break
                original_transcript = decoded_result.strip()
                if not original_transcript:
                    logger.warning("Empty transcript generated (fast path)")
                    return None
                logger.info(f"[FAST PATH] Detected language: {detected_source_language}, Transcript: {original_transcript[:50]}...")
            except Exception as e:
                logger.error(f"Transcription failed (fast path): {e}")
                return None

            # For now, use the full chunk as the time range (0 to len(audio_chunk)/sample_rate)
            chunk_start = 0.0
            chunk_end = len(audio_chunk) / sample_rate
            return {
                "speaker_label": "SPEAKER_00",
                "original_transcript": original_transcript,
                "detected_language": detected_source_language,
                "start": chunk_start,
                "end": chunk_end
            }
        except Exception as e:
            logger.error(f"Fast path audio processing failed: {e}")
            return None

    def enrich_transcript_batch(self, audio_chunk, transcript_list, target_language, sample_rate=16000):
        """
        Slow path: Diarization, translation, and Gemini insights on a batch of audio and transcripts.
        Updates speaker labels, adds translations and insights.
        """
        try:
            # 1. Speaker Diarization (on large chunk)
            diarization_result = []
            pyannote_to_persistent = {}
            if self.speaker_diarization is not None:
                try:
                    diarization = self.speaker_diarization({'waveform': torch.tensor(audio_chunk).unsqueeze(0), 'sample_rate': sample_rate})
                    for turn, _, pyannote_label in diarization.itertracks(yield_label=True):
                        # Persistent speaker mapping
                        if pyannote_label not in self.speaker_map:
                            persistent_label = f"SPEAKER_{self.next_speaker_id}"
                            self.speaker_map[pyannote_label] = persistent_label
                            self.next_speaker_id += 1
                        else:
                            persistent_label = self.speaker_map[pyannote_label]
                        pyannote_to_persistent[pyannote_label] = persistent_label
                        diarization_result.append({
                            'start': turn.start,
                            'end': turn.end,
                            'pyannote_label': pyannote_label,
                            'speaker': persistent_label
                        })
                except Exception as e:
                    logger.error(f"Speaker diarization failed (slow path): {e}")
            else:
                logger.warning("Speaker diarization model not available (slow path)")

            # 2. Update speaker labels in transcripts (intelligent mapping by time overlap)
            enriched_transcripts = []
            if not isinstance(transcript_list, list):
                logger.error("transcript_list is not a list; cannot enrich transcripts.")
                transcript_list = []
            if not isinstance(diarization_result, list):
                logger.error("diarization_result is not a list; cannot map speakers.")
                diarization_result = []
            for t in transcript_list:
                if not isinstance(t, dict):
                    logger.warning(f"Transcript item is not a dict: {t}")
                    continue
                t_start = t.get('start')
                t_end = t.get('end')
                assigned_speaker = t.get('speaker_label', 'SPEAKER_00')
                if t_start is not None and t_end is not None:
                    # Find all diarization segments that overlap with this transcript
                    overlapping_segments = []
                    for seg in diarization_result:
                        if not isinstance(seg, dict):
                            continue
                        seg_start = seg.get('start')
                        seg_end = seg.get('end')
                        if seg_start is None or seg_end is None:
                            continue
                        if not (seg_end <= t_start or seg_start >= t_end):
                            overlapping_segments.append(seg)
                    if overlapping_segments:
                        # Assign the persistent speaker from the segment with the largest overlap
                        def overlap(seg):
                            seg_start = seg.get('start')
                            seg_end = seg.get('end')
                            if seg_start is None or seg_end is None or t_start is None or t_end is None:
                                return 0
                            return min(t_end, seg_end) - max(t_start, seg_start)
                        best_seg = max(overlapping_segments, key=overlap)
                        pyannote_label = best_seg.get('pyannote_label')
                        if pyannote_label and pyannote_label in pyannote_to_persistent:
                            assigned_speaker = pyannote_to_persistent[pyannote_label]
                enriched_transcripts.append({
                    **t,
                    'speaker_label': assigned_speaker
                })

            # 3. Translation (batch)
            for t in enriched_transcripts:
                orig = t.get('original_transcript', '')
                src_lang = t.get('detected_language', 'en')
                if src_lang == target_language:
                    t['translated_transcript'] = orig
                else:
                    t['translated_transcript'] = self._perform_intelligent_translation(orig, src_lang, target_language)

            # 4. Gemini insights (batch, optional)
            # Placeholder: You can add Gemini API call here if needed
            # insights = ...

            return {
                'enriched_transcripts': enriched_transcripts,
                'diarization_result': diarization_result,
                # 'insights': insights
            }
        except Exception as e:
            logger.error(f"Slow path enrichment failed: {e}")
            return None

    def _perform_intelligent_translation(self, original_transcript, detected_source_language, target_language):
        """
        Implements intelligent translation logic with three scenarios:
        A) No translation needed
        B) Direct translation possible
        C) Pivot translation via English required
        """
        logger.info(f"[TRANSLATION] Inputs: original_transcript='{original_transcript}', detected_source_language='{detected_source_language}', target_language='{target_language}'")
        try:
            # Scenario A: No Translation Needed
            if detected_source_language == target_language:
                logger.info("[TRANSLATION] Entering Scenario A: No Translation Needed.")
                logger.debug(f"No translation needed: {detected_source_language} -> {target_language}")
                return original_transcript

            # Scenario B: Direct Translation is Possible
            direct_key = (detected_source_language, target_language)
            if direct_key in self.translation_models:
                logger.info("[TRANSLATION] Entering Scenario B: Direct Translation.")
                logger.info(f"Using direct translation: {detected_source_language} -> {target_language}")
                return self._translate_text(original_transcript, direct_key)

            # Scenario C: Pivot Translation via English Required
            logger.info("[TRANSLATION] Entering Scenario C: Pivot Translation via English.")
            logger.info(f"Using pivot translation via English: {detected_source_language} -> en -> {target_language}")
            
            # Step 1: Translate from source language to English
            source_to_en_key = (detected_source_language, 'en')
            if source_to_en_key in self.translation_models:
                english_text = self._translate_text(original_transcript, source_to_en_key)
                if english_text is None:
                    logger.error(f"Failed to translate {detected_source_language} -> en")
                    return original_transcript
            else:
                logger.warning(f"No translation model available for {detected_source_language} -> en")
                return original_transcript

            # Step 2: Translate from English to target language
            en_to_target_key = ('en', target_language)
            if en_to_target_key in self.translation_models:
                final_translation = self._translate_text(english_text, en_to_target_key)
                if final_translation is None:
                    logger.error(f"Failed to translate en -> {target_language}")
                    return english_text  # Return English as fallback
                return final_translation
            else:
                logger.warning(f"No translation model available for en -> {target_language}")
                return english_text  # Return English as fallback

        except Exception as e:
            logger.error(f"Translation pipeline failed: {e}", exc_info=True)
            return original_transcript

    def _translate_text(self, text, translation_key):
        logger.info(f"[TRANSLATE] About to translate: '{text[:50]}...' with key {translation_key}")
        try:
            translation_model = self.translation_models[translation_key]['model']
            translation_tokenizer = self.translation_models[translation_key]['tokenizer']
            
            inputs = translation_tokenizer(text, return_tensors="pt", padding=True, truncation=True)
            inputs = inputs.to(translation_model.device)
            with torch.no_grad():
                translated_ids = translation_model.generate(**inputs)
            translated_text = translation_tokenizer.batch_decode(translated_ids, skip_special_tokens=True)[0]
            
            return translated_text.strip()
            
        except Exception as e:
            logger.error(f"Translation failed for {translation_key}", exc_info=True)
            return None

    def _simple_vad_fallback(self, audio_chunk, model, sampling_rate=16000):
        """
        Simple VAD fallback that always returns speech detected.
        Used when Silero VAD utilities are not available.
        """
        # Simple energy-based VAD
        energy = np.mean(np.abs(audio_chunk))
        threshold = 0.01  # Adjust this threshold as needed
        
        if energy > threshold:
            # Return a simple speech segment
            return [{'start': 0, 'end': len(audio_chunk) / sampling_rate}]
        else:
            return [] 