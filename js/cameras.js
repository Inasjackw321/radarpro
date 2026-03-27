/**
 * StormTracker Pro - Cameras Module
 * Satellite imagery feeds and coastal cameras
 */
const Cameras = (() => {
  let refreshTimers = [];

  function init() {
    const grid = document.getElementById('cameras-grid');
    if (!grid) return;

    const cams = CONFIG.cameras || [];

    grid.innerHTML = cams.map((cam, i) => {
      if (cam.type === 'iframe') {
        return `<div class="cam-cell">
          <iframe src="${cam.url}" loading="lazy" allowfullscreen></iframe>
          <div class="cam-label">${cam.name}</div>
        </div>`;
      }
      return `<div class="cam-cell">
        <div class="cam-loading">Loading...</div>
        <img id="cam-${i}" src="${cam.url}" alt="${cam.name}" loading="lazy"
             onerror="this.style.opacity='0.2'"
             onload="this.style.opacity='1';this.previousElementSibling.style.display='none'">
        <div class="cam-label">${cam.name}</div>
      </div>`;
    }).join('');

    // Refresh image cameras
    cams.forEach((cam, i) => {
      if (cam.type === 'img') {
        const timer = setInterval(() => {
          const img = document.getElementById(`cam-${i}`);
          if (img) {
            const sep = cam.url.includes('?') ? '&' : '?';
            img.src = `${cam.url}${sep}_t=${Date.now()}`;
          }
        }, CONFIG.intervals.cameras);
        refreshTimers.push(timer);
      }
    });

    // Also refresh tropical outlook images
    setInterval(() => {
      refreshImg('tropical-outlook-img', 'https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png');
      refreshImg('tropical-outlook-img-2', 'https://www.nhc.noaa.gov/xgtwo/two_atl_2d0.png');
      refreshImg('tropical-sat-thumb', `https://cdn.star.nesdis.noaa.gov/${CONFIG.satellite.goes}/ABI/SECTOR/taw/GEOCOLOR/latest.jpg`);
      refreshImg('tropical-ir-thumb', `https://cdn.star.nesdis.noaa.gov/${CONFIG.satellite.goes}/ABI/SECTOR/taw/13/latest.jpg`);
    }, 120000); // 2 min
  }

  function refreshImg(id, baseUrl) {
    const img = document.getElementById(id);
    if (img) img.src = `${baseUrl}?_t=${Date.now()}`;
  }

  return { init };
})();
