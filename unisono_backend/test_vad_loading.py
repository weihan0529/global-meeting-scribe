#!/usr/bin/env python3
"""
Test script to verify Silero VAD model loading with the new robust logic.
This script tests the AudioProcessor initialization to ensure VAD loads correctly.
"""

import sys
import os
import time
import logging

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unisono_backend.settings')

import django
django.setup()

from assistant.audio_processor import AudioProcessor

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_vad_loading():
    """Test that Silero VAD model loads correctly."""
    logger.info("🧪 Testing Silero VAD model loading...")
    
    try:
        # Create AudioProcessor instance
        logger.info("📞 Creating AudioProcessor instance...")
        start_time = time.time()
        
        processor = AudioProcessor()
        
        load_time = time.time() - start_time
        logger.info(f"⏱️  AudioProcessor creation took: {load_time:.2f} seconds")
        
        # Check if VAD model loaded successfully
        if processor.vad_model is not None:
            logger.info("✅ VAD model loaded successfully")
        else:
            logger.error("❌ VAD model failed to load")
            return False
        
        # Check if VAD utilities loaded successfully
        if processor.get_speech_timestamps is not None:
            logger.info("✅ VAD utilities loaded successfully")
        else:
            logger.warning("⚠️  VAD utilities failed to load - VAD will be disabled")
            return False
        
        # Test VAD functionality with dummy audio
        logger.info("🧪 Testing VAD functionality...")
        try:
            # Create dummy audio data (silence)
            import numpy as np
            dummy_audio = np.zeros(16000, dtype=np.float32)  # 1 second of silence
            
            # Test VAD processing
            speech_timestamps = processor.get_speech_timestamps(
                dummy_audio, 
                processor.vad_model, 
                sampling_rate=16000
            )
            
            logger.info(f"✅ VAD processing successful - detected {len(speech_timestamps)} speech segments")
            return True
            
        except Exception as e:
            logger.error(f"❌ VAD processing failed: {e}")
            return False
        
    except Exception as e:
        logger.error(f"❌ AudioProcessor creation failed: {e}")
        return False

def test_other_models():
    """Test that other models also load correctly."""
    logger.info("🧪 Testing other model loading...")
    
    try:
        processor = AudioProcessor()
        
        # Check Whisper model
        if processor.whisper_model is not None and processor.whisper_processor is not None:
            logger.info("✅ Whisper model loaded successfully")
        else:
            logger.error("❌ Whisper model failed to load")
            return False
        
        # Check speaker diarization model
        if processor.speaker_diarization is not None:
            logger.info("✅ Speaker diarization model loaded successfully")
        else:
            logger.warning("⚠️  Speaker diarization model failed to load")
        
        # Check translation models
        if processor.translation_models:
            logger.info(f"✅ {len(processor.translation_models)} translation models loaded successfully")
        else:
            logger.warning("⚠️  No translation models loaded")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Model loading test failed: {e}")
        return False

def main():
    """Run all VAD loading tests."""
    logger.info("🚀 Starting VAD loading tests...")
    
    # Test 1: VAD loading
    if not test_vad_loading():
        logger.error("❌ VAD loading test failed")
        return 1
    
    # Test 2: Other models
    if not test_other_models():
        logger.error("❌ Other model loading test failed")
        return 1
    
    logger.info("🎉 All VAD loading tests passed!")
    logger.info("💡 Silero VAD model is now loading correctly with robust error handling.")
    return 0

if __name__ == "__main__":
    exit(main()) 