class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096; // Buffer size for processing
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const inputChannel = input[0];
    if (!inputChannel) {
      return true;
    }

    // Fill the buffer with incoming audio data
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex] = inputChannel[i];
      this.bufferIndex++;

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Send a copy of the buffer to avoid issues with shared memory
        const audioData = new Float32Array(this.buffer);
        this.port.postMessage({
          type: 'audio_data',
          data: audioData,
          sampleRate: sampleRate,
          timestamp: currentTime
        });
        
        // Reset buffer index
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 