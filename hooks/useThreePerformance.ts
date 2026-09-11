import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, PixelRatio } from "react-native";

type ThreePerformanceOptions = {
  active?: boolean;
  enable3D?: boolean;
  enableAnimations?: boolean;
  maxPixelRatio?: number;
};

export function useThreePerformance({
  active = true,
  enable3D = true,
  enableAnimations = true,
  maxPixelRatio = 1.5,
}: ThreePerformanceOptions = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (mounted) {
        setReduceMotion(isEnabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return useMemo(() => {
    const animationsEnabled = active && enableAnimations && !reduceMotion;

    return {
      animationsEnabled,
      pixelRatio: Math.min(PixelRatio.get(), maxPixelRatio),
      reduceMotion,
      shouldRender: active && enable3D,
    };
  }, [active, enable3D, enableAnimations, maxPixelRatio, reduceMotion]);
}
