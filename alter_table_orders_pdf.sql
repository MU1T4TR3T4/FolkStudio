-- Adicionar coluna para URL do PDF do pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Índice para busca (opcional, mas boa prática se formos filtrar)
CREATE INDEX IF NOT EXISTS idx_orders_pdf_url ON orders(pdf_url);
