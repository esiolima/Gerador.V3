import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./authTypes";
import { getAuthCookieName, verifyAuthToken } from "./authService";

function getTokenFromCookie(req: AuthenticatedRequest) {
  const cookieHeader = req.headers.cookie || "";
  const cookieName = getAuthCookieName();

  const cookies = cookieHeader.split(";").map((c) => c.trim());

  for (const cookie of cookies) {
    const [key, ...value] = cookie.split("=");
    if (key === cookieName) {
      return decodeURIComponent(value.join("="));
    }
  }

  return "";
}

// Anexa req.user quando existir um cookie de sessao valido, mas nunca bloqueia
// a requisicao -- use requireAdmin (ou uma variante requireAuth) nas rotas que
// realmente precisam exigir login.
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getTokenFromCookie(req);
    if (token) {
      req.user = verifyAuthToken(token);
    }
  } catch {
    // token ausente/invalido -- segue sem usuario anexado
  }

  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getTokenFromCookie(req);
    const user = verifyAuthToken(token);

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Acesso restrito a administradores." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Sessão inválida." });
  }
}
