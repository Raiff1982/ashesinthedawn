/**
 * ADVANCED LEVEL METER
 * Peak, RMS, and loudness display with history graph and real audio data
 */

import { useEffect, useRef, useState } from 'react';
import { Volume2, TrendingDown } from 'lucide-react';
import { Tooltip } from './TooltipProvider';

interface LevelMeterProps {
  _trackId?: string;
  height?: number;
  width?: number;
  showLoudness?: boolean;
}

export function LevelMeter({
  _trackId,
  height = 180,
  width = 100,
  showLoudness = true,
}: LevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peak, setPeak] = useState(-60);
  const [rms, setRms] = useState(-60);
  const [loudness, setLoudness] = useState(-23);
  const [isClipping, setIsClipping] = useState(false);
  const historyRef = useRef<number[]>([]);
  const peakHoldRef = useRef(0);
  const peakDecayRef = useRef(-60);
  const animationRef = useRef<number | null>(null);

  // Convert linear (0-1) to dB
  const linearToDb = (val: number): number => {
    return val <= 0.00001 ? -60 : 20 * Math.log10(val);
  };

  // Get real levels from audio engine and update meters
  useEffect(() => {
    const updateMeters = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = (window as any)?.audioEngineRef?.current;

      if (engine && typeof engine.getAudioLevels === 'function') {
        const levels = engine.getAudioLevels();
        if (levels) {
          // Calculate RMS from frequency data
          let sum = 0;
          for (let i = 0; i < levels.length; i++) {
            const normalized = levels[i] / 255;
            sum += normalized * normalized;
          }
          const rmsLinear = Math.sqrt(sum / levels.length);
          const rmsDb = linearToDb(rmsLinear);

          // Find peak in frequency data
          let peakLinear = 0;
          for (let i = 0; i < levels.length; i++) {
            peakLinear = Math.max(peakLinear, levels[i] / 255);
          }
          const peakDb = linearToDb(peakLinear);

          // Smooth RMS with exponential moving average
          const smoothedRms = 0.7 * rms + 0.3 * rmsDb;
          setRms(smoothedRms);

          // Update peak with hold and decay
          if (peakDb > peakDecayRef.current) {
            peakDecayRef.current = peakDb;
            peakHoldRef.current = 60; // Hold for 60 frames (~1 second at 60fps)
          } else {
            peakHoldRef.current--;
            if (peakHoldRef.current <= 0) {
              // Decay peak slowly
              peakDecayRef.current = Math.max(
                peakDb,
                peakDecayRef.current - 0.5
              );
            }
          }

          setPeak(peakDecayRef.current);
          setIsClipping(peakDecayRef.current > -2);

          // Calculate loudness (LUFS approximation)
          const loudnessDb = smoothedRms - 2;
          setLoudness(loudnessDb);

          // Add to history for graph
          historyRef.current.push(smoothedRms);
          if (historyRef.current.length > 100) {
            historyRef.current.shift();
          }
        }
      }

      animationRef.current = requestAnimationFrame(updateMeters);
    };

    animationRef.current = requestAnimationFrame(updateMeters);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rms]);

  // Draw meters
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const padding = 10;
      const meterWidth = (canvas.width - padding * 2) / 2;
      const meterHeight = canvas.height - padding * 2;

      // Helper: Draw a smooth meter bar with animation
      const drawMeter = (
        x: number,
        value: number,
        min: number,
        max: number,
        label: string,
        color: string
      ) => {
        // Background
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x, padding, meterWidth, meterHeight);

        // Border
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, padding, meterWidth, meterHeight);

        // Smooth bar fill with gradient
        const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
        const fillHeight = meterHeight * normalizedValue;

        const gradient = ctx.createLinearGradient(
          0,
          meterHeight - fillHeight + padding,
          0,
          meterHeight + padding
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#' + (parseInt(color.slice(1), 16) >> 1).toString(16));

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, padding + 2 + meterHeight - fillHeight, meterWidth - 4, fillHeight - 4);

        // Labels with smooth font rendering
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + meterWidth / 2, canvas.height - 2);
        ctx.fillText(value.toFixed(1), x + meterWidth / 2, padding + 12);
      };

      // Peak meter (red if clipping)
      drawMeter(
        padding,
        peak,
        -60,
        6,
        'PEAK',
        isClipping ? '#ef4444' : '#fbbf24'
      );

      // RMS meter (green)
      drawMeter(
        padding + meterWidth + 2,
        rms,
        -60,
        6,
        'RMS',
        '#4ade80'
      );

      // Draw smoothly animated history graph at bottom
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(padding, canvas.height - 30, canvas.width - padding * 2, 28);

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.strokeRect(padding, canvas.height - 30, canvas.width - padding * 2, 28);

      // Plot history with smooth curve
      const graphWidth = canvas.width - padding * 2;
      const graphHeight = 26;
      const pointSpacing = graphWidth / (historyRef.current.length || 1);

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      historyRef.current.forEach((value, idx) => {
        const x = padding + idx * pointSpacing;
        const normalizedValue = (value + 60) / 66;
        const y = canvas.height - 30 + graphHeight * (1 - normalizedValue);

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Subtle grid lines for reference
      ctx.strokeStyle = '#1f293760';
      ctx.lineWidth = 0.5;
      for (let i = -60; i <= 6; i += 12) {
        const normalizedValue = (i + 60) / 66;
        const y = canvas.height - 30 + graphHeight * (1 - normalizedValue);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
      }
    };

    // Continuous animation
    const animFrame = setInterval(() => {
      draw();
    }, 16); // ~60fps

    return () => {
      clearInterval(animFrame);
    };
  }, [peak, rms, loudness, isClipping]);

  return (
    <div className="space-y-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          LEVEL METERS
        </label>
        {isClipping && (
          <span className="text-xs px-2 py-1 bg-red-600 text-white rounded animate-pulse font-bold">
            CLIPPING!
          </span>
        )}
      </div>

      <Tooltip
        content={{
          title: 'Level Meters',
          description:
            'Peak meter shows absolute maximum level. RMS shows average energy. Clipping warning appears when peak exceeds -2dB.',
          category: 'mixer',
          relatedFunctions: ['Spectrum Analyzer', 'Loudness Meter', 'Volume Control'],
          performanceTip: 'Aim for peak levels around -3 to -6dB to leave headroom for mastering.',
          examples: [
            'Vocals: -12dB to -6dB peak',
            'Drums: -9dB to -3dB peak',
            'Bass: -12dB to -6dB peak',
            'Master: -3dB to 0dB peak',
          ],
        }}
        position="top"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full border border-gray-700 rounded bg-gray-900"
          style={{ display: 'block' }}
        />
      </Tooltip>

      {showLoudness && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-900 p-2 rounded border border-gray-700">
            <div className="text-gray-500 mb-1">LOUDNESS</div>
            <div className="font-mono text-blue-400 font-bold">{loudness.toFixed(1)} LUFS</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-700">
            <div className="text-gray-500 mb-1">HEADROOM</div>
            <div className="font-mono text-green-400 font-bold">{(-2 - peak).toFixed(1)} dB</div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 italic flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        Real-time monitoring | History graph shows last 100 samples
      </div>
    </div>
  );
}
