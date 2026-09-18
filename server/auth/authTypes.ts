import { Request } from "express";

export type AuthRole = "admin" | "user";
export type AuthStatus = "pending" | "approved";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  active: boolean;
  status: AuthStatus;
  company?: string;
  jobTitle?: string;
  phone?: string;
  message?: string;
  createdAt: string;
};

export type PublicAuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

export type AdminAuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  active: boolean;
  status: AuthStatus;
  company?: string;
  jobTitle?: string;
  phone?: string;
  message?: string;
  createdAt: string;
};

export type AuthenticatedRequest = Request & {
  user?: PublicAuthUser;
};
