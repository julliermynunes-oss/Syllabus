-- Script para atualizar roles de usuários para admin
-- Execute este script no banco de dados SQLite

UPDATE users 
SET role = 'admin' 
WHERE nome_completo IN (
  'Julliermy Nunes das Chagas',
  'Ana Aureliano',
  'Alexandre Pignanelli'
);

-- Verificar se a atualização foi bem-sucedida
SELECT id, nome_completo, email, role 
FROM users 
WHERE nome_completo IN (
  'Julliermy Nunes das Chagas',
  'Ana Aureliano',
  'Alexandre Pignanelli'
);

