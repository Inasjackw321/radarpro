# StormTracker Pro GLOBAL — Worldwide Cyclone Intelligence

A professional broadcast-quality **global** hurricane, typhoon, and cyclone tracking system designed for OBS Studio. Auto-jumps between locations worldwide, tracks storms across all ocean basins, and displays satellite imagery from 4 satellite constellations.

## Global Coverage

| Basin | Storms Tracked | Satellite | Data Source |
|-------|---------------|-----------|-------------|
| Atlantic | Hurricanes | GOES-16 East | NHC |
| East Pacific | Hurricanes | GOES-18 West | NHC |
| Central Pacific | Hurricanes | GOES-18 West | NHC |
| West Pacific | Typhoons | Himawari-9 | NHC/ArcGIS |
| North Indian | Cyclones | Meteosat | NHC/ArcGIS |
| South Indian | Cyclones | Meteosat | NHC/ArcGIS |
| South Pacific | Cyclones | Himawari-9 | NHC/ArcGIS |

## Features

### Storm Tracking
- **NHC CurrentStorms.json** — Real-time active storm data (Atlantic + East Pacific)
- **NHC ArcGIS** — Storm positions, forecast tracks, cone of uncertainty
- **Global storm markers** — Color-coded by Saffir-Simpson + Super Typhoon scale
- **Auto-jump to storms** — Map automatically flies to active storm locations
- **Basin overview** — Color-coded basin chips showing which basins have active systems

### Satellite Imagery (4 Constellations)
- **GOES-16 East** — Americas East (6 sectors)
- **GOES-18 West** — Americas West (5 sectors)
- **Himawari-9** — West Pacific / Oceania
- **Meteosat** — Europe / Africa / Indian Ocean
- **10 Products** — GeoColor, Visible, Water Vapor, Clean IR, Upper WV, IR Longwave, Air Mass, Sandwich, Cloud Phase, Night Microphysics
- **Globe Scene** — All 4 satellites displayed simultaneously

### Location Jumping
- **12 worldwide locations** — Miami, Houston, San Juan, Honolulu, Manila, Tokyo, Hong Kong, Mumbai, Darwin, Havana, Jacksonville, Fort Lauderdale
- **Auto-cycles** every 15 seconds between locations
- **Storm priority** — 60% chance to jump to active storm locations when storms exist
- **Per-location weather** — Fetches conditions for each location as it jumps

### Weather (Global)
- **Open-Meteo API** — Works for ANY latitude/longitude worldwide, no API key
- **NWS fallback** — Uses NWS API for US locations (higher detail forecast)
- **Current conditions** — Temperature, humidity, wind, pressure, dew point
- **7-day forecast** — Daily high/low with WMO weather code icons

### Alerts
- **NWS alerts** for US locations — color-coded severity banners
- **Hurricane/Typhoon-specific styling** — Purple hurricane warnings, teal storm surge
- **Scrolling ticker** with global storm data + weather alerts

### 6 Auto-Rotating Scenes
1. **Radar** — Animated RainViewer precipitation + storm markers
2. **Satellite** — GOES/Himawari/Meteosat imagery with product rotation
3. **Globe** — All 4 satellites side-by-side (full disk Earth views)
4. **Forecast** — 7-day forecast cards for current location
5. **Tropical** — NHC outlooks (Atlantic, East Pacific, Central Pacific)
6. **Cameras** — 9-panel satellite feed grid

### Smart Behavior
- Severe weather locks scenes to Radar + Satellite
- Storm jumping prioritizes active cyclone locations
- Satellite auto-switches to relevant constellation per basin
- All data auto-refreshes on configured intervals

## Quick Start

```bash
cd radarpro
python3 -m http.server 8080
```

OBS Studio → Browser Source → `http://localhost:8080` → 1920x1080

## Configuration

Edit `js/config.js`:

```javascript
// Add locations
CONFIG.locations.push({ lat: 13.75, lng: 100.52, name: 'Bangkok, TH', region: 'West Pacific', state: null });

// Change jump speed
CONFIG.intervals.locationJump = 10000; // 10 seconds

// Change satellite
CONFIG.satellites.GOES16.sectors  // Atlantic sectors
CONFIG.satellites.HIM             // Himawari config

// Transparent mode for OBS overlay
CONFIG.obs.transparentBg = true;
```

## Data Sources (All Free)

| Source | Data | Key Required |
|--------|------|-------------|
| [NHC CurrentStorms.json](https://www.nhc.noaa.gov/CurrentStorms.json) | Active storms (ATL/EPAC) | No |
| [NHC ArcGIS](https://idpgis.ncep.noaa.gov/arcgis/rest/services/) | Storm GIS data | No |
| [RainViewer](https://www.rainviewer.com/api.html) | Global radar tiles | No |
| [Open-Meteo](https://open-meteo.com/) | Global weather (any lat/lng) | No |
| [NWS API](https://api.weather.gov/) | US alerts & forecasts | No |
| [GOES CDN](https://cdn.star.nesdis.noaa.gov/) | GOES-16/18 satellite | No |
| [JMA Himawari](https://www.data.jma.go.jp/mscweb/data/himawari/) | Himawari-9 imagery | No |
| [EUMETSAT](https://eumetview.eumetsat.int/) | Meteosat imagery | No |
| [CARTO](https://carto.com/) | Dark map tiles | No |

## License

MIT
