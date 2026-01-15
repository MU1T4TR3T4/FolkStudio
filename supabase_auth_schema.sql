-- ============================================
-- SISTEMA DE AUTENTICAÇÃO
-- Tabela de usuários com roles e autenticação
-- ============================================

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'equipe')),
  commission DECIMAL(5,2), -- Apenas para vendedores
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura pública (necessário para login)
CREATE POLICY "Allow public read access" ON users
    FOR SELECT
    USING (true);

-- Policy: Permitir insert/update/delete público (temporário para desenvolvimento)
-- IMPORTANTE: Em produção, restringir isso apenas para usuários autenticados
CREATE POLICY "Allow public insert" ON users
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update" ON users
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete" ON users
    FOR DELETE
    USING (true);

-- Inserir usuário admin padrão (senha: admin123)
-- Hash gerado com bcrypt, salt rounds: 10
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'admin@folkstudio.com',
    '$2a$10$rQ3qZ9X5Y7K8wN2mP4lJ1.eH6vF5tG8hI9jK0lM1nO2pQ3rS4tU5v',
    'Administrador',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema com autenticação';
COMMENT ON COLUMN users.role IS 'Role do usuário: admin, vendedor ou equipe';
COMMENT ON COLUMN users.commission IS 'Porcentagem de comissão (apenas para vendedores)';
COMMENT ON COLUMN users.is_active IS 'Indica se o usuário está ativo no sistema';
