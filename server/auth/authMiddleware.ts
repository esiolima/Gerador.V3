import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./authTypes";
import { getAuthCookieName, getUserById, verifyAuthToken } from "./authService";

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
// realmente precisam exigir login. Busca o usuario atual no banco (nao so o
// que veio gravado no token) para refletir mudancas de papel/status sem
// exigir novo login.
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getTokenFromCookie(req);
    if (token) {
      const payload = verifyAuthToken(token);
      req.user = getUserById(payload.id) || payload;
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
    const payload = verifyAuthToken(token);

    // Busca o papel ATUAL no banco -- o token pode ter sido emitido antes de
    // uma promocao/rebaixamento feita pelo admin, e so seria atualizado num
    // novo login. Sem isso, quem acabou de ser promovido ficaria bloqueado
    // (ou quem foi rebaixado continuaria com acesso) ate relogar.
    const currentUser = getUserById(payload.id);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ success: false, error: "Acesso restrito a administradores." });
    }

    req.user = currentUser;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Sessão inválida." });
  }
}
