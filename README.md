# StormTracker Pro - Hurricane & Cyclone Tracking for OBS Studio

A professional broadcast-quality hurricane and cyclone tracking app designed for OBS Studio Browser Source. Features live radar, GOES satellite imagery (10+ products), NHC storm tracking, NWS alerts, 7-day forecast, tropical outlooks, and camera feeds — all auto-broadcasting with zero interaction.

## Features

### Radar & Tracking
- **Animated Radar Map** — RainViewer tiles cycling through 2+ hours of precipitation data on a dark Leaflet map
- **NHC Storm Tracking** — Live tropical cyclone positions from the National Hurricane Center ArcGIS service
- **Storm Markers** — Color-coded by Saffir-Simpson category with wind speed labels
- **Forecast Tracks** — Projected storm paths drawn on the map
- **Cone of Uncertainty** — NHC forecast cone overlay
- **Alert Polygons** — NWS warning areas drawn on the map with severity coloring

### Satellite Imagery
- **10 GOES Products** — GeoColor, Visible, Water Vapor, Clean IR, Upper WV, IR Longwave, Air Mass, Sandwich, Cloud Phase, Night Microphysics
- **6 Sectors** — Full Disk, CONUS, Tropical Atlantic, Gulf of Mexico, Caribbean, Southeast US
- **Auto-rotating** products with product strip indicator
- **Direct CDN** — No API key needed, images from NOAA STAR

### Weather & Alerts
- **NWS Weather Alerts** — Color-coded severity banners (Tornado, Hurricane, Storm Surge, etc.)
- **Hurricane-specific styling** — Purple banners for hurricane warnings, teal for storm surge
- **Current Conditions** — Temperature, humidity, wind, pressure, visibility, dew point
- **7-Day Forecast** — Daily high/low with weather icons
- **Tropical Outlook** — NHC 2-day and 5-day formation probability maps

### Broadcast Features
- **5 Auto-Rotating Scenes** — Radar, Satellite, Forecast, Tropical Outlook, Cameras
- **Scrolling Ticker** — Active storm info + weather alerts
- **Saffir-Simpson Scale** — Color-coded category strip in footer
- **LIVE Indicator** — Pulsing red badge
- **Glassmorphism UI** — Modern dark theme with frosted-glass panels
- **Smart Scene Priority** — Stays on radar/satellite during severe weather

### Camera Feeds
- **6 Default Feeds** — GOES Atlantic, Gulf IR, Caribbean, Full Disk Earth, SE US, Tropical Outlook
- **Auto-refreshing** images with cache-busting
- **Configurable** — Add your own cameras (images or iframes)

## Quick Start

### Recommended: Local HTTP Server

```bash
cd radarpro
python3 -m http.server 8080
```

In OBS Studio:
1. Add **Browser Source**
2. URL: `http://localhost:8080`
3. Width: `1920`, Height: `1080`
4. Uncheck "Shutdown source when not visible"

### Alternative: Direct File

1. Browser Source → Check "Local file" → Browse to `index.html`
2. Width: `1920`, Height: `1080`

> API calls may be blocked with `file://` protocol. HTTP server method recommended.

## Configuration

Edit `js/config.js`:

```javascript
// Change location
CONFIG.location = { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' };
CONFIG.state = 'FL';

// Change map view (Atlantic basin default)
CONFIG.map.center = [25.0, -75.0];
CONFIG.map.zoom = 5;

// Branding
CONFIG.branding.stationName = 'STORMTRACKER';
CONFIG.branding.callSign = 'PRO';

// Satellite source
CONFIG.satellite.goes = 'GOES16';  // or 'GOES18' for West

// Scene rotation speed
CONFIG.intervals.sceneRotation = 25000;  // 25 seconds

// Overlay mode for compositing
CONFIG.obs.transparentBg = true;
```

### Add Custom Cameras

```javascript
CONFIG.cameras = [
  { name: 'Beach Cam', url: 'https://example.com/cam.jpg', type: 'img' },
  { name: 'Live Stream', url: 'https://youtube.com/embed/xxx', type: 'iframe' }
];
```

## Data Sources (All Free, No API Keys)

| Source | Data | Key |
|--------|------|-----|
| [RainViewer](https://www.rainviewer.com/api.html) | Radar tiles | None |
| [NWS API](https://www.weather.gov/documentation/services-web-api) | Alerts, forecasts, conditions | None (User-Agent) |
| [NHC ArcGIS](https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/) | Active storms, tracks, cones | None |
| [GOES CDN](https://cdn.star.nesdis.noaa.gov/) | Satellite imagery (10+ products) | None |
| [NHC Outlooks](https://www.nhc.noaa.gov/) | Tropical formation maps | None |
| [CARTO](https://carto.com/basemaps/) | Dark map basemap | None |

## File Structure

```
radarpro/
├── index.html          # Main entry point
├── css/
│   ├── main.css        # Layout, glassmorphism, dark theme
│   ├── animations.css  # Pulse, ticker, fade, spin, glow
│   └── alerts.css      # Hurricane/tornado alert severity styles
├── js/
│   ├── config.js       # All settings (location, APIs, branding)
│   ├── app.js          # Controller, clock, scene manager
│   ├── radar.js        # Leaflet + RainViewer + NHC storm map
│   ├── satellite.js    # GOES satellite imagery (10 products, 6 sectors)
│   ├── weather.js      # NWS conditions + 7-day forecast
│   ├── alerts.js       # NWS alerts + NHC tropical cyclones
│   ├── ticker.js       # Scrolling bottom ticker
│   └── cameras.js      # Camera/satellite feed grid
└── README.md
```

## Scenes

| Scene | Duration | Content |
|-------|----------|---------|
| Radar | Default | Animated precipitation map + storm markers |
| Satellite | 25s | GOES imagery cycling through products |
| Forecast | 25s | 7-day forecast cards |
| Tropical | 25s | NHC 2/5-day outlook + satellite thumbnails |
| Cameras | 25s | 6-panel satellite/camera grid |

During severe weather, scenes auto-lock to Radar and Satellite only.

## License

MIT
