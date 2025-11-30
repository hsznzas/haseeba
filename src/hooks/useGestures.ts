/**
 * Custom Gesture Hooks
 * 
 * Provides gesture handling for swipe, drag, and tap interactions.
 * Built on @use-gesture/react for cross-platform gesture support.
 */

import { useCallback, useState, useRef } from "react";
import { useDrag, useGesture } from "@use-gesture/react";
import { onSwipeAction, onDragStart, onDragEnd } from "@/services/haptics";

// ============================================
// Types
// ============================================

export interface SwipeConfig {
  /** Minimum distance to trigger swipe (px) */
  threshold?: number;
  /** Callback when swiped left */
  onSwipeLeft?: () => void;
  /** Callback when swiped right */
  onSwipeRight?: () => void;
  /** Enable haptic feedback */
  haptics?: boolean;
}

export interface DragConfig {
  /** Axis to constrain drag */
  axis?: "x" | "y" | "both";
  /** Bounds for drag movement */
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  /** Enable haptic feedback */
  haptics?: boolean;
  /** Callback on drag start */
  onDragStart?: () => void;
  /** Callback on drag end */
  onDragEnd?: (position: { x: number; y: number }) => void;
  /** Callback during drag */
  onDrag?: (position: { x: number; y: number }) => void;
}

export interface LongPressConfig {
  /** Duration before triggering (ms) */
  duration?: number;
  /** Callback when long press triggered */
  onLongPress: () => void;
  /** Enable haptic feedback */
  haptics?: boolean;
}

// ============================================
// useSwipe Hook
// ============================================

/**
 * Hook for swipe gesture detection
 * 
 * @example
 * const swipeHandlers = useSwipe({
 *   onSwipeLeft: () => deleteItem(),
 *   onSwipeRight: () => completeItem(),
 *   haptics: true,
 * });
 * 
 * return <div {...swipeHandlers}>Swipeable content</div>
 */
export function useSwipe(config: SwipeConfig = {}) {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    haptics = true,
  } = config;

  const [swipeState, setSwipeState] = useState<"idle" | "swiping" | "swiped">("idle");
  const [swipeOffset, setSwipeOffset] = useState(0);

  const bind = useDrag(
    ({ movement: [mx], direction: [dx], velocity: [vx], active, cancel: _cancel }) => {
      if (active) {
        setSwipeState("swiping");
        setSwipeOffset(mx);
      } else {
        // Check if swipe threshold reached
        const isSwipe = Math.abs(mx) > threshold || vx > 0.5;

        if (isSwipe) {
          setSwipeState("swiped");
          
          if (haptics) {
            onSwipeAction();
          }

          if (dx < 0 && onSwipeLeft) {
            onSwipeLeft();
          } else if (dx > 0 && onSwipeRight) {
            onSwipeRight();
          }
        }

        // Reset after animation
        setTimeout(() => {
          setSwipeState("idle");
          setSwipeOffset(0);
        }, 200);
      }
    },
    {
      axis: "x",
      filterTaps: true,
    }
  );

  return {
    bind,
    swipeState,
    swipeOffset,
    style: {
      transform: `translateX(${swipeOffset}px)`,
      transition: swipeState === "idle" ? "transform 0.2s ease-out" : "none",
    },
  };
}

// ============================================
// useDraggable Hook
// ============================================

/**
 * Hook for draggable elements
 * 
 * @example
 * const { bind, position, isDragging } = useDraggable({
 *   axis: "y",
 *   onDragEnd: (pos) => reorderItems(pos.y),
 * });
 * 
 * return <div {...bind()} style={{ transform: `translateY(${position.y}px)` }}>Draggable</div>
 */
export function useDraggable(config: DragConfig = {}) {
  const {
    axis = "both",
    bounds,
    haptics = true,
    onDragStart: onStart,
    onDragEnd: onEnd,
    onDrag,
  } = config;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const bind = useDrag(
    ({ movement: [mx, my], first, last, active }) => {
      if (first) {
        setIsDragging(true);
        if (haptics) onDragStart();
        onStart?.();
      }

      if (active) {
        let x = axis === "y" ? 0 : mx;
        let y = axis === "x" ? 0 : my;

        // Apply bounds
        if (bounds) {
          if (bounds.left !== undefined) x = Math.max(bounds.left, x);
          if (bounds.right !== undefined) x = Math.min(bounds.right, x);
          if (bounds.top !== undefined) y = Math.max(bounds.top, y);
          if (bounds.bottom !== undefined) y = Math.min(bounds.bottom, y);
        }

        setPosition({ x, y });
        onDrag?.({ x, y });
      }

      if (last) {
        setIsDragging(false);
        if (haptics) onDragEnd();
        onEnd?.(position);
        setPosition({ x: 0, y: 0 });
      }
    },
    {
      filterTaps: true,
    }
  );

  return {
    bind,
    position,
    isDragging,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      cursor: isDragging ? "grabbing" : "grab",
      touchAction: "none",
    },
  };
}

// ============================================
// useLongPress Hook
// ============================================

/**
 * Hook for long press detection
 * 
 * @example
 * const longPressHandlers = useLongPress({
 *   duration: 500,
 *   onLongPress: () => showContextMenu(),
 * });
 * 
 * return <button {...longPressHandlers}>Long press me</button>
 */
export function useLongPress(config: LongPressConfig) {
  const {
    duration = 500,
    onLongPress,
    haptics = true,
  } = config;

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [isPressed, setIsPressed] = useState(false);

  const start = useCallback(() => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      if (haptics) {
        onDragStart(); // Reuse for haptic feedback
      }
      onLongPress();
      setIsPressed(false);
    }, duration);
  }, [duration, haptics, onLongPress]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsPressed(false);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    isPressed,
  };
}

// ============================================
// useDoubleTap Hook
// ============================================

/**
 * Hook for double tap detection
 * 
 * @example
 * const doubleTapHandlers = useDoubleTap({
 *   onDoubleTap: () => likeItem(),
 * });
 * 
 * return <div {...doubleTapHandlers}>Double tap me</div>
 */
export function useDoubleTap(config: {
  onDoubleTap: () => void;
  delay?: number;
  haptics?: boolean;
}) {
  const { onDoubleTap, delay = 300, haptics = true } = config;

  const lastTapRef = useRef<number>(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      if (haptics) {
        onSwipeAction();
      }
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [delay, haptics, onDoubleTap]);

  return {
    onClick: handleTap,
    onTouchEnd: handleTap,
  };
}

// ============================================
// usePinch Hook (for future use)
// ============================================

/**
 * Hook for pinch gesture (zoom)
 * Placeholder for future implementation
 */
export function usePinch(config: {
  onPinch?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
}) {
  const [scale, setScale] = useState(1);

  const bind = useGesture({
    onPinch: ({ offset: [s] }) => {
      setScale(s);
      config.onPinch?.(s);
    },
    onPinchEnd: ({ offset: [s] }) => {
      config.onPinchEnd?.(s);
    },
  });

  return {
    bind,
    scale,
  };
}

