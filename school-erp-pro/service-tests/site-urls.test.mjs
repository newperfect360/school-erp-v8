import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSiteUrls} from '../src/config/siteUrls.js';

test('existing Vercel subdomain needs no custom domain configuration',()=>{
  assert.deepEqual(resolveSiteUrls({},'https://school-erp-v8.vercel.app'),{
    webBaseUrl:'https://school-erp-v8.vercel.app',publicSiteUrl:'https://school-erp-v8.vercel.app',
    apiBaseUrl:'https://school-erp-v8.vercel.app/api',appDownloadUrl:'https://school-erp-v8.vercel.app/download-app',
  });
});
test('future public domain and separate API can change through configuration',()=>{
  const urls=resolveSiteUrls({PUBLIC_SITE_URL:'https://school.example',API_BASE_URL:'https://api.school.example',APP_DOWNLOAD_URL:'/download-app'},'https://school-erp-v8.vercel.app');
  assert.equal(urls.appDownloadUrl,'https://school.example/download-app');
  assert.equal(urls.apiBaseUrl,'https://api.school.example');
});
test('local development remains local and unsafe URL schemes are rejected',()=>{
  assert.equal(resolveSiteUrls({},'http://127.0.0.1:5178').appDownloadUrl,'http://127.0.0.1:5178/download-app');
  for(const value of ['javascript:alert(1)','http://school.example','https://user:password@school.example'])assert.throws(()=>resolveSiteUrls({APP_DOWNLOAD_URL:value},'https://school.example'),/HTTPS/);
});
