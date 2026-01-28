import * as Tone from 'tone';

class AudioService {
  private ready: boolean = false;
  private jumpSynth: Tone.PolySynth | null = null;
  private coinSynth: Tone.PolySynth | null = null;
  private crashSynth: Tone.NoiseSynth | null = null;
  private powerupSynth: Tone.MetalSynth | null = null;
  private grindSynth: Tone.NoiseSynth | null = null;
  private bgmLoop: Tone.Loop | null = null;
  private menuMusic: HTMLAudioElement | null = null;
  private gameMusic: HTMLAudioElement | null = null;

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

    // Load background music files if they exist
    this.menuMusic = new Audio('/menu-music.mp3');
    this.menuMusic.loop = true;
    this.menuMusic.volume = 0.5;
    this.menuMusic.preload = 'auto';
    
    this.gameMusic = new Audio('/game-music.mp3');
    this.gameMusic.loop = true;
    this.gameMusic.volume = 0.5;
    this.gameMusic.preload = 'auto';
    
    // Enhanced Background Music - Hip-hop style with Jewish/Klezmer touches (fallback)
    const bass = new Tone.MembraneSynth().toDestination();
    bass.volume.value = -10;
    
    const lead = new Tone.PolySynth(Tone.Synth).toDestination();
    lead.volume.value = -15;
    
    this.bgmLoop = new Tone.Loop(time => {
      // Bass line - hip-hop beat
      bass.triggerAttackRelease("C2", "8n", time);
      bass.triggerAttackRelease("E2", "8n", time + 0.5);
      bass.triggerAttackRelease("G2", "8n", time + 1);
      
      // Lead melody - Klezmer-inspired (minor scale)
      if (Math.floor(time * 2) % 4 === 0) {
        lead.triggerAttackRelease(["C4", "Eb4", "G4"], "4n", time);
      }
    }, "1.5n");

    Tone.Transport.bpm.value = 120;
    this.ready = true;
  }
  
  // Voice lines using Web Speech API (fallback to text-to-speech)
  playVoiceLine(text: string) {
    if (!this.ready) return;
    
    // Use Web Speech API for Hebrew voice
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
      utterance.volume = 0.7;
      
      // Try to find Hebrew voice
      const voices = speechSynthesis.getVoices();
      const hebrewVoice = voices.find(v => v.lang.startsWith('he')) || voices.find(v => v.lang.startsWith('ar'));
      if (hebrewVoice) {
        utterance.voice = hebrewVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }

  startMusic() {
    if (this.ready) {
      // Try to use game music file first, fallback to Tone.js generated music
      if (this.gameMusic) {
        this.gameMusic.play().catch(() => {
          console.log('Game music file not found, using generated music');
          // Fallback to generated music
          if (this.bgmLoop) {
            if (Tone.Transport.state !== 'started') Tone.Transport.start();
            this.bgmLoop.start(0);
          }
        });
      } else if (this.bgmLoop) {
        if (Tone.Transport.state !== 'started') Tone.Transport.start();
        this.bgmLoop.start(0);
      }
    }
  }

  stopMusic() {
    if (this.ready) {
      if (this.gameMusic) {
        this.gameMusic.pause();
        this.gameMusic.currentTime = 0;
      }
      Tone.Transport.stop();
      if(this.bgmLoop) this.bgmLoop.stop();
    }
  }
  
  pauseMusic() {
    if (this.ready) {
      if (this.gameMusic) {
        this.gameMusic.pause();
      }
      Tone.Transport.pause();
    }
  }
  
  resumeMusic() {
    if (this.ready) {
      if (this.gameMusic) {
        this.gameMusic.play().catch(() => console.log('Could not resume game music'));
      }
      Tone.Transport.start();
    }
  }
  
  startMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.play().catch(() => {
        console.log('Menu music file not found');
      });
    }
  }
  
  stopMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.pause();
      this.menuMusic.currentTime = 0;
    }
  }

  playJump() { 
    if(this.ready) {
      this.jumpSynth?.triggerAttackRelease(["C4"], "16n");
      // Random voice line on jump
      if (Math.random() > 0.7) {
        const lines = ['יאללה!', 'קפיצה!', 'בואו!', 'וואו!', 'בעזרת השם!'];
        this.playVoiceLine(lines[Math.floor(Math.random() * lines.length)]);
      }
    }
  }
  
  playTrick() { 
    if(this.ready) {
      this.jumpSynth?.triggerAttackRelease(["E5", "G5"], "16n");
      if (Math.random() > 0.6) {
        const lines = ['סבבה!', 'וואו!', 'יבנה המקדש!'];
        this.playVoiceLine(lines[Math.floor(Math.random() * lines.length)]);
      }
    }
  }
  
  playSuperTrick() { 
    if(this.ready) {
      this.jumpSynth?.triggerAttackRelease(["G5", "C6"], "16n");
      const lines = ['יאללה!', 'וואו!', 'ריבון העולמים!', 'יבנה המקדש!'];
      this.playVoiceLine(lines[Math.floor(Math.random() * lines.length)]);
    }
  }
  
  playCoin() { 
    if(this.ready) {
      this.coinSynth?.triggerAttackRelease(["C6", "E6"], "32n");
      if (Math.random() > 0.8) {
        this.playVoiceLine('בעזרת השם!');
      }
    }
  }
  
  playCrash() { 
    if(this.ready) {
      this.crashSynth?.triggerAttackRelease("8n", "+0");
      const lines = ['אוי ויי!', 'אופס!', 'לא!', 'השם ירחם!'];
      this.playVoiceLine(lines[Math.floor(Math.random() * lines.length)]);
    }
  }
  
  playPowerup() { if(this.ready) this.powerupSynth?.triggerAttackRelease("32n", "+0"); }
  playBuy() { if(this.ready) this.coinSynth?.triggerAttackRelease(["E6", "G6", "C7"], "16n"); }
  
  playGrind() {
      if(this.ready) this.grindSynth?.triggerAttackRelease("32n", "+0");
  }
}

export const audioService = new AudioService();