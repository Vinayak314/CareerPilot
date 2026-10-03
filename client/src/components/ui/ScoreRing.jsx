import { useEffect, useState } from 'react';
import { scoreLevel, scoreLabel } from '../../lib/format';

const STROKES = {
  good: '#10b981',
  fair: '#f59e0b',
  poor: '#ef4444',
  none: '#cbd5e1',
};

/**
 * Circular match ring. Colour follows the shared thresholds and the accessible
 * label always includes a text description, so severity isn't conveyed by colour alone.
 */
const ScoreRing = ({ score, size = 64, stroke, label, className = '', textClassName = '' }) => {
  const level = scoreLevel(score);
  const strokeWidth = stroke ?? Math.max(4, Math.round(size / 11));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = level === 'none' ? 0 : score;

  // Animate from empty on mount.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const offset = circumference - (shown / 100) * circumference;
  const fontSize = size >= 110 ? 'text-3xl' : size >= 80 ? 'text-xl' : size >= 56 ? 'text-sm' : 'text-xs';
  const accessibleLabel = `${label ? `${label}: ` : ''}${level === 'none' ? 'not scored' : `${score}%, ${scoreLabel(score).toLowerCase()}`}`;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={accessibleLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="donut-ring" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STROKES[level]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-progress"
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-bold text-slate-900 ${fontSize} ${textClassName}`}
        aria-hidden="true"
      >
        {level === 'none' ? '—' : `${score}%`}
      </span>
    </div>
  );
};

export default ScoreRing;
