import { Platform } from "react-native";
import type { ExpoWebGLRenderingContext } from "expo-gl";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Clock,
  Color,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  cameraRelativeMovement,
  chaseCameraPose,
  followHeading,
  INITIAL_CHARACTER_HEADING,
} from "./story-world-camera";
import { createMeadowEnvironment, MEADOW_LIGHTING, STORY_HUT_PLACEMENT } from "./story-world-environment";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  STORY_INTERACTION_DISTANCE,
  STORY_WORLD_BOUNDS,
  RETURN_PORTAL_ID,
  RETURN_PORTAL_POSITION,
  worldChestPosition,
} from "./story-world.constants";
import {
  loadExplorerModel,
  loadStoryScrollModel,
  loadTropicalHutModel,
  loadTreasureChestModel,
} from "./load-explorer.native";
import type { PlayerCharacterId } from "@/data/player-characters";
import { bakeExplorerWalk, type BakedExplorerWalk } from "./baked-explorer-walk";
import { ExplorerWalk } from "./explorer-walk";
import { disposeWorldObject } from "./dispose-world-object";
import { prepareCompatibleSkinning, type CompatibleSkinning } from "./compatible-skinning";
import type {
  StoryPortalState,
  StoryWorldInput,
  StoryWorldPortal,
  StoryWorldStatus,
} from "./story-world.types";

import { createStoryPortal } from "./story-portal-visual";
import { createQuestScenery } from "./quest-scenery";
import { isWorldChestUnlocked, storySetting, worldNodeId } from "./quest-progression";

type StoryWorldEngineOptions = {
  questStoryId?: string;
  spawnPosition?: { x: number; z: number };
  characterId: PlayerCharacterId;
  gl: ExpoWebGLRenderingContext;
  onError: (error: Error) => void;
  onReady: () => void;
  onStatusChange: (status: StoryWorldStatus) => void;
  portals: StoryWorldPortal[];
};

type AnimatedStoryScroll = {
  completedBadge: Group;
  group: Group;
  marker: Mesh;
  markerMaterial: MeshBasicMaterial;
  materials: MeshStandardMaterial[];
  phase: number;
  scroll: Group;
  storyId: string;
};

const GL_VERSION = 0x1f02;
const START_POSITION = new Vector3(0, 0, 12.2);
const tempCameraPosition = new Vector3();
const tempCameraTarget = new Vector3();
const tempObject = new Object3D();

function mergeGeometryParts(parts: BufferGeometry[], label: string) {
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) {
    throw new Error(`Hindi mabuo ang ${label} ng 3D story world.`);
  }
  return merged;
}

function scrollAppearance(state: StoryPortalState) {
  if (state === "completed") {
    return {
      color: 0x9fcf88,
      emissive: 0x173b1c,
      marker: 0x73d895,
      markerOpacity: 0.34,
      opacity: 1,
    };
  }
  if (state === "locked") {
    return {
      color: 0x797b73,
      emissive: 0x000000,
      marker: 0x777a82,
      markerOpacity: 0.2,
      opacity: 0.56,
    };
  }
  return {
    color: 0xf2bc58,
    emissive: 0x4a2704,
    marker: 0xffd66f,
    markerOpacity: 0.42,
    opacity: 1,
  };
}

function makeCanvas(gl: ExpoWebGLRenderingContext): HTMLCanvasElement {
  if (typeof HTMLCanvasElement !== "undefined" && gl.canvas instanceof HTMLCanvasElement) return gl.canvas;
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

/**
 * Expo GL exposes a native HostObject rather than a browser WebGL context.
 * Three's WebGL 1 renderer expects VERSION to always be present and all GL
 * methods to be called with the native HostObject as `this`. The adapter keeps
 * those native bindings while filling the one browser capability Expo may omit.
 */
function makeRendererContext(
  gl: ExpoWebGLRenderingContext,
  canvas: HTMLCanvasElement,
): WebGLRenderingContext {
  if (typeof HTMLCanvasElement !== "undefined" && gl.canvas instanceof HTMLCanvasElement) return gl as unknown as WebGLRenderingContext;
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

      // Avoid crossing into Expo's native HostObject again for every draw.
      const cached = boundMethods.get(property);
      if (cached) return cached;
      const value = nativeContext[property];
      if (typeof value !== "function") return value;
      const bound = value.bind(gl) as (...args: unknown[]) => unknown;
      boundMethods.set(property, bound);
      return bound;
    },
    has: (_target, property) =>
      property === "VERSION" || property === "canvas" || property in nativeContext,
  }) as unknown as WebGLRenderingContext;
}

