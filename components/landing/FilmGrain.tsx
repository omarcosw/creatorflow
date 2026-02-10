'use client';

import { useEffect, useRef } from 'react';

export default function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = 256;
    const h = 256;
    canvas.width = w;
    canvas.height = h;

    let frame = 0;
    const drawGrain = () => {
      frame++;
      // Only update every 2 frames for performance
      if (frame % 2 === 0) {
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const v = Math.random() * 255;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 16; // slightly more visible alpha
        }
        ctx.putImageData(imageData, 0, 0);
      }
      animId = requestAnimationFrame(drawGrain);
    };

    drawGrain();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <>
      {/* Film grain canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[90] h-full w-full opacity-[0.045]"
        style={{ mixBlendMode: 'overlay', imageRendering: 'pixelated', width: '100%', height: '100%' }}
      />
      {/* Scan lines overlay — subtle animated */}
      <div
        className="pointer-events-none fixed inset-0 z-[91] opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
          backgroundSize: '100% 4px',
          animation: 'scanlineScroll 8s linear infinite',
        }}
      />
    </>
  );
}
