'use client';

class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private queue: string[] = [];
  private playing = false;
  private currentAudio: HTMLAudioElement | null = null;
  private volume = 1.0;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  async play(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.volume = this.volume;
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        this.currentAudio = null;
        reject(new Error(`Failed to play audio: ${url}`));
      };

      audio.play().catch(reject);
    });
  }

  async playSequence(urls: string[]): Promise<void> {
    for (const url of urls) {
      await this.play(url);
    }
  }

  enqueue(url: string) {
    this.queue.push(url);
    if (!this.playing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.playing = false;
      return;
    }

    this.playing = true;
    const url = this.queue.shift()!;

    try {
      await this.play(url);
    } catch (err) {
      console.error('Audio play error:', err);
    }

    this.processQueue();
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.queue = [];
    this.playing = false;
  }
}

export const audioPlayer = new AudioPlayer();
