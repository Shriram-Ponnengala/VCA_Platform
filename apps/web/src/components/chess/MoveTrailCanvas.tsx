'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export type TrailVariant = 'blue' | 'fire' | 'rainbow';

export interface PlayTrailParams {
  from: string;
  to: string;
  variant: TrailVariant;
  duration?: number;
}

export interface MoveTrailCanvasHandle {
  playTrail: (params: PlayTrailParams) => void;
  resize: () => void;
}

interface MoveTrailCanvasProps {
  orientation: 'white' | 'black';
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  hue?: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const MoveTrailCanvas = forwardRef<MoveTrailCanvasHandle, MoveTrailCanvasProps>(
  ({ orientation }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const activeAnimationRef = useRef<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      variant: TrailVariant;
      duration: number;
      startTime: number;
      points: TrailPoint[];
    } | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const getSquareCenter = (sq: string, width: number, height: number) => {
      if (!sq || sq.length < 2) return { x: 0, y: 0 };
      const file = sq[0];
      const rank = parseInt(sq[1], 10);
      const fileIdx = FILES.indexOf(file);
      const rankIdx = rank - 1;

      if (fileIdx === -1 || isNaN(rankIdx)) return { x: 0, y: 0 };

      const col = orientation === 'white' ? fileIdx : 7 - fileIdx;
      const row = orientation === 'white' ? 7 - rankIdx : rankIdx;

      const sqWidth = width / 8;
      const sqHeight = height / 8;

      return {
        x: (col + 0.5) * sqWidth,
        y: (row + 0.5) * sqHeight,
      };
    };

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    useEffect(() => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, [orientation]);

    useImperativeHandle(ref, () => ({
      resize: resizeCanvas,
      playTrail: ({ from, to, variant, duration = 200 }) => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        const start = getSquareCenter(from, rect.width, rect.height);
        const end = getSquareCenter(to, rect.width, rect.height);

        activeAnimationRef.current = {
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          variant,
          duration,
          startTime: performance.now(),
          points: [],
        };

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }

        let lastTime = performance.now();

        const renderFrame = (now: number) => {
          const anim = activeAnimationRef.current;
          if (!anim || !canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const dt = now - lastTime;
          lastTime = now;

          const elapsed = now - anim.startTime;
          const progress = Math.min(1, elapsed / anim.duration);
          const easedProgress = 1 - Math.pow(1 - progress, 2);

          const currentX = anim.startX + (anim.endX - anim.startX) * easedProgress;
          const currentY = anim.startY + (anim.endY - anim.startY) * easedProgress;

          if (progress < 1) {
            anim.points.push({
              x: currentX,
              y: currentY,
              age: 0,
              maxAge: 160,
              hue: (elapsed * 1.5) % 360,
            });
          }

          anim.points.forEach((p) => {
            p.age += dt;
          });
          anim.points = anim.points.filter((p) => p.age < p.maxAge);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const numPoints = anim.points.length;
          if (numPoints > 0) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < numPoints; i++) {
              const pt = anim.points[i];
              const life = 1 - pt.age / pt.maxAge;
              const radius = Math.max(3, (i / numPoints) * 12 * life);

              ctx.beginPath();
              ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

              if (anim.variant === 'fire') {
                const alpha = life * 0.85;
                ctx.fillStyle = i % 2 === 0
                  ? `rgba(251, 146, 60, ${alpha})`
                  : `rgba(239, 68, 68, ${alpha})`;
                ctx.shadowColor = '#f97316';
                ctx.shadowBlur = 12 * life;
              } else if (anim.variant === 'rainbow') {
                const alpha = life * 0.9;
                ctx.fillStyle = `hsla(${pt.hue || 0}, 90%, 60%, ${alpha})`;
                ctx.shadowColor = `hsl(${pt.hue || 0}, 90%, 60%)`;
                ctx.shadowBlur = 10 * life;
              } else {
                const alpha = life * 0.85;
                ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.shadowColor = '#3b82f6';
                ctx.shadowBlur = 10 * life;
              }

              ctx.fill();
            }

            if (progress < 1) {
              ctx.beginPath();
              ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
              if (anim.variant === 'fire') {
                ctx.fillStyle = '#fef08a';
                ctx.shadowColor = '#ef4444';
              } else if (anim.variant === 'rainbow') {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ec4899';
              } else {
                ctx.fillStyle = '#e0f2fe';
                ctx.shadowColor = '#0284c7';
              }
              ctx.shadowBlur = 16;
              ctx.fill();
            }

            ctx.restore();
          }

          if (progress < 1 || anim.points.length > 0) {
            animFrameRef.current = requestAnimationFrame(renderFrame);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            activeAnimationRef.current = null;
          }
        };

        animFrameRef.current = requestAnimationFrame(renderFrame);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    );
  }
);

MoveTrailCanvas.displayName = 'MoveTrailCanvas';
