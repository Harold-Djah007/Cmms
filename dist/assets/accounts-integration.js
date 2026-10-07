(() => {
  let native=false;
  const previous=renderPeople;
  renderPeople=function(){return previous()+`<section class="card pad"><h2>Invitations and account access</h2><p>Manage web and mobile access, email invitations and password resets.</p><a class="button" href="/users.html">Manage live invitations</a>${native?'<button class="button secondary" data-account-logout>Sign out</button>':'<p class="muted">Live invitations require the shared account service. Demo people are sample records.</p>'}</section>`;};
  document.addEventListener('click',async event=>{
    if(!event.target.closest('[data-account-logout]'))return;
    const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});
    if(!response.ok){toast('Could not sign out. Please retry.');return;}
    for(const key of Object.keys(localStorage))if(key.startsWith('safimaint'))localStorage.removeItem(key);
    if('caches' in window)for(const key of await caches.keys())if(key.startsWith('safimaint'))await caches.delete(key);
    location.assign('/auth.html');
  });
  fetch('/api/auth/config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(async config=>{
    native=config?.mode==='password';
    if(native){showNewUser=()=>location.assign('/users.html');const session=await fetch('/api/v1/session',{cache:'no-store',credentials:'same-origin'});if(session.status===401)location.replace('/auth.html');}
  }).catch(()=>{});
})();
