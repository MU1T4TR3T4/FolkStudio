-- Adicionar coluna para identificar o usuário criador (string/nome)
-- Útil para o Workspace que usa autenticação simulada/local

ALTER TABLE designs ADD COLUMN IF NOT EXISTS created_by_user TEXT;
ALTER TABLE stamps ADD COLUMN IF NOT EXISTS created_by_user TEXT;

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_designs_created_by_user ON designs(created_by_user);
CREATE INDEX IF NOT EXISTS idx_stamps_created_by_user ON stamps(created_by_user);
