import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./authTypes";

export function authMiddleware(
  _req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  next();
}

export function requireAdmin(
  _req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  next();
}
