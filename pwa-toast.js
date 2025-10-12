(()=>{
  const LS_INSTALLED='pwaInstalled';
  const LS_DISMISSED_AT='pwaToastDismissedAt';
  const COOLDOWN_DAYS=7;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  const daysSince=(ts)=>(Date.now()-ts)/864e5;
  const throttled=()=>{const ts=Number(localStorage.getItem(LS_DISMISSED_AT)||0);return ts && daysSince(ts)<COOLDOWN_DAYS;};

  // If already standalone, mark installed
  if (isStandalone()) { try{localStorage.setItem(LS_INSTALLED,'1')}catch{} }

  // Shadow host (prevents CSS bleed, non-intrusive)
  const host=document.createElement('div'); host.id='pwa-toast-root'; document.body.appendChild(host);
  const root=host.attachShadow({mode:'open'});
  const style=document.createElement('style');
  style.textContent=`
    :host{ all: initial; }
    .toast {
      position: fixed; left: 12px; right: 12px; bottom: 14px; z-index: 2147483646;
      display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;
      background: rgba(17,24,39,.98); color: #e5e7eb; border: 1px solid #1f2937; border-radius: 14px;
      padding: 12px 12px; box-shadow: 0 10px 28px rgba(0,0,0,.35); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      transform: translateY(16px); opacity: 0; transition: opacity .25s ease, transform .25s ease;
    }
    .toast.show{ opacity:1; transform: translateY(0); }
    .msg{ font-size: 14px; color: #cbd5e1; }
    .row{ display:flex; gap:8px; }
    button{ all: unset; cursor: pointer; padding: 8px 12px; border-radius: 10px; font-weight: 600; }
    .install{ background:#22c55e; color:#051b0f; }
    .dismiss{ background:#1f2937; color:#e5e7eb; border:1px solid #374151; }
    @media (min-width:720px){ .toast{ left: auto; right: 18px; width: 380px; } }
  `;
  const wrap=document.createElement('div');
  wrap.innerHTML=`
    <div id="t" class="toast" aria-live="polite" aria-atomic="true" hidden>
      <div class="msg" id="m">Install this app for quick, offline access.</div>
      <div class="row">
        <button id="i" class="install">Install</button>
        <button id="x" class="dismiss" aria-label="Dismiss">Not now</button>
      </div>
    </div>
  `;
  root.appendChild(style); root.appendChild(wrap);
  const $t=root.getElementById('t'),$i=root.getElementById('i'),$x=root.getElementById('x'),$m=root.getElementById('m');

  const show=()=>{ $t.hidden=false; requestAnimationFrame(()=> $t.classList.add('show')); };
  const hide=()=>{ $t.classList.remove('show'); setTimeout(()=>{ $t.hidden=true; }, 250); };

  // Close on dismiss
  $x.addEventListener('click',()=>{ try{localStorage.setItem(LS_DISMISSED_AT,String(Date.now()))}catch{}; hide(); });

  // Click "Install" -> trigger existing #btnInstall click (your code handles the prompt)
  $i.addEventListener('click',()=>{
    const nativeBtn=document.getElementById('btnInstall');
    if(nativeBtn){ nativeBtn.click(); }
    hide();
  });

  // When app gets installed, hide toast + mark installed
  window.addEventListener('appinstalled',()=>{ try{localStorage.setItem(LS_INSTALLED,'1')}catch{}; hide(); });

  // Android/Chrome path: only show after beforeinstallprompt (so we know it's installable)
  let sawBIP = false;
  window.addEventListener('beforeinstallprompt', () => {
    sawBIP = true;
    const installed = localStorage.getItem(LS_INSTALLED) === '1';
    if (!installed && !throttled() && !isIOS()) { show(); }
  });

  // iOS path: show a gentle hint (no native prompt)
  window.addEventListener('load', ()=>{
    const installed = localStorage.getItem(LS_INSTALLED) === '1';
    if (isIOS() && !isStandalone() && !installed && !throttled()) {
      $m.textContent = 'On iPhone: Share → Add to Home Screen to install.';
      show();
    }
  });
})();
