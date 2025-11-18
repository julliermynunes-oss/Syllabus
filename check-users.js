const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'syllabus.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  
  console.log('✓ Conectado ao banco de dados:', DB_PATH);
  console.log('\n📋 Listando todos os usuários:\n');
  
  db.all('SELECT id, nome_completo, email, role FROM users ORDER BY nome_completo', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err);
      db.close();
      process.exit(1);
    }
    
    if (rows.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
    } else {
      rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome_completo}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || 'professor (padrão)'}`);
        console.log('');
      });
    }
    
    db.close();
    process.exit(0);
  });
});