export class StoryWorldEngine {
  private activeAnimation: StoryWorldStatus["animation"] = "Idle";
  private storyGates: ReturnType<typeof createStoryPortal>[] = [];
  private animatedStoryScrolls: AnimatedStoryScroll[] = [];
  private animationFrame: number | null = null;
  private camera: PerspectiveCamera;
  private cameraAnchor = START_POSITION.clone();
  private cameraHeading = INITIAL_CHARACTER_HEADING;
  private movementHeading = INITIAL_CHARACTER_HEADING;
  private movementDirection = new Vector3();
  private character = new Group();
  private characterVisual = new Group();
  private clock = new Clock(false);
  private disposed = false;
  private input: StoryWorldInput = { x: 0, y: 0 };
  private lastNearestStoryId: string | null = null;
  private nearChest = false;
  private nearReturnPortal = false;
  private returnGate: ReturnType<typeof createStoryPortal> | null = null;
  private chestLock: Mesh | null = null;
  private locomotionStyle: "hop" | "walk" = "walk";
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private standingPose: Object3D | null = null;
  private walkingPose: Object3D | null = null;
  private explorerWalk: ExplorerWalk | null = null;
  private bakedWalk: BakedExplorerWalk = null;
  private explorerSkinning: CompatibleSkinning = null;
  private walkPhase = 0;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private lastRenderedAt: number | null = null;
  private loadingStage = "environment";
  private renderedStage = "";
  private skinningElapsed = 0;
  private measuredFrames = 0;
  private measuredSince = 0;
  private measuredWorkMs = 0;
  private measuredUpdateMs = 0;
  private measuredRenderMs = 0;

