import type { Request, Response, NextFunction } from "express";

/**
 * Shared LAN staff secret for destructive routes.
 * Set ADMIN_TOKEN in server/.env (see .env.example).
 */
export const getAdminToken = (): string =>
  (process.env.ADMIN_TOKEN ?? process.env.DELETE_TOKEN ?? "").trim();

export const isAdminAuthConfigured = (): boolean => getAdminToken().length >= 4;

/**
 * Require X-Admin-Token or Authorization: Bearer <token>.
 * If ADMIN_TOKEN is unset: allow in development (logged), block in production.
 */
export function requireAdminToken(req: Request, res: Response, next: NextFunction): void {
  const expected = getAdminToken();
  const isProd = (process.env.NODE_ENV ?? "development") === "production";

  if (!expected) {
    if (isProd) {
      res.status(503).json({
        message:
          "Delete is disabled: set ADMIN_TOKEN in the server environment before allowing deletions.",
      });
      return;
    }
    // Dev convenience only — still prefer setting ADMIN_TOKEN on shared LAN.
    next();
    return;
  }

  const headerToken =
    (typeof req.headers["x-admin-token"] === "string" ? req.headers["x-admin-token"] : "") ||
    (typeof req.headers.authorization === "string" &&
    req.headers.authorization.toLowerCase().startsWith("bearer ")
      ? req.headers.authorization.slice(7).trim()
      : "");

  if (!headerToken || headerToken !== expected) {
    res.status(401).json({
      message: "Admin token required. Provide header X-Admin-Token.",
    });
    return;
  }

  next();
}
