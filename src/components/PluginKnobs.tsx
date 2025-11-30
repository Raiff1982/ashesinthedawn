/**
 * PluginKnobs - Visual rotary knob controls for plugin parameters
 * 
 * Features:
 * - SVG-based rotary knobs with smooth animation
 * - Mouse drag and scroll wheel support
 * - Parameter value display
 * - Min/Max range visualization
 * - Real-time feedback
 * - Tooltip support
 */

import React, { useState, useRef, useEffect } from 'react';

interface PluginKnobsProps {
  pluginId: string;
  pluginName: string;
  parameters: Record<string, PluginParameter>;
  onParameterChange: (paramName: string, value: number) => void;
}

interface PluginParameter {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

interface KnobState {
  isDragging: boolean;
  lastY: number;
  startValue: number;
}

const MIN_ROTATION = -135;
const MAX_ROTATION = 135;
const TOTAL_ROTATION = MAX_ROTATION - MIN_ROTATION;

/**
 * Individual rotary knob component
 */
const Knob: React.FC<{
  param: PluginParameter;
  onValueChange: (value: number) => void;
}> = ({ param, onValueChange }) => {
  const [knobState, setKnobState] = useState<KnobState>({
    isDragging: false,
    lastY: 0,
    startValue: param.value,
  });
  const knobRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate rotation from value (0-1 normalized)
  const normalized = (param.value - param.min) / (param.max - param.min);
  const rotation = MIN_ROTATION + normalized * TOTAL_ROTATION;

  // Handle mouse down on knob
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setKnobState({
      isDragging: true,
      lastY: e.clientY,
      startValue: param.value,
    });
  };

  // Handle mouse move (drag)
  useEffect(() => {
    if (!knobState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = knobState.lastY - e.clientY;
      const sensitivity = 2; // pixels per unit change
      const rawDelta = deltaY / sensitivity;

      const range = param.max - param.min;
      const step = param.step || 0.01;
      const stepsInRange = range / step;
      const deltaValue = (rawDelta / 100) * range;

      let newValue = param.value + deltaValue;

      // Clamp to min/max
      newValue = Math.max(param.min, Math.min(param.max, newValue));

      // Round to step
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }

      onParameterChange(newValue);
      setKnobState(prev => ({ ...prev, lastY: e.clientY }));
    };

    const handleMouseUp = () => {
      setKnobState(prev => ({ ...prev, isDragging: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [knobState, param, onParameterChange]);

  // Handle scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = param.step || 0.01;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.max(
      param.min,
      Math.min(param.max, param.value + direction * step)
    );
    onParameterChange(newValue);
  };

  // Handle double-click to reset
  const handleDoubleClick = () => {
    const midpoint = (param.min + param.max) / 2;
    onParameterChange(midpoint);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-2 p-3 rounded bg-gray-800 border border-gray-700 hover:border-gray-600 transition group cursor-grab active:cursor-grabbing"
      title={param.description || param.label}
    >
      {/* SVG Knob */}
      <svg
        ref={knobRef}
        width="60"
        height="60"
        viewBox="0 0 60 60"
        className="select-none"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Background circle */}
        <circle
          cx="30"
          cy="30"
          r="28"
          fill="rgb(31, 41, 55)"
          stroke="rgb(55, 65, 81)"
          strokeWidth="1"
        />

        {/* Value arc (green) */}
        <path
          d={`
            M 30 4
            A 26 26 0 0 ${normalized > 0.5 ? 1 : 0}
            ${30 + 26 * Math.sin((rotation * Math.PI) / 180)}
            ${30 - 26 * Math.cos((rotation * Math.PI) / 180)}
          `}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Remaining arc (gray) */}
        <path
          d={`
            M ${30 + 26 * Math.sin((rotation * Math.PI) / 180)}
            ${30 - 26 * Math.cos((rotation * Math.PI) / 180)}
            A 26 26 0 0 ${normalized > 0.5 ? 0 : 1}
            30 56
          `}
          fill="none"
          stroke="rgb(75, 85, 99)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Center circle */}
        <circle
          cx="30"
          cy="30"
          r="3"
          fill="rgb(156, 163, 175)"
        />

        {/* Indicator line */}
        <line
          x1="30"
          y1="30"
          x2={30 + 16 * Math.sin((rotation * Math.PI) / 180)}
          y2={30 - 16 * Math.cos((rotation * Math.PI) / 180)}
          stroke={knobState.isDragging ? 'rgb(59, 130, 246)' : 'rgb(219, 234, 254)'}
          strokeWidth="2"
          strokeLinecap="round"
          className={knobState.isDragging ? 'transition-colors' : ''}
        />

        {/* Ticks for reference (every 45 degrees) */}
        {[0, 45, 90, 135].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 30 + 24 * Math.sin(rad);
          const y1 = 30 - 24 * Math.cos(rad);
          const x2 = 30 + 20 * Math.sin(rad);
          const y2 = 30 - 20 * Math.cos(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(107, 114, 128)"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* Label */}
      <div className="text-xs font-medium text-gray-300 text-center truncate max-w-[70px]">
        {param.label}
      </div>

      {/* Value Display */}
      <div className="flex items-center gap-1">
        <div className="text-xs font-mono text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700 min-w-[40px] text-center">
          {param.value.toFixed(2)}
        </div>
        {param.unit && (
          <div className="text-xs text-gray-500">{param.unit}</div>
        )}
      </div>

      {/* Min/Max Range */}
      <div className="text-xs text-gray-500 text-center">
        <span className="opacity-75">{param.min.toFixed(1)}</span>
        <span className="opacity-50 mx-1">—</span>
        <span className="opacity-75">{param.max.toFixed(1)}</span>
      </div>

      {/* Info tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 whitespace-nowrap z-50">
        Drag • Scroll • Double-click to reset
      </div>
    </div>
  );
};

/**
 * Plugin Knobs Panel Component
 */
export const PluginKnobs: React.FC<PluginKnobsProps> = ({
  pluginId,
  pluginName,
  parameters,
  onParameterChange,
}) => {
  const paramArray = Object.values(parameters);

  if (paramArray.length === 0) {
    return (
      <div className="bg-gray-800 rounded border border-gray-700 p-4">
        <div className="text-xs text-gray-500 text-center">
          No parameters for {pluginName}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded border border-gray-700 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">{pluginName}</h4>
        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
          {paramArray.length} params
        </span>
      </div>

      {/* Knobs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {paramArray.map((param) => (
          <div key={param.name} className="relative">
            <Knob
              param={param}
              onValueChange={(value) => onParameterChange(param.name, value)}
            />
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 bg-gray-900/50 p-2 rounded border border-gray-700/50">
        💡 Drag knobs to adjust • Scroll wheel for fine control • Double-click to reset
      </div>
    </div>
  );
};

export default PluginKnobs;