  constructor(private options: StoryWorldEngineOptions) {
    const { gl } = options;
    const canvas = makeCanvas(gl);
    const rendererContext = makeRendererContext(gl, canvas);
    this.camera = new PerspectiveCamera(
      48,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      75,
    );
    this.renderer = new WebGLRenderer({
      alpha: false,
      antialias: false,
      canvas,
      context: rendererContext,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    if (options.spawnPosition) {
      this.character.position.set(options.spawnPosition.x, 0, options.spawnPosition.z);
      this.cameraAnchor.copy(this.character.position);
    }
    this.createScene();
    this.start();
    void this.loadWorldModels();
  }

  setInput(input: StoryWorldInput) {
    if (Math.hypot(this.input.x, this.input.y) <= 0.06 && Math.hypot(input.x, input.y) > 0.06) {
      // Keep the view's direction at the start of a gesture. Recomputing this
      // while the camera turns would make holding sideways spiral endlessly.
      this.movementHeading = this.cameraHeading;
    }
    this.input = input;
  }

  updatePortals(portals: StoryWorldPortal[]) {
    this.options.portals = portals;
    if (this.chestLock) this.chestLock.visible = !isWorldChestUnlocked(portals);
    for (const gate of this.storyGates) {
      const portal = portals.find(portal => portal.story.id === gate.storyId);
      if (portal) gate.setState(portal.state);
    }
    for (const visual of this.animatedStoryScrolls) {
      const portal = portals.find(portal => worldNodeId(portal) === visual.storyId);
      if (!portal) {
        continue;
      }
      this.updateScrollAppearance(visual, portal.state);
    }
  }

  start() {
    if (this.disposed || this.animationFrame !== null) {
      return;
    }
    this.clock.start();
    this.lastRenderedAt = null;
    this.measuredFrames = 0;
    this.measuredSince = 0;
    this.measuredWorkMs = 0;
    this.measuredUpdateMs = 0;
    this.measuredRenderMs = 0;
    this.animationFrame = requestAnimationFrame(this.renderFrame);
  }

  stop() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.clock.stop();
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stop();
    this.explorerWalk?.dispose();
    this.bakedWalk?.dispose();
    this.explorerSkinning?.dispose();
    disposeWorldObject(this.scene);
    this.renderer.dispose();
  }

  private createScene() {
    const setting = storySetting(this.options.questStoryId);
    this.scene.background = new Color(setting?.sky ?? MEADOW_LIGHTING.sky);
    this.scene.fog = new FogExp2(setting?.sky ?? MEADOW_LIGHTING.fog, MEADOW_LIGHTING.fogDensity);
    this.scene.add(new HemisphereLight(
      MEADOW_LIGHTING.hemisphereSky, MEADOW_LIGHTING.hemisphereGround,
      MEADOW_LIGHTING.hemisphereIntensity,
    ));
    this.scene.add(new AmbientLight(0xfff8e7, MEADOW_LIGHTING.ambientIntensity));
    const sunlight = new DirectionalLight(0xfff0c9, MEADOW_LIGHTING.sunlightIntensity);
    sunlight.position.set(-6, 11, 8);
    this.scene.add(sunlight);
    const meadow = createMeadowEnvironment(Platform.OS !== "web");
    // Static scenery never needs its local matrices recomposed each frame.
    meadow.traverse(object => { object.updateMatrix(); object.matrixAutoUpdate = false; });
    this.scene.add(meadow);

    if (this.options.questStoryId) this.scene.add(createQuestScenery(this.options.questStoryId));
    this.addPath();
    if (!this.options.spawnPosition) this.character.position.copy(START_POSITION);
    this.character.rotation.y = INITIAL_CHARACTER_HEADING;
    this.character.add(this.characterVisual);
    this.scene.add(this.character);
    this.updateCamera(0);
  }

  private addPath() {
    const curvePoints = [
      new Vector3(0, 0.015, 13.2),
      ...this.options.portals.map(({ position }) => new Vector3(position.x, 0.015, position.z)),
      new Vector3(0, 0.015, worldChestPosition(Boolean(this.options.questStoryId)).z),
    ];
    const curve = new CatmullRomCurve3(curvePoints, false, "catmullrom", 0.35);
    const geometry = new BoxGeometry(0.82, 0.08, 1.05);
    const material = new MeshLambertMaterial({ color: storySetting(this.options.questStoryId)?.path ?? 0xd3bd82 });
    const stoneGeometries: BufferGeometry[] = [];
    const count = this.options.questStoryId ? 32 : 58;
    for (let index = 0; index < count; index += 1) {
      const progress = index / (count - 1);
      const point = curve.getPoint(progress);
      const tangent = curve.getTangent(progress);
      tempObject.position.copy(point);
      tempObject.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
      const alternatingScale = index % 3 === 0 ? 1.12 : 0.96;
      tempObject.scale.set(alternatingScale, 1, 0.9);
      tempObject.updateMatrix();
      const stoneGeometry = geometry.clone();
      stoneGeometry.applyMatrix4(tempObject.matrix);
      stoneGeometries.push(stoneGeometry);
    }
    const mergedGeometry = mergeGeometryParts(stoneGeometries, "landas");
    geometry.dispose();
    const stones = new Mesh(mergedGeometry, material);
    this.scene.add(stones);
  }

  private async loadWorldModels() {
    try {
      const stages: [string, () => void | Promise<void>][] = [
        [`character:${this.options.characterId}`, () => this.addExplorer()],
        [this.options.questStoryId ? "scrolls" : "portals", () => this.options.questStoryId ? this.addStoryScrolls() : this.addStoryGates()],
        ...(!this.options.questStoryId ? [["hut", () => this.addTropicalHut()] as [string, () => Promise<void>]] : []),
        ["chest", () => this.addTreasureChest()],
      ];
      // Stagger GLB decoding and first uploads instead of creating every
      // model while the intro is still releasing its native views.
      for (const [label, load] of stages) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        if (this.disposed) return;
        if (__DEV__) console.info(`[Wikalino world] loading ${label}`);
        await load();
        if (this.disposed) return;
        this.loadingStage = label;
      }
      if (this.disposed) {
        return;
      }
      this.options.onReady();
      if (__DEV__) console.info("[Wikalino world] ready");
    } catch (cause) {
      if (this.disposed) return;
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.options.onError(error);
    }
  }

