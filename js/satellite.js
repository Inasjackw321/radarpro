/**
 * StormTracker Pro GLOBAL — Satellite Module
 * GOES-16/18, Himawari-9, Meteosat imagery
 */
const Satellite = (() => {
  let currentSat = 'GOES16';
  let currentSector = 'taw';
  let currentProduct = 'GEOCOLOR';
  let productIdx = 0;
  let satIdx = 0;

  function init() {
    buildStrip();
    loadImage();
    // Rotate product every 7s
    setInterval(rotateProduct, 7000);
    // Refresh periodically
    setInterval(loadImage, CONFIG.intervals.satellite);
  }

  function buildStrip() {
    const strip = document.getElementById('sat-strip');
    if (!strip) return;
    strip.innerHTML = CONFIG.satProducts.map(p =>
      `<div class="sc ${p.id === currentProduct ? 'active' : ''}" data-p="${p.id}">${p.name}</div>`
    ).join('');
  }

  function loadImage() {
    const img = document.getElementById('sat-img');
    const ld = document.getElementById('sat-load');
    if (!img) return;

    const url = buildUrl();
    if (ld) ld.classList.remove('hidden');

    const tmp = new Image();
    tmp.onload = () => {
      img.src = tmp.src;
      if (ld) ld.classList.add('hidden');
      updateInfo();
    };
    tmp.onerror = () => {
      // Fallback: try GOES16 CONUS
      img.src = `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/latest.jpg?_t=${Date.now()}`;
      if (ld) ld.classList.add('hidden');
      updateInfo();
    };
    tmp.src = url;
  }

  function buildUrl() {
    const t = Date.now();
    if (currentSat === 'HIM') {
      // Himawari — use JMA imagery
      return `https://www.data.jma.go.jp/mscweb/data/himawari/img/fd_/fd__trm_0.jpg?_t=${t}`;
    }
    if (currentSat === 'MET') {
      // Meteosat
      return `https://eumetview.eumetsat.int/static-images/latestImages/EUMETSAT_MSGIODC_RGBNatColour_LowResolution.jpg?_t=${t}`;
    }
    // GOES
    const sat = CONFIG.satellites[currentSat];
    if (!sat) return '';
    return `${sat.cdnBase}/SECTOR/${currentSector}/${currentProduct}/latest.jpg?_t=${t}`;
  }

  function updateInfo() {
    const satCfg = CONFIG.satellites[currentSat];
    const prod = CONFIG.satProducts.find(p => p.id === currentProduct);
    setText('si-name', satCfg ? satCfg.name : currentSat);
    setText('si-product', prod ? `${prod.name} — ${prod.desc}` : currentProduct);
    setText('si-time', new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));

    document.querySelectorAll('.sc').forEach(c => {
      c.classList.toggle('active', c.dataset.p === currentProduct);
    });
  }

  function rotateProduct() {
    productIdx = (productIdx + 1) % CONFIG.satProducts.length;
    currentProduct = CONFIG.satProducts[productIdx].id;
    loadImage();
  }

  // Switch to satellite for a basin
  function setSatForBasin(basinId) {
    const b = CONFIG.basins.find(x => x.id === basinId);
    if (!b) return;
    currentSat = b.sat;
    currentSector = b.sector;
    loadImage();
  }

  // Cycle through satellites globally
  function rotateSat() {
    const sats = ['GOES16', 'GOES18', 'HIM', 'MET'];
    satIdx = (satIdx + 1) % sats.length;
    currentSat = sats[satIdx];
    currentSector = CONFIG.satellites[currentSat]?.sectors?.[0]?.id || 'FD';
    loadImage();
  }

  function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  return { init, loadImage, rotateProduct, rotateSat, setSatForBasin };
})();
