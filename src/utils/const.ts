// Constants
// Mapbox access token. Read from VITE_MAPBOX_TOKEN in .env (see .env.example).
// Get your own token at https://www.mapbox.com/ — do NOT commit a real token.
const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
const MAP_LAYER_LIST = [
  'road-label',
  'waterway-label',
  'natural-line-label',
  'natural-point-label',
  'water-line-label',
  'water-point-label',
  'poi-label',
  'airport-label',
  'settlement-subdivision-label',
  'settlement-label',
  'state-label',
  'country-label',
];

const USE_GOOGLE_ANALYTICS = false;
const GOOGLE_ANALYTICS_TRACKING_ID = '';

// styling: set to `true` if you want dash-line route
const USE_DASH_LINE = true;
// styling: route line opacity: [0, 1]
const LINE_OPACITY = 0.4;
// styling: map height - responsive design
// Use smaller height on mobile devices for better user experience
const MAP_HEIGHT = window.innerWidth <= 768 ? 250 : 600;
//set to `false` if you want to hide the road label characters
const ROAD_LABEL_DISPLAY = true;
// updated on 2024/11/17: privacy mode is set to true by default
//set to `true` if you want to display only the routes without showing the map.
const PRIVACY_MODE = false;
// updated on 2024/11/17: lights are turned off by default
//set to `false` if you want to make light off as default, only effect when `PRIVACY_MODE` = false
const LIGHTS_ON = false;
//set to `true` if you want to show the 'Elevation Gain' column
const SHOW_ELEVATION_GAIN = true;
// richer title for the activity types (like garmin style)
const RICH_TITLE = false;

// IF you are outside China please make sure IS_CHINESE = false
// Controls only the map label language layer (RunMap) — all display
// strings are English-only. Chinese reverse-geocoding addresses in
// activity data are still parsed (see utils.extractLocation) so
// location province / city still populate correctly.
const IS_CHINESE = false;
const USE_ANIMATION_FOR_GRID = false;
// English-only info messages. LocationStat imports these directly.
const LOCATION_INFO_MESSAGE_FIRST =
  'Ran through some places — hoping the lit-up dots grow over time.';
const LOCATION_INFO_MESSAGE_SECOND =
  "Don't stop. Don't stop running.";

// Kept the same name for backwards-compat with imports.
const INFO_MESSAGE = (yearLength: number, year: string): string =>
  `Running journey with ${yearLength} year${yearLength === 1 ? '' : 's'}, the table shows year ${year} data`;
const FULL_MARATHON_RUN_TITLE = 'Full Marathon';
const HALF_MARATHON_RUN_TITLE = 'Half Marathon';
const MORNING_RUN_TITLE = 'Morning Run';
const MIDDAY_RUN_TITLE = 'Midday Run';
const AFTERNOON_RUN_TITLE = 'Afternoon Run';
const EVENING_RUN_TITLE = 'Evening Run';
const NIGHT_RUN_TITLE = 'Night Run';
const RUN_GENERIC_TITLE = 'Run';
const RUN_TRAIL_TITLE = 'Trail Run';
const RUN_TREADMILL_TITLE = 'Treadmill Run';
const MORNING_HIKING_TITLE = 'Morning Hike';
const MIDDAY_HIKING_TITLE = 'Midday Hike';
const AFTERNOON_HIKING_TITLE = 'Afternoon Hike';
const EVENING_HIKING_TITLE = 'Evening Hike';
const NIGHT_HIKING_TITLE = 'Night Hike';
const HIKING_GENERIC_TITLE = 'Hiking';
const CYCLING_TITLE = 'Cycling';
const SKIING_TITLE = 'Skiing';
const MORNING_WALKING_TITLE = 'Morning Walk';
const MIDDAY_WALKING_TITLE = 'Midday Walk';
const AFTERNOON_WALKING_TITLE = 'Afternoon Walk';
const EVENING_WALKING_TITLE = 'Evening Walk';
const NIGHT_WALKING_TITLE = 'Night Walk';
const WALKING_GENERIC_TITLE = 'Walking';
const SWIMMING_TITLE = 'Swimming';
const ALL_TITLE = 'All';
const ACTIVITY_COUNT_TITLE = 'Activity Count';
const MAX_DISTANCE_TITLE = 'Max Distance';
const MAX_SPEED_TITLE = 'Max Speed';
const TOTAL_TIME_TITLE = 'Total Time';
const AVERAGE_SPEED_TITLE = 'Average Speed';
const TOTAL_DISTANCE_TITLE = 'Total Distance';
const AVERAGE_DISTANCE_TITLE = 'Average Distance';
const TOTAL_ELEVATION_GAIN_TITLE = 'Total Elevation Gain';
const AVERAGE_HEART_RATE_TITLE = 'Average Heart Rate';
const YEARLY_TITLE = 'Yearly';
const MONTHLY_TITLE = 'Monthly';
const WEEKLY_TITLE = 'Weekly';
const DAILY_TITLE = 'Daily';
const LOCATION_TITLE = 'Location';
const HOME_PAGE_TITLE = 'Home';

