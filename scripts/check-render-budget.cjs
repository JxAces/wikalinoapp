/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const mod = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/three/render-budget.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports: mod.exports, module: mod });
for (const [w, h, dpr] of [[390,844,3], [430,932,3], [375,667,2], [1024,1366,2], [1366,1024,2], [320,240,1]]) {
  const b = mod.exports.renderBudget(w,h,dpr);
  assert(b.width > 0 && b.height > 0 && b.scale > 0 && b.scale <= 1);
  assert(Math.max(b.width*dpr, b.height*dpr) <= 1280.001);
  assert(Math.abs(b.width / b.height - w / h) < 1e-10);
  // Scaling around the center restores the exact container edges.
  assert(Math.abs((w-b.width)/2 + b.width/2 - b.width/(2*b.scale)) < 1e-8);
  assert(Math.abs((h-b.height)/2 + b.height/2 - b.height/(2*b.scale)) < 1e-8);
  console.log(`${w}x${h} @${dpr}: ${Math.round(b.width*dpr)}x${Math.round(b.height*dpr)} buffer; ${Math.round((1-b.scale*b.scale)*100)}% fewer 3D pixels`);
}
assert.equal(mod.exports.renderBudget(0,0,3).width,0);
console.log('Render budget: phone/tablet, rotation, zero layout, aspect and edge coverage passed');
