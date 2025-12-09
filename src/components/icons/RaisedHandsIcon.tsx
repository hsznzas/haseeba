import React from 'react';
import { Hand } from 'lucide-react';

interface RaisedHandsIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Raised hands icon (similar to 🙌) using two Lucide Hand icons
 * Left hand is flipped horizontally, creating a celebratory pose
 */
const RaisedHandsIcon: React.FC<RaisedHandsIconProps> = ({ 
  size = 24, 
  className = '',
  strokeWidth = 2
}) => (
  <span 
    className={`inline-flex items-center justify-center ${className}`}
    style={{ width: size, height: size }}
  >
    <Hand size={size * 0.75} strokeWidth={strokeWidth} style={{ transform: 'scaleX(-1)', marginRight: -2 }} />
    <Hand size={size * 0.75} strokeWidth={strokeWidth} style={{ marginLeft: -2 }} />
  </span>
);

export default RaisedHandsIcon;
