/**
 * StormTracker Pro — GLOBAL Configuration
 * Worldwide Hurricane, Typhoon & Cyclone Tracking
 */
const CONFIG = {
  // === Global Basins ===
  basins: [
    { id: 'AL', name: 'Atlantic',        emoji: '🌊', sat: 'GOES16', sector: 'taw',  center: [20, -60],  zoom: 4 },
    { id: 'EP', name: 'East Pacific',    emoji: '🌊', sat: 'GOES18', sector: 'tpw',  center: [15, -120], zoom: 4 },
    { id: 'WP', name: 'West Pacific',    emoji: '🌏', sat: 'HIM',    sector: 'fd',   center: [18, 135],  zoom: 4 },
    { id: 'NI', name: 'North Indian',    emoji: '🌏', sat: 'MET',    sector: 'full', center: [15, 75],   zoom: 4 },
    { id: 'SI', name: 'South Indian',    emoji: '🌍', sat: 'MET',    sector: 'full', center: [-15, 70],  zoom: 4 },
    { id: 'SP', name: 'South Pacific',   emoji: '🌏', sat: 'HIM',    sector: 'fd',   center: [-18, 170], zoom: 4 },
    { id: 'CP', name: 'Central Pacific', emoji: '🌊', sat: 'GOES18', sector: 'tpw',  center: [15, -170], zoom: 4 }
  ],

  // === World Locations (auto-jump cycle) ===
  locations: [
    { lat: 25.76,  lng: -80.19,  name: 'Miami, FL',       region: 'Atlantic',      state: 'FL' },
    { lat: 29.76,  lng: -95.37,  name: 'Houston, TX',     region: 'Gulf Coast',    state: 'TX' },
    { lat: 18.47,  lng: -66.11,  name: 'San Juan, PR',    region: 'Caribbean',     state: 'PR' },
    { lat: 21.31,  lng: -157.86, name: 'Honolulu, HI',    region: 'Central Pacific', state: 'HI' },
    { lat: 14.60,  lng: 120.98,  name: 'Manila, PH',      region: 'West Pacific',  state: null },
    { lat: 35.68,  lng: 139.69,  name: 'Tokyo, JP',       region: 'West Pacific',  state: null },
    { lat: 22.32,  lng: 114.17,  name: 'Hong Kong',       region: 'West Pacific',  state: null },
    { lat: 19.08,  lng: 72.88,   name: 'Mumbai, IN',      region: 'North Indian',  state: null },
    { lat: -12.46, lng: 130.84,  name: 'Darwin, AU',      region: 'South Pacific', state: null },
    { lat: 23.12,  lng: -82.38,  name: 'Havana, CU',      region: 'Caribbean',     state: null },
    { lat: 30.33,  lng: -81.66,  name: 'Jacksonville, FL', region: 'Atlantic',     state: 'FL' },
    { lat: 26.10,  lng: -80.14,  name: 'Fort Lauderdale',  region: 'Atlantic',     state: 'FL' }
  ],

  // Current active location index
  activeLocationIdx: 0,

  // === Map ===
  map: {
    center: [20, -40],  // Global Atlantic default
    zoom: 3,
    maxZoom: 12,
    minZoom: 2
  },

  // === Intervals (ms) ===
  intervals: {
    radar: 300000,
    satellite: 90000,
    alerts: 60000,
    nhc: 180000,
    conditions: 600000,
    cameras: 45000,
    sceneRotation: 20000,
    locationJump: 15000,
    clock: 1000
  },

  // === Branding ===
  branding: {
    stationName: 'STORMTRACKER',
    callSign: 'GLOBAL',
    tagline: 'Worldwide Cyclone Intelligence',
    network: 'LIVE'
  },

  // === OBS ===
  obs: { width: 1920, height: 1080, transparentBg: false },

  // === NWS ===
  nws: { userAgent: '(StormTrackerPro Global, contact@stormtracker.app)' },

  // === Radar ===
  radar: {
    opacity: 0.6,
    animationDelay: 350,
    pauseOnLastFrame: 2200,
    colorScheme: 6,
    smoothing: 1,
    snow: 1
  },

  // === Satellites ===
  satellites: {
    GOES16: {
      name: 'GOES-16 East',
      region: 'Americas East',
      cdnBase: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI',
      sectors: [
        { id: 'FD',    name: 'Full Disk' },
        { id: 'CONUS', name: 'CONUS' },
        { id: 'taw',   name: 'Tropical Atlantic' },
        { id: 'gm',    name: 'Gulf of Mexico' },
        { id: 'car',   name: 'Caribbean' },
        { id: 'se',    name: 'Southeast US' }
      ]
    },
    GOES18: {
      name: 'GOES-18 West',
      region: 'Americas West',
      cdnBase: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI',
      sectors: [
        { id: 'FD',    name: 'Full Disk' },
        { id: 'CONUS', name: 'CONUS' },
        { id: 'tpw',   name: 'Tropical E. Pacific' },
        { id: 'np',    name: 'North Pacific' },
        { id: 'hi',    name: 'Hawaii' }
      ]
    },
    HIM: {
      name: 'Himawari-9',
      region: 'West Pacific / Oceania',
      cdnBase: null,
      imageUrl: 'https://www.data.jma.go.jp/mscweb/data/himawari/img/fd_/fd__trm_',
      sectors: [
        { id: 'fd', name: 'Full Disk' }
      ]
    },
    MET: {
      name: 'Meteosat',
      region: 'Europe / Africa / Indian Ocean',
      cdnBase: null,
      imageUrl: 'https://eumetview.eumetsat.int/static-images/latestImages',
      sectors: [
        { id: 'full', name: 'Full Disk' }
      ]
    }
  },

  satProducts: [
    { id: 'GEOCOLOR',          name: 'GeoColor',      desc: 'True Color Blend' },
    { id: '02',                name: 'Visible',        desc: 'Red Band 0.64μm' },
    { id: '09',                name: 'Water Vapor',    desc: 'Mid-Level WV' },
    { id: '13',                name: 'Clean IR',       desc: '10.3μm Longwave' },
    { id: '08',                name: 'Upper WV',       desc: 'Upper-Level WV' },
    { id: '14',                name: 'IR Longwave',    desc: '11.2μm' },
    { id: 'AirMass',           name: 'Air Mass',       desc: 'RGB Composite' },
    { id: 'Sandwich',          name: 'Sandwich',       desc: 'VIS+IR Overlay' },
    { id: 'DayCloudPhase',     name: 'Cloud Phase',    desc: 'Day RGB' },
    { id: 'NightMicrophysics', name: 'Night Micro',    desc: 'Night RGB' }
  ],

  // === NHC ===
  nhc: {
    currentStormsUrl: 'https://www.nhc.noaa.gov/CurrentStorms.json',
    gisService: 'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings',
    outlooks: {
      atl5d: 'https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png',
      atl2d: 'https://www.nhc.noaa.gov/xgtwo/two_atl_2d0.png',
      epac5d: 'https://www.nhc.noaa.gov/xgtwo/two_pac_5d0.png',
      epac2d: 'https://www.nhc.noaa.gov/xgtwo/two_pac_2d0.png',
      cpac5d: 'https://www.nhc.noaa.gov/xgtwo/two_cpac_5d0.png'
    }
  },

  // === Scenes ===
  scenes: ['radar', 'satellite', 'globe', 'forecast', 'tropical', 'cameras'],

  // === Global Cameras / Feeds ===
  cameras: [
    { name: 'GOES-16 Full Disk',     url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg', type: 'img' },
    { name: 'GOES-18 Full Disk',     url: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/678x678.jpg', type: 'img' },
    { name: 'Atlantic Tropical',     url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/latest.jpg', type: 'img' },
    { name: 'East Pacific',          url: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/SECTOR/tpw/GEOCOLOR/latest.jpg', type: 'img' },
    { name: 'Gulf of Mexico IR',     url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/gm/13/latest.jpg', type: 'img' },
    { name: 'Caribbean GeoColor',    url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/car/GEOCOLOR/latest.jpg', type: 'img' },
    { name: 'Atlantic IR',           url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/13/latest.jpg', type: 'img' },
    { name: 'ATL 5-Day Outlook',     url: 'https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png', type: 'img' },
    { name: 'EPAC 5-Day Outlook',    url: 'https://www.nhc.noaa.gov/xgtwo/two_pac_5d0.png', type: 'img' }
  ],

  // === Saffir-Simpson + Global Scales ===
  stormCategories: {
    'TD':  { color: '#5ebaff', label: 'Tropical Depression',  abbr: 'TD',   wind: '< 39' },
    'TS':  { color: '#00faf4', label: 'Tropical Storm',       abbr: 'TS',   wind: '39-73' },
    'C1':  { color: '#ffffcc', label: 'Category 1',           abbr: 'C1',   wind: '74-95' },
    'C2':  { color: '#ffe775', label: 'Category 2',           abbr: 'C2',   wind: '96-110' },
    'C3':  { color: '#ffc140', label: 'Category 3',           abbr: 'C3',   wind: '111-129' },
    'C4':  { color: '#ff8f20', label: 'Category 4',           abbr: 'C4',   wind: '130-156' },
    'C5':  { color: '#ff6060', label: 'Category 5',           abbr: 'C5',   wind: '157+' },
    'STY': { color: '#cc0000', label: 'Super Typhoon',        abbr: 'STY',  wind: '150+' }
  },

  alertColors: {
    Extreme:  { bg: '#dc2626', text: '#fff', class: 'alert-extreme' },
    Severe:   { bg: '#ea580c', text: '#fff', class: 'alert-severe' },
    Moderate: { bg: '#d97706', text: '#fff', class: 'alert-moderate' },
    Minor:    { bg: '#ca8a04', text: '#1a1a2e', class: 'alert-minor' },
    Unknown:  { bg: '#6b7280', text: '#fff', class: 'alert-unknown' }
  },

  conditionIcons: {
    'Sunny': '☀️', 'Clear': '🌙', 'Mostly Sunny': '🌤️',
    'Mostly Clear': '🌤️', 'Partly Sunny': '⛅', 'Partly Cloudy': '⛅',
    'Mostly Cloudy': '🌥️', 'Cloudy': '☁️', 'Overcast': '☁️',
    'Rain': '🌧️', 'Light Rain': '🌦️', 'Heavy Rain': '🌧️',
    'Showers': '🌦️', 'Thunderstorms': '⛈️', 'Tropical Storm': '🌀',
    'Hurricane': '🌀', 'Typhoon': '🌀', 'Cyclone': '🌀',
    'Snow': '🌨️', 'Fog': '🌫️', 'Windy': '💨', 'Hot': '🔥'
  }
};
