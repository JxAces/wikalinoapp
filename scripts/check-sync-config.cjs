/* global __dirname */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../services/sync/config.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function config(env){const module={exports:{}};vm.runInNewContext(`(function(require,module,exports,process){${source}\n})`,{URL})(()=>({Platform:{OS:'web'}}),module,module.exports,{env});return module.exports.syncConfig();}
const publicEnv={EXPO_PUBLIC_SYNC_MODE:'supabase',EXPO_PUBLIC_API_URL:'http://localhost:3001',EXPO_PUBLIC_SUPABASE_URL:'https://project.supabase.co',EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_only_not_real'};
assert(config(publicEnv),'Real Supabase authentication can use a local HTTP backend');
assert(config({...publicEnv,EXPO_PUBLIC_API_URL:'https://api.example.com'}));
assert.equal(config({...publicEnv,EXPO_PUBLIC_API_URL:'http://api.example.com'}),null,'Never send student tokens to a remote HTTP origin');
assert.equal(config({...publicEnv,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_test_only_not_real'}),null,'Privileged keys never initialize student auth');
assert.equal(config({...publicEnv,EXPO_PUBLIC_SYNC_MODE:'local',EXPO_PUBLIC_API_URL:'https://api.example.com'}),null,'Local test identities cannot be used against a deployed backend');
console.log('PASS: Supabase/local configuration, HTTP boundaries and privileged-key rejection.');
