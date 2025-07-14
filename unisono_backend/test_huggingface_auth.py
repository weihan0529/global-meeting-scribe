#!/usr/bin/env python3
"""
Test script to verify HuggingFace API key authentication.
This script tests that models can be loaded with the API key.
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

from django.conf import settings
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_huggingface_auth():
    """Test that HuggingFace API key is working correctly."""
    logger.info("🧪 Testing HuggingFace API key authentication...")
    
    # Check if API key is configured
    hf_token = getattr(settings, 'HUGGINGFACE_API_KEY', None)
    if not hf_token:
        logger.error("❌ HUGGINGFACE_API_KEY not configured in Django settings")
        return False
    
    logger.info(f"✅ HuggingFace API key found: {hf_token[:10]}...")
    
    # Test loading a simple model with authentication
    try:
        logger.info("📞 Testing model loading with API key...")
        start_time = time.time()
        
        # Try loading a small translation model
        model_name = "Helsinki-NLP/opus-mt-en-es"
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            token=hf_token
        )
        
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name,
            token=hf_token
        )
        
        load_time = time.time() - start_time
        logger.info(f"⏱️  Model loading took: {load_time:.2f} seconds")
        
        # Test a simple translation
        test_text = "Hello, how are you?"
        inputs = tokenizer(test_text, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            translated_ids = model.generate(**inputs)
        
        translated_text = tokenizer.batch_decode(translated_ids, skip_special_tokens=True)[0]
        
        logger.info(f"✅ Translation test successful: '{test_text}' -> '{translated_text}'")
        return True
        
    except Exception as e:
        logger.error(f"❌ HuggingFace authentication test failed: {e}")
        return False

def test_api_key_format():
    """Test that the API key has the correct format."""
    logger.info("🧪 Testing API key format...")
    
    hf_token = getattr(settings, 'HUGGINGFACE_API_KEY', None)
    if not hf_token:
        logger.error("❌ No API key found")
        return False
    
    # Check if it starts with 'hf_'
    if not hf_token.startswith('hf_'):
        logger.error("❌ API key should start with 'hf_'")
        return False
    
    # Check length (should be around 40 characters)
    if len(hf_token) < 30:
        logger.error("❌ API key seems too short")
        return False
    
    logger.info("✅ API key format looks correct")
    return True

def test_settings_import():
    """Test that Django settings can be imported correctly."""
    logger.info("🧪 Testing Django settings import...")
    
    try:
        from django.conf import settings
        hf_token = getattr(settings, 'HUGGINGFACE_API_KEY', None)
        
        if hf_token:
            logger.info("✅ Django settings imported successfully")
            logger.info(f"✅ HUGGINGFACE_API_KEY found: {hf_token[:10]}...")
            return True
        else:
            logger.error("❌ HUGGINGFACE_API_KEY not found in settings")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed to import Django settings: {e}")
        return False

def main():
    """Run all HuggingFace authentication tests."""
    logger.info("🚀 Starting HuggingFace authentication tests...")
    
    # Test 1: Settings import
    if not test_settings_import():
        logger.error("❌ Settings import test failed")
        return 1
    
    # Test 2: API key format
    if not test_api_key_format():
        logger.error("❌ API key format test failed")
        return 1
    
    # Test 3: Model loading with authentication
    if not test_huggingface_auth():
        logger.error("❌ HuggingFace authentication test failed")
        return 1
    
    logger.info("🎉 All HuggingFace authentication tests passed!")
    logger.info("💡 Your HuggingFace API key is working correctly.")
    return 0

if __name__ == "__main__":
    exit(main()) 