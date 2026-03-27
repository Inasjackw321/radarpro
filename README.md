# RadarPro - Live Weather Radar for OBS Studio

A professional broadcast-quality weather radar app designed to run as an OBS Studio Browser Source. Features live radar animation, NWS weather alerts, current conditions, 7-day forecast, and camera feeds — all auto-broadcasting with zero interaction required.

## Features

- **Live Radar Map** — Animated RainViewer radar tiles over a dark Leaflet map, cycling through the last 2 hours of data plus short-term forecasts
- **NWS Weather Alerts** — Color-coded severity banners (Tornado Warning = pulsing red, Severe Thunderstorm = orange, etc.) with auto-polling every 60 seconds
- **Current Conditions** — Temperature, humidity, wind speed/direction, visibility, and pressure from the nearest NWS observation station
- **7-Day Forecast** — Auto-rotating forecast scene with daily high/low temps and conditions
- **Live Cameras** — Configurable camera grid with auto-refreshing image feeds (DOT cams, NOAA satellite, radar loops)
- **Scrolling Ticker** — Bottom alert ticker with seamless CSS animation
- **Scene Rotation** — Auto-cycles between Radar, Forecast, and Cameras every 30 seconds
- **Glassmorphism UI** — Modern dark theme with frosted-glass cards, perfect for streaming
- **OBS Optimized** — 1920x1080 fixed layout, no scrollbars, transparent background mode available

## Quick Start

### Option 1: Local HTTP Server (Recommended)

```bash
cd radarpro
python3 -m http.server 8080
```

Then in OBS Studio:
1. Add a **Browser Source**
2. Set URL to `http://localhost:8080`
3. Set Width: `1920`, Height: `1080`
4. Uncheck "Shutdown source when not visible" for continuous updates

### Option 2: Direct File

In OBS Studio:
1. Add a **Browser Source**
2. Check "Local file" and browse to `index.html`
3. Set Width: `1920`, Height: `1080`

> Note: Some API calls may be blocked with `file://` protocol. The HTTP server method is recommended.

## Configuration

Edit `js/config.js` to customize:

```javascript
CONFIG.location = { lat: 35.2271, lng: -80.8431, name: 'Charlotte, NC' };
CONFIG.state = 'NC';                          // State for NWS alerts
CONFIG.branding.stationName = 'RADAR PRO';    // Your station name
CONFIG.branding.tagline = 'Live Weather Coverage';
CONFIG.refreshIntervals.sceneRotation = 30000; // Scene change interval (ms)
CONFIG.obs.transparentBg = false;              // true for overlay mode
```

### Camera Feeds

Add your own camera sources in `config.js`:

```javascript
CONFIG.cameras = [
  { name: 'My Camera', url: 'https://example.com/camera.jpg', type: 'img' },
  { name: 'Live Stream', url: 'https://youtube.com/embed/xxx', type: 'iframe' }
];
```

## APIs Used

| API | Purpose | Key Required |
|-----|---------|-------------|
| [RainViewer](https://www.rainviewer.com/api.html) | Radar tiles | No |
| [NWS API](https://www.weather.gov/documentation/services-web-api) | Alerts, forecasts, conditions | No (User-Agent only) |
| [CARTO](https://carto.com/basemaps/) | Dark map basemap | No |

## File Structure

```
radarpro/
├── index.html          # Main entry point
├── css/
│   ├── main.css        # Layout, glassmorphism, dark theme
│   ├── animations.css  # Pulse, ticker, fade, sweep animations
│   └── alerts.css      # Alert severity colors and styles
├── js/
│   ├── config.js       # All configurable settings
│   ├── app.js          # Main controller, clock, scene manager
│   ├── radar.js        # Leaflet map + RainViewer animation
│   ├── weather.js      # NWS current conditions + forecast
│   ├── alerts.js       # NWS alerts polling + display
│   ├── ticker.js       # Scrolling bottom ticker
│   └── cameras.js      # Camera feed panel
└── README.md
```

## OBS Tips

- Use **1920x1080** Browser Source resolution
- Enable **"Shutdown source when not visible"** to save resources when not streaming
- For **overlay mode**: Set `CONFIG.obs.transparentBg = true` in config.js, then layer over your webcam/other sources
- The app auto-starts everything on load — no clicks needed

## License

MIT
