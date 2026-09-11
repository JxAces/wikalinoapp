import type { ExpoWebGLRenderingContext } from "expo-gl";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  msaaSamples?: number;
  onContextCreate: (context: ExpoWebGLRenderingContext) => void;
};

/** A real browser context with Expo's end-of-frame contract. Shared scene code
 * uses the real canvas and bypasses the native HostObject adapter on web. */
export function RenderSurface({ style, onContextCreate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callback = useRef(onContextCreate);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { callback.current = onContextCreate; }, [onContextCreate]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    };
    const create = () => {
      resize();
      const options = { alpha: false, antialias: false, powerPreference: "low-power" as const };
      const gl = canvas.getContext("webgl2", options) || canvas.getContext("webgl", options);
      if (!gl) { setError("Hindi suportado ng browser na ito ang WebGL. Subukan ang ibang browser."); return; }
      Object.assign(gl, { endFrameEXP: () => undefined });
      setError(null);
      callback.current(gl as unknown as ExpoWebGLRenderingContext);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      setError("Naghihintay na maibalik ang 3D graphics…");
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", create);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // Parent preview installs its disposal guards in an effect first.
    const frame = requestAnimationFrame(create);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", create);
    };
  }, []);
  return <View style={[styles.root, style]}>
    <canvas ref={canvasRef} aria-label="Wikalino 3D scene" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", touchAction: "none" }} />
    {error && <View style={styles.error}><Text style={styles.text}>{error}</Text></View>}
  </View>;
}
const styles = StyleSheet.create({
  root: { overflow: "hidden" },
  error: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#A9D8C4" },
  text: { color: "#203F36", textAlign: "center" },
});
