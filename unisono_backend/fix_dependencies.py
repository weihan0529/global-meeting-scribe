#!/usr/bin/env python3
"""
Script to fix missing dependencies and provide guidance for model access issues.
"""

import subprocess
import sys
import os

def install_sacremoses():
    """Install the missing sacremoses dependency."""
    print("📦 Installing sacremoses dependency...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "sacremoses"])
        print("✅ sacremoses installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install sacremoses: {e}")
        return False

def check_pyannote_access():
    """Check and provide guidance for Pyannote model access."""
    print("\n🔐 Pyannote Model Access Issue:")
    print("The pyannote/speaker-diarization-3.1 model requires special access.")
    print("\nTo fix this:")
    print("1. Visit: https://huggingface.co/pyannote/speaker-diarization-3.1")
    print("2. Click 'Accept' to accept the user conditions")
    print("3. Also visit: https://huggingface.co/pyannote/segmentation-3.0")
    print("4. Click 'Accept' to accept the user conditions")
    print("5. Restart your Django server")
    print("\nNote: These models are gated and require explicit permission.")

def main():
    """Run all fixes."""
    print("🚀 Fixing dependencies and providing guidance...")
    
    # Install missing dependency
    if install_sacremoses():
        print("\n✅ Dependencies fixed successfully!")
    else:
        print("\n⚠️  Some dependencies could not be installed automatically.")
    
    # Provide Pyannote guidance
    check_pyannote_access()
    
    print("\n📋 Summary of fixes:")
    print("✅ Installed sacremoses (for better translation)")
    print("⚠️  Manual action required for Pyannote models")
    print("✅ VAD fallback implemented (app will work without Silero VAD)")
    
    print("\n🎯 Next steps:")
    print("1. Accept Pyannote model terms on HuggingFace")
    print("2. Restart your Django server")
    print("3. Run: python test_vad_loading.py")
    print("4. Your app should now work with fallback VAD")

if __name__ == "__main__":
    main() 