import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/notificationStore';

// We use Web Audio API to synthesize beautiful, high-quality soft sounds dynamically.
// This prevents large base64 bloat and guarantees 0 latency.

export function useNotificationSound() {
  const { soundEnabled, soundVolume } = useNotificationStore();
  
  // We use a ref to hold the audio context to avoid recreating it
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Only initialize AudioContext on client side
    if (typeof window !== 'undefined' && !audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    
    return () => {
      // Suspend rather than close to allow reuse if unmounted/remounted quickly
      if (audioCtxRef.current?.state === 'running') {
        audioCtxRef.current.suspend();
      }
    };
  }, []);

  const playSound = (type: 'Critical' | 'Warning' | 'Success' | 'Information') => {
    if (!soundEnabled || !audioCtxRef.current) return;
    
    // If context is suspended (due to autoplay policy), try to resume it
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    
    // Base volume
    const vol = soundVolume * 0.15; // Keep it very soft, max 15% system volume

    switch (type) {
      case 'Success':
        // Soft pop / bell upward
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'Information':
        // Gentle click / drop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.8, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'Warning':
        // Soft alert / double beep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'Critical': {
        // Subtle chime / resonant alert
        osc.type = 'sine';
        
        // Two oscillators for a richer chime chord (e.g. minor 3rd)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.connect(gainNode);
        
        osc.frequency.setValueAtTime(300, now); // Root
        osc2.frequency.setValueAtTime(356.78, now); // Minor third
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 1.2, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.8);
        osc2.stop(now + 0.8);
        break;
      }
    }
  };

  return { playSound };
}
