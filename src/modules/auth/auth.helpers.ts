export const normalizeEmail = (email: unknown) => typeof email === "string" ? email.trim().toLowerCase() : "";
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
