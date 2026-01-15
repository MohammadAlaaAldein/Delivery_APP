export const IsDev = (): boolean => process.env.SERVER === 'development';
export const IsProd = (): boolean => process.env.SERVER === 'production';
export const getServerPrettyName = () => process.env.SERVER_PRETTY_NAME;
export const getSiteBaseURL = () => process.env.BASE_URL;

// Removed session constants - using JWT only now

export const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;
export const JWT_SECRET_TOKEN_TTL = 3600;

export const JWT_REFRESH_SECRET_TOKEN = process.env.JWT_REFRESH_SECRET_TOKEN;
export const JWT_REFRESH_SECRET_TOKEN_TTL = 7 * 24 * 3600;

export const CACHE_KEYS = {
	monitor_new_connections_cache_key: `monitor_new_dev_connections`,
	monitor_exists_connections_cache_key: `monitor_exist_dev_connections`,
	device_rejection: `dev_rejection`,
	device_cleaned_rejection: 'dev_cleaned_rejection',
	device_queue: "cmd_queue_v1",
	last_connect_time: "lct_v1",
	device_lock: "dev_lock_v1",
};

export const FRONTEND_ROOT_FOLDER = '../../frontend/';
export const DIST1 = 'dist';
export const DIST2 = 'dist2';
export const FRONTEND_ROOT = '/my-dashboard';

export const ONE_DAY = 86400;
export const ONE_WEEK = ONE_DAY * 7;
export const ONE_MONTH = ONE_DAY * 30;
export const ONE_MINUTE = 60;

export const ALL_CACHES_TTL = ONE_WEEK;
export const URL_PREFIX = 'api';
export const RESET_PASSWORD_LINK_TTL = 3*24*3600;
export const CAPTCHA_IMAGE_TTL= ONE_MINUTE / 2;
export const WHITELISTED_IPS = process.env.WHITELISTED_IPS;

export const TEMPERATURE_FIELDS_CONFIG = {
	min_temperature: -50,
	max_temperature: 100,
	min_hw_version: 'C',
	fw_version: '0.5.0'
}
