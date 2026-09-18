import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { AuthRole, AuthStatus, AuthUser, PublicAuthUser, AdminAuthUser } from "./authTypes";

const DATA_DIR = path.resolve("data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const DEFAULT_JWT_SECRET =
  "troque-este-segredo-em-producao-usando-a-variavel-AUTH_JWT_SECRET";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "jornal_auth_token";
const JWT_EXPIRES_IN = process.env.AUTH_JWT_EXPIRES_IN || "7d";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getJwtSecret() {
  return process.env.AUTH_JWT_SECRET || DEFAULT_JWT_SECRET;
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function toPublicUser(user: AuthUser): PublicAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function readUsers(): AuthUser[] {
  ensureDataDir();

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf8");
  }

  const raw = fs.readFileSync(USERS_FILE, "utf8");

  try {
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function writeUsers(users: AuthUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export async function ensureInitialAdminUser() {
  const users = readUsers();

  if (users.length > 0) return;

  const email = normalizeEmail(process.env.AUTH_ADMIN_EMAIL || "admin@jornal.local");
  const password = process.env.AUTH_ADMIN_PASSWORD || "admin123";
  const name = process.env.AUTH_ADMIN_NAME || "Administrador";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin: AuthUser = {
    id: randomUUID(),
    name,
    email,
    passwordHash,
    role: "admin",
    active: true,
    status: "approved",
    createdAt: new Date().toISOString(),
  };

  writeUsers([admin]);

  console.log("[Auth] Usuário admin inicial criado.");
  console.log(`[Auth] Email: ${email}`);

  if (!process.env.AUTH_ADMIN_PASSWORD) {
    console.log("[Auth] Senha padrão: admin123");
    console.log("[Auth] IMPORTANTE: configure AUTH_ADMIN_PASSWORD no deploy.");
  }
}

export async function loginWithEmailPassword(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const users = readUsers();

  const user = users.find(
    (item) => item.email === email && item.active && item.status === "approved"
  );

  if (!user) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const passwordOk = await bcrypt.compare(String(password || ""), user.passwordHash);

  if (!passwordOk) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const publicUser = toPublicUser(user);

  const token = jwt.sign(publicUser, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: publicUser,
  };
}

export function verifyAuthToken(token: string): PublicAuthUser {
  const payload = jwt.verify(token, getJwtSecret()) as PublicAuthUser;

  if (!payload?.id || !payload?.email || !payload?.role) {
    throw new Error("Sessão inválida.");
  }

  return payload;
}

export function getUserById(id: string): PublicAuthUser | null {
  const users = readUsers();
  const user = users.find((item) => item.id === id && item.active);

  return user ? toPublicUser(user) : null;
}

export function listUsers(): PublicAuthUser[] {
  return readUsers()
    .filter((user) => user.active)
    .map(toPublicUser);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role?: AuthRole;
}) {
  const users = readUsers();
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("E-mail obrigatório.");
  }

  if (!input.password || input.password.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  const exists = users.some((user) => user.email === email);

  if (exists) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user: AuthUser = {
    id: randomUUID(),
    name: input.name || email,
    email,
    passwordHash,
    role: input.role || "user",
    active: true,
    status: "approved",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);

  return toPublicUser(user);
}

export function deactivateUser(id: string) {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index < 0) {
    throw new Error("Usuário não encontrado.");
  }

  users[index].active = false;
  writeUsers(users);
}

function toAdminUser(user: AuthUser): AdminAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    status: user.status,
    company: user.company,
    jobTitle: user.jobTitle,
    phone: user.phone,
    message: user.message,
    createdAt: user.createdAt,
  };
}

// 🔐 ADMIN: lista todos os usuarios (pendentes + aprovados), do mais recente pro mais antigo
export function listAllUsersForAdmin(): AdminAuthUser[] {
  return readUsers()
    .map(toAdminUser)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// 🔐 Cria um pedido de acesso pendente (sem senha ainda -- o admin define ao aprovar)
export async function requestAccess(input: {
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  message?: string;
}) {
  const users = readUsers();
  const email = normalizeEmail(input.email);

  if (!email || !input.name) {
    throw new Error("Nome e e-mail são obrigatórios.");
  }

  const existing = users.find((user) => user.email === email);

  if (existing) {
    throw new Error("Já existe uma conta ou solicitação com este e-mail.");
  }

  const placeholderHash = await bcrypt.hash(randomUUID(), 12);

  const user: AuthUser = {
    id: randomUUID(),
    name: input.name,
    email,
    passwordHash: placeholderHash,
    role: "user",
    active: false,
    status: "pending",
    company: input.company,
    jobTitle: input.jobTitle,
    phone: input.phone,
    message: input.message,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);

  return toAdminUser(user);
}

// 🔐 ADMIN: aprova um pedido pendente, definindo a senha de acesso
export async function approveUser(id: string, password: string) {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index < 0) {
    throw new Error("Usuário não encontrado.");
  }

  if (!password || password.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  users[index].passwordHash = await bcrypt.hash(password, 12);
  users[index].active = true;
  users[index].status = "approved";

  writeUsers(users);

  return toAdminUser(users[index]);
}

// 🔐 ADMIN: rejeita e remove um pedido pendente
export function rejectUser(id: string) {
  const users = readUsers();
  const user = users.find((item) => item.id === id);

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (user.status !== "pending") {
    throw new Error("Este usuário já foi aprovado -- use excluir em vez de rejeitar.");
  }

  writeUsers(users.filter((item) => item.id !== id));
}

// 🔐 ADMIN: reseta a senha de um usuário existente
export async function resetUserPassword(id: string, newPassword: string) {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index < 0) {
    throw new Error("Usuário não encontrado.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  users[index].passwordHash = await bcrypt.hash(newPassword, 12);
  writeUsers(users);

  return toAdminUser(users[index]);
}

// 🔐 ADMIN: exclui um usuário definitivamente
export function deleteUser(id: string) {
  const users = readUsers();
  const exists = users.some((user) => user.id === id);

  if (!exists) {
    throw new Error("Usuário não encontrado.");
  }

  writeUsers(users.filter((user) => user.id !== id));
}
