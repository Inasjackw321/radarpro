/**
 * RadarPro - Ticker Module
 * Scrolling bottom ticker bar with weather alerts and info
 */
const Ticker = (() => {
  let alertItems = [];
  let contentEl = null;
  const SEPARATOR = '◆';

  function init() {
    contentEl = document.getElementById('ticker-content');
    render();
  }

  function setAlerts(items) {
    alertItems = items || [];
    render();
  }

  function render() {
    if (!contentEl) return;

    const items = buildItems();

    if (items.length === 0) {
      // Default content
      const defaultText = `${CONFIG.branding.stationName} ${SEPARATOR} ${CONFIG.branding.tagline} ${SEPARATOR} ${CONFIG.location.name} ${SEPARATOR} Powered by NWS & RainViewer`;
      const html = `<span class="ticker-item">${defaultText}</span>`;
      contentEl.innerHTML = html + html; // duplicate for seamless loop
      setDuration(defaultText.length);
      return;
    }

    // Build ticker HTML
    let html = items.map(item => {
      const severityClass = item.severity
        ? `ticker-item-alert ${item.severity.toLowerCase()}`
        : '';
      return `<span class="ticker-item ${severityClass}">${item.text}</span>
              <span class="ticker-separator">${SEPARATOR}</span>`;
    }).join('');

    // Add branding between alert cycles
    html += `<span class="ticker-item">${CONFIG.branding.stationName} &mdash; ${CONFIG.branding.tagline}</span>
             <span class="ticker-separator">${SEPARATOR}</span>`;

    // Duplicate for seamless infinite scroll
    contentEl.innerHTML = html + html;

    // Calculate duration based on content length
    const totalChars = items.reduce((sum, i) => sum + i.text.length, 0) + 40;
    setDuration(totalChars);
  }

  function buildItems() {
    const items = [];

    // Add alert items
    alertItems.forEach(alert => {
      items.push({
        text: alert.text,
        severity: alert.severity
      });
    });

    // Add time-based info
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (alertItems.length === 0) {
      items.push({ text: `Current time: ${timeStr} — No active weather alerts for ${CONFIG.state}` });
      items.push({ text: `${CONFIG.location.name} — Live radar coverage` });
    }

    return items;
  }

  function setDuration(charCount) {
    // ~80 pixels per second scroll speed, ~7px per character
    const pixels = charCount * 7;
    const duration = Math.max(15, pixels / 80);
    const track = document.querySelector('.ticker-track');
    if (track) {
      track.style.setProperty('--ticker-duration', `${duration}s`);
    }
    if (contentEl) {
      contentEl.style.animationDuration = `${duration}s`;
    }
  }

  return { init, setAlerts };
})();
