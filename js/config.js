/**
 * StormTracker Pro - Configuration
 * Hurricane & Cyclone Tracking System for OBS Studio
 * Edit this file to customize your broadcast.
 */
const CONFIG = {
  // === Location & Region ===
  location: {
    lat: 25.7617,
    lng: -80.1918,
    name: 'Miami, FL'
  },
  state: 'FL',
  region: 'Atlantic Basin',

  // Map defaults
  map: {
    center: [25.0, -75.0],   // Atlantic basin view
    zoom: 5,
    maxZoom: 10,
    minZoom: 3
  },

  // === Refresh Intervals (ms) ===
  intervals: {
    radar: 300000,        // 5 min - radar tiles
    satellite: 120000,    // 2 min - satellite imagery
    alerts: 60000,        // 1 min - NWS alerts
    nhc: 300000,          // 5 min - NHC hurricane data
    conditions: 600000,   // 10 min - current weather
    cameras: 30000,       // 30 sec - camera image refresh
    sceneRotation: 25000, // 25 sec - auto scene change
    clock: 1000           // 1 sec
  },

  // === Branding ===
  branding: {
    stationName: 'STORMTRACKER',
    callSign: 'PRO',
    tagline: 'Hurricane & Cyclone Coverage',
    network: 'LIVE COVERAGE'
  },

  // === OBS Settings ===
  obs: {
    width: 1920,
    height: 1080,
    transparentBg: false
  },

  // === API Config ===
  nws: {
    userAgent: '(StormTrackerPro, contact@stormtracker.app)'
  },

  // === Radar ===
  radar: {
    opacity: 0.65,
    animationDelay: 400,
    pauseOnLastFrame: 2500,
    colorScheme: 6,   // NEXRAD color scheme
    smoothing: 1,
    snow: 1
  },

  // === Satellite Products ===
  satellite: {
    goes: 'GOES16',  // GOES16 or GOES18
    defaultProduct: 'GEOCOLOR',
    products: [
      { id: 'GEOCOLOR',  name: 'GeoColor',       desc: 'True Color / IR Blend' },
      { id: '02',        name: 'Visible',         desc: '0.64μm Red Band' },
      { id: '09',        name: 'Water Vapor',     desc: 'Mid-Level WV' },
      { id: '13',        name: 'Clean IR',        desc: '10.3μm Longwave' },
      { id: '08',        name: 'Upper WV',        desc: 'Upper-Level Water Vapor' },
      { id: '14',        name: 'IR Longwave',     desc: '11.2μm Window' },
      { id: 'AirMass',   name: 'Air Mass',        desc: 'RGB Composite' },
      { id: 'Sandwich',  name: 'Sandwich',        desc: 'Visible + IR Overlay' },
      { id: 'DayCloudPhase', name: 'Cloud Phase', desc: 'Day Cloud Phase RGB' },
      { id: 'NightMicrophysics', name: 'Night Micro', desc: 'Night Microphysics RGB' }
    ],
    sectors: [
      { id: 'FD',    name: 'Full Disk',  resolution: '1808x1808' },
      { id: 'CONUS', name: 'CONUS',      resolution: '1250x750' },
      { id: 'taw',   name: 'Tropical Atlantic', resolution: '1800x1080' },
      { id: 'gm',    name: 'Gulf of Mexico',    resolution: '1000x1000' },
      { id: 'car',   name: 'Caribbean',         resolution: '1000x1000' },
      { id: 'se',    name: 'Southeast US',      resolution: '1200x1200' }
    ],
    defaultSector: 'taw'
  },

  // === NHC Hurricane Tracking ===
  nhc: {
    basin: 'atlantic',  // 'atlantic' or 'eastern_pacific'
    gisService: 'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings',
    outlookUrl: 'https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png',
    feeds: {
      atlantic: 'https://www.nhc.noaa.gov/index-at.xml',
      eastPacific: 'https://www.nhc.noaa.gov/index-ep.xml',
      outlook: 'https://www.nhc.noaa.gov/gtwo.xml'
    }
  },

  // === Scene Rotation ===
  scenes: ['radar', 'satellite', 'forecast', 'tropical', 'cameras'],

  // === Cameras (coastal/storm) ===
  cameras: [
    {
      name: 'GOES-16 Atlantic',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/latest.jpg',
      type: 'img'
    },
    {
      name: 'Gulf of Mexico IR',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/gm/13/latest.jpg',
      type: 'img'
    },
    {
      name: 'Caribbean GeoColor',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/car/GEOCOLOR/latest.jpg',
      type: 'img'
    },
    {
      name: 'Full Disk Earth',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg',
      type: 'img'
    },
    {
      name: 'SE US Visible',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/se/GEOCOLOR/latest.jpg',
      type: 'img'
    },
    {
      name: 'Tropical Outlook',
      url: 'https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png',
      type: 'img'
    }
  ],

  // === Saffir-Simpson Scale Colors ===
  stormCategories: {
    'TD':  { color: '#5ebaff', label: 'Tropical Depression', wind: '< 39 mph' },
    'TS':  { color: '#00faf4', label: 'Tropical Storm',     wind: '39-73 mph' },
    'C1':  { color: '#ffffcc', label: 'Category 1',         wind: '74-95 mph' },
    'C2':  { color: '#ffe775', label: 'Category 2',         wind: '96-110 mph' },
    'C3':  { color: '#ffc140', label: 'Category 3',         wind: '111-129 mph' },
    'C4':  { color: '#ff8f20', label: 'Category 4',         wind: '130-156 mph' },
    'C5':  { color: '#ff6060', label: 'Category 5',         wind: '157+ mph' }
  },

  // === Alert Severity ===
  alertColors: {
    Extreme:  { bg: '#dc2626', text: '#fff', class: 'alert-extreme' },
    Severe:   { bg: '#ea580c', text: '#fff', class: 'alert-severe' },
    Moderate: { bg: '#d97706', text: '#fff', class: 'alert-moderate' },
    Minor:    { bg: '#ca8a04', text: '#1a1a2e', class: 'alert-minor' },
    Unknown:  { bg: '#6b7280', text: '#fff', class: 'alert-unknown' }
  },

  // === Weather Icons ===
  conditionIcons: {
    'Sunny': '☀️', 'Clear': '🌙', 'Mostly Sunny': '🌤️',
    'Mostly Clear': '🌤️', 'Partly Sunny': '⛅', 'Partly Cloudy': '⛅',
    'Mostly Cloudy': '🌥️', 'Cloudy': '☁️', 'Overcast': '☁️',
    'Rain': '🌧️', 'Light Rain': '🌦️', 'Heavy Rain': '🌧️',
    'Showers': '🌦️', 'Thunderstorms': '⛈️', 'Tropical Storm': '🌀',
    'Hurricane': '🌀', 'Snow': '🌨️', 'Fog': '🌫️', 'Windy': '💨'
  }
};
