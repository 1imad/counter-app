// Bluetooth Earbuds & Wireless Media Controller
// Uses the HTML5 Media Session API to intercept earbud taps (AirPods squeeze, Galaxy Buds tap, Bluetooth headsets)
// so users can count Zikr with their earbuds in pocket or hands-free.

class EarbudMediaController {
  constructor() {
    this.isActive = false;
    this.audioElement = null;
    this.onIncrement = null;
    this.onDecrement = null;
    this.onFastJump = null;
  }

  // Initialize a silent audio loop to hold OS media priority
  initSilentAudio() {
    if (!this.audioElement) {
      // 44-byte silent WAV data URI
      const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      this.audioElement = new Audio(silentWav);
      this.audioElement.loop = true;
      this.audioElement.preload = 'auto';
    }
  }

  activate({ onIncrement, onDecrement, onFastJump, currentTitle = 'SubhanAllah' }) {
    this.onIncrement = onIncrement;
    this.onDecrement = onDecrement;
    this.onFastJump = onFastJump;

    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      console.warn('MediaSession API is not supported in this browser.');
      return false;
    }

    try {
      this.initSilentAudio();
      this.audioElement.play().catch(() => {
        // Autoplay may need user gesture which occurs on clicking Enable Earbud Mode
      });

      this.updateMetadata(currentTitle);

      // Earbud single tap / squeeze toggles between play and pause
      // We map BOTH to increment so every single tap advances your Zikr count!
      navigator.mediaSession.setActionHandler('play', () => {
        if (this.onIncrement) this.onIncrement();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.onIncrement) this.onIncrement();
      });

      // Double tap / squeeze on many earbuds sends 'nexttrack'
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.onIncrement) this.onIncrement();
      });

      // Triple tap sends 'previoustrack'
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.onDecrement) this.onDecrement();
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (this.onFastJump) this.onFastJump(10);
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (this.onFastJump) this.onFastJump(-10);
      });

      this.isActive = true;
      return true;
    } catch (err) {
      console.error('Failed to activate earbud media session:', err);
      return false;
    }
  }

  updateMetadata(dhikrTitle = 'SubhanAllah', count = 0, target = 33) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `🕌 ${dhikrTitle} (${count}/${target})`,
          artist: 'NoorTasbih • Tap Earbud to Count',
          album: 'Hands-Free Wireless Tasbeeh',
          artwork: [
            { src: '/favicon.svg', sizes: '96x96', type: 'image/svg+xml' },
            { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }
          ]
        });
      } catch {
        // Optional
      }
    }
  }

  deactivate() {
    this.isActive = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
      } catch {
        // Optional
      }
    }
  }
}

export const earbudController = new EarbudMediaController();
