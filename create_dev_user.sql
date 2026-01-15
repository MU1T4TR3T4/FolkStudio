-- Criar usuário dev@folkstudio.com
INSERT INTO users (
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_at
) VALUES (
    'dev@folkstudio.com',
    '$2b$10$yyTcN8TFAiTbxLl6o18pNeN0nYzRGJGBLpIyFOYt9MJUcEQbajZta',
    'Desenvolvedor',
    'vendedor',
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Verificar criação
SELECT id, email, full_name, role, is_active, created_at 
FROM users 
WHERE email = 'dev@folkstudio.com';
