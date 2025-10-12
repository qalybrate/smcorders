(() => {
  const LS_INSTALLED = 'pwaInstalled',
    LS_DISMISSED_AT = 'pwaPromptDismissedAt';
  const COOLDOWN_DAYS = 7;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;
  const daysSince = (ts) => (Date.now() - ts) / 864e5;
  const shouldThrottle = () => {
    const ts = +localStorage.getItem(LS_DISMISSED_AT) || 0;
    return ts && daysSince(ts) < COOLDOWN_DAYS;
  };

  if (isStandalone()) localStorage.setItem(LS_INSTALLED, '1');

  let deferred = null;

  const modal = document.createElement('div');
  modal.innerHTML = `
  <style>
    .overlay{position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.45);z-index:9999;font-family:sans-serif}
    .box{background:#111827;color:#e5e7eb;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.3);padding:20px;border:1px solid #1f2937;width:min(560px,92vw)}
    .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
    button{border-radius:10px;padding:8px 12px;cursor:pointer}
    .secondary{background:#1f2937;color:#e5e7eb;border:1px solid #374151}
    .primary{background:#22c55e;color:#05210f;border:0}
  </style>
  <div id="pwaPrompt" class="overlay" hidden>
    <div class="box">
      <h2>Install this app?</h2>
      <p>Add it to your home screen for faster access.</p>
      <div class="actions">
        <button id="noBtn" class="secondary">Not now</button>
        <button id="yesBtn" class="primary">Install</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(modal);

  const overlay = modal.querySelector('#pwaPrompt');
  const yes = modal.querySelector('#yesBtn');
  const no = modal.querySelector('#noBtn');

  const show = () => {
    overlay.hidden = false;
  };
  const hide = () => {
    overlay.hidden = true;
  };

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(LS_INSTALLED, '1');
    hide();
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    const installed = localStorage.getItem(LS_INSTALLED) === '1';
    if (!installed && !shouldThrottle() && !isIOS()) show();
  });

  yes.addEventListener('click', async () => {
    if (!deferred) {
      hide();
      return;
    }
    deferred.prompt();
    const r = await deferred.userChoice;
    deferred = null;
    if (r.outcome === 'accepted') {
      localStorage.setItem(LS_INSTALLED, '1');
      hide();
    } else {
      localStorage.setItem(LS_DISMISSED_AT, String(Date.now())); // <-- fixed
      hide();
    }
  });

  no.addEventListener('click', () => {
    localStorage.setItem(LS_DISMISSED_AT, String(Date.now())); // <-- fixed
    hide();
  });
})();
