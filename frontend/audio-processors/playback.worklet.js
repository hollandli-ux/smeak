/**
 * Audio Playback Worklet Processor for playing PCM audio.
 * Uses an offset tracker instead of slice() to avoid allocations
 * on the real-time audio thread.
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.currentOffset = 0; // Track position in current buffer (avoids slice())

    this.port.onmessage = (event) => {
      if (event.data === "interrupt") {
        // Clear the queue on interrupt
        this.audioQueue = [];
        this.currentOffset = 0;
      } else if (event.data instanceof Float32Array) {
        // Add audio data to the queue
        this.audioQueue.push(event.data);
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (output.length === 0) return true;

    const channel = output[0];
    let outputIndex = 0;

    // Fill the output buffer from the queue
    while (outputIndex < channel.length && this.audioQueue.length > 0) {
      const currentBuffer = this.audioQueue[0];

      if (!currentBuffer || currentBuffer.length === 0) {
        this.audioQueue.shift();
        this.currentOffset = 0;
        continue;
      }

      const remainingOutput = channel.length - outputIndex;
      const remainingBuffer = currentBuffer.length - this.currentOffset;
      const copyLength = Math.min(remainingOutput, remainingBuffer);

      // Copy audio data to output using offset (no slice allocation)
      for (let i = 0; i < copyLength; i++) {
        channel[outputIndex++] = currentBuffer[this.currentOffset++];
      }

      // If we've consumed the entire buffer, move to the next one
      if (this.currentOffset >= currentBuffer.length) {
        this.audioQueue.shift();
        this.currentOffset = 0;
      }
    }

    // Fill remaining output with silence
    while (outputIndex < channel.length) {
      channel[outputIndex++] = 0;
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
