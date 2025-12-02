import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';

interface AnimatedFlameProps {
  size?: number;
  streak: number;
  className?: string;
}

/**
 * Animated flame icon with randomized animation parameters
 * Each instance gets unique timing, scale, rotation and float effects
 */
const AnimatedFlame: React.FC<AnimatedFlameProps> = ({ size = 10, streak, className = '' }) => {
  // Generate random animation parameters (memoized so they stay consistent)
  const animParams = useMemo(() => ({
    // Animation duration between 0.8s and 1.6s
    duration: 0.8 + Math.random() * 0.8,
    // Animation delay between 0 and 0.5s
    delay: Math.random() * 0.5,
    // Scale variation: oscillates between these values
    scaleMin: 0.85 + Math.random() * 0.1,
    scaleMax: 1.1 + Math.random() * 0.15,
    // Rotation range: -15 to 15 degrees max
    rotationRange: 5 + Math.random() * 10,
    // Opacity variation
    opacityMin: 0.7 + Math.random() * 0.2,
    // Y-axis float amount
    floatAmount: 0.5 + Math.random() * 1.5,
  }), []);

  // Unique animation name based on params
  const animationName = `flame-dance-${Math.random().toString(36).substr(2, 9)}`;

  // Keyframes CSS (no glow, just transform and opacity)
  const keyframesStyle = `
    @keyframes ${animationName} {
      0%, 100% {
        transform: scale(${animParams.scaleMin}) rotate(-${animParams.rotationRange}deg) translateY(0px);
        opacity: ${animParams.opacityMin};
      }
      25% {
        transform: scale(${animParams.scaleMax}) rotate(${animParams.rotationRange * 0.5}deg) translateY(-${animParams.floatAmount}px);
        opacity: 1;
      }
      50% {
        transform: scale(${(animParams.scaleMin + animParams.scaleMax) / 2}) rotate(${animParams.rotationRange}deg) translateY(-${animParams.floatAmount * 0.5}px);
        opacity: ${(1 + animParams.opacityMin) / 2};
      }
      75% {
        transform: scale(${animParams.scaleMax * 0.95}) rotate(-${animParams.rotationRange * 0.3}deg) translateY(-${animParams.floatAmount * 1.2}px);
        opacity: 0.95;
      }
    }
  `;

  // Calculate streak-based size enhancement (no glow)
  const streakBonus = Math.min(streak / 30, 1); // Max bonus at 30 day streak

  return (
    <span className={`inline-flex items-center ${className}`}>
      <style>{keyframesStyle}</style>
      <span
        className="inline-block"
        style={{
          animation: `${animationName} ${animParams.duration}s ease-in-out infinite`,
          animationDelay: `${animParams.delay}s`,
          transformOrigin: 'center bottom',
        }}
      >
        <Flame
          size={size}
          className="text-orange-500"
          fill="currentColor"
          style={{
            // Longer streaks get slightly larger flames
            transform: `scale(${1 + streakBonus * 0.2})`,
          }}
        />
      </span>
    </span>
  );
};

export default AnimatedFlame;

