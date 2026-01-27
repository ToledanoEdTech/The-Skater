import * as Tone from 'tone';

class AudioService {
  private ready: boolean = false;
  private jumpSynth: Tone.PolySynth | null = null;
  private coinSynth: Tone.PolySynth | null = null;
  private crashSynth: Tone.NoiseSynth | null = null;
  private powerupSynth: Tone.MetalSynth | null = null;
  private grindSynth: Tone.NoiseSynth | null = null;
  private bgmLoop: Tone.Loop | null = null;

  async init() {
    if (this.ready) return;
    await Tone.start();
    
    this.jumpSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.jumpSynth.set({ envelope: { attack: 0.01, decay: 0.1, sustain: 0 } });

    this.coinSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.coinSynth.set({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.5 }, volume: -5 });

    this.crashSynth = new Tone.NoiseSynth().toDestination();
    this.crashSynth.set({ envelope: { attack: 0.005, decay: 0.3, sustain: 0 } });

    this.powerupSynth = new Tone.MetalSynth().toDestination();
    this.powerupSynth.volume.value = -8;
    
    // Grind Sound
    this.grindSynth = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 }
    }).toDestination();
    this.grindSynth.volume.value = -12;

    // Simple Background Beat
    const bass = new Tone.MembraneSynth().toDestination();
    bass.volume.value = -10;
    
    this.bgmLoop = new Tone.Loop(time => {
      bass.triggerAttackRelease("C2", "8n", time);
      bass.triggerAttackRelease("E2", "8n", time + 0.5);
      bass.triggerAttackRelease("G2", "8n", time + 1);
    }, "1.5n");

    Tone.Transport.bpm.value = 120;
    this.ready = true;
  }

  startMusic() {
    if (this.ready && this.bgmLoop) {
      if (Tone.Transport.state !== 'started') Tone.Transport.start();
      this.bgmLoop.start(0);
    }
  }

  stopMusic() {
    if (this.ready) {
      Tone.Transport.stop();
      if(this.bgmLoop) this.bgmLoop.stop();
    }
  }
  
  pauseMusic() {
    if (this.ready) Tone.Transport.pause();
  }
  
  resumeMusic() {
    if (this.ready) Tone.Transport.start();
  }

  playJump() { if(this.ready) this.jumpSynth?.triggerAttackRelease(["C4"], "16n"); }
  playTrick() { if(this.ready) this.jumpSynth?.triggerAttackRelease(["E5", "G5"], "16n"); }
  playSuperTrick() { if(this.ready) this.jumpSynth?.triggerAttackRelease(["G5", "C6"], "16n"); }
  playCoin() { if(this.ready) this.coinSynth?.triggerAttackRelease(["C6", "E6"], "32n"); }
  playCrash() { if(this.ready) this.crashSynth?.triggerAttackRelease("8n"); }
  playPowerup() { if(this.ready) this.powerupSynth?.triggerAttackRelease("32n"); }
  playBuy() { if(this.ready) this.coinSynth?.triggerAttackRelease(["E6", "G6", "C7"], "16n"); }
  
  playGrind() {
      if(this.ready) this.grindSynth?.triggerAttackRelease("32n");
  }
}

export const audioService = new AudioService();