// Checks every minute (and when the tab comes back into view) whether this page has been updated on the site.
// When it has, a banner offers to refresh. A page can set window.beforeUpdateReload to a function
// (it may return a promise) to save progress before the refresh.
(function () {
  const url = location.href.split('#')[0].split('?')[0];
  let first = null, shown = false;
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  async function check() {
    if (shown || location.protocol === 'file:') return;
    try {
      const r = await fetch(url + '?vcheck=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const h = hash(await r.text());
      if (first === null) first = h;   // the version this tab is running
      else if (h !== first) show();
    } catch (e) {}
  }
  function show() {
    shown = true;
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;' +
      'max-width:92vw;box-sizing:border-box;padding:8px 10px 8px 14px;border:2px solid #f0c35a;border-radius:8px;' +
      'background:rgba(30,22,12,.96);color:#f5e6c4;font:14px Georgia,serif;box-shadow:0 6px 20px rgba(0,0,0,.5)';
    const msg = document.createElement('span'); msg.textContent = 'A new version is available.';
    const go = document.createElement('button'); go.textContent = 'Refresh';
    const later = document.createElement('button'); later.textContent = 'Later';
    for (const b of [go, later]) b.style.cssText = 'font:inherit;cursor:pointer;border-radius:5px;padding:4px 12px;border:1px solid #a07a3c;background:#1d150b;color:#e8efe6';
    go.style.color = '#f0c35a';
    go.onclick = async () => {
      go.disabled = true; go.textContent = 'Saving...';
      try { if (window.beforeUpdateReload) await window.beforeUpdateReload(); } catch (e) {}
      location.replace(url + '?v=' + Date.now() + location.hash);   // a fresh address skips the browser's cached copy
    };
    later.onclick = () => bar.remove();
    bar.append(msg, go, later);
    document.body.appendChild(bar);
  }
  check();
  setInterval(check, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
