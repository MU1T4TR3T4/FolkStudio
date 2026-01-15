-- Atualizar senha do usuário dev@folkstudio.com para 'admin12345'
UPDATE users 
SET 
  password_hash = '$2b$10$wZAF1SrZHGtUuGMYbifkseKL9bV3nUKkX2QDk9EO73CPtw5qAnU6O',
  updated_at = NOW()
WHERE email = 'dev@folkstudio.com';

-- Verificar atualização
SELECT email, updated_at FROM users WHERE email = 'dev@folkstudio.com';
