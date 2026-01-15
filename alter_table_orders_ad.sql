-- Adicionar colunas de custos adicionais (AD1-AD4) à tabela de pedidos
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ad1 DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS ad2 DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS ad3 DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS ad4 DECIMAL(10, 2);

-- Atualizar view ou cache de schema no Supabase se necessário (automático geralmente)
