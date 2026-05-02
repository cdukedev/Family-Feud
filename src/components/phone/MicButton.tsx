'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioRecorder } from '@/lib/audio/recorder';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MicButton({ onTranscript, disabled, className = '' }: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || !recorderRef.current) return;
    try {
      await recorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [disabled]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !recording) return;

    try {
      setRecording(false);
      setProcessing(true);

      const audioBlob = await recorderRef.current.stop();

      // Send to STT API route
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/stt-transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data?.transcript) {
        onTranscript(data.transcript);
      }
    } catch (err) {
      console.error('STT failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [recording, onTranscript]);

  return (
    <motion.button
      onPointerDown={startRecording}
      onPointerUp={stopRecording}
      onPointerLeave={stopRecording}
      disabled={disabled || processing}
      animate={{
        scale: recording ? 1.1 : 1,
        boxShadow: recording
          ? '0 0 40px rgba(46, 204, 113, 0.6)'
          : '0 0 20px rgba(46, 204, 113, 0.2)',
      }}
      className={`
        w-24 h-24 rounded-full flex items-center justify-center
        ${recording ? 'bg-[var(--color-success)]' : 'bg-[var(--color-success)]/80'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors select-none touch-none
        ${className}
      `}
    >
      {processing ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full"
        />
      ) : (
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}

      {recording && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[var(--color-success)]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.button>
  );
}
