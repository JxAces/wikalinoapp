/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const nativeWeb = require("react-native-web");
const root = path.resolve(__dirname, "..");
const originalLoad = Module._load;
const originalError = console.error;
const errors = [];

// Resolve the same web implementations Metro uses, without starting a browser
// or touching player storage. Keep React in development mode to catch warnings.
Module._load = function(request, parent, isMain) {
  if (request === "react-native") return nativeWeb;
  if (request === "react-native-svg") return originalLoad.call(this, "react-native-svg/lib/commonjs/elements.web.js", parent, isMain);
  if (request === "@expo/vector-icons") return { MaterialCommunityIcons: () => null };
  return originalLoad.call(this, request, parent, isMain);
};

function load(relative) {
  const exports = {};
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("exports", "require", code)(exports, require);
  return exports;
}

try {
  console.error = (...args) => errors.push(args.map(String).join(" "));
  const { cabinetActivities } = load("data/cabinet-activities.ts");
  for (const [file, name, id, count] of [
    ["CharacterTransformationMap", "CharacterTransformationMap", "damit-transformation", 4],
    ["UgatCheckActivity", "UgatCheckActivity", "ugat-check", 2],
  ]) {
    const Component = load(`components/story-cabinet/${file}.tsx`)[name];
    const activity = cabinetActivities.find(item => item.id === id);
    const html = renderToStaticMarkup(React.createElement(Component, { activity, fields: activity.fields, responses: {}, onChange() {}, onComplete() {}, showErrors: false, completed: false }));
    const svgTags = html.match(/<svg\b[^>]*>/g) ?? [];
    assert.equal(svgTags.length, count);
    assert(svgTags.every(tag => tag.includes('aria-hidden="true"') && !/\saccessible=/.test(tag)), `${name}: decorative SVGs must use valid web attributes`);
  }
  const { ActivityCabinetCard } = load("components/story-cabinet/ActivityCabinetCard.tsx");
  for (const completed of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(ActivityCabinetCard, { activity: cabinetActivities[0], index: 0, completed, hasDraft: false, compact: true, onPress() {} }));
    const svgTags = html.match(/<svg\b[^>]*>/g) ?? [];
    assert.equal(svgTags.length, 1);
    assert(svgTags.every(tag => tag.includes('aria-hidden="true"') && !/\saccessible=/.test(tag)), "Activity cabinets must hide decorative SVGs using valid web attributes");
  }
  assert.deepEqual(errors, [], "Cabinet artwork must render without React DOM errors");

  const { Svg } = require("react-native-svg");
  renderToStaticMarkup(React.createElement(Svg, { accessible: false }));
  assert(errors.some(message => message.includes("non-boolean attribute") && message.includes("accessible")), "The development renderer must detect the original warning");
} finally {
  Module._load = originalLoad;
  console.error = originalError;
}
console.log("PASS: Activity cabinets, Suri-Lalim, and Ugat artwork render without invalid accessible attributes; decorative SVGs stay hidden from assistive technology; original warning reproduced by the negative control.");
