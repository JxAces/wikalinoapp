import { createContext, ReactNode, useContext } from "react";

type ThreeMotionState = {
  animationsEnabled: boolean;
  reduceMotion: boolean;
};

const ThreeMotionContext = createContext<ThreeMotionState>({
  animationsEnabled: true,
  reduceMotion: false,
});

type ThreeMotionProviderProps = ThreeMotionState & {
  children: ReactNode;
};

export function ThreeMotionProvider({
  animationsEnabled,
  children,
  reduceMotion,
}: ThreeMotionProviderProps) {
  return (
    <ThreeMotionContext.Provider value={{ animationsEnabled, reduceMotion }}>
      {children}
    </ThreeMotionContext.Provider>
  );
}

export function useThreeMotion() {
  return useContext(ThreeMotionContext);
}