  private async addExplorer() {
    const model = await loadExplorerModel(this.options.characterId);
    if (this.disposed) {
      disposeWorldObject(model.scene);
      return;
    }
    // Prepare off-scene: rendering and navigation can continue between poses,
    // and leaving during preparation must not attach a late-loaded character.
    if (Platform.OS !== "web" && model.walkClip) {
      try {
        this.bakedWalk = await bakeExplorerWalk(model.scene, model.walkClip, () => this.disposed);
      } catch (error) {
        disposeWorldObject(model.scene);
        throw error;
      }
      if (this.disposed) {
        this.bakedWalk?.dispose();
        disposeWorldObject(model.scene);
        return;
      }
    }
    this.standingPose = model.standingPose;
    this.walkingPose = model.walkingPose;
    this.locomotionStyle = model.locomotionStyle;
    this.characterVisual.add(model.scene);
    if (!this.bakedWalk) {
      this.explorerSkinning = prepareCompatibleSkinning(model.scene, this.renderer.capabilities.isWebGL2, Platform.OS === "web" ? this.renderer.capabilities.maxVertexUniforms : 0);
      if (model.walkClip) this.explorerWalk = new ExplorerWalk(model.scene, model.walkClip);
    }
    this.setAnimation("Idle", true);
  }

  private addStoryGates() {
    for (const portal of this.options.portals) {
      const gate = createStoryPortal(portal.story.id, portal.state);
      gate.group.position.set(portal.position.x, 0, portal.position.z);
      this.scene.add(gate.group);
      this.storyGates.push(gate);
    }
  }

  private async addStoryScrolls() {
    const template = await loadStoryScrollModel();
    if (this.disposed) {
      disposeWorldObject(template);
      return;
    }

    this.returnGate = createStoryPortal(RETURN_PORTAL_ID);
    this.returnGate.group.position.set(RETURN_PORTAL_POSITION.x, 0, RETURN_PORTAL_POSITION.z);
    this.scene.add(this.returnGate.group);

    this.options.portals.forEach((portal, index) => {
      const scroll = template.clone(true);
      scroll.scale.multiplyScalar(0.62);
      scroll.position.multiplyScalar(0.62);
      const materials: MeshStandardMaterial[] = [];
      scroll.traverse((object) => {
        if (!(object instanceof Mesh)) {
          return;
        }
        const sourceMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        const clonedMaterials = sourceMaterials.map((sourceMaterial) => {
          const material = sourceMaterial.clone();
          if (material instanceof MeshStandardMaterial) {
            material.side = DoubleSide;
            materials.push(material);
          }
          return material;
        });
        object.material = Array.isArray(object.material)
          ? clonedMaterials
          : clonedMaterials[0];
      });

      const group = new Group();
      group.position.set(portal.position.x, 0.72, portal.position.z);
      scroll.rotation.y = index % 2 === 0 ? -0.12 : 0.12;
      scroll.rotation.z = index % 2 === 0 ? -0.035 : 0.035;
      group.add(scroll);

      const completedBadge = new Group();
      completedBadge.position.set(0, 2.08, 0.04);
      completedBadge.rotation.y = 0.58;
      const medal = new Mesh(
        new CircleGeometry(0.29, 28),
        new MeshBasicMaterial({ color: 0xf6cd62, depthWrite: false }),
      );
      const checkMaterial = new MeshBasicMaterial({
        color: 0x392350,
        depthWrite: false,
      });
      const shortCheck = new Mesh(
        new BoxGeometry(0.065, 0.19, 0.035),
        checkMaterial,
      );
      shortCheck.position.set(-0.065, -0.025, 0.025);
      shortCheck.rotation.z = -0.72;
      const longCheck = new Mesh(
        new BoxGeometry(0.065, 0.31, 0.035),
        checkMaterial,
      );
      longCheck.position.set(0.07, 0.025, 0.025);
      longCheck.rotation.z = 0.68;
      completedBadge.add(medal, shortCheck, longCheck);
      completedBadge.visible = false;
      group.add(completedBadge);
      this.scene.add(group);

      const markerMaterial = new MeshBasicMaterial({
        color: 0xffd66f,
        depthWrite: false,
        opacity: 0.42,
        side: DoubleSide,
        transparent: true,
      });
      const marker = new Mesh(new CircleGeometry(0.82, 28), markerMaterial);
      marker.position.set(portal.position.x, 0.065, portal.position.z);
      marker.rotation.x = -Math.PI / 2;
      this.scene.add(marker);

      const visual: AnimatedStoryScroll = {
        completedBadge,
        group,
        marker,
        markerMaterial,
        materials,
        phase: index * 0.83,
        scroll,
        storyId: worldNodeId(portal),
      };
      this.animatedStoryScrolls.push(visual);
      this.updateScrollAppearance(visual, portal.state);
    });
  }

