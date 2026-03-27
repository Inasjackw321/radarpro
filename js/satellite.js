/**
 * StormTracker Pro - Satellite Module
 * GOES-16/18 satellite imagery with multiple products and sectors
 */
const Satellite = (() => {
  let currentProduct = null;
  let currentSector = null;
  let productIndex = 0;
  let rotateTimer = null;

  function init() {
    currentProduct = CONFIG.satellite.defaultProduct;
    currentSector = CONFIG.satellite.defaultSector;

    buildProductStrip();
    loadImage();

    // Auto-rotate satellite products every cycle
    rotateTimer = setInterval(() => {
      rotateProduct();
    }, 8000); // Change product every 8 seconds when satellite scene is active

    // Refresh images periodically
    setInterval(() => loadImage(), CONFIG.intervals.satellite);
  }

  function buildProductStrip() {
    const strip = document.getElementById('sat-product-strip');
    if (!strip) return;

    const products = CONFIG.satellite.products;
    strip.innerHTML = products.map(p =>
      `<div class="sat-chip ${p.id === currentProduct ? 'active' : ''}" data-product="${p.id}">${p.name}</div>`
    ).join('');
  }

  function loadImage() {
    const img = document.getElementById('sat-image');
    const loading = document.getElementById('sat-loading');
    if (!img) return;

    const goes = CONFIG.satellite.goes;
    const sector = getSectorConfig(currentSector);
    const product = currentProduct;

    // Build URL based on product type
    let url;
    const isSpecialProduct = ['GEOCOLOR', 'AirMass', 'Sandwich', 'DayCloudPhase', 'NightMicrophysics'].includes(product);

    if (isSpecialProduct) {
      url = `https://cdn.star.nesdis.noaa.gov/${goes}/ABI/SECTOR/${currentSector}/${product}/latest.jpg`;
    } else {
      url = `https://cdn.star.nesdis.noaa.gov/${goes}/ABI/SECTOR/${currentSector}/${product}/latest.jpg`;
    }

    // Cache bust
    url += `?_t=${Date.now()}`;

    if (loading) loading.classList.remove('hidden');

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = tempImg.src;
      img.style.opacity = '1';
      if (loading) loading.classList.add('hidden');
      updateSatInfo();
    };
    tempImg.onerror = () => {
      // Try CONUS fallback
      const fallbackUrl = `https://cdn.star.nesdis.noaa.gov/${goes}/ABI/CONUS/${product}/latest.jpg?_t=${Date.now()}`;
      img.src = fallbackUrl;
      if (loading) loading.classList.add('hidden');
      updateSatInfo();
    };
    tempImg.src = url;
  }

  function updateSatInfo() {
    const product = CONFIG.satellite.products.find(p => p.id === currentProduct);
    const sector = CONFIG.satellite.sectors.find(s => s.id === currentSector);

    const nameEl = document.getElementById('sat-product-name');
    const sectorEl = document.getElementById('sat-sector-name');
    const timeEl = document.getElementById('sat-timestamp');

    if (nameEl) nameEl.textContent = product ? product.name : currentProduct;
    if (sectorEl) sectorEl.textContent = sector ? sector.name : currentSector;
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    }

    // Update strip active state
    document.querySelectorAll('.sat-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.product === currentProduct);
    });
  }

  function rotateProduct() {
    const products = CONFIG.satellite.products;
    productIndex = (productIndex + 1) % products.length;
    currentProduct = products[productIndex].id;
    loadImage();
  }

  function rotateSector() {
    const sectors = CONFIG.satellite.sectors;
    const idx = sectors.findIndex(s => s.id === currentSector);
    currentSector = sectors[(idx + 1) % sectors.length].id;
    loadImage();
  }

  function setProduct(productId) {
    currentProduct = productId;
    productIndex = CONFIG.satellite.products.findIndex(p => p.id === productId);
    loadImage();
  }

  function setSector(sectorId) {
    currentSector = sectorId;
    loadImage();
  }

  function getSectorConfig(id) {
    return CONFIG.satellite.sectors.find(s => s.id === id) || CONFIG.satellite.sectors[0];
  }

  function getCurrentProduct() { return currentProduct; }
  function getCurrentSector() { return currentSector; }

  return {
    init, loadImage, rotateProduct, rotateSector,
    setProduct, setSector, getCurrentProduct, getCurrentSector
  };
})();
