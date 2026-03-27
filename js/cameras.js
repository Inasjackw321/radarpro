/**
 * StormTracker Pro GLOBAL — Cameras / Satellite Feeds
 */
const Cameras = (() => {
  let timers = [];

  function init() {
    const grid = document.getElementById('cams-grid');
    if (!grid) return;

    const cams = CONFIG.cameras;
    grid.innerHTML = cams.map((c, i) => {
      if (c.type === 'iframe') {
        return `<div class="cam-c"><iframe src="${c.url}" loading="lazy" allowfullscreen></iframe><div class="cam-lbl">${c.name}</div></div>`;
      }
      return `<div class="cam-c"><div class="cam-ld">Loading...</div><img id="cm-${i}" src="${c.url}" alt="${c.name}" loading="lazy" onerror="this.style.opacity='.15'" onload="this.style.opacity='1';this.previousElementSibling.style.display='none'"><div class="cam-lbl">${c.name}</div></div>`;
    }).join('');

    // Refresh image cameras
    cams.forEach((c, i) => {
      if (c.type === 'img') {
        timers.push(setInterval(() => {
          const img = document.getElementById(`cm-${i}`);
          if (img) img.src = `${c.url}${c.url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        }, CONFIG.intervals.cameras));
      }
    });

    // Globe view refresh
    setInterval(refreshGlobe, 120000);
  }

  function refreshGlobe() {
    const t = Date.now();
    refreshImg('globe-goes16', `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg?_t=${t}`);
    refreshImg('globe-goes18', `https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/678x678.jpg?_t=${t}`);
    refreshImg('globe-him', `https://www.data.jma.go.jp/mscweb/data/himawari/img/fd_/fd__trm_0.jpg?_t=${t}`);
    refreshImg('globe-met', `https://eumetview.eumetsat.int/static-images/latestImages/EUMETSAT_MSGIODC_RGBNatColour_LowResolution.jpg?_t=${t}`);
  }

  function refreshImg(id, url) {
    const img = document.getElementById(id);
    if (img) img.src = url;
  }

  return { init, refreshGlobe };
})();
