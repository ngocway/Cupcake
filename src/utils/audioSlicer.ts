export const sliceAudioFile = async (file: File, durationSeconds: number = 3.5): Promise<File> => {
  try {
    // 1. Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Decode audio data
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // 3. Create OfflineAudioContext to render the sliced portion
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const duration = Math.min(audioBuffer.duration, durationSeconds);
    const frameCount = sampleRate * duration;

    const offlineContext = new OfflineAudioContext(channels, frameCount, sampleRate);

    // 4. Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0, 0, duration);

    // 5. Render
    const renderedBuffer = await offlineContext.startRendering();

    // 6. Convert rendered buffer to WAV format
    const wavBlob = audioBufferToWavBlob(renderedBuffer);

    // 7. Return as File
    const originalName = file.name;
    const extIndex = originalName.lastIndexOf('.');
    const baseName = extIndex !== -1 ? originalName.slice(0, extIndex) : originalName;
    return new File([wavBlob], `${baseName}_sliced.wav`, { type: 'audio/wav' });

  } catch (error) {
    console.error('Error slicing audio:', error);
    // If Web Audio API fails, fallback to the original file
    return file;
  }
};

// Helper function to encode AudioBuffer to WAV format
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data: number) {
    view.setUint32(offset, data, true);
    offset += 4;
  }
}