const LOADING_TEXT = 'Loading...';

const ACTIVITY_TYPES = {
  RUN_GENERIC_TITLE,
  RUN_TRAIL_TITLE,
  RUN_TREADMILL_TITLE,
  HIKING_GENERIC_TITLE,
  CYCLING_TITLE,
  SKIING_TITLE,
  WALKING_GENERIC_TITLE,
  SWIMMING_TITLE,
  ALL_TITLE,
};

const RUN_TITLES = {
  FULL_MARATHON_RUN_TITLE,
  HALF_MARATHON_RUN_TITLE,
  MORNING_RUN_TITLE,
  MIDDAY_RUN_TITLE,
  AFTERNOON_RUN_TITLE,
  EVENING_RUN_TITLE,
  NIGHT_RUN_TITLE,
};

const WALKING_TITLES = {
  MORNING_WALKING_TITLE,
  MIDDAY_WALKING_TITLE,
  AFTERNOON_WALKING_TITLE,
  EVENING_WALKING_TITLE,
  NIGHT_WALKING_TITLE,
};

const HIKING_TITLES = {
  MORNING_HIKING_TITLE,
  MIDDAY_HIKING_TITLE,
  AFTERNOON_HIKING_TITLE,
  EVENING_HIKING_TITLE,
  NIGHT_HIKING_TITLE,
};

const ACTIVITY_TOTAL = {
  ACTIVITY_COUNT_TITLE,
  MAX_DISTANCE_TITLE,
  MAX_SPEED_TITLE,
  TOTAL_TIME_TITLE,
  AVERAGE_SPEED_TITLE,
  TOTAL_DISTANCE_TITLE,
  AVERAGE_DISTANCE_TITLE,
  TOTAL_ELEVATION_GAIN_TITLE,
  AVERAGE_HEART_RATE_TITLE,
  YEARLY_TITLE,
  MONTHLY_TITLE,
  WEEKLY_TITLE,
  DAILY_TITLE,
  LOCATION_TITLE,
};

export {
  USE_GOOGLE_ANALYTICS,
  GOOGLE_ANALYTICS_TRACKING_ID,
  LOCATION_INFO_MESSAGE_FIRST,
  LOCATION_INFO_MESSAGE_SECOND,
  MAPBOX_TOKEN,
  MAP_LAYER_LIST,
  IS_CHINESE,
  ROAD_LABEL_DISPLAY,
  INFO_MESSAGE,
  RUN_TITLES,
  WALKING_TITLES,
  HIKING_TITLES,
  LOCATION_TITLE,
  USE_ANIMATION_FOR_GRID,
  USE_DASH_LINE,
  LINE_OPACITY,
  MAP_HEIGHT,
  PRIVACY_MODE,
  LIGHTS_ON,
  SHOW_ELEVATION_GAIN,
  RICH_TITLE,
  ACTIVITY_TYPES,
  ACTIVITY_TOTAL,
  HOME_PAGE_TITLE,
  LOADING_TEXT,
};

const nike = 'rgb(224,237,94)'; // if you want to change the main color, modify this value in src/styles/variables.scss
const dark_vanilla = 'rgb(228,212,220)';

// If your map has an offset please change this line
// issues #92 and #198
export const NEED_FIX_MAP = false;
export const MAIN_COLOR = nike;
export const PROVINCE_FILL_COLOR = '#47b8e0';
export const COUNTRY_FILL_COLOR = dark_vanilla;

// Static color constants
export const RUN_COLOR_LIGHT = '#47b8e0';
export const RUN_COLOR_DARK = MAIN_COLOR;

// Single run animation colors
export const SINGLE_RUN_COLOR_LIGHT = '#52c41a'; // Green for light theme
export const SINGLE_RUN_COLOR_DARK = '#ff4d4f'; // Red for dark theme

