const CACHE='safimaint-simple-hierarchy-v26';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/safimaint-fiix-base.css',
  './assets/safimaint-fiix-components.css',
  './assets/safimaint-simple.css',
  './assets/safimaint-professional.css',
  './assets/safimaint-premium-v12.css',
  './assets/safimaint-live-motion-v13.css',
  './assets/safimaint-semantic-motion-v14.css',
  './assets/safimaint-semantic-motion-v15.css',
  './assets/safimaint-readability-v16.css',
  './assets/safimaint-asset-tree-v18.css',
  './assets/safimaint-asset-explorer-v19.css',
  './assets/safimaint-asset-hierarchy-v20.css',
  './assets/safimaint-asset-workspace-v21.css',
  './assets/safimaint-fiix-hierarchy-v22.css',
  './assets/safimaint-fiix-operating-model-v23.css',
  './assets/safimaint-fiix-workflow-v24.css',
  './assets/safimaint-fiix-connected-v25.css',
  './assets/safimaint-00-config.js','./assets/safimaint-01-seed.js','./assets/safimaint-02-core.js','./assets/safimaint-03-operations.js','./assets/safimaint-04-assets.js','./assets/safimaint-05-inventory-a.js','./assets/safimaint-06-inventory-b.js','./assets/safimaint-07-admin.js','./assets/safimaint-08-dialogs-search.js','./assets/safimaint-09-events.js','./assets/safimaint-10-fiix-workflows.js','./assets/safimaint-11-simple-onboarding.js','./assets/safimaint-live-ui.js','./assets/safimaint-premium-v12.js','./assets/safimaint-live-motion-v13.js','./assets/safimaint-semantic-motion-v14.js','./assets/safimaint-semantic-motion-v15.js','./assets/safimaint-asset-hierarchy-v17.js','./assets/safimaint-asset-tree-v18.js','./assets/safimaint-asset-explorer-v19.js','./assets/safimaint-asset-hierarchy-v20.js','./assets/safimaint-asset-workspace-v21.js','./assets/safimaint-fiix-operating-model-v23.js','./assets/safimaint-fiix-workflow-v24.js','./assets/safimaint-fiix-connected-v25.js',
  './assets/safimaint-logo.svg',
  './assets/favicon.svg',
  './assets/app-icon.svg'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      const network=fetch(event.request).then(response=>{
        if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){
          const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>cached||caches.match('./index.html'));
      return cached||network;
    })
  );
});
