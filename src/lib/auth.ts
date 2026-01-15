import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'vendedor' | 'equipe';
  commission?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

const SALT_ROUNDS = 10;
const SESSION_KEY = 'folk_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verificar senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Fazer login com email e senha
 */
export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Buscar usuário por email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return { success: false, error: 'Email ou senha incorretos' };
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return { success: false, error: 'Usuário inativo. Entre em contato com o administrador.' };
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return { success: false, error: 'Email ou senha incorretos' };
    }

    // Remover password_hash do objeto de usuário
    const { password_hash, ...userWithoutPassword } = user;

    // Criar sessão
    const session: AuthSession = {
      user: userWithoutPassword as User,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString()
    };

    // Salvar sessão no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, user: userWithoutPassword as User };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, error: 'Erro ao processar login. Tente novamente.' };
  }
}

/**
 * Fazer logout
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Obter usuário logado
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const session: AuthSession = JSON.parse(sessionData);

    // Verificar se sessão expirou
    if (new Date(session.expiresAt) < new Date()) {
      logout();
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Verificar se usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Verificar se usuário tem role específico
 */
export function hasRole(role: 'admin' | 'vendedor' | 'equipe'): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

/**
 * Middleware de autenticação para proteger rotas
 * Retorna true se autenticado, false caso contrário
 */
export function checkAuth(requiredRole?: 'admin' | 'vendedor' | 'equipe'): boolean {
  const user = getCurrentUser();

  if (!user) {
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    return false;
  }

  return true;
}

/**
 * Criar novo usuário (apenas admin pode fazer isso)
 */
export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'vendedor' | 'equipe';
  commission?: number;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Verificar se usuário atual é admin
    const currentUser = getCurrentUser();

    // Check for super admin (dashboard login)
    const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('folk_admin_auth') === 'true';

    if (!isSuperAdmin && (!currentUser || currentUser.role !== 'admin')) {
      return { success: false, error: 'Apenas administradores podem criar usuários' };
    }

    // Hash da senha
    const password_hash = await hashPassword(userData.password);

    // Criar usuário no Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: userData.email.toLowerCase(),
        password_hash,
        full_name: userData.name,
        phone: userData.phone,
        role: userData.role,
        commission: userData.commission,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'Email já cadastrado' };
      }
      throw error;
    }

    // Remover password_hash do retorno
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return { success: true, user: userWithoutPassword as User };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, error: 'Erro ao criar usuário. Tente novamente.' };
  }
}

/**
 * Atualizar senha de usuário
 */
export async function updatePassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se usuário atual é admin
    const currentUser = getCurrentUser();

    // Check for super admin (dashboard login)
    const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('folk_admin_auth') === 'true';

    if (!isSuperAdmin && (!currentUser || currentUser.role !== 'admin')) {
      return { success: false, error: 'Apenas administradores podem alterar senhas' };
    }

    // Hash da nova senha
    const password_hash = await hashPassword(newPassword);

    // Atualizar no Supabase
    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return { success: false, error: 'Erro ao atualizar senha. Tente novamente.' };
  }
}

/**
 * Ativar/desativar usuário
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se usuário atual é admin
    const currentUser = getCurrentUser();

    // Check for super admin (dashboard login)
    const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('folk_admin_auth') === 'true';

    if (!isSuperAdmin && (!currentUser || currentUser.role !== 'admin')) {
      return { success: false, error: 'Apenas administradores podem alterar status de usuários' };
    }

    // Atualizar no Supabase
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error: 'Erro ao atualizar status. Tente novamente.' };
  }
}

/**
 * Obter todos os usuários (apenas admin)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as User[]) || [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}

/**
 * Obter usuário por ID (apenas admin)
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * Excluir usuário (apenas admin)
 */
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar permissão
    const currentUser = getCurrentUser();
    const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('folk_admin_auth') === 'true';

    if (!isSuperAdmin && (!currentUser || currentUser.role !== 'admin')) {
      return { success: false, error: 'Apenas administradores podem excluir usuários' };
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return { success: false, error: 'Erro ao excluir usuário. Tente novamente.' };
  }
}
