'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface AnswerEntry {
  text: string;
  points: string;
  aliases: string;
}

export function QuestionCreator() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<AnswerEntry[]>([
    { text: '', points: '', aliases: '' },
    { text: '', points: '', aliases: '' },
    { text: '', points: '', aliases: '' },
    { text: '', points: '', aliases: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateAnswer = (index: number, field: keyof AnswerEntry, value: string) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    );
  };

  const addAnswer = () => {
    if (answers.length < 8) {
      setAnswers((prev) => [...prev, { text: '', points: '', aliases: '' }]);
    }
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 4) {
      setAnswers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const totalPoints = answers.reduce((sum, a) => sum + (parseInt(a.points) || 0), 0);
  const validAnswers = answers.filter((a) => a.text.trim() && parseInt(a.points) > 0);

  const handleSave = async () => {
    if (!question.trim() || validAnswers.length < 4) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Create question
      const { data: q, error: qErr } = await supabase
        .from('questions')
        .insert({
          text: question.trim(),
          answer_count: validAnswers.length,
          category: 'custom',
          difficulty: 'medium',
          source: 'custom',
          fast_money_ok: true,
          tags: ['custom'],
        })
        .select()
        .single();

      if (qErr) throw qErr;

      // Create answers
      const answerRows = validAnswers.map((a, idx) => ({
        question_id: q.id,
        rank: idx + 1,
        text: a.text.trim(),
        points: parseInt(a.points),
        aliases: a.aliases
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }));

      const { error: aErr } = await supabase.from('answers').insert(answerRows);
      if (aErr) throw aErr;

      setSaved(true);
      setQuestion('');
      setAnswers([
        { text: '', points: '', aliases: '' },
        { text: '', points: '', aliases: '' },
        { text: '', points: '', aliases: '' },
        { text: '', points: '', aliases: '' },
      ]);

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save question:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-bold">Create Custom Question</h3>

      <Input
        label="Question"
        placeholder='e.g. "Name something Dad always burns on the grill"'
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="space-y-2">
        <p className="text-sm text-white/60">
          Answers (points should sum to ~100, currently: {totalPoints})
        </p>

        {answers.map((answer, idx) => (
          <motion.div key={idx} layout className="flex gap-2 items-center">
            <span className="text-white/30 text-sm w-4">{idx + 1}</span>
            <Input
              placeholder="Answer text"
              value={answer.text}
              onChange={(e) => updateAnswer(idx, 'text', e.target.value)}
              className="!py-1.5 !text-sm flex-1"
            />
            <Input
              placeholder="Pts"
              type="number"
              value={answer.points}
              onChange={(e) => updateAnswer(idx, 'points', e.target.value)}
              className="!py-1.5 !text-sm !w-16 text-center"
            />
            <Input
              placeholder="Aliases (comma-separated)"
              value={answer.aliases}
              onChange={(e) => updateAnswer(idx, 'aliases', e.target.value)}
              className="!py-1.5 !text-sm flex-1"
            />
            {answers.length > 4 && (
              <button
                onClick={() => removeAnswer(idx)}
                className="text-white/30 hover:text-white/60 cursor-pointer"
              >
                x
              </button>
            )}
          </motion.div>
        ))}

        {answers.length < 8 && (
          <Button variant="ghost" size="sm" onClick={addAnswer}>
            + Add Answer
          </Button>
        )}
      </div>

      <AnimatePresence>
        {saved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[var(--color-success)] text-sm text-center"
          >
            Question saved!
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        disabled={saving || !question.trim() || validAnswers.length < 4}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Custom Question'}
      </Button>
    </Card>
  );
}
