import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ExpoWebGLRenderingContext } from "expo-gl";
import { GLView } from "expo-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused } from "expo-router";
import {
  ActivityIndicator,
  AppState,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ACESFilmicToneMapping,
  Box3,
  Object3D,
  Texture,
  Vector3,
  AmbientLight,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

import { Colors } from "@/constants/colors";
import { loadExplorerModel } from "@/components/story-world/load-explorer.native";

import type { CharacterModelPreviewProps } from "./CharacterModelPreview";

const GL_VERSION = 0x1f02;

type PreviewRuntime = {
  animationFrame: number | null;
  disposed: boolean;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  display: Group | null;
  width: number;
  height: number;
};

function makeCanvas(gl: ExpoWebGLRenderingContext): HTMLCanvasElement {
  return {
    addEventListener: () => undefined,
    clientHeight: gl.drawingBufferHeight,
    clientWidth: gl.drawingBufferWidth,
    getContext: () => gl,
    height: gl.drawingBufferHeight,
    removeEventListener: () => undefined,
    setAttribute: () => undefined,
    style: {},
    width: gl.drawingBufferWidth,
  } as unknown as HTMLCanvasElement;
}

function makeRendererContext(
  gl: ExpoWebGLRenderingContext,
  canvas: HTMLCanvasElement,
): WebGLRenderingContext {
  const boundMethods = new Map<PropertyKey, (...args: unknown[]) => unknown>();
  const nativeContext = gl as unknown as Record<PropertyKey, unknown>;
  const nativeGetParameter = gl.getParameter.bind(gl);

  function ExpoGLContextAdapter() {}

  return new Proxy<Record<PropertyKey, unknown>>({}, {
    get: (_target, property) => {
      if (property === "constructor") {
        return ExpoGLContextAdapter;
      }
      if (property === "canvas") {
        return canvas;
      }
      if (property === "VERSION") {
        return typeof nativeContext.VERSION === "number"
          ? nativeContext.VERSION
          : GL_VERSION;
      }
      if (property === "getParameter") {
        return (parameter: number) => {
          const value = nativeGetParameter(parameter);
          if (parameter === GL_VERSION && typeof value !== "string") {
            return "WebGL 1.0 (Expo GL)";
          }
          return value;
        };
      }

      const value = nativeContext[property];
      if (typeof value !== "function") {
        return value;
      }
      const cached = boundMethods.get(property);
      if (cached) {
        return cached;
      }
      const bound = value.bind(gl) as (...args: unknown[]) => unknown;
      boundMethods.set(property, bound);
      return bound;
    },
    has: (_target, property) =>
      property === "VERSION" || property === "canvas" || property in nativeContext,
  }) as unknown as WebGLRenderingContext;
}

function disposeObject(root: Object3D) {
  // Several poses can share geometry/materials; release each GPU resource once.
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<MeshStandardMaterial>();
  const textures = new Set<Texture>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}

function disposeRuntime(runtime: PreviewRuntime | null) {
  if (!runtime || runtime.disposed) return;
  runtime.disposed = true;
  if (runtime.animationFrame !== null) cancelAnimationFrame(runtime.animationFrame);
  disposeObject(runtime.scene);
  runtime.renderer.dispose();
}

function fitCamera(runtime: PreviewRuntime) {
  if (!runtime.display) return;
  // Fit all sides of the model, including wide ears or a hat, during rotation.
  const bounds = new Box3().setFromObject(runtime.display);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const halfFov = runtime.camera.fov * Math.PI / 360;
  const diameter = Math.hypot(size.x, size.z);
  const distance = Math.max(size.y / 2 / Math.tan(halfFov), diameter / 2 / Math.tan(halfFov) / runtime.camera.aspect) * 1.20 + diameter / 2;
  runtime.camera.position.set(0, center.y + 0.05, distance);
  runtime.camera.lookAt(0, center.y, 0);
  runtime.camera.updateProjectionMatrix();
}

export function CharacterModelPreview({ characterId, style, interactive = false }: CharacterModelPreviewProps) {
  const runtimeRef = useRef<PreviewRuntime | null>(null);
  const mounted = useRef(false);
  const loadVersion = useRef(0);
  const loadQueue = useRef<Promise<void>>(Promise.resolve());
  const rotation = useRef({ target: 0, current: 0, start: 0 });
  const appActive = useRef(AppState.currentState === "active");
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  useEffect(() => { focusedRef.current = focused; }, [focused]);
  const [contextVersion, setContextVersion] = useState(0);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", state => { appActive.current = state === "active"; });
    return () => {
      mounted.current = false;
      subscription.remove();
      disposeRuntime(runtimeRef.current);
    };
  }, []);

  const onRotationStart = useCallback(() => {
    rotation.current.start = rotation.current.target;
  }, []);
  const onRotationMove = useCallback((dx: number) => {
    rotation.current.target = rotation.current.start + dx * 0.012;
  }, []);
  // PanResponder stores these callbacks; refs are read only on touch events.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => interactive && Math.abs(gesture.dx) > 3 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: onRotationStart,
    onPanResponderMove: (_, gesture) => onRotationMove(gesture.dx),
    onPanResponderTerminationRequest: () => true,
  }), [interactive, onRotationStart, onRotationMove]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.disposed) return;
    const version = ++loadVersion.current;
    setReady(false);
    setError(false);
    if (runtime.display) {
      runtime.scene.remove(runtime.display);
      disposeObject(runtime.display);
      runtime.display = null;
    }
    rotation.current = { target: 0, current: 0, start: 0 };
    // Serialize asset decoding. Rapid next/back skips obsolete selections.
    loadQueue.current = loadQueue.current.then(async () => {
      if (runtime.disposed || version !== loadVersion.current) return;
      try {
        const model = await loadExplorerModel(characterId);
        if (runtime.disposed || version !== loadVersion.current || !mounted.current) {
          disposeObject(model.scene);
          return;
        }
        const display = new Group();
        display.add(model.scene);
        runtime.scene.add(display);
        runtime.display = display;
        fitCamera(runtime);
        setReady(true);
      } catch (cause) {
        if (!runtime.disposed && version === loadVersion.current && mounted.current) {
          console.warn("Hindi ma-load ang character preview.", cause);
          setError(true);
          setCanRetry(true);
        }
      }
    });
  }, [characterId, contextVersion, retry]);

  const handleContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    if (!mounted.current) return;
    disposeRuntime(runtimeRef.current);
    try {
      const canvas = makeCanvas(gl);
      const renderer = new WebGLRenderer({ alpha: false, antialias: false, canvas,
        context: makeRendererContext(gl, canvas), powerPreference: "low-power" });
      renderer.setPixelRatio(1);
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      const scene = new Scene();
      scene.background = new Color(0xa9d8c4);
      scene.add(new HemisphereLight(0xf1fff9, 0x426d32, 2.05));
      scene.add(new AmbientLight(0xfff8e7, 0.65));
      const sunlight = new DirectionalLight(0xfff0c9, 2.3);
      sunlight.position.set(-3, 6, 5);
      scene.add(sunlight);
      const camera = new PerspectiveCamera(35, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 50);
      const ground = new Mesh(new CircleGeometry(1.05, 48), new MeshStandardMaterial({ color: 0x79ae72, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.025;
      scene.add(ground);
      const runtime: PreviewRuntime = { animationFrame: null, disposed: false, renderer, scene, camera,
        display: null, width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
      runtimeRef.current = runtime;
      let lastTime = 0;
      const render = (time: number) => {
        if (runtime.disposed) return;
        if (appActive.current && focusedRef.current && time - lastTime >= 30) {
          const delta = Math.min((time - lastTime) / 1000, 0.05);
          lastTime = time;
          try {
            if (runtime.width !== gl.drawingBufferWidth || runtime.height !== gl.drawingBufferHeight) {
              runtime.width = gl.drawingBufferWidth;
              runtime.height = gl.drawingBufferHeight;
              renderer.setSize(runtime.width, runtime.height, false);
              camera.aspect = runtime.width / Math.max(runtime.height, 1);
              fitCamera(runtime);
            }
            if (runtime.display) {
              rotation.current.current += (rotation.current.target - rotation.current.current) * (1 - Math.exp(-delta * 18));
              runtime.display.rotation.y = rotation.current.current;
            }
            renderer.render(scene, camera);
            gl.endFrameEXP();
          } catch (cause) {
            console.warn("Hindi ma-render ang character preview.", cause);
            disposeRuntime(runtime);
            if (mounted.current) { setReady(false); setError(true); setCanRetry(false); }
            return;
          }
        }
        runtime.animationFrame = requestAnimationFrame(render);
      };
      runtime.animationFrame = requestAnimationFrame(render);
      setContextVersion(value => value + 1);
    } catch (cause) {
      console.warn("Hindi masimulan ang character preview.", cause);
      disposeRuntime(runtimeRef.current);
      if (mounted.current) { setError(true); setCanRetry(false); }
    }
  }, []);

  return <View style={[styles.root, style]} {...pan.panHandlers}
    accessibilityLabel={interactive ? "3D tauhan. I-drag pakaliwa o pakanan upang paikutin." : "3D tauhan"}
    accessibilityRole={interactive ? "adjustable" : "image"}
    accessibilityActions={interactive ? [{ name: "increment", label: "Paikutin pakanan" }, { name: "decrement", label: "Paikutin pakaliwa" }] : undefined}
    onAccessibilityAction={event => { rotation.current.target += event.nativeEvent.actionName === "increment" ? Math.PI / 4 : -Math.PI / 4; }}>
    <GLView onContextCreate={handleContextCreate} style={styles.canvas} />
    {!ready && <View style={styles.overlay}>
      {error ? <>
        <MaterialCommunityIcons color={Colors.secondary} name="cube-off-outline" size={34} />
        <Text style={styles.errorText}>Hindi maipakita ang 3D tauhan.</Text>
        {canRetry && <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={styles.retry}>
          <Text style={styles.errorText}>Subukan muli</Text>
        </Pressable>}
      </> : <ActivityIndicator color={Colors.secondary} size="large" />}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  canvas: { flex: 1 },
  errorText: { color: Colors.primaryDark, fontSize: 12, fontWeight: "700", marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", backgroundColor: "#A9D8C4", justifyContent: "center" },
  root: { backgroundColor: "#A9D8C4", minHeight: 240, overflow: "hidden" },
  retry: { padding: 14, borderRadius: 12, backgroundColor: Colors.primarySoft, marginTop: 12 },
});
