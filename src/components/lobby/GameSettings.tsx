'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { GameSettings as GameSettingsType } from '@/types/game';

interface GameSettingsProps {
  gameId: string;
  settings: GameSettingsType;
  onSave: (settings: GameSettingsType) => void;
}

const VOICE_OPTIONS = [
  { id: 'en-US-Neural2-D', label: 'Warm Baritone (Male)', preview: 'Deep, warm voice' },
  { id: 'en-US-Neural2-F', label: 'Energetic (Female)', preview: 'Bright, energetic voice' },
  { id: 'en-US-Neural2-A', label: 'Calm (Male)', preview: 'Calm, collected voice' },
  { id: 'en-US-Neural2-C', label: 'Bright (Female)', preview: 'Cheerful, bright voice' },
];

const ANSWER_WINDOW_OPTIONS = [8, 10, 15, 20];

export function GameSettings({ gameId, settings, onSave }: GameSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('games')
        .update({ settings: JSON.parse(JSON.stringify(localSettings)) })
        .eq('id', gameId);
      onSave(localSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-6">
      <h3 className="text-lg font-bold text-white">Game Settings</h3>

      {/* Total Rounds */}
      <div>
        <label className="block text-sm text-white/60 mb-2">Number of Rounds</label>
        <div className="flex gap-2">
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setLocalSettings((s) => ({ ...s, total_rounds: n }))}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                localSettings.total_rounds === n
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Window */}
      <div>
        <label className="block text-sm text-white/60 mb-2">Answer Time (seconds)</label>
        <div className="flex gap-2">
          {ANSWER_WINDOW_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setLocalSettings((s) => ({ ...s, answer_window_seconds: n }))}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                localSettings.answer_window_seconds === n
                  ? 'bg-[var(--color-secondary)] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {n}s
            </button>
          ))}
        </div>
      </div>

      {/* Host Voice */}
      <div>
        <label className="block text-sm text-white/60 mb-2">AI Host Voice</label>
        <div className="space-y-2">
          {VOICE_OPTIONS.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setLocalSettings((s) => ({ ...s, host_voice: voice.id }))}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                localSettings.host_voice === voice.id
                  ? 'bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="font-medium text-white">{voice.label}</span>
              <span className="block text-xs text-white/40 mt-0.5">{voice.preview}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Questions Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-medium">Include Custom Questions</span>
          <p className="text-xs text-white/40">Mix in your family&apos;s custom questions</p>
        </div>
        <button
          onClick={() =>
            setLocalSettings((s) => ({
              ...s,
              include_custom_questions: !s.include_custom_questions,
            }))
          }
          className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
            localSettings.include_custom_questions ? 'bg-[var(--color-success)]' : 'bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              localSettings.include_custom_questions ? 'translate-x-6.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </Card>
  );
}
