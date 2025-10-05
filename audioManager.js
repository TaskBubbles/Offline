class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.soundBuffer = null;
    this.activeSources = [];
    this.MAX_SOUNDS = 2;
    this.loadSound('Pop.wav');
  }

  async loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.soundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  lastPitch = 1;

  playPopSound() {
    if (!this.soundBuffer) {
      console.error("Sound not loaded yet");
      return;
    }

    if (this.activeSources.length >= this.MAX_SOUNDS) {
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.soundBuffer;
    const pitchVariations = [1, 1.19, 1.335, 1.5, 1.68179, 1.88775];
    const currentPitch = pitchVariations[this.lastPitch++ % pitchVariations.length];
    source.playbackRate.value = currentPitch;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.activeSources = this.activeSources.filter(activeSource => activeSource !== source);
    };

    this.activeSources.push(source);
    source.start(0);
  }
}

// Create a global instance of AudioManager
const audioManager = new AudioManager();

// Function to play the pop sound
function PlayPopSound() {
  audioManager.playPopSound();
}