  private async addTreasureChest() {
    const chest = await loadTreasureChestModel();
    if (this.disposed) {
      disposeWorldObject(chest);
      return;
    }
    chest.position.y += 0.04;
    const position = worldChestPosition(Boolean(this.options.questStoryId));
    chest.position.x += position.x;
    chest.position.z += position.z;
    chest.rotation.y = 0.08;
    this.scene.add(chest);
    // One small merged draw call for an unmistakable padlock above the chest.
    const body = new BoxGeometry(0.42, 0.32, 0.12);
    const shackle = new TorusGeometry(0.14, 0.04, 5, 12);
    shackle.translate(0, 0.22, 0);
    this.chestLock = new Mesh(mergeGeometryParts([body, shackle], "kandado"), new MeshBasicMaterial({ color: 0xe8c96e }));
    this.chestLock.position.set(position.x, 1.85, position.z);
    this.chestLock.visible = !isWorldChestUnlocked(this.options.portals);
    this.scene.add(this.chestLock);
  }

  private async addTropicalHut() {
    const hut = await loadTropicalHutModel();
    if (this.disposed) {
      disposeWorldObject(hut);
      return;
    }
    const clearing = new Group();
    clearing.name = "Hut in the far meadow clearing";
    clearing.position.set(STORY_HUT_PLACEMENT.x, STORY_HUT_PLACEMENT.y, STORY_HUT_PLACEMENT.z);
    clearing.rotation.y = STORY_HUT_PLACEMENT.rotation;
    clearing.add(hut);
    this.scene.add(clearing);
  }

  private updateScrollAppearance(
    visual: AnimatedStoryScroll,
    state: StoryPortalState,
  ) {
    const appearance = scrollAppearance(state);
    for (const material of visual.materials) {
      material.color.setHex(appearance.color);
      material.emissive.setHex(appearance.emissive);
      material.emissiveIntensity = state === "current" ? 0.18 : 0.08;
      material.opacity = appearance.opacity;
      material.transparent = appearance.opacity < 1;
      material.needsUpdate = true;
    }
    visual.markerMaterial.color.setHex(appearance.marker);
    visual.markerMaterial.opacity = appearance.markerOpacity;
    visual.markerMaterial.needsUpdate = true;
    visual.completedBadge.visible = state === "completed";
  }

  private setAnimation(name: StoryWorldStatus["animation"], immediate = false) {
    if (!immediate && name === this.activeAnimation) {
      return;
    }
    if (this.standingPose && !this.explorerWalk && !this.bakedWalk) {
      this.standingPose.visible = name === "Idle";
    }
    if (this.walkingPose && !this.explorerWalk && !this.bakedWalk) {
      this.walkingPose.visible = name === "Walk";
    }
    this.activeAnimation = name;
    this.emitStatus();
  }

