// Offline caching is scoped to this project path, including GitHub Pages subpaths.
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.querySelector('#install-button')?.removeAttribute('hidden');});
new MutationObserver(()=>{if(installPrompt)document.querySelector('#install-button')?.removeAttribute('hidden');}).observe(document.getElementById('workspace'),{childList:true});
document.addEventListener('click',async e=>{if(e.target.closest('#install-button')&&installPrompt){await installPrompt.prompt();installPrompt=null;document.querySelector('#install-button')?.setAttribute('hidden','');}});
if('serviceWorker' in navigator && window.isSecureContext){
 navigator.serviceWorker.register('./sw.js').then(reg=>{
  function offer(){if(!reg.waiting||!navigator.serviceWorker.controller)return;document.querySelector('#update-banner').hidden=false;document.querySelector('#apply-update').onclick=()=>{
   // App persists unsaved settings drafts before a deliberate reload.
   if(!window.dispatchEvent(new Event('schooltool-before-update',{cancelable:true})))return;
   reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  };}
  offer();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')offer();});});
 }).catch(()=>{ /* The online application remains usable when caching is blocked. */ });
 let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading&&window.dispatchEvent(new Event('schooltool-before-update',{cancelable:true}))){reloading=true;location.reload();}});
}
