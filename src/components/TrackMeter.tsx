import { useEffect, useRef } from 'react';
import { getAudioEngine } from '../lib/audioEngine';

interface TrackMeterProps {
  trackId: string;
  height?: number;
  width?: number;
}

export default function TrackMeter({ trackId, height = 120, width = 10 }: TrackMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const peakRef = useRef(0);

  useEffect(() => {
    const audioEngine = getAudioEngine();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const falloffSpeed = 0.015; // how fast the peak falls per frame
    const smoothing = 0.75; // smoother transitions
    let smoothedLevel = 0;

    const draw = () => {
      const level = audioEngine.getTrackLevel(trackId);
      const currentLevel = Math.min(1, Math.max(0, level));

      // Smooth the level for visual stability
      smoothedLevel = smoothedLevel * smoothing + currentLevel * (1 - smoothing);

      // Peak falloff logic
      peakRef.current = Math.max(smoothedLevel, peakRef.current - falloffSpeed);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Determine bar height
      const barHeight = smoothedLevel * height;
      const peakHeight = peakRef.current * height;

      // Gradient color (bottom to top)
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#059669'); // green
      gradient.addColorStop(0.7, '#facc15'); // yellow
      gradient.addColorStop(0.9, '#f97316'); // orange
      gradient.addColorStop(1, '#dc2626'); // red

      // Draw level bar
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - barHeight, width, barHeight);

      // Draw peak indicator
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, height - peakHeight - 2, width, 2);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [trackId, height, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded bg-gray-950 border border-gray-800"
    />
  );
}
