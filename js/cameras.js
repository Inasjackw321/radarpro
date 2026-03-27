/**
 * RadarPro - Cameras Module
 * Weather camera feed management
 */
const Cameras = (() => {
  let refreshTimers = [];

  function init() {
    const grid = document.getElementById('camera-grid');
    if (!grid) return;

    const cameras = CONFIG.cameras || [];

    grid.innerHTML = cameras.map((cam, idx) => {
      if (cam.type === 'iframe') {
        return `
          <div class="camera-cell">
            <iframe src="${cam.url}" loading="lazy" allowfullscreen></iframe>
            <div class="camera-label">${cam.name}</div>
          </div>
        `;
      } else {
        return `
          <div class="camera-cell">
            <div class="loading-text">Loading camera...</div>
            <img id="camera-img-${idx}"
                 src="${cam.url}"
                 alt="${cam.name}"
                 loading="lazy"
                 onerror="this.style.display='none'"
                 onload="this.style.display='block';this.previousElementSibling.style.display='none'">
            <div class="camera-label">${cam.name}</div>
          </div>
        `;
      }
    }).join('');

    // Auto-refresh image cameras every 30 seconds
    cameras.forEach((cam, idx) => {
      if (cam.type === 'img') {
        const timer = setInterval(() => {
          const img = document.getElementById(`camera-img-${idx}`);
          if (img) {
            const separator = cam.url.includes('?') ? '&' : '?';
            img.src = `${cam.url}${separator}_t=${Date.now()}`;
          }
        }, 30000);
        refreshTimers.push(timer);
      }
    });
  }

  function show() {
    const panel = document.getElementById('camera-panel');
    if (panel) {
      panel.classList.remove('hidden');
      panel.classList.add('fade-in');
    }
  }

  function hide() {
    const panel = document.getElementById('camera-panel');
    if (panel) {
      panel.classList.add('hidden');
      panel.classList.remove('fade-in');
    }
  }

  return { init, show, hide };
})();