  private renderFrame = (time: number) => {
    if (this.disposed) {
      return;
    }
    // Expo GL submits work across the native GL queue. Keep native rendering
    // at a stable 30 FPS instead of saturating it with 60/120 submissions.
    const interval = this.renderer.capabilities.isWebGL2 ? 1000 / 60 : 1000 / 30;
    if (this.lastRenderedAt !== null && time - this.lastRenderedAt < interval - 1) {
      this.animationFrame = requestAnimationFrame(this.renderFrame);
      return;
    }
    this.lastRenderedAt = time;
    const workStarted = __DEV__ ? performance.now() : 0;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.elapsedTime;
    this.updateCharacter(delta);
    this.animateStoryScrolls(delta, elapsed);
    for (const gate of this.storyGates) {
      gate.update(elapsed);
    }
    this.returnGate?.update(elapsed);
    this.updateCamera(delta);
    try {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = this.options.gl;
      if (width !== this.viewportWidth || height !== this.viewportHeight) {
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / Math.max(1, height);
        this.camera.updateProjectionMatrix();
      }
      this.skinningElapsed += delta;
      // The camera/controls stay at 30 FPS. CPU leg deformation can update at
      // 15 FPS, halving buffer uploads while retaining the full walk cycle.
      if (this.explorerSkinning?.mode !== "cpu" || this.skinningElapsed >= 1 / 15) {
        this.explorerSkinning?.update();
        this.skinningElapsed %= 1 / 15;
      }
      const renderStarted = __DEV__ ? performance.now() : 0;
      this.renderer.render(this.scene, this.camera);
      this.options.gl.endFrameEXP();
      if (__DEV__ && this.renderedStage === "chest" && this.measuredFrames < 120) {
        if (!this.measuredSince) this.measuredSince = time;
        this.measuredFrames++;
        this.measuredUpdateMs += renderStarted - workStarted;
        this.measuredRenderMs += performance.now() - renderStarted;
        this.measuredWorkMs += performance.now() - workStarted;
        if (this.measuredFrames === 120) {
          console.info("[Wikalino performance]", JSON.stringify({
            submittedFps: Math.round(119000 / Math.max(1, time - this.measuredSince)),
            averageJsFrameMs: Math.round(this.measuredWorkMs / 120 * 10) / 10,
            sceneUpdateMs: Math.round(this.measuredUpdateMs / 120 * 10) / 10,
            renderSubmitMs: Math.round(this.measuredRenderMs / 120 * 10) / 10,
            drawCalls: this.renderer.info.render.calls,
            triangles: this.renderer.info.render.triangles,
            buffer: `${width}x${height}`,
            animation: this.bakedWalk?.mode ?? this.explorerSkinning?.mode ?? "static-poses",
          }));
        }
      }
      if (this.renderedStage !== this.loadingStage) {
        this.renderedStage = this.loadingStage;
        if (__DEV__) console.info(`[Wikalino world] submitted ${this.loadingStage} frame`);
      }
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    } catch (cause) {
      this.stop();
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.options.onError(error);
    }
  };

