/** AWS regions available in the settings dropdown */
export const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'sa-east-1', 'ca-central-1',
];

/** localStorage key names used throughout the app */
export const STORAGE_KEYS = {
  ENDPOINT: 'ls_endpoint',
  REGION: 'ls_region',
  ACCESS_KEY: 'ls_access_key',
  SECRET_KEY: 'ls_secret_key',
  BACKEND: 'ls_backend',
  SIDEBAR_EXPANDED: 'ls_sidebar_expanded',
  THEME: 'ls_theme',
  DENSITY: 'ls_density',
};

/** Default connection settings */
export const DEFAULTS = {
  ENDPOINT: 'http://localhost:4566',
  REGION: 'us-east-1',
  ACCESS_KEY: 'test',
  SECRET_KEY: 'test',
  BACKEND: 'localstack',
};
