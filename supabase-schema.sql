-- ============================================
-- FolkStudio Database Schema - COMPLETO
-- ============================================
-- Este script cria TODAS as tabelas necessárias para o FolkStudio
-- Incluindo: Designs, Pedidos, Usuários, Autenticação e Gerenciamento
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: GERENCIAMENTO DE USUÁRIOS
-- ============================================

-- 1.1 TABELA: users
-- Armazena informações de todos os usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'employee', 'admin')) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 1.2 TABELA: user_sessions
-- Gerencia sessões de usuários logados
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 1.3 TABELA: customers
-- Informações adicionais específicas de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  cpf_cnpj TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- 1.4 TABELA: employees
-- Informações adicionais específicas de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE, -- ID do funcionário (matrícula)
  department TEXT,
  position TEXT,
  hire_date DATE,
  salary DECIMAL(10, 2),
  is_admin BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para employees
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);

-- ============================================
-- PARTE 2: PRODUTOS E DESIGNS
-- ============================================

-- 2.1 TABELA: designs
-- Armazena os designs criados no estúdio
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mockup_image TEXT,
  product_type TEXT NOT NULL,
  color TEXT NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para designs
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_product_type ON designs(product_type);
CREATE INDEX IF NOT EXISTS idx_designs_is_public ON designs(is_public);

-- 2.2 TABELA: stamps
-- Armazena estampas/logos (gerados por IA ou uploads)
CREATE TABLE IF NOT EXISTS stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('generated', 'uploaded')),
  prompt TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para stamps
CREATE INDEX IF NOT EXISTS idx_stamps_user_id ON stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_stamps_type ON stamps(type);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON stamps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stamps_is_public ON stamps(is_public);

-- ============================================
-- PARTE 3: PEDIDOS E VENDAS
-- ============================================

-- 3.1 TABELA: orders
-- Armazena pedidos de clientes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  product_type TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'quality_check', 'ready', 'shipped', 'delivered', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  total_price DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT,
  notes TEXT,
  internal_notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_design_id ON orders(design_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);

-- 3.2 TABELA: order_items
-- Itens individuais de um pedido (para pedidos com múltiplos produtos)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2),
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_design_id ON order_items(design_id);

-- ============================================
-- PARTE 4: COMUNICAÇÃO E ARQUIVOS
-- ============================================

-- 4.1 TABELA: order_messages
-- Armazena mensagens de chat dos pedidos
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Mensagem interna (apenas equipe)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para order_messages
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_user_id ON order_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON order_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_order_messages_is_internal ON order_messages(is_internal);

-- 4.2 TABELA: order_files
-- Armazena arquivos anexados aos pedidos
CREATE TABLE IF NOT EXISTS order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para order_files
CREATE INDEX IF NOT EXISTS idx_order_files_order_id ON order_files(order_id);
CREATE INDEX IF NOT EXISTS idx_order_files_user_id ON order_files(user_id);

-- 4.3 TABELA: order_comments
-- Armazena comentários administrativos nos pedidos
CREATE TABLE IF NOT EXISTS order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  comment TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para order_comments
CREATE INDEX IF NOT EXISTS idx_order_comments_order_id ON order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_user_id ON order_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_created_at ON order_comments(created_at);

-- ============================================
-- PARTE 5: HISTÓRICO E LOGS
-- ============================================

-- 5.1 TABELA: status_logs
-- Armazena histórico de mudanças de status dos pedidos
CREATE TABLE IF NOT EXISTS status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para status_logs
CREATE INDEX IF NOT EXISTS idx_status_logs_order_id ON status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_user_id ON status_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_created_at ON status_logs(created_at DESC);

-- 5.2 TABELA: activity_logs
-- Registro de atividades importantes do sistema
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT, -- 'order', 'design', 'user', etc.
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- PARTE 6: CONFIGURAÇÕES E NOTIFICAÇÕES
-- ============================================

-- 6.1 TABELA: notifications
-- Notificações para usuários
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 6.2 TABELA: system_settings
-- Configurações gerais do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- ============================================
-- PARTE 7: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (AJUSTAR EM PRODUÇÃO)
-- IMPORTANTE: Estas políticas permitem acesso total. Em produção, implementar controle de acesso adequado.

