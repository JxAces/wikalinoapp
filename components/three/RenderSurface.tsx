import { GLView } from "expo-gl";
import { useState, type ComponentProps } from "react";
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { renderBudget } from "./render-budget";

/** Expo allocates its drawable from the native view's size and screen scale.
 * renderer.setPixelRatio(1) cannot resize that allocation. Lay out a smaller
 * drawable and scale only that layer; sibling HUD text stays native resolution.
 */
export function RenderSurface({ style, onLayout, ...props }: ComponentProps<typeof GLView>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const budget = renderBudget(size.width, size.height, PixelRatio.get());
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    onLayout?.(event);
  };
  return <View style={[styles.container, style]} onLayout={handleLayout}>
    {size.width > 0 && size.height > 0 && <GLView {...props} msaaSamples={0} style={{
      position: "absolute",
      width: budget.width,
      height: budget.height,
      left: (size.width - budget.width) / 2,
      top: (size.height - budget.height) / 2,
      transform: [{ scale: 1 / budget.scale }],
    }} />}
  </View>;
}

const styles = StyleSheet.create({ container: { overflow: "hidden" } });
