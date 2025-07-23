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
            # Load pyannote speaker diarization model
            logger.info("Loading pyannote speaker diarization model...")
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
                'distil-whisper/distil-large-v3',
                token=hf_token
            )
            self.whisper_model = AutoModelForSpeechSeq2Seq.from_pretrained(
                'distil-whisper/distil-large-v3',
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

    # Remove process_chunk and process_chunk_for_transcription
    def enrich_transcript_batch(self, audio_chunk, transcript_list, target_language, sample_rate=16000):
        """
        Batch: Diarization, transcription, translation, and Gemini insights on a batch of audio.
        If transcript_list is None, generate transcripts from diarization segments.
        """
        try:
            diarization_result = []
            pyannote_to_persistent = {}
            enriched_transcripts = []
            if self.speaker_diarization is not None:
                try:
                    diarization = self.speaker_diarization({'waveform': torch.tensor(audio_chunk).unsqueeze(0), 'sample_rate': sample_rate})
                    for turn, _, pyannote_label in diarization.itertracks(yield_label=True):
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
                    logger.error(f"Speaker diarization failed: {e}")
            else:
                logger.warning("Speaker diarization model not available")
            # If no transcript_list, generate transcripts from diarization segments
            if transcript_list is None:
                transcript_list = []
                for seg in diarization_result:
                    seg_start = int(seg['start'] * sample_rate)
                    seg_end = int(seg['end'] * sample_rate)
                    segment_audio = audio_chunk[seg_start:seg_end]
                    transcript = {
                        'start': seg['start'],
                        'end': seg['end'],
                        'speaker_label': seg['speaker']
                    }
                    if self.whisper_processor is not None and self.whisper_model is not None:
                        try:
                            inputs = self.whisper_processor(segment_audio, sampling_rate=sample_rate, return_tensors="pt")
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
                            transcript['original_transcript'] = decoded_result.strip()
                            transcript['detected_language'] = detected_source_language
                            logger.info(f"[TRANSCRIBE] Speaker: {transcript['speaker_label']}, Detected Language: {detected_source_language}, Transcript: {decoded_result.strip()}")
                        except Exception as e:
                            logger.error(f"Whisper transcription failed: {e}")
                            transcript['original_transcript'] = ''
                            transcript['detected_language'] = 'en'
                    else:
                        transcript['original_transcript'] = ''
                        transcript['detected_language'] = 'en'
                    transcript_list.append(transcript)
            # Translation
            for t in transcript_list:
                orig = t.get('original_transcript', '')
                src_lang = t.get('detected_language', 'en')
                if src_lang == target_language:
                    t['translated_transcript'] = orig
                else:
                    t['translated_transcript'] = self._perform_intelligent_translation(orig, src_lang, target_language)
                enriched_transcripts.append(t)
            return {
                'enriched_transcripts': enriched_transcripts,
                'diarization_result': diarization_result,
            }
        except Exception as e:
            logger.error(f"Batch audio processing failed: {e}")
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