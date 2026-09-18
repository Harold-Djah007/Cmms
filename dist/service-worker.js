const CACHE='safimaint-document-aligned-v54';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/safimaint-fiix-base.css',
  './assets/safimaint-fiix-components.css',
  './assets/safimaint-simple.css',
  './assets/safimaint-professional.css',
  './assets/safimaint-premium-v12.css',
  './assets/safimaint-readability-v16.css',
  './assets/safimaint-asset-tree-v18.css',
  './assets/safimaint-asset-explorer-v19.css',
  './assets/safimaint-asset-hierarchy-v20.css',
  './assets/safimaint-asset-workspace-v21.css',
  './assets/safimaint-fiix-hierarchy-v22.css',
  './assets/safimaint-fiix-operating-model-v23.css',
  './assets/safimaint-fiix-workflow-v24.css',
  './assets/safimaint-fiix-connected-v25.css',
  './assets/safimaint-asset-creator-v27.css',
  './assets/safimaint-sync-v30.css',
  './assets/safimaint-asset-map-v31.css',
  './assets/safimaint-responsive-v36.css',
  './assets/safimaint-work-execution-v38.css',
  './assets/safimaint-field-quality-v37.css',
  './assets/safimaint-operations-console-v41.css',
  './assets/safimaint-fiix-operating-core-v44.css',
  './assets/safimaint-asset-command-center-v45.css',
  './assets/safimaint-fiix-parity-v47.css',
  './assets/safimaint-work-planning-v54.css',
  './assets/safimaint-field-planner-v53.css',
  './assets/safimaint-lifecycle-v52.css',
  './assets/safimaint-spec-modules-v51.css',
  './assets/safimaint-spec-core-v50.css',
  './assets/safimaint-semantic-kpis-v43.css',
  './assets/safimaint-00-config.js','./assets/safimaint-01-seed.js','./assets/safimaint-02-core.js','./assets/safimaint-03-operations.js','./assets/safimaint-04-assets.js','./assets/safimaint-05-inventory-a.js','./assets/safimaint-06-inventory-b.js','./assets/safimaint-07-admin.js','./assets/safimaint-08-dialogs-search.js','./assets/safimaint-09-events.js','./assets/safimaint-10-fiix-workflows.js','./assets/safimaint-11-simple-onboarding.js','./assets/safimaint-live-ui.js','./assets/safimaint-premium-v12.js','./assets/safimaint-asset-hierarchy-v17.js','./assets/safimaint-asset-tree-v18.js','./assets/safimaint-asset-explorer-v19.js','./assets/safimaint-asset-hierarchy-v20.js','./assets/safimaint-asset-workspace-v21.js','./assets/safimaint-fiix-operating-model-v23.js','./assets/safimaint-fiix-workflow-v24.js','./assets/safimaint-fiix-connected-v25.js','./assets/safimaint-asset-creator-v27.js','./assets/safimaint-sync-v30.js','./assets/safimaint-responsive-v36.js','./assets/safimaint-field-quality-v37.js','./assets/safimaint-work-execution-v38.js','./assets/safimaint-operations-console-v41.js','./assets/safimaint-semantic-kpis-v43.js','./assets/safimaint-fiix-operating-core-v44.js','./assets/safimaint-asset-command-center-v45.js','./assets/safimaint-fiix-parity-v47.js','./assets/safimaint-spec-core-v50.js','./assets/safimaint-spec-modules-v51.js','./assets/safimaint-lifecycle-v52.js','./assets/safimaint-field-planner-v53.js','./assets/safimaint-work-planning-v54.js',
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
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy))}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(
    fetch(event.request).then(response=>{
        if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){
          const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>caches.match(event.request))
  );
});
