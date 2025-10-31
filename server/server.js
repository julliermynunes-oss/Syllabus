const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
// Em desenvolvimento: permite apenas equals localhost
// Em produção: permite todas as origens (já que o frontend e backend estão no mesmo domínio no Railway)
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: true, // Permite qualquer origem em produção
    credentials: true
  }));
} else {
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
}
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database setup (supports persistent volume via DB_PATH)
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'syllabus.db');
const isUsingVolume = !!process.env.DB_PATH;

console.log('=== DATABASE CONFIGURATION ===');
console.log('DB_PATH:', DB_PATH);
console.log('Using persistent volume:', isUsingVolume ? 'YES' : 'NO (ephemeral - data will be lost on redeploy)');
if (!isUsingVolume) {
  console.warn('⚠️  WARNING: Database is using ephemeral storage. Data will be lost on redeploy!');
  console.warn('⚠️  To fix: Create a Volume in Railway and set DB_PATH=/data/syllabus.db');
}

try {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory:', dbDir);
  } else {
    console.log('Database directory exists:', dbDir);
  }
} catch (e) {
  console.error('Could not ensure DB directory exists:', e);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err, '\nPath:', DB_PATH);
  } else {
    console.log('✓ Connected to SQLite database at', DB_PATH);
    console.log('=== END DATABASE CONFIGURATION ===');
    
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
        linha TEXT,
        semestre_ano TEXT,
        turma TEXT,
        departamento TEXT,
        num_creditos TEXT,
        sem_curricular TEXT,
        idioma TEXT,
        coordenador TEXT,
        professores TEXT,
        programa TEXT,
        sobre_disciplina TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users(id)
      )`);

      // Add sobre_disciplina column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN sobre_disciplina TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add linha column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN linha TEXT`, (err) => {
        // Ignore if exists
      });

      // Add conteudo column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN conteudo TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add metodologia column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN metodologia TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add criterio_avaliacao column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN criterio_avaliacao TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add aula_aula column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN aula_aula TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add compromisso_etico column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN compromisso_etico TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add sobre_professor column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN sobre_professor TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add referencias column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN referencias TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add competencias column if it doesn't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN competencias TEXT`, (err) => {
        // Ignore error if column already exists
      });

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

      db.run(`CREATE TABLE IF NOT EXISTS syllabus_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        professor_nome TEXT NOT NULL,
        professor_email TEXT,
        curso TEXT,
        disciplina TEXT,
        semestre_ano TEXT,
        turma_nome TEXT,
        status TEXT DEFAULT 'pending',
        assigned_to_user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
      )`);

      // Normalização retroativa de valores de semestre (idempotente)
      const normalizeSemesters = () => {
        // Semestre/Ano: Primeiro/AAAA -> 1/AAAA, Segundo/AAAA -> 2/AAAA
        db.run(`UPDATE syllabi SET semestre_ano = REPLACE(semestre_ano, 'Primeiro/', '1/') WHERE semestre_ano LIKE 'Primeiro/%'`);
        db.run(`UPDATE syllabi SET semestre_ano = REPLACE(semestre_ano, 'Segundo/', '2/') WHERE semestre_ano LIKE 'Segundo/%'`);

        // Sem. Curricular: textos para ordinais numéricos
        db.run("UPDATE syllabi SET sem_curricular='1º' WHERE sem_curricular='Primeiro'");
        db.run("UPDATE syllabi SET sem_curricular='2º' WHERE sem_curricular='Segundo'");
        db.run("UPDATE syllabi SET sem_curricular='3º' WHERE sem_curricular='Terceiro'");
        db.run("UPDATE syllabi SET sem_curricular='4º' WHERE sem_curricular='Quarto'");
        db.run("UPDATE syllabi SET sem_curricular='5º' WHERE sem_curricular='Quinto'");
        db.run("UPDATE syllabi SET sem_curricular='6º' WHERE sem_curricular='Sexto'");
        db.run("UPDATE syllabi SET sem_curricular='7º' WHERE sem_curricular IN ('Sétimo','Setimo')");
        db.run("UPDATE syllabi SET sem_curricular='8º' WHERE sem_curricular='Oitavo'");
      };

      normalizeSemesters();
    });
  }
});

// Read CSV files and populate database
function loadCSVData() {
  try {
    let cursosData = [];
    let disciplinasData = [];
    let programsLoaded = false;
    let disciplinesLoaded = false;

    // Read Cursos CSV
    fs.createReadStream('./Curso.csv')
      .pipe(csv())
      .on('data', (row) => {
        cursosData.push(row);
      })
      .on('end', () => {
        db.serialize(() => {
          db.run('DELETE FROM programs');
          const programsMap = new Map();
          
          // Insert programs
          const uniquePrograms = [...new Set(cursosData.map(r => r.programa))];
          uniquePrograms.forEach((programa) => {
            db.run('INSERT INTO programs (nome) VALUES (?)', [programa], function(err) {
              if (!err) {
                programsMap.set(programa, this.lastID);
              }
            });
          });
          
          programsLoaded = true;
          if (disciplinesLoaded) {
            insertDisciplines(disciplinasData, programsMap);
          }
        });
      });

    // Read Disciplinas CSV
    fs.createReadStream('./Disciplina.csv')
      .pipe(csv())
      .on('data', (row) => {
        disciplinasData.push(row);
      })
      .on('end', () => {
        disciplinesLoaded = true;
        if (programsLoaded) {
          setTimeout(() => insertDisciplines(disciplinasData, new Map()), 500);
        }
      });

    console.log('CSV data loaded successfully');
  } catch (error) {
    console.error('Error loading CSV data:', error);
  }
}

