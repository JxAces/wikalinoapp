# Active mobile branding

The active flat artwork is in assets/branding. PNG exports are used by Expo and the PWA. The full wordmark uses a 1200 × 600 canvas to avoid the square Quick Look preview cropping. The 1024 × 1024 native icon is opaque; the Android foreground is transparent with artwork inside the central 60% safe circle. The same padded opaque icon supports PWA maskable icons. A symbol-only 48px favicon preserves readability.

Regenerate with `node scripts/build-brand-icons.cjs` with sharp available via NODE_PATH. SVG lettering uses Arial Rounded MT Bold; final PNGs embed its rendered appearance. Earlier concepts are retained. Expo config and dimensions were verified; native launcher changes require a fresh build and installation. Physical-device installation has not been tested in this change.
