import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';

interface AnimatedFlameProps {
  size?: number;
  streak: number;
  className?: string;
}

/**
 * Animated flame icon with realistic flickering animation
 * Each instance gets unique timing for organic, randomized feel
 */
const AnimatedFlame: React.FC<AnimatedFlameProps> = ({ size = 10, streak, className = '' }) => {
  // Generate random animation parameters (memoized so they stay consistent)
  const animParams = useMemo(() => {
    // Random values for each keyframe to create organic flickering
    const flicker = () => ({
      scale: 0.95 + Math.random() * 0.08, // Very subtle: 0.95 to 1.08
      rotate: -3 + Math.random() * 8, // Small rotation: -3 to 3 degrees
      y: Math.random() * 0.8, // Tiny float: 0 to 0.5px
      opacity: 0.70 + Math.random() * 0.15, // 0.85 to 1.0
    });
    
    return {
      // Fast flickering: 0.3s to 0.6s
      duration: 0.3 + Math.random() * 0.3,
      // Stagger start times
      delay: Math.random() * 0.3,
      // Generate 8 random keyframe states for irregular flickering
      k0: flicker(),
      k1: flicker(),
      k2: flicker(),
      k3: flicker(),
      k4: flicker(),
      k5: flicker(),
      k6: flicker(),
      k7: flicker(),
    };
  }, []);

  // Unique animation name
  const animationName = `flame-flicker-${Math.random().toString(36).substr(2, 9)}`;

  // Keyframes with many steps for realistic flickering (no smooth transitions)
  const keyframesStyle = `
    @keyframes ${animationName} {
      0% {
        transform: scale(${animParams.k0.scale}) rotate(${animParams.k0.rotate}deg) translateY(-${animParams.k0.y}px);
        opacity: ${animParams.k0.opacity};
      }
      12% {
        transform: scale(${animParams.k1.scale}) rotate(${animParams.k1.rotate}deg) translateY(-${animParams.k1.y}px);
        opacity: ${animParams.k1.opacity};
      }
      25% {
        transform: scale(${animParams.k2.scale}) rotate(${animParams.k2.rotate}deg) translateY(-${animParams.k2.y}px);
        opacity: ${animParams.k2.opacity};
      }
      37% {
        transform: scale(${animParams.k3.scale}) rotate(${animParams.k3.rotate}deg) translateY(-${animParams.k3.y}px);
        opacity: ${animParams.k3.opacity};
      }
      50% {
        transform: scale(${animParams.k4.scale}) rotate(${animParams.k4.rotate}deg) translateY(-${animParams.k4.y}px);
        opacity: ${animParams.k4.opacity};
      }
      62% {
        transform: scale(${animParams.k5.scale}) rotate(${animParams.k5.rotate}deg) translateY(-${animParams.k5.y}px);
        opacity: ${animParams.k5.opacity};
      }
      75% {
        transform: scale(${animParams.k6.scale}) rotate(${animParams.k6.rotate}deg) translateY(-${animParams.k6.y}px);
        opacity: ${animParams.k6.opacity};
      }
      87% {
        transform: scale(${animParams.k7.scale}) rotate(${animParams.k7.rotate}deg) translateY(-${animParams.k7.y}px);
        opacity: ${animParams.k7.opacity};
      }
      100% {
        transform: scale(${animParams.k0.scale}) rotate(${animParams.k0.rotate}deg) translateY(-${animParams.k0.y}px);
        opacity: ${animParams.k0.opacity};
      }
    }
  `;

  // Minimal streak bonus (very subtle)
  const streakBonus = Math.min(streak / 50, 1); // Max bonus at 50 day streak

  return (
    <span className={`inline-flex items-center ${className}`}>
      <style>{keyframesStyle}</style>
      <span
        className="inline-block"
        style={{
          // Use steps() for instant jumps between keyframes - more flame-like
          animation: `${animationName} ${animParams.duration}s steps(8) infinite`,
          animationDelay: `${animParams.delay}s`,
          transformOrigin: 'center bottom',
        }}
      >
        <Flame
          size={size}
          className="text-orange-500"
          fill="currentColor"
          style={{
            // Very subtle size increase for long streaks
            transform: `scale(${1 + streakBonus * 0.08})`,
          }}
        />
      </span>
    </span>
  );
};

export default AnimatedFlame;

