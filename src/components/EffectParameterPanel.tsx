/**
 * Effect Parameter Panel
 * UI component for displaying and editing effect parameters
 * Integrated with DSP Bridge for real-time processing
 */

import { useState, useEffect } from 'react';
import { useDAW } from '../contexts/DAWContext';
import { Sliders, Power, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface EffectParameterPanelProps {
  trackId: string;
}

export default function EffectParameterPanel({ trackId }: EffectParameterPanelProps) {
  const {
    getTrackEffects,
    updateEffectParameter,
    enableDisableEffect,
    removeEffectFromTrack,
    setEffectWetDry,
  } = useDAW();

  const [expandedEffectId, setExpandedEffectId] = useState<string | null>(null);
  const effects = getTrackEffects(trackId);

  if (effects.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No effects loaded. Add effects from the plugin browser.
      </div>
    );
  }

  const handleParameterChange = (
    effectId: string,
    paramName: string,
    value: number
  ) => {
    updateEffectParameter(trackId, effectId, paramName, value);
  };

  const handleWetDryChange = (effectId: string, value: number) => {
    setEffectWetDry(trackId, effectId, value);
  };

  const toggleEffect = (effectId: string, enabled: boolean) => {
    enableDisableEffect(trackId, effectId, enabled);
  };

  const removeEffect = (effectId: string) => {
    if (confirm('Remove this effect?')) {
      removeEffectFromTrack(trackId, effectId);
    }
  };

  return (
    <div className="space-y-2">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className={`border rounded-lg ${
            effect.enabled ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-850'
          }`}
        >
          {/* Effect Header */}
          <div className="flex items-center gap-2 p-3">
            <button
              onClick={() => toggleEffect(effect.id, !effect.enabled)}
              className={`p-1 rounded ${
                effect.enabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
              title={effect.enabled ? 'Disable effect' : 'Enable effect'}
            >
              <Power className="w-4 h-4" />
            </button>

            <Sliders className="w-4 h-4 text-gray-500" />

            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-100">
                {effect.effectType}
              </h3>
              <p className="text-xs text-gray-500">
                {effect.bypass ? 'Bypassed' : 'Active'}
              </p>
            </div>

            <button
              onClick={() =>
                setExpandedEffectId(
                  expandedEffectId === effect.id ? null : effect.id
                )
              }
              className="p-1 rounded hover:bg-gray-700"
            >
              {expandedEffectId === effect.id ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => removeEffect(effect.id)}
              className="p-1 rounded hover:bg-red-600 text-red-400 hover:text-white"
              title="Remove effect"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Effect Parameters */}
          {expandedEffectId === effect.id && (
            <div className="border-t border-gray-700 p-3 space-y-3">
              {/* Wet/Dry Mix */}
              <div>
                <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Wet/Dry Mix</span>
                  <span className="text-blue-400">{Math.round(effect.wetDry * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effect.wetDry}
                  onChange={(e) =>
                    handleWetDryChange(effect.id, parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Effect-Specific Parameters */}
              {Object.entries(effect.parameters).map(([paramName, paramValue]) => (
                <EffectParameter
                  key={paramName}
                  effectId={effect.id}
                  effectType={effect.effectType}
                  paramName={paramName}
                  paramValue={paramValue as number}
                  onChange={(value) => handleParameterChange(effect.id, paramName, value)}
                />
              ))}

              {Object.keys(effect.parameters).length === 0 && (
                <p className="text-xs text-gray-500 italic">
                  No additional parameters available for this effect.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Individual effect parameter control
 */
interface EffectParameterProps {
  effectId: string;
  effectType: string;
  paramName: string;
  paramValue: number;
  onChange: (value: number) => void;
}

function EffectParameter({
  effectType,
  paramName,
  paramValue,
  onChange,
}: EffectParameterProps) {
  // Get parameter specs based on effect type
  const paramSpec = getParameterSpec(effectType, paramName);

  const [localValue, setLocalValue] = useState(paramValue);

  useEffect(() => {
    setLocalValue(paramValue);
  }, [paramValue]);

  const handleChange = (value: number) => {
    setLocalValue(value);
    onChange(value);
  };

  return (
    <div>
      <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>{formatParameterName(paramName)}</span>
        <span className="text-blue-400">
          {formatParameterValue(localValue, paramSpec.unit)}
        </span>
      </label>
      <input
        type="range"
        min={paramSpec.min}
        max={paramSpec.max}
        step={paramSpec.step}
        value={localValue}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

/**
 * Get parameter specifications for effect types
 */
function getParameterSpec(effectType: string, paramName: string) {
  const specs: Record<
    string,
    Record<string, { min: number; max: number; step: number; unit: string }>
  > = {
    compressor: {
      threshold: { min: -60, max: 0, step: 0.1, unit: 'dB' },
      ratio: { min: 1, max: 20, step: 0.1, unit: ':1' },
      attack: { min: 0.001, max: 1, step: 0.001, unit: 's' },
      release: { min: 0.01, max: 3, step: 0.01, unit: 's' },
    },
    highpass: {
      cutoff: { min: 20, max: 20000, step: 1, unit: 'Hz' },
    },
    lowpass: {
      cutoff: { min: 20, max: 20000, step: 1, unit: 'Hz' },
    },
    '3band-eq': {
      low_gain: { min: -12, max: 12, step: 0.1, unit: 'dB' },
      mid_gain: { min: -12, max: 12, step: 0.1, unit: 'dB' },
      high_gain: { min: -12, max: 12, step: 0.1, unit: 'dB' },
    },
    limiter: {
      threshold: { min: -20, max: 0, step: 0.1, unit: 'dB' },
      attack: { min: 0.0001, max: 0.1, step: 0.0001, unit: 's' },
      release: { min: 0.01, max: 1, step: 0.01, unit: 's' },
    },
    saturation: {
      drive: { min: 0.1, max: 10, step: 0.1, unit: 'x' },
      tone: { min: 0, max: 1, step: 0.01, unit: '' },
    },
    distortion: {
      amount: { min: 0, max: 1, step: 0.01, unit: '' },
    },
    'simple-delay': {
      delay_time: { min: 0.001, max: 2, step: 0.001, unit: 's' },
      feedback: { min: 0, max: 0.95, step: 0.01, unit: '' },
      mix: { min: 0, max: 1, step: 0.01, unit: '' },
    },
    reverb: {
      room: { min: 0, max: 1, step: 0.01, unit: '' },
      damp: { min: 0, max: 1, step: 0.01, unit: '' },
      wet: { min: 0, max: 1, step: 0.01, unit: '' },
    },
  };

  const effectSpecs = specs[effectType.toLowerCase()];
  if (effectSpecs && effectSpecs[paramName]) {
    return effectSpecs[paramName];
  }

  // Default specs
  return { min: 0, max: 1, step: 0.01, unit: '' };
}

/**
 * Format parameter name for display
 */
function formatParameterName(paramName: string): string {
  return paramName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format parameter value for display
 */
function formatParameterValue(value: number, unit: string): string {
  if (unit === 'Hz' && value >= 1000) {
    return `${(value / 1000).toFixed(1)} kHz`;
  }
  
  if (unit === 's' && value < 1) {
    return `${(value * 1000).toFixed(0)} ms`;
  }
  
  return `${value.toFixed(2)}${unit}`;
}
