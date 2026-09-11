import { Canvas } from "@react-three/fiber/native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { useThreePerformance } from "@/hooks/useThreePerformance";
import type { ThreeCanvasProps } from "@/types/three.types";

import { ThreeErrorBoundary } from "./ThreeErrorBoundary";
import { ThreeMotionProvider } from "./ThreeMotion";

const DEFAULT_CAMERA_POSITION = [0, 0, 5] as const;

function DefaultFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>Hindi available ang 3D preview.</Text>
    </View>
  );
}

export function ThreeCanvas({
  active = true,
  backgroundColor = Colors.primarySoft,
  cameraPosition = DEFAULT_CAMERA_POSITION,
  children,
  enable3D = true,
  enableAnimations = true,
  fallback,
  loadingFallback,
  maxPixelRatio = 1.5,
  style,
  transparentBackground = false,
}: ThreeCanvasProps) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const { animationsEnabled, reduceMotion, shouldRender } =
    useThreePerformance({
      active,
      enable3D,
      enableAnimations,
      maxPixelRatio,
    });
  const fallbackContent = fallback ?? <DefaultFallback />;

  if (!shouldRender) {
    return <View style={[styles.container, style]}>{fallbackContent}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      <ThreeErrorBoundary
        fallback={fallbackContent}
        onError={() => setFailed(true)}
      >
        <Canvas
          camera={{ position: cameraPosition, fov: 45 }}
          frameloop={animationsEnabled ? "always" : "demand"}
          gl={{
            alpha: transparentBackground,
            antialias: false,
            powerPreference: "low-power",
          }}
          onCreated={() => setReady(true)}
          performance={{ min: 0.5, max: 1, debounce: 250 }}
          style={styles.canvas}
        >
          {transparentBackground ? null : (
            <color attach="background" args={[backgroundColor]} />
          )}
          <ambientLight intensity={0.85} />
          <directionalLight intensity={1.1} position={[3, 4, 5]} />
          <ThreeMotionProvider
            animationsEnabled={animationsEnabled}
            reduceMotion={reduceMotion}
          >
            {children}
          </ThreeMotionProvider>
        </Canvas>
      </ThreeErrorBoundary>

      {!ready && !failed ? (
        <View pointerEvents="none" style={styles.loading}>
          {loadingFallback ?? <ActivityIndicator color={Colors.primary} />}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  container: {
    minHeight: 180,
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: Colors.primarySoft,
    flex: 1,
    justifyContent: "center",
    minHeight: 180,
    padding: 20,
  },
  fallbackText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: Colors.primarySoft,
    justifyContent: "center",
  },
});
