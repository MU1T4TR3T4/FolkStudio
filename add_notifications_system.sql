-- ============================================
-- SCRIPT: Adicionar Suporte para Avatar e Notificações
-- ============================================

-- 1. Adicionar coluna avatar_url na tabela users (se não existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'order_in_production', 'order_ready', 'new_message', 'order_status_changed')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own notifications" ON notifications
    FOR SELECT
    USING (true);

CREATE POLICY "Allow users to update their own notifications" ON notifications
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);

-- 3. Função para criar notificação quando pedido é criado
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vendor_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            NEW.vendor_id,
            'Novo Pedido',
            'Pedido #' || NEW.order_number || ' foi criado',
            'new_order',
            '/dashboard/orders/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para novos pedidos
DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

-- 4. Função para notificar mudança de status
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_type TEXT;
BEGIN
    IF NEW.status != OLD.status AND NEW.vendor_id IS NOT NULL THEN
        -- Determinar título e tipo baseado no status
        CASE NEW.status
            WHEN 'in_production' THEN
                notification_title := 'Pedido em Produção';
                notification_type := 'order_in_production';
            WHEN 'ready' THEN
                notification_title := 'Pedido Pronto';
                notification_type := 'order_ready';
            ELSE
                notification_title := 'Status Alterado';
                notification_type := 'order_status_changed';
        END CASE;

        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            NEW.vendor_id,
            notification_title,
            'Pedido #' || NEW.order_number || ' está ' || NEW.status,
            notification_type,
            '/dashboard/orders/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mudança de status
DROP TRIGGER IF EXISTS on_order_status_changed ON orders;
CREATE TRIGGER on_order_status_changed
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_change();

-- Comentários
COMMENT ON COLUMN users.avatar_url IS 'URL da foto de perfil do usuário';
COMMENT ON TABLE notifications IS 'Notificações do sistema para os usuários';

-- Verificação
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND (column_name = 'avatar_url' OR table_name = 'notifications')
ORDER BY table_name, column_name;
