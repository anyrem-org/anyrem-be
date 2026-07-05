export const normalizeEmail = (email: unknown) => typeof email === "string" ? email.trim().toLowerCase() : "";
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Public API origin, e.g. https://api.example.com/api */
export const apiBase = (appUrl: string) => {
  const base = appUrl.replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

/** Build a public API URL from APP_URL (host root or already ending in /api). */
export const apiUrl = (appUrl: string, path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase(appUrl)}${normalized}`;
};
