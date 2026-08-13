import React, { useRef, useCallback } from 'react';
import {
  View, Animated, PanResponder, StyleSheet, useWindowDimensions,
} from 'react-native';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface Props {
  uri: string;
  onZoomChange?: (isZoomed: boolean) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTouchDist(touches: { pageX: number; pageY: number }[]) {
  const dx = touches[1].pageX - touches[0].pageX;
  const dy = touches[1].pageY - touches[0].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

const ZoomableImage: React.FC<Props> = ({ uri, onZoomChange }) => {
  const { width, height } = useWindowDimensions();

  // Animated values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Refs for current committed state
  const scale = useRef(1);
  const transX = useRef(0);
  const transY = useRef(0);

  // Gesture tracking refs
  const startScale = useRef(1);
  const startDist = useRef(0);
  const startTransX = useRef(0);
  const startTransY = useRef(0);
  const isPinching = useRef(false);

  // Double tap timing
  const lastTapTime = useRef(0);

  const resetZoom = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(translateXAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(translateYAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
    ]).start();
    scale.current = 1;
    transX.current = 0;
    transY.current = 0;
    onZoomChange?.(false);
  }, [scaleAnim, translateXAnim, translateYAnim, onZoomChange]);

  const panResponder = useRef(
    PanResponder.create({
      // Do NOT claim touches on initial touch down at 1x so PagerView gets swipes
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gs) => {
        const touchCount = evt.nativeEvent.touches.length;
        // Claim gesture if 2 fingers (pinch) OR if already zoomed in (> 1.05x)
        if (touchCount === 2) return true;
        if (scale.current > 1.05) return true;
        return false;
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          isPinching.current = true;
          startDist.current = getTouchDist(touches as any);
          startScale.current = scale.current;
        } else {
          isPinching.current = false;
          startTransX.current = transX.current;
          startTransY.current = transY.current;
        }
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch zoom in progress
          isPinching.current = true;
          const dist = getTouchDist(touches as any);
          if (startDist.current > 0) {
            const ratio = dist / startDist.current;
            const newScale = clamp(startScale.current * ratio, MIN_SCALE, MAX_SCALE);
            scale.current = newScale;
            scaleAnim.setValue(newScale);
            onZoomChange?.(newScale > 1.05);
          }
        } else if (touches.length === 1 && scale.current > 1.05 && !isPinching.current) {
          // Pan in progress (single finger while zoomed)
          const maxX = (width * (scale.current - 1)) / 2;
          const maxY = (height * (scale.current - 1)) / 2;
          const newX = clamp(startTransX.current + gs.dx, -maxX, maxX);
          const newY = clamp(startTransY.current + gs.dy, -maxY, maxY);
          transX.current = newX;
          transY.current = newY;
          translateXAnim.setValue(newX);
          translateYAnim.setValue(newY);
        }
      },
      onPanResponderRelease: () => {
        isPinching.current = false;

        if (scale.current < 1.05) {
          resetZoom();
        } else {
          // Clamp pan position within zoomed bounds
          const maxX = (width * (scale.current - 1)) / 2;
          const maxY = (height * (scale.current - 1)) / 2;
          const boundedX = clamp(transX.current, -maxX, maxX);
          const boundedY = clamp(transY.current, -maxY, maxY);
          transX.current = boundedX;
          transY.current = boundedY;
          translateXAnim.setValue(boundedX);
          translateYAnim.setValue(boundedY);
          onZoomChange?.(true);
        }
      },
      onPanResponderTerminate: () => {
        isPinching.current = false;
        if (scale.current < 1.05) {
          resetZoom();
        }
      },
    })
  ).current;

  const handleTouchEnd = useCallback((evt: any) => {
    // Handle double-tap to zoom/reset cleanly without blocking PagerView swipes
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      lastTapTime.current = 0;
      if (scale.current > 1.05) {
        resetZoom();
      } else {
        const targetScale = 2.5;
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: targetScale, useNativeDriver: true }),
          Animated.spring(translateXAnim, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateYAnim, { toValue: 0, useNativeDriver: true }),
        ]).start();
        scale.current = targetScale;
        transX.current = 0;
        transY.current = 0;
        onZoomChange?.(true);
      }
    } else {
      lastTapTime.current = now;
    }
  }, [resetZoom, scaleAnim, translateXAnim, translateYAnim, onZoomChange]);

  return (
    <View
      style={[styles.container, { width, height }]}
      onTouchEnd={handleTouchEnd}
      {...panResponder.panHandlers}
    >
      <Animated.Image
        source={{ uri }}
        style={[
          styles.image,
          { width, height },
          {
            transform: [
              { translateX: translateXAnim },
              { translateY: translateYAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {},
});

export default ZoomableImage;
