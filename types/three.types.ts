import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type ThreeVector3 = readonly [number, number, number];

export type ThreeScale = number | ThreeVector3;

export type ThreeCanvasProps = {
  active?: boolean;
  backgroundColor?: string;
  cameraPosition?: ThreeVector3;
  children: ReactNode;
  enable3D?: boolean;
  enableAnimations?: boolean;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  maxPixelRatio?: number;
  style?: StyleProp<ViewStyle>;
  transparentBackground?: boolean;
};

export type ThreeObjectAnimationProps = {
  animate?: boolean;
  floatDistance?: number;
  floatSpeed?: number;
  rotationSpeed?: ThreeVector3;
};

export type ThreeObjectTransformProps = {
  position?: ThreeVector3;
  rotation?: ThreeVector3;
  scale?: ThreeScale;
};

export type ModelSource = number | string;
