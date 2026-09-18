import { Express, Response } from "express";
import { requireAdmin } from "./authMiddleware";
import { AuthenticatedRequest } from "./authTypes";
import {
  approveUser,
  deleteUser,
  listAllUsersForAdmin,
  rejectUser,
  resetUserPassword,
  setUserRole,
} from "./authService";

export function setupAdminRoutes(app: Express) {
  // Lista todos os usuarios: pendentes (aguardando aprovacao) + aprovados
  app.get(
    "/api/admin/users",
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      res.json({ success: true, users: listAllUsersForAdmin() });
    }
  );

  // Aprova um pedido de acesso pendente, definindo a senha de entrada
  app.post(
    "/api/admin/users/:id/approve",
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const password = String(req.body?.password || "");
        const role = req.body?.role === "admin" ? "admin" : undefined;
        const user = await approveUser(req.params.id, password, role);
        res.json({ success: true, user });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error?.message });
      }
    }
  );

  // Promove ou rebaixa um usuario ja aprovado (admin <-> usuario)
  app.post(
    "/api/admin/users/:id/role",
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      try {
        const role = req.body?.role === "admin" ? "admin" : "user";
        const user = setUserRole(req.params.id, role);
        res.json({ success: true, user });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error?.message });
      }
    }
  );

  // Rejeita (remove) um pedido de acesso pendente
  app.post(
    "/api/admin/users/:id/reject",
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      try {
        rejectUser(req.params.id);
        res.json({ success: true });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error?.message });
      }
    }
  );

  // Reseta a senha de um usuario ja aprovado
  app.post(
    "/api/admin/users/:id/reset-password",
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const password = String(req.body?.password || "");
        const user = await resetUserPassword(req.params.id, password);
        res.json({ success: true, user });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error?.message });
      }
    }
  );

  // Exclui um usuario definitivamente
  app.delete(
    "/api/admin/users/:id",
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      try {
        deleteUser(req.params.id);
        res.json({ success: true });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error?.message });
      }
    }
  );
}
