/** Cap 3D pixels independently from the native-resolution interface. */
export function renderBudget(width: number, height: number, deviceRatio: number) {
  const ratio = Math.max(1, deviceRatio);
  const pixelRatio = Math.min(ratio, 1.25, 1280 / Math.max(width, height, 1));
  const scale = pixelRatio / ratio;
  return { width: width * scale, height: height * scale, scale, pixelRatio };
}
