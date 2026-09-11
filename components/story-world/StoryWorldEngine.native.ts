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
} from "./story-world.constants";
import {
  loadExplorerModel,
  loadStoryScrollModel,
  loadTropicalHutModel,
  loadTreasureChestModel,
} from "./load-explorer.native";
import type { PlayerCharacterId } from "@/data/player-characters";
import type {
  StoryPortalState,
  StoryWorldInput,
  StoryWorldPortal,
  StoryWorldStatus,
} from "./story-world.types";

type StoryWorldEngineOptions = {
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

export class StoryWorldEngine {
  private activeAnimation: StoryWorldStatus["animation"] = "Idle";
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
  private locomotionStyle: "hop" | "walk" = "walk";
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private standingPose: Object3D | null = null;
  private walkingPose: Object3D | null = null;
  private walkPhase = 0;
  private viewportWidth = 0;
  private viewportHeight = 0;

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
    for (const visual of this.animatedStoryScrolls) {
      const portal = portals.find(({ story }) => story.id === visual.storyId);
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
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.dispose();
      }
    });
    this.renderer.dispose();
  }

  private createScene() {
    this.scene.background = new Color(MEADOW_LIGHTING.sky);
    this.scene.fog = new FogExp2(MEADOW_LIGHTING.fog, MEADOW_LIGHTING.fogDensity);
    this.scene.add(new HemisphereLight(
      MEADOW_LIGHTING.hemisphereSky, MEADOW_LIGHTING.hemisphereGround,
      MEADOW_LIGHTING.hemisphereIntensity,
    ));
    this.scene.add(new AmbientLight(0xfff8e7, MEADOW_LIGHTING.ambientIntensity));
    const sunlight = new DirectionalLight(0xfff0c9, MEADOW_LIGHTING.sunlightIntensity);
    sunlight.position.set(-6, 11, 8);
    this.scene.add(sunlight);
    this.scene.add(createMeadowEnvironment());

    this.addPath();
    this.character.position.copy(START_POSITION);
    this.character.rotation.y = INITIAL_CHARACTER_HEADING;
    this.character.add(this.characterVisual);
    this.scene.add(this.character);
    this.updateCamera(0);
  }

  private addPath() {
    const curvePoints = [
      new Vector3(0, 0.015, 13.2),
      ...this.options.portals.map(({ position }) => new Vector3(position.x, 0.015, position.z)),
      new Vector3(0, 0.015, -19.3),
    ];
    const curve = new CatmullRomCurve3(curvePoints, false, "catmullrom", 0.35);
    const geometry = new BoxGeometry(0.82, 0.08, 1.05);
    const material = new MeshLambertMaterial({ color: 0xd3bd82 });
    const stoneGeometries: BufferGeometry[] = [];
    for (let index = 0; index < 58; index += 1) {
      const progress = index / 57;
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
      await Promise.all([
        this.addExplorer(),
        this.addStoryScrolls(),
        this.addTropicalHut(),
        this.addTreasureChest(),
      ]);
      if (this.disposed) {
        return;
      }
      this.options.onReady();
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.options.onError(error);
    }
  }

  private async addExplorer() {
    const model = await loadExplorerModel(this.options.characterId);
    if (this.disposed) {
      return;
    }
    this.standingPose = model.standingPose;
    this.walkingPose = model.walkingPose;
    this.locomotionStyle = model.locomotionStyle;
    this.characterVisual.add(model.scene);
    this.setAnimation("Idle", true);
  }

  private async addStoryScrolls() {
    const template = await loadStoryScrollModel();
    if (this.disposed) {
      return;
    }

    this.options.portals.forEach((portal, index) => {
      const scroll = template.clone(true);
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
        storyId: portal.story.id,
      };
      this.animatedStoryScrolls.push(visual);
      this.updateScrollAppearance(visual, portal.state);
    });
  }

  private async addTreasureChest() {
    const chest = await loadTreasureChestModel();
    if (this.disposed) {
      return;
    }
    chest.position.y += 0.04;
    chest.position.z += -18.85;
    chest.rotation.y = 0.08;
    this.scene.add(chest);
  }

  private async addTropicalHut() {
    const hut = await loadTropicalHutModel();
    if (this.disposed) {
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
    if (this.standingPose) {
      this.standingPose.visible = name === "Idle";
    }
    if (this.walkingPose) {
      this.walkingPose.visible = name === "Walk";
    }
    this.activeAnimation = name;
    this.emitStatus();
  }

  private renderFrame = () => {
    if (this.disposed) {
      return;
    }
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.updateCharacter(delta);
    this.animateStoryScrolls(delta, elapsed);
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
      this.renderer.render(this.scene, this.camera);
      this.options.gl.endFrameEXP();
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    } catch (cause) {
      this.stop();
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.options.onError(error);
    }
  };

  private updateCharacter(delta: number) {
    const strength = Math.min(1, Math.hypot(this.input.x, this.input.y));
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
      this.walkPhase += delta * (7.5 + strength * 2.5);
      if (this.locomotionStyle === "hop") {
        this.characterVisual.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.18;
        this.characterVisual.rotation.x =
          -0.035 + Math.cos(this.walkPhase * 2) * 0.035;
        this.characterVisual.rotation.z = Math.sin(this.walkPhase) * 0.012;
      } else {
        this.characterVisual.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.055;
        this.characterVisual.rotation.x = 0.025;
        this.characterVisual.rotation.z = Math.sin(this.walkPhase) * 0.025;
      }
      if (this.walkingPose && this.locomotionStyle === "walk") {
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
        nearestId = portal.story.id;
      }
    }
    if (nearestId !== this.lastNearestStoryId) {
      this.lastNearestStoryId = nearestId;
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
    });
  }
}
