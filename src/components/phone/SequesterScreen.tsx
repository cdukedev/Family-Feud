'use client';

import { motion } from 'framer-motion';

export function SequesterScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#2c1654] p-8 select-none">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/5 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, Math.random() * -200, null],
              x: [null, Math.random() * 100 - 50, null],
            }}
            transition={{
              repeat: Infinity,
              duration: 5 + Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="relative z-10 text-center"
      >
        <p className="text-6xl mb-6">&#x1F3B5;</p>
        <h2 className="text-2xl font-bold text-white/80 mb-2">You&apos;re Sequestered!</h2>
        <p className="text-white/40 text-lg">
          Don&apos;t peek at the TV!
        </p>
        <p className="text-white/30 text-sm mt-4">
          Put on headphones and wait for your turn
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="mt-16 relative z-10"
      >
        <p className="text-white/20 text-sm">Waiting for Player 1 to finish...</p>
      </motion.div>
    </div>
  );
}