  private updateCharacter(delta: number) {
    const strength = Math.min(1, Math.hypot(this.input.x, this.input.y));
    this.explorerWalk?.update(delta, strength > 0.06);
    this.bakedWalk?.update(delta, strength > 0.06);
    if (strength > 0.06) {
      cameraRelativeMovement(this.input.x, this.input.y, this.movementHeading, this.movementDirection);
      const directionX = this.movementDirection.x;
      const directionZ = this.movementDirection.z;
      const speed = 3.15;
      this.character.position.x = MathUtils.clamp(
        this.character.position.x + directionX * speed * delta,
        STORY_WORLD_BOUNDS.minX,
        STORY_WORLD_BOUNDS.maxX,
      );
      this.character.position.z = MathUtils.clamp(
        this.character.position.z + directionZ * speed * delta,
        STORY_WORLD_BOUNDS.minZ,
        STORY_WORLD_BOUNDS.maxZ,
      );
      const targetRotation = Math.atan2(directionX, directionZ);
      const rotationDifference = Math.atan2(
        Math.sin(targetRotation - this.character.rotation.y),
        Math.cos(targetRotation - this.character.rotation.y),
      );
      this.character.rotation.y += rotationDifference * Math.min(1, delta * 11);
      const duration = this.bakedWalk?.duration ?? this.explorerWalk?.clip.duration;
      this.walkPhase += delta * (duration ? Math.PI * 2 / duration : 7.5 + strength * 2.5);
      if (this.locomotionStyle === "hop") {
        this.characterVisual.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.18;
        this.characterVisual.rotation.x =
          -0.035 + Math.cos(this.walkPhase * 2) * 0.035;
        this.characterVisual.rotation.z = Math.sin(this.walkPhase) * 0.012;
      } else {
        this.characterVisual.position.y = Math.abs(Math.sin(this.walkPhase)) * (this.explorerWalk || this.bakedWalk ? 0.012 : 0.055);
        this.characterVisual.rotation.x = 0.025;
        this.characterVisual.rotation.z = Math.sin(this.walkPhase) * 0.025;
      }
      if (this.walkingPose && this.locomotionStyle === "walk" && !this.explorerWalk && !this.bakedWalk) {
        // The Quaternius file contains a modeled walking pose rather than a
        // skeleton clip. Mirroring that pose on alternating steps gives the
        // character a clear left/right stride while keeping it mobile-friendly.
        this.walkingPose.scale.x = Math.sin(this.walkPhase) >= 0 ? 1 : -1;
      }
      this.setAnimation("Walk");
    } else {
      const settle = 1 - Math.exp(-delta * 12);
      this.characterVisual.position.y = MathUtils.lerp(
        this.characterVisual.position.y,
        0,
        settle,
      );
      this.characterVisual.rotation.x = MathUtils.lerp(
        this.characterVisual.rotation.x,
        0,
        settle,
      );
      this.characterVisual.rotation.z = MathUtils.lerp(
        this.characterVisual.rotation.z,
        0,
        settle,
      );
      if (this.walkingPose) {
        this.walkingPose.scale.x = 1;
      }
      this.setAnimation("Idle");
    }

    let nearestId: string | null = null;
    let nearestDistance = STORY_INTERACTION_DISTANCE;
    for (const portal of this.options.portals) {
      const distance = Math.hypot(
        this.character.position.x - portal.position.x,
        this.character.position.z - portal.position.z,
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = worldNodeId(portal);
      }
    }
    const chestPosition = worldChestPosition(Boolean(this.options.questStoryId));
    const nearChest = Math.hypot(this.character.position.x - chestPosition.x, this.character.position.z - chestPosition.z) < STORY_INTERACTION_DISTANCE;
    const nearReturnPortal = Boolean(this.returnGate) && Math.hypot(this.character.position.x - RETURN_PORTAL_POSITION.x, this.character.position.z - RETURN_PORTAL_POSITION.z) < STORY_INTERACTION_DISTANCE;
    if (nearestId !== this.lastNearestStoryId || nearChest !== this.nearChest || nearReturnPortal !== this.nearReturnPortal) {
      this.lastNearestStoryId = nearestId;
      this.nearChest = nearChest;
      this.nearReturnPortal = nearReturnPortal;
      this.emitStatus();
    }
  }

  private animateStoryScrolls(delta: number, elapsed: number) {
    for (const visual of this.animatedStoryScrolls) {
      visual.group.position.y = 0.72 + Math.sin(elapsed * 1.55 + visual.phase) * 0.14;
      visual.scroll.rotation.y += delta * 0.34;
      visual.scroll.rotation.x = Math.sin(elapsed * 1.1 + visual.phase) * 0.045;
      const markerPulse = 1 + Math.sin(elapsed * 2.15 + visual.phase) * 0.08;
      visual.marker.scale.setScalar(markerPulse);
      if (visual.completedBadge.visible) {
        const badgePulse = 1 + Math.sin(elapsed * 2.6 + visual.phase) * 0.075;
        visual.completedBadge.scale.setScalar(badgePulse);
      }
    }
  }

  private updateCamera(delta: number) {
    this.cameraHeading = followHeading(this.cameraHeading, this.character.rotation.y, delta);
    this.cameraAnchor.lerp(this.character.position, 1 - Math.exp(-delta * 8));
    chaseCameraPose(this.cameraAnchor, this.cameraHeading, tempCameraPosition, tempCameraTarget);
    this.camera.position.copy(tempCameraPosition);
    this.camera.lookAt(tempCameraTarget);
  }

  private emitStatus() {
    this.options.onStatusChange({
      animation: this.activeAnimation,
      nearestStoryId: this.lastNearestStoryId,
      nearChest: this.nearChest,
      nearReturnPortal: this.nearReturnPortal,
    });
  }
}