// Helper function to get theme-aware RUN_COLOR
export const getRuntimeRunColor = (): string => {
  if (typeof window === 'undefined') return RUN_COLOR_DARK;

  const dataTheme = document.documentElement.getAttribute('data-theme');
  const savedTheme = localStorage.getItem('theme');

  // Determine current theme (default to dark)
  const isDark =
    dataTheme === 'dark' ||
    (!dataTheme && savedTheme === 'dark') ||
    (!dataTheme && !savedTheme);

  return isDark ? RUN_COLOR_DARK : RUN_COLOR_LIGHT;
};

// Helper function to get theme-aware SINGLE_RUN_COLOR
export const getRuntimeSingleRunColor = (): string => {
  if (typeof window === 'undefined') return SINGLE_RUN_COLOR_DARK;

  const dataTheme = document.documentElement.getAttribute('data-theme');
  const savedTheme = localStorage.getItem('theme');

  // Determine current theme (default to dark)
  const isDark =
    dataTheme === 'dark' ||
    (!dataTheme && savedTheme === 'dark') ||
    (!dataTheme && !savedTheme);

  return isDark ? SINGLE_RUN_COLOR_DARK : SINGLE_RUN_COLOR_LIGHT;
};

// Legacy export for backwards compatibility
export const RUN_COLOR = '#47b8e0';
export const RUN_TRAIL_COLOR = 'rgb(255,153,51)';
export const CYCLING_COLOR = 'rgb(51,255,87)';
export const HIKING_COLOR = 'rgb(151,51,255)';
export const WALKING_COLOR = HIKING_COLOR;
export const SWIMMING_COLOR = 'rgb(255,51,51)';

// map tiles vendor, maptiler or mapbox or stadiamaps
// if you want to use maptiler, set the access token in MAP_TILE_ACCESS_TOKEN
export const MAP_TILE_VENDOR = 'mapbox';

// map tiles style name, see MAP_TILE_STYLES for more details
export const MAP_TILE_STYLE_LIGHT = 'light-v10';
export const MAP_TILE_STYLE_DARK = 'dark-v10';

// access token. you can apply a new one, it's free.
// maptiler: Gt5R0jT8tuIYxW6sNrAg | sign up at https://cloud.maptiler.com/auth/widget
// stadiamaps: 8a769c5a-9125-4936-bdcf-a6b90cb5d0a4 | sign up at https://client.stadiamaps.com/signup/
export const MAP_TILE_ACCESS_TOKEN = 'Gt5R0jT8tuIYxW6sNrAg';

export const MAP_TILE_STYLES = {
  maptiler: {
    'dataviz-light': 'https://api.maptiler.com/maps/dataviz/style.json?key=',
    'dataviz-dark':
      'https://api.maptiler.com/maps/dataviz-dark/style.json?key=',
    'basic-light': 'https://api.maptiler.com/maps/basic-v2/style.json?key=',
    'basic-dark': 'https://api.maptiler.com/maps/basic-v2-dark/style.json?key=',
    'streets-light': 'https://api.maptiler.com/maps/streets-v2/style.json?key=',
    'streets-dark':
      'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=',
    'outdoor-light': 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=',
    'outdoor-dark':
      'https://api.maptiler.com/maps/outdoor-v2-dark/style.json?key=',
    'bright-light': 'https://api.maptiler.com/maps/bright-v2/style.json?key=',
    'bright-dark':
      'https://api.maptiler.com/maps/bright-v2-dark/style.json?key=',
    'topo-light': 'https://api.maptiler.com/maps/topo-v2/style.json?key=',
    'topo-dark': 'https://api.maptiler.com/maps/topo-v2-dark/style.json?key=',
    'winter-light': 'https://api.maptiler.com/maps/winter-v2/style.json?key=',
    'winter-dark':
      'https://api.maptiler.com/maps/winter-v2-dark/style.json?key=',
    hybrid: 'https://api.maptiler.com/maps/hybrid/style.json?key=',
  },

  // https://docs.stadiamaps.com/themes/
  stadiamaps: {
    // light
    alidade_smooth:
      'https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=',
    alidade_smooth_dark:
      'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=',
    alidade_satellite:
      'https://tiles.stadiamaps.com/styles/alidade_satellite.json?api_key=',
  },

  // https://docs.mapbox.com/api/maps/styles/
  mapbox: {
    'dark-v10': 'mapbox://styles/mapbox/dark-v10',
    'dark-v11': 'mapbox://styles/mapbox/dark-v11',
    'light-v10': 'mapbox://styles/mapbox/light-v10',
    'light-v11': 'mapbox://styles/mapbox/light-v11',
    'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1',
    'satellite-streets-v12': 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  default: 'mapbox://styles/mapbox/dark-v10',
};
