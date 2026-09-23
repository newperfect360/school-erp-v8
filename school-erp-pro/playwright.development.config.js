import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',workers:1,timeout:60000,
 testMatch:['development-workflows.spec.js','audit-upgrade.spec.js','implementation-proof.spec.js','lifecycle.spec.js','stability.spec.js','cleanup-backup.spec.js','institutional-review.spec.js','official-identity.spec.js'],
 // These historical tests target removed authentication UI or a separate legacy app.
 // They are not represented as passed development business-workflow tests.
 grepInvert:/invalid login, help|account requests never|older web entry/,
 use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:5315',channel:'msedge',headless:true,screenshot:'off',video:'off'},
 reporter:[['list'],['json',{outputFile:'test-results/development-functional.json'}]],
});
