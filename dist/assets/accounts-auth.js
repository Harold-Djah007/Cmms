(() => {
  const $ = id => document.getElementById(id);
  const fragment = new URLSearchParams(location.hash.slice(1));
  const kind = fragment.has('invite') ? 'invite' : fragment.has('reset') ? 'reset' : null;
  const token = kind ? fragment.get(kind) : null;
  if (kind) history.replaceState(null, '', location.pathname);
  let forgot = false;
  function configure(){
    $('title').textContent = kind ? (kind === 'invite' ? 'Accept your invitation' : 'Choose a new password') : forgot ? 'Reset your password' : 'Sign in';
    $('email-label').hidden = !!kind;
    $('email').required = !kind;
    $('password-label').hidden = forgot;
    $('password').required = !forgot;
    $('password').autocomplete = kind ? 'new-password' : 'current-password';
    $('mode-label').hidden = !!kind || forgot;
    $('submit').textContent = kind ? 'Set password' : forgot ? 'Send reset email' : 'Sign in';
    $('forgot').hidden = !!kind || forgot;
    $('signin').hidden = !kind && !forgot;
  }
  configure();
  $('forgot').onclick = () => { forgot = true; configure(); $('message').textContent=''; };
  $('account-form').onsubmit = async event => {
    event.preventDefault(); $('submit').disabled=true; $('message').textContent='';
    try {
      const path = kind ? `redeem/${kind}` : forgot ? 'forgot' : 'login';
      const body = kind ? {token,password:$('password').value} : forgot ? {email:$('email').value} : {email:$('email').value,password:$('password').value,accessKind:$('mode').value};
      const response = await fetch('/api/auth/'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result = await response.json();
      if(!response.ok) throw new Error(typeof result.detail==='string' ? result.detail : 'Please check your entries and try again.');
      $('password').value=''; $('message').textContent=result.message || result.status;
      if(!kind && !forgot) location.assign('/'+($('mode').value==='mobile' ? '#work-orders' : ''));
      if(kind) {$('account-form').hidden=true; $('signin').hidden=false;}
    } catch(error) { $('message').textContent=error.message; }
    finally {$('submit').disabled=false;}
  };
})();
