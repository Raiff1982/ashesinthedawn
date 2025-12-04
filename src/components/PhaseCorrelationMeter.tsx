/**
 * PHASE CORRELATION METER
 * Stereo phase display with Lissajous visualization
 */

import { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';
import { Tooltip } from './TooltipProvider';

interface PhaseCorrelationMeterProps {
  width?: number;
  height?: number;
}

export function PhaseCorrelationMeter({
  width = 120,
  height = 120,
}: PhaseCorrelationMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [correlation, setCorrelation] = useState(0.8);
  const [phaseInverted, setPhaseInverted] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Simulate correlation data
  useEffect(() => {
    const updateCorrelation = () => {
      // Simulate correlation value
      const baseCorr = 0.6 + Math.sin(Date.now() / 2000) * 0.3;
      setCorrelation(Math.max(-1, Math.min(1, baseCorr)));

      // Check for phase inversion (when correlation < -0.5)
      setPhaseInverted(baseCorr < -0.5);

      animationRef.current = requestAnimationFrame(updateCorrelation);
    };

    animationRef.current = requestAnimationFrame(updateCorrelation);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Draw Lissajous figure
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 10;

    // Draw background circle
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Lissajous figure based on correlation
    ctx.strokeStyle = correlation > 0.5 ? '#4ade80' : correlation > -0.5 ? '#fbbf24' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < 360; i++) {
      const angle = (i * Math.PI) / 180;

      // Create Lissajous pattern based on correlation
      const x = cx + radius * Math.sin(angle);
      const y = cy + radius * Math.sin(angle + correlation * Math.PI);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw center point
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw correlation percentage
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(correlation * 100) + '%', cx, cy + radius + 15);

    // Draw phase inversion warning
    if (phaseInverted) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('PHASE INV!', cx, cy - radius - 10);
    }
  }, [correlation, phaseInverted]);

  return (
    <div className="space-y-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
        <Radio className="w-3 h-3" />
        PHASE CORRELATION
      </label>

      <Tooltip
        content={{
          title: 'Phase Correlation Meter',
          description:
            'Shows stereo phase relationship. +1 = Perfect mono, 0 = Uncorrelated, -1 = Inverted phase. Lissajous figure helps visualize relationship.',
          category: 'mixer',
          relatedFunctions: ['Stereo Width', 'Phase Invert', 'Mono Sum Check'],
          performanceTip: 'Check correlation before exporting to avoid issues on mono playback systems.',
          examples: [
            'Dual mono mics: Low correlation',
            'Stereo pair: High correlation',
            'Out-of-phase audio: Negative correlation',
          ],
        }}
        position="top"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height + 30}
          className="w-full border border-gray-700 rounded bg-gray-900"
          style={{ display: 'block' }}
        />
      </Tooltip>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className={`p-2 rounded text-center font-mono font-bold ${
            correlation > 0.5
              ? 'bg-green-900 text-green-400'
              : correlation > -0.5
                ? 'bg-yellow-900 text-yellow-400'
                : 'bg-red-900 text-red-400'
          }`}
        >
          {correlation.toFixed(2)}
        </div>
        <div className={`p-2 rounded text-center text-xs font-bold ${phaseInverted ? 'bg-red-900 text-red-400 animate-pulse' : 'bg-green-900 text-green-400'}`}>
          {phaseInverted ? '? INVERTED' : '? NORMAL'}
        </div>
      </div>
    </div>
  );
}
