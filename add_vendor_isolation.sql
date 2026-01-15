-- ============================================
-- SCRIPT: Adicionar Isolamento de Dados por Vendedor
-- ============================================
-- Este script adiciona colunas para associar dados aos vendedores
-- Permitindo que cada vendedor tenha seus próprios dados isolados
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PARTE 1: ADICIONAR COLUNAS
-- ============================================

-- 1.1 Adicionar coluna created_by_user_id em stamps
ALTER TABLE stamps 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 1.2 Adicionar coluna created_by_user_id em client_stamps
ALTER TABLE client_stamps 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 1.3 Adicionar coluna created_by_user_id em clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 1.4 Adicionar coluna vendor_id em orders (se não existir)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 1.5 Adicionar coluna created_by_user_id em designs
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- PARTE 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para stamps
CREATE INDEX IF NOT EXISTS idx_stamps_created_by_user ON stamps(created_by_user_id);

-- Índices para client_stamps
CREATE INDEX IF NOT EXISTS idx_client_stamps_created_by_user ON client_stamps(created_by_user_id);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_created_by_user ON clients(created_by_user_id);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);

-- Índices para designs
CREATE INDEX IF NOT EXISTS idx_designs_created_by_user ON designs(created_by_user_id);

-- ============================================
-- PARTE 3: MIGRAR DADOS EXISTENTES (OPCIONAL)
-- ============================================

-- OPÇÃO 1: Associar todos os dados existentes ao admin
-- Descomente as linhas abaixo se quiser executar esta opção

-- UPDATE stamps 
-- SET created_by_user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE created_by_user_id IS NULL;

-- UPDATE client_stamps 
-- SET created_by_user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE created_by_user_id IS NULL;

-- UPDATE clients 
-- SET created_by_user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE created_by_user_id IS NULL;

-- UPDATE orders 
-- SET vendor_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE vendor_id IS NULL;

-- UPDATE designs 
-- SET created_by_user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE created_by_user_id IS NULL;

-- ============================================
-- PARTE 4: COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN stamps.created_by_user_id IS 'ID do usuário (vendedor) que criou esta estampa';
COMMENT ON COLUMN client_stamps.created_by_user_id IS 'ID do usuário (vendedor) que criou este vínculo';
COMMENT ON COLUMN clients.created_by_user_id IS 'ID do usuário (vendedor) que cadastrou este cliente';
COMMENT ON COLUMN orders.vendor_id IS 'ID do vendedor responsável por este pedido';
COMMENT ON COLUMN designs.created_by_user_id IS 'ID do usuário (vendedor) que criou este design';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as colunas foram adicionadas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('created_by_user_id', 'vendor_id')
ORDER BY table_name, column_name;

-- Verificar se os índices foram criados
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE '%user%' OR indexname LIKE '%vendor%'
ORDER BY tablename, indexname;
