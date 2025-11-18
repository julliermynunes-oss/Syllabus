const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determinar o caminho do banco de dados (mesma lógica do server.js)
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'syllabus.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  
  console.log('✓ Conectado ao banco de dados:', DB_PATH);
  
  // Primeiro, garantir que a coluna role existe
  db.run(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'professor'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.warn('Aviso ao adicionar coluna role:', err.message);
    } else if (!err) {
      console.log('✓ Coluna role adicionada à tabela users');
    }
    
    // Agora atualizar os roles
    const adminUsers = [
      'Julliermy Nunes das Chagas',
      'Ana Aureliano',
      'Alexandre Pignanelli'
    ];
    
    // Atualizar roles
    const placeholders = adminUsers.map(() => '?').join(',');
    const updateQuery = `UPDATE users SET role = 'admin' WHERE nome_completo IN (${placeholders})`;
    
    db.run(updateQuery, adminUsers, function(err) {
      if (err) {
        console.error('Erro ao atualizar roles:', err);
        db.close();
        process.exit(1);
      }
      
      console.log(`✓ ${this.changes} usuário(s) atualizado(s) para admin`);
      
      // Verificar os resultados
      const selectQuery = `SELECT id, nome_completo, email, role FROM users WHERE nome_completo IN (${placeholders})`;
      db.all(selectQuery, adminUsers, (err, rows) => {
        if (err) {
          console.error('Erro ao verificar resultados:', err);
        } else {
          console.log('\n✓ Usuários atualizados:');
          rows.forEach(user => {
            console.log(`  - ${user.nome_completo} (${user.email}): ${user.role || 'professor'}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('Erro ao fechar banco de dados:', err);
          } else {
            console.log('\n✓ Script concluído com sucesso!');
          }
          process.exit(0);
        });
      });
    });
  });
});

