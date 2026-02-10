'use client';

import { motion } from 'framer-motion';

export default function AboutSection() {
  return (
    <section id="sobre" className="relative py-24 px-6 lg:px-12 overflow-hidden">
      <div className="mx-auto max-w-3xl text-center">
        {/* Glow behind logo */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[400px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)]" />

        {/* Pulsating glow ring */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border border-[#8B5CF6]/10"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Second ring offset */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full border border-[#C026D3]/8"
          animate={{ scale: [1.2, 1.8, 1.2], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Big W logo with 3D CSS rotation + pulsing glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8 inline-block"
          style={{ perspective: '600px' }}
        >
          <motion.span
            className="inline-block font-display text-[80px] md:text-[100px] font-extrabold leading-none bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-[#C026D3] bg-clip-text text-transparent"
            animate={{ rotateY: [0, 8, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              transformStyle: 'preserve-3d',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }}
          >
            W
          </motion.span>
        </motion.div>

        {/* Description with staggered reveal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative space-y-1"
        >
          {['Um App de IA para Creators,', 'especializado em criação de conteúdo,', 'roteirização e demandas criativas.'].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
              className="text-lg md:text-xl text-white leading-relaxed"
            >
              {line}
            </motion.p>
          ))}
        </motion.div>

        {/* Sparkles */}
        <div className="pointer-events-none absolute top-12 left-1/4 text-[#8B5CF6]/25 text-lg select-none">&#10022;</div>
        <div className="pointer-events-none absolute bottom-12 right-1/4 text-[#C026D3]/20 text-sm select-none">&#10022;</div>
      </div>
    </section>
  );
}
