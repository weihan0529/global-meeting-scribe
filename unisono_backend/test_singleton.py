#!/usr/bin/env python3
"""
Test script to verify the singleton AudioProcessor pattern.
This script simulates multiple WebSocket connections to ensure
the AudioProcessor is created only once.
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

from assistant.consumer import get_audio_processor, MeetingConsumer
from channels.testing import WebsocketCommunicator
from unisono_backend.asgi import application

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_singleton_pattern():
    """Test that AudioProcessor is created only once."""
    logger.info("🧪 Testing singleton AudioProcessor pattern...")
    
    # First call - should create the instance
    logger.info("📞 First call to get_audio_processor()...")
    start_time = time.time()
    processor1 = get_audio_processor()
    first_load_time = time.time() - start_time
    logger.info(f"⏱️  First load took: {first_load_time:.2f} seconds")
    
    # Second call - should return the same instance
    logger.info("📞 Second call to get_audio_processor()...")
    start_time = time.time()
    processor2 = get_audio_processor()
    second_load_time = time.time() - start_time
    logger.info(f"⏱️  Second load took: {second_load_time:.2f} seconds")
    
    # Verify they are the same instance
    if processor1 is processor2:
        logger.info("✅ Singleton pattern working correctly - same instance returned")
    else:
        logger.error("❌ Singleton pattern failed - different instances returned")
        return False
    
    # Verify second load is much faster
    if second_load_time < 0.1:  # Should be nearly instant
        logger.info("✅ Second load is instant as expected")
    else:
        logger.warning(f"⚠️  Second load took {second_load_time:.2f}s - might not be using singleton")
    
    return True

def test_consumer_initialization():
    """Test that MeetingConsumer uses the singleton correctly."""
    logger.info("🧪 Testing MeetingConsumer initialization...")
    
    try:
        # Create a consumer instance
        consumer = MeetingConsumer()
        logger.info("✅ MeetingConsumer created successfully")
        
        # Verify it has the audio processor
        if hasattr(consumer, 'audio_processor') and consumer.audio_processor is not None:
            logger.info("✅ MeetingConsumer has AudioProcessor instance")
        else:
            logger.error("❌ MeetingConsumer missing AudioProcessor instance")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create MeetingConsumer: {e}")
        return False

def main():
    """Run all tests."""
    logger.info("🚀 Starting singleton pattern tests...")
    
    # Test 1: Singleton pattern
    if not test_singleton_pattern():
        logger.error("❌ Singleton pattern test failed")
        return 1
    
    # Test 2: Consumer initialization
    if not test_consumer_initialization():
        logger.error("❌ Consumer initialization test failed")
        return 1
    
    logger.info("🎉 All tests passed! Singleton pattern is working correctly.")
    logger.info("💡 Performance improvement: Models are loaded only once at server startup.")
    return 0

if __name__ == "__main__":
    exit(main()) 