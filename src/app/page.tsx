'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--color-dark)] via-[var(--color-board)] to-[var(--color-dark)]">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <Logo size="lg" />
        <p className="text-center text-white/60 mt-4 text-lg">
          AI-Powered Family Game Night
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <Button
          variant="primary"
          size="xl"
          onClick={() => router.push('/host')}
          className="w-full"
        >
          Host New Game
        </Button>

        <Button
          variant="secondary"
          size="xl"
          onClick={() => router.push('/join')}
          className="w-full"
        >
          Join Game
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-white/30 text-sm text-center"
      >
        Play on your phone. Watch on the big screen.
      </motion.p>
    </div>
  );
}
