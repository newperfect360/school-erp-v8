export const developmentEnabled = false;
export const getDevelopmentSession = () => null;
export const subscribeDevelopment = () => () => {};
export const developmentLogout = () => {};
export function developmentLogin() { throw Error('Development login is disabled.'); }