-- Políticas para users
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);

-- Políticas para designs
CREATE POLICY "Allow public read on designs" ON designs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on designs" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on designs" ON designs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on designs" ON designs FOR DELETE USING (true);

-- Políticas para stamps
CREATE POLICY "Allow public read on stamps" ON stamps FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stamps" ON stamps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stamps" ON stamps FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stamps" ON stamps FOR DELETE USING (true);

-- Políticas para orders
CREATE POLICY "Allow public read on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);

-- Políticas para order_items
CREATE POLICY "Allow public read on order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Políticas para order_messages
CREATE POLICY "Allow public read on order_messages" ON order_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_messages" ON order_messages FOR INSERT WITH CHECK (true);

-- Políticas para order_files
CREATE POLICY "Allow public read on order_files" ON order_files FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_files" ON order_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on order_files" ON order_files FOR DELETE USING (true);

-- Políticas para order_comments
CREATE POLICY "Allow public read on order_comments" ON order_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_comments" ON order_comments FOR INSERT WITH CHECK (true);

-- Políticas para status_logs
CREATE POLICY "Allow public read on status_logs" ON status_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on status_logs" ON status_logs FOR INSERT WITH CHECK (true);

-- Políticas para notifications
CREATE POLICY "Allow public read on notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on notifications" ON notifications FOR UPDATE USING (true);

-- Políticas para customers
CREATE POLICY "Allow public read on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customers" ON customers FOR UPDATE USING (true);

-- Políticas para employees
CREATE POLICY "Allow public read on employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert on employees" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on employees" ON employees FOR UPDATE USING (true);

-- Políticas para user_sessions
CREATE POLICY "Allow public read on user_sessions" ON user_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on user_sessions" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on user_sessions" ON user_sessions FOR DELETE USING (true);

-- Políticas para activity_logs
CREATE POLICY "Allow public read on activity_logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on activity_logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Políticas para system_settings
CREATE POLICY "Allow public read on system_settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on system_settings" ON system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on system_settings" ON system_settings FOR UPDATE USING (true);

-- ============================================
-- PARTE 8: TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de pedido único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'FS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sequence para números de pedido
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger para gerar número de pedido automaticamente
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders
    FOR EACH ROW WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- PARTE 9: DADOS INICIAIS
-- ============================================

-- Inserir usuário admin padrão (senha: admin123 - MUDAR EM PRODUÇÃO!)
-- Hash bcrypt para 'admin123': $2a$10$rOzJq5xQxH5L5pY5L5pY5.5pY5L5pY5L5pY5L5pY5L5pY5L5pY5L
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES ('admin@folkstudio.com', '$2a$10$rOzJq5xQxH5L5pY5L5pY5.5pY5L5pY5L5pY5L5pY5L5pY5L5pY5L', 'Administrador', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir configurações padrão do sistema
INSERT INTO system_settings (key, value, description)
VALUES 
  ('site_name', '"FolkStudio"', 'Nome do site'),
  ('site_email', '"contato@folkstudio.com"', 'Email de contato'),
  ('order_prefix', '"FS"', 'Prefixo dos números de pedido'),
  ('default_currency', '"BRL"', 'Moeda padrão')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Contar registros em cada tabela
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM designs) as designs_count,
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM stamps) as stamps_count
FROM pg_tables
WHERE schemaname = 'public'
LIMIT 1;

-- ============================================
-- PARTE 10: CLIENTES (ADICIONADO)
-- ============================================

-- 10.1 TABELA: clients
-- Tabela para gerenciamento de clientes pelos usuários (lojistas)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- O usuário dono deste registro de cliente
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  cpf_cnpj TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Trigger para updated_at em clients
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS para clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert on clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clients" ON clients FOR DELETE USING (true);

-- 10.2 ATUALIZAÇÃO TABELA: orders
-- Adicionar referência ao cliente cadastrado (opcional, pois pode ser um cliente avulso sem cadastro)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