function insertDisciplines(disciplinasData, programsMap) {
  db.serialize(() => {
    db.run('DELETE FROM disciplines');
    
    db.all('SELECT * FROM programs', [], (err, programs) => {
      if (err) {
        console.error('Error fetching programs:', err);
        return;
      }
      
      const programsMap = new Map();
      programs.forEach(p => programsMap.set(p.nome, p.id));
      
      // Group disciplines by programa
      const groupedDisciplines = {};
      disciplinasData.forEach(row => {
        const programa = row.programa;
        if (!groupedDisciplines[programa]) {
          groupedDisciplines[programa] = [];
        }
        groupedDisciplines[programa].push(row.disciplina);
      });
      
      // Insert disciplines
      Object.keys(groupedDisciplines).forEach(programa => {
        const programaId = programsMap.get(programa);
        if (programaId) {
          const uniqueDisciplines = [...new Set(groupedDisciplines[programa])];
          uniqueDisciplines.forEach(disciplina => {
            db.run('INSERT INTO disciplines (nome, programa_id) VALUES (?, ?)', [disciplina, programaId]);
          });
        }
      });
      
      console.log('Disciplines inserted successfully');
    });
  });
}

// Load CSV data on startup
setTimeout(loadCSVData, 1000);

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

      const token = jwt.sign({ id: this.lastID, email, nome_completo }, JWT_SECRET);
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

    const token = jwt.sign({ id: user.id, email: user.email, nome_completo: user.nome_completo }, JWT_SECRET);
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
    LEFT JOIN users u ON s.usuario_id = u.id
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
    'SELECT s.*, u.nome_completo as usuario FROM syllabi s LEFT JOIN users u ON s.usuario_id = u.id WHERE s.id = ?',
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
    curso, disciplina, linha, semestre_ano, turma, departamento,
    num_creditos, sem_curricular, idioma, coordenador,
    professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao,
    aula_aula, compromisso_etico, sobre_professor, referencias, competencias
  } = req.body;

  db.run(
    `INSERT INTO syllabi 
     (usuario_id, curso, disciplina, linha, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao, aula_aula, compromisso_etico, sobre_professor, referencias, competencias)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id, curso, disciplina, linha, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao, aula_aula, compromisso_etico, sobre_professor, referencias, competencias
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
    curso, disciplina, linha, semestre_ano, turma, departamento,
    num_creditos, sem_curricular, idioma, coordenador,
    professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao,
    aula_aula, compromisso_etico, sobre_professor, referencias, competencias
  } = req.body;

  db.run(
    `UPDATE syllabi 
     SET curso=?, disciplina=?, linha=?, semestre_ano=?, turma=?, departamento=?,
         num_creditos=?, sem_curricular=?, idioma=?, coordenador=?, professores=?, programa=?, sobre_disciplina=?, conteudo=?, metodologia=?, criterio_avaliacao=?, aula_aula=?, compromisso_etico=?, sobre_professor=?, referencias=?, competencias=?
     WHERE id=? AND usuario_id=?`,
    [
      curso, disciplina, linha, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao, aula_aula, compromisso_etico, sobre_professor, referencias, competencias,
      id, req.user.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar syllabus' });
      }
      if (this.changes === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para editar este syllabus' });
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
      if (this.changes === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir este syllabus' });
      }
      res.json({ message: 'Syllabus deletado com sucesso' });
    }
  );
});

// Manutenção: reatribuir syllabi órfãos (sem usuário correspondente) para o usuário logado
app.post('/api/maintenance/claim-orphans', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.run(
    `UPDATE syllabi 
     SET usuario_id = ?
     WHERE usuario_id IS NULL 
        OR usuario_id NOT IN (SELECT id FROM users)`,
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao reatribuir syllabi' });
      }
      res.json({ updated: this.changes });
    }
  );
});

// Request routes
app.post('/api/requests', authenticateToken, (req, res) => {
  const { professor_nome, professor_email, curso, disciplina, semestre_ano, turma_nome } = req.body;

  db.run(
    'INSERT INTO syllabus_requests (professor_nome, professor_email, curso, disciplina, semestre_ano, turma_nome) VALUES (?, ?, ?, ?, ?, ?)',
    [professor_nome, professor_email, curso, disciplina, semestre_ano, turma_nome],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar requisição' });
      }
      res.json({ id: this.lastID, message: 'Requisição criada com sucesso' });
    }
  );
});

app.get('/api/requests', authenticateToken, (req, res) => {
  // Find requests FOR the current user by name
  const userName = req.user.nome_completo;

  db.all(
    'SELECT * FROM syllabus_requests WHERE professor_nome = ? AND status = "pending" ORDER BY created_at DESC',
    [userName],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar requisições' });
      }
      res.json(rows);
    }
  );
});

app.put('/api/requests/:id/accept', authenticateToken, (req, res) => {
  const id = req.params.id;

  db.run(
    'UPDATE syllabus_requests SET status = "accepted", assigned_to_user_id = ? WHERE id = ?',
    [req.user.id, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao aceitar requisição' });
      }
      res.json({ message: 'Requisição aceita com sucesso' });
    }
  );
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'client', 'build');

  // Middleware de cache-busting para assets do frontend
  app.use((req, res, next) => {
    if (/\.html$/i.test(req.url)) {
      res.set('Cache-Control', 'no-store');
    } else if (/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(req.url)) {
      res.set('Cache-Control', 'no-cache');
    }
    next();
  });

  // Desabilitar etag para evitar 304 com bundle antigo
  app.set('etag', false);
  app.use(express.static(buildPath, { etag: false }));
  
  // For any other requests, send back React's index.html file
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

