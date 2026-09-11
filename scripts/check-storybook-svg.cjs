/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Render the real, pure artwork components as React elements without a native
// view manager. This exercises generated path strings, which tsc cannot check.
const source = path.join(__dirname, '../components/three/integrations/StorybookArtwork.tsx');
const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const artworkModule = { exports: {} };
const svg = { __esModule: true, default: 'Svg', Circle: 'Circle', G: 'G', Path: 'Path', Rect: 'Rect' };
new Function('require', 'module', 'exports', compiled)(
  (name) => name === 'react-native-svg' ? svg : require(name),
  artworkModule, artworkModule.exports,
);

const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
function validatePath(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  assert.equal(d.replace(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?|[\s,]/g, ''), '', `Unexpected SVG data: ${d}`);
  assert.match(tokens[0] ?? '', /^[Mm]$/, `Path must begin with M: ${d}`);
  let i = 0;
  while (i < tokens.length) {
    const command = tokens[i++].toUpperCase();
    assert(Object.hasOwn(arity, command), `Unknown command ${command}: ${d}`);
    const start = i;
    while (i < tokens.length && Number.isFinite(Number(tokens[i]))) i++;
    const count = i - start;
    assert(arity[command] ? count >= arity[command] && count % arity[command] === 0 : count === 0,
      `${command} has ${count} coordinates, expected groups of ${arity[command]}: ${d}`);
  }
}
const paths = [];
function visit(element) {
  if (Array.isArray(element)) return element.forEach(visit);
  if (!element || typeof element !== 'object') return;
  if (typeof element.type === 'function') return visit(element.type(element.props));
  if (element.type === 'Path') paths.push(element.props.d);
  visit(element.props?.children);
}
for (const component of Object.values(artworkModule.exports)) visit(component());
// Also check the portal's literal paths, used later in the same intro.
const portal = fs.readFileSync(path.join(__dirname, '../components/three/integrations/StorybookPortal.tsx'), 'utf8');
for (const match of portal.matchAll(/\bd="([^"]+)"/g)) paths.push(match[1]);
assert(paths.length > 20, 'Expected all cover, landscape, and portal paths');
paths.forEach(validatePath);
// The exact malformed string from the crash must remain rejected.
assert.throws(() => validatePath('M20 40Q90 5160 40Q90 7520 40'), /coordinates/);
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(paths));
console.log(`Validated ${paths.length} storybook/portal SVG paths; malformed cover regression rejected.`);
