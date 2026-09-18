// Public locations only. Changing domains must not change school/database identity.
export function resolveSiteUrls(config = {}, origin) {
  const loopback = hostname => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  const resolve = (value, base) => {
    const url = new URL(value, base);
    if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback(url.hostname)))) {
      throw new Error('Public school URLs must use HTTPS (HTTP is allowed only for localhost).');
    }
    return url;
  };
  const base = resolve(config.WEB_BASE_URL || origin, origin);
  const publicSite = resolve(config.PUBLIC_SITE_URL || base.href, base);
  const api = resolve(config.API_BASE_URL || '/api', base);
  const download = resolve(config.APP_DOWNLOAD_URL || '/download-app', publicSite);
  return Object.freeze({
    webBaseUrl: base.href.replace(/\/$/, ''),
    publicSiteUrl: publicSite.href.replace(/\/$/, ''),
    apiBaseUrl: api.href.replace(/\/$/, ''),
    appDownloadUrl: download.href,
  });
}

export function currentSiteUrls() {
  return resolveSiteUrls({
    WEB_BASE_URL: import.meta.env.VITE_WEB_BASE_URL,
    PUBLIC_SITE_URL: import.meta.env.VITE_PUBLIC_SITE_URL,
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    APP_DOWNLOAD_URL: import.meta.env.VITE_APP_DOWNLOAD_URL,
  }, window.location.origin);
}
