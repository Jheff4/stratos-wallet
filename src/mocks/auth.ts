export interface User {
  id: string;
  email: string;
  passwordHash: string; // just base64 for simulation, not secure
  role: 'user' | 'admin' | 'auditor';
  createdAt: string;
}

// In-memory storage (will be persisted later)
let users: User[] = [];
// let tokens: Map<string, string> = new Map(); // token -> userId

// Simple token: base64(JSON({userId, role}))
export function createToken(user: User): string {
  const payload = { userId: user.id, role: user.role };
  return btoa(JSON.stringify(payload));
}

export function parseToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.userId && decoded.role) return decoded;
  } catch {}
  return null;
}

// Load users from persistence
export function loadUsers(data: User[]) {
  users = data;
}

export function getUsers(): User[] {
  return users;
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function registerUser(email: string, password: string, role: 'user' | 'admin' | 'auditor' = 'user'): User {
  // In a real app, hash password; here we fake it
  const passwordHash = btoa(password); // NOT secure, just for simulation
  const newUser: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

export function authenticateUser(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (user.passwordHash === btoa(password)) return user;
  return null;
}

export function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  return parseToken(token);
}