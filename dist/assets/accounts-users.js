(() => {
  const $=id=>document.getElementById(id);
  let state, records=[];
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(path, options={}){
    const response=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});
    const data=await response.json();
    if(!response.ok) throw new Error(typeof data.detail==='string'?data.detail:'Request failed. Please try again.');
    return data;
  }
  async function refresh(){records=await api('/api/auth/invitations');$('invitations').innerHTML=records.map(r=>`<tr><td>${escape(r.name)}</td><td>${escape(r.email)}</td><td>${escape(r.accessKind)}</td><td>${escape(r.status)}</td><td>${r.status==='Sent'?`<button data-revoke="${escape(r.id)}" class="secondary">Revoke</button>`:''}</td></tr>`).join('')||'<tr><td colspan="5">No invitations yet</td></tr>';}
  $('refresh').onclick=()=>refresh().catch(e=>$('message').textContent=e.message);
  $('invitations').onclick=async e=>{const button=e.target.closest('[data-revoke]');if(!button)return;button.disabled=true;try{await api('/api/auth/invitations/'+button.dataset.revoke,{method:'DELETE'});await refresh();$('message').textContent='Invitation revoked.';}catch(error){$('message').textContent=error.message;button.disabled=false;}};
  $('invite-form').onsubmit=async e=>{e.preventDefault();$('send').disabled=true;try{const data=Object.fromEntries(new FormData(e.target));data.siteIds=$('sites').value?[$('sites').value]:[];data.groupIds=[];const result=await api('/api/auth/invitations',{method:'POST',body:JSON.stringify(data)});$('message').textContent=result.message;e.target.reset();await refresh();}catch(error){$('message').textContent=error.message;}finally{$('send').disabled=false;}};
  $('logout').onclick=async()=>{try{await api('/api/auth/logout',{method:'POST'});location.assign('/auth.html');}catch(error){$('message').textContent=error.message;}};
  (async()=>{const config=await api('/api/auth/config');if(config.mode!=='password')throw new Error('Live invitations require email/password authentication. See ACCOUNT_SETUP.md for setup. Local demo users do not receive email.');state=(await api('/api/v1/state')).state;$('roles').innerHTML=state.roles.map(r=>`<option value="${escape(r.id)}">${escape(r.name||r.id)}</option>`).join('');$('sites').insertAdjacentHTML('beforeend',state.sites.map(s=>`<option value="${escape(s.id)}">${escape(s.name)}</option>`).join(''));await refresh();if(!config.emailConfigured){$('send').disabled=true;$('message').textContent='Configure SMTP and SAFIMAINT_PUBLIC_URL before sending live invitations.';}})().catch(error=>{$('message').textContent=error.message;$('send').disabled=true;});
})();
