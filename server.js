const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const multer = require('multer');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client/build'));

// Database setup
const db = new sqlite3.Database('./syllabus.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Create tables
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_completo TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS syllabi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        curso TEXT,
        disciplina TEXT,
        semestre_ano TEXT,
        turma TEXT,
        departamento TEXT,
        num_creditos TEXT,
        sem_curricular TEXT,
        idioma TEXT,
        coordenador TEXT,
        professores TEXT,
        programa TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        codigo TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS disciplines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        programa_id INTEGER,
        FOREIGN KEY (programa_id) REFERENCES programs(id)
      )`);
    });
  }
});

// Read Excel file and populate database
function loadExcelData() {
  try {
    const workbook = xlsx.readFile('./Base Dados Programas.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    db.serialize(() => {
      db.run('DELETE FROM programs');
      db.run('DELETE FROM disciplines');
      
      const programsMap = new Map();
      const programsSet = new Set();
      
      // Extract unique programs from Excel
      data.forEach((row) => {
        const programa = row['Programa'] || '';
        if (programa) {
          programsSet.add(programa);
        }
      });
      
      // Insert programs
      programsSet.forEach((programa) => {
        const stmt = db.prepare('INSERT INTO programs (nome) VALUES (?)');
        const result = stmt.run([programa]);
        stmt.finalize();
        programsMap.set(programa, result.lastID);
      });
      
      // Add some sample disciplines for each program
      // This is a placeholder - you can manually add disciplines or expand this
      programsMap.forEach((programId, programa) => {
        // Add common disciplines
        const commonDisciplines = [
          'Metodologia Científica',
          'Ética Profissional',
          'Gestão de Projetos',
          'Pesquisa em Administração',
          'Planejamento Estratégico'
        ];
        
        commonDisciplines.forEach((disciplina) => {
          const stmt = db.prepare('INSERT INTO disciplines (nome, programa_id) VALUES (?, ?)');
          stmt.run([disciplina, programId]);
          stmt.finalize();
        });
      });
    });
    
    console.log('Excel data loaded successfully');
  } catch (error) {
    console.error('Error loading Excel data:', error);
  }
}

// Load Excel data on startup
setTimeout(loadExcelData, 1000);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/register', async (req, res) => {
  const { nome_completo, email, senha } = req.body;

  if (!nome_completo || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const hashedPassword = await bcrypt.hash(senha, 10);

  db.run(
    'INSERT INTO users (nome_completo, email, senha) VALUES (?, ?, ?)',
    [nome_completo, email, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }
        return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
      }

      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
      res.json({ token, user: { id: this.lastID, nome_completo, email } });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar usuário' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, nome_completo: user.nome_completo, email: user.email } });
  });
});

// Programs and Disciplines routes
app.get('/api/programs', (req, res) => {
  db.all('SELECT * FROM programs', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar programas' });
    }
    res.json(rows);
  });
});

app.get('/api/disciplines', (req, res) => {
  const { programa, nome } = req.query;
  
  if (programa) {
    db.all(
      'SELECT d.* FROM disciplines d JOIN programs p ON d.programa_id = p.id WHERE p.nome LIKE ?',
      [`%${programa}%`],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar disciplinas' });
        }
        res.json(rows);
      }
    );
  } else if (nome) {
    db.all(
      'SELECT * FROM disciplines WHERE nome LIKE ?',
      [`%${nome}%`],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar disciplinas' });
        }
        res.json(rows);
      }
    );
  } else {
    db.all('SELECT * FROM disciplines', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar disciplinas' });
      }
      res.json(rows);
    });
  }
});

// Syllabi routes
app.get('/api/syllabi', authenticateToken, (req, res) => {
  const { programa, disciplina } = req.query;
  let query = `
    SELECT s.*, u.nome_completo as usuario
    FROM syllabi s
    JOIN users u ON s.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (programa) {
    query += ' AND s.programa LIKE ?';
    params.push(`%${programa}%`);
  }

  if (disciplina) {
    query += ' AND s.disciplina LIKE ?';
    params.push(`%${disciplina}%`);
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar syllabi' });
    }
    res.json(rows);
  });
});

app.get('/api/syllabi/:id', authenticateToken, (req, res) => {
  const id = req.params.id;

  db.get(
    'SELECT s.*, u.nome_completo as usuario FROM syllabi s JOIN users u ON s.usuario_id = u.id WHERE s.id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar syllabus' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Syllabus não encontrado' });
      }
      res.json(row);
    }
  );
});

app.post('/api/disciplines', authenticateToken, (req, res) => {
  const { nome, programa_id } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome da disciplina é obrigatório' });
  }

  db.run(
    'INSERT INTO disciplines (nome, programa_id) VALUES (?, ?)',
    [nome, programa_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar disciplina' });
      }
      res.json({ id: this.lastID, message: 'Disciplina criada com sucesso' });
    }
  );
});

app.post('/api/syllabi', authenticateToken, (req, res) => {
  const {
    curso, disciplina, semestre_ano, turma, departamento,
    num_creditos, sem_curricular, idioma, coordenador,
    professores, programa
  } = req.body;

  db.run(
    `INSERT INTO syllabi 
     (usuario_id, curso, disciplina, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id, curso, disciplina, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar syllabus' });
      }
      res.json({ id: this.lastID, message: 'Syllabus criado com sucesso' });
    }
  );
});

app.put('/api/syllabi/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const {
    curso, disciplina, semestre_ano, turma, departamento,
    num_creditos, sem_curricular, idioma, coordenador,
    professores, programa
  } = req.body;

  db.run(
    `UPDATE syllabi 
     SET curso=?, disciplina=?, semestre_ano=?, turma=?, departamento=?,
         num_creditos=?, sem_curricular=?, idioma=?, coordenador=?, professores=?, programa=?
     WHERE id=? AND usuario_id=?`,
    [
      curso, disciplina, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa,
      id, req.user.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar syllabus' });
      }
      res.json({ message: 'Syllabus atualizado com sucesso' });
    }
  );
});

app.delete('/api/syllabi/:id', authenticateToken, (req, res) => {
  const id = req.params.id;

  db.run(
    'DELETE FROM syllabi WHERE id=? AND usuario_id=?',
    [id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar syllabus' });
      }
      res.json({ message: 'Syllabus deletado com sucesso' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

