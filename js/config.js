/**
 * RadarPro Configuration
 * Edit this file to customize your weather broadcast.
 */
const CONFIG = {
  // Location settings
  location: {
    lat: 35.2271,
    lng: -80.8431,
    name: 'Charlotte, NC'
  },
  state: 'NC',

  // Map settings
  radarCenter: [35.2271, -80.8431],
  radarZoom: 7,
  maxZoom: 7,

  // Refresh intervals (milliseconds)
  refreshIntervals: {
    radar: 300000,       // 5 minutes
    alerts: 60000,       // 1 minute
    conditions: 600000,  // 10 minutes
    sceneRotation: 30000 // 30 seconds
  },

  // Branding
  branding: {
    stationName: 'RADAR PRO',
    tagline: 'Live Weather Coverage',
    callSign: 'WRDR'
  },

  // OBS settings
  obs: {
    width: 1920,
    height: 1080,
    transparentBg: false
  },

  // NWS API
  nws: {
    userAgent: '(RadarPro Weather App, contact@radarpro.app)'
  },

  // Radar display
  radar: {
    opacity: 0.7,
    animationDelay: 500,
    pauseOnLastFrame: 2000,
    colorScheme: 2,     // 1=original, 2=universal blue, 6=NEXRAD
    smoothing: 1,
    snow: 1
  },

  // Scene rotation order
  scenes: ['radar', 'forecast', 'cameras'],

  // Camera feeds (type: 'img' for auto-refreshing images, 'iframe' for embeds)
  cameras: [
    {
      name: 'Charlotte Skyline',
      url: 'https://www.charlottenc.gov/files/assets/public/v/1/images/clb-government-center-webcam.jpg',
      type: 'img'
    },
    {
      name: 'Radar Station',
      url: 'https://radar.weather.gov/ridge/standard/KGSP_loop.gif',
      type: 'img'
    },
    {
      name: 'Satellite View',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/se/GEOCOLOR/latest.jpg',
      type: 'img'
    },
    {
      name: 'Regional Radar',
      url: 'https://radar.weather.gov/ridge/standard/KMRX_loop.gif',
      type: 'img'
    }
  ],

  // Alert severity mapping
  alertColors: {
    Extreme: { bg: '#dc2626', text: '#ffffff', class: 'alert-extreme' },
    Severe:  { bg: '#ea580c', text: '#ffffff', class: 'alert-severe' },
    Moderate:{ bg: '#d97706', text: '#ffffff', class: 'alert-moderate' },
    Minor:   { bg: '#ca8a04', text: '#1a1a2e', class: 'alert-minor' },
    Unknown: { bg: '#6b7280', text: '#ffffff', class: 'alert-unknown' }
  },

  // Weather condition icon mapping (NWS short forecast text -> emoji)
  conditionIcons: {
    'Sunny': '☀️',
    'Clear': '🌙',
    'Mostly Sunny': '🌤️',
    'Mostly Clear': '🌤️',
    'Partly Sunny': '⛅',
    'Partly Cloudy': '⛅',
    'Mostly Cloudy': '🌥️',
    'Cloudy': '☁️',
    'Overcast': '☁️',
    'Rain': '🌧️',
    'Light Rain': '🌦️',
    'Heavy Rain': '🌧️',
    'Showers': '🌦️',
    'Thunderstorms': '⛈️',
    'Severe Thunderstorms': '⛈️',
    'Snow': '🌨️',
    'Light Snow': '🌨️',
    'Heavy Snow': '❄️',
    'Sleet': '🌨️',
    'Freezing Rain': '🌧️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'Windy': '💨',
    'Breezy': '💨',
    'Hot': '🔥',
    'Cold': '🥶'
  }
};
