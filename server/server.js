const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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

// LibreTranslate configuration
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || null;

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

      // Add custom_tab_name and custom_tab_content columns if they don't exist
      db.run(`ALTER TABLE syllabi ADD COLUMN custom_tab_name TEXT`, (err) => {
        // Ignore error if column already exists
      });

      db.run(`ALTER TABLE syllabi ADD COLUMN custom_tab_content TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add professores_data column (JSON com dados dos professores: foto, descrição, links)
      db.run(`ALTER TABLE syllabi ADD COLUMN professores_data TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add contatos column (rich text para aba de contatos)
      db.run(`ALTER TABLE syllabi ADD COLUMN contatos TEXT`, (err) => {
        // Ignore error if column already exists
      });
      db.run(`ALTER TABLE syllabi ADD COLUMN ods TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add o_que_e_esperado column (rich text para aba "O QUE É ESPERADO QUE O(A) ALUNO(A)")
      db.run(`ALTER TABLE syllabi ADD COLUMN o_que_e_esperado TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add custom_tab_position column (para definir onde a aba personalizada aparece)
      db.run(`ALTER TABLE syllabi ADD COLUMN custom_tab_position TEXT`, (err) => {
        // Ignore error if column already exists
      });

      // Add referencias_layout column (para definir layout das referências: lista ou categorizado)
      db.run(`ALTER TABLE syllabi ADD COLUMN referencias_layout TEXT`, (err) => {
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

// Store professores data in memory (keyed by departamento code)
let professoresData = {};

// Store competências data in memory (keyed by curso)
let competenciasData = {};

// Read CSV files and populate database
function loadCSVData() {
  try {
    let cursosData = [];
    let disciplinasData = [];
    let programsLoaded = false;
    let disciplinesLoaded = false;

    // Read Cursos CSV (com tratamento de erro)
    const cursoCsvPath = path.join(__dirname, '..', 'Curso.csv');
    if (fs.existsSync(cursoCsvPath)) {
      fs.createReadStream(cursoCsvPath, { encoding: 'utf8' })
        .on('error', (err) => {
          console.warn('Erro ao ler Curso.csv:', err.message);
        })
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
    } else {
      console.warn('Curso.csv não encontrado, pulando carregamento de programas');
    }

    // Read Disciplinas CSV (com tratamento de erro)
    const disciplinaCsvPath = path.join(__dirname, '..', 'Disciplina.csv');
    if (fs.existsSync(disciplinaCsvPath)) {
      fs.createReadStream(disciplinaCsvPath, { encoding: 'utf8' })
        .on('error', (err) => {
          console.warn('Erro ao ler Disciplina.csv:', err.message);
        })
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
    } else {
      console.warn('Disciplina.csv não encontrado, pulando carregamento de disciplinas');
    }

    // Read Professores from XLSX file (better encoding support)
    professoresData = {};
    try {
      const xlsxPath = path.join(__dirname, '..', 'Professores.xlsx');
      const workbook = XLSX.readFile(xlsxPath);
      const sheetName = workbook.SheetNames[0]; // Get first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON array
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      data.forEach((row) => {
        // Try different possible column names
        const dept = (row.DEPT || row.dept || row['DEPT'] || Object.values(row)[0] || '').toString().trim();
        const professor = (row.Professores || row.professores || row['Professores'] || Object.values(row)[1] || '').toString().trim();
        
        if (dept && professor && dept !== 'DEPT' && dept !== 'departamento') {
          if (!professoresData[dept]) {
            professoresData[dept] = [];
          }
          professoresData[dept].push(professor);
        }
      });
      
      // Remove duplicates and sort
      Object.keys(professoresData).forEach(dept => {
        professoresData[dept] = [...new Set(professoresData[dept])].sort();
      });
      
      console.log('Professores XLSX loaded successfully');
      console.log(`Loaded professores for ${Object.keys(professoresData).length} departments`);
    } catch (error) {
      console.error('Error loading Professores.xlsx, trying CSV fallback:', error.message);
      // Fallback to CSV if XLSX fails
      const csvPath = path.join(__dirname, '..', 'professores_eaesp.csv');
      if (fs.existsSync(csvPath)) {
        const fileBuffer = fs.readFileSync(csvPath);
        let csvContent = fileBuffer.toString('latin1');
        if (csvContent.includes('') && csvContent.match(/[áàâãéêíóôõúç]/gi) === null) {
          csvContent = fileBuffer.toString('utf8');
        }
        const lines = csvContent.split('\n');
        lines.forEach((line, index) => {
          if (index === 0) return;
          if (!line.trim()) return;
          const parts = line.split(';');
          if (parts.length >= 2) {
            const dept = parts[0].trim();
            const professor = parts[1].trim().replace(/\r$/, '');
            if (dept && professor && dept !== 'DEPT') {
              if (!professoresData[dept]) {
                professoresData[dept] = [];
              }
              professoresData[dept].push(professor);
            }
          }
        });
        Object.keys(professoresData).forEach(dept => {
          professoresData[dept] = [...new Set(professoresData[dept])].sort();
        });
      }
    }

    console.log('CSV data loaded successfully');
    
    // Load competências from XLSX
    loadCompetenciasData();
  } catch (error) {
    console.error('Error loading CSV data:', error);
  }
}

// Function to load competências from XLSX
function loadCompetenciasData() {
  try {
    const xlsxPath = path.join(__dirname, '..', 'Competências.xlsx');
    if (!fs.existsSync(xlsxPath)) {
      console.warn('Competências.xlsx not found');
      return;
    }

    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Group competências by curso
    competenciasData = {};
    data.forEach(row => {
      const curso = (row.Curso || '').trim();
      if (curso) {
        if (!competenciasData[curso]) {
          competenciasData[curso] = [];
        }
        competenciasData[curso].push({
          competencia: (row.Competência || '').trim(),
          descricao: (row.Descrição || '').trim()
        });
      }
    });

    console.log(`Loaded competências for ${Object.keys(competenciasData).length} cursos`);
  } catch (error) {
    console.error('Error loading competências:', error);
  }
}

// Function to map full course name to course code
function getCursoCode(cursoNome) {
  if (!cursoNome) return null;
  
  // Map common patterns: "CGA - Curso de Graduação em Administração" -> "CGA"
  const match = cursoNome.match(/^([A-Z]+(?:\s+[A-Z]+)?)/);
  if (match) {
    return match[1].replace(/\s+/g, '');
  }
  
  // Direct match if already a code
  if (Object.keys(competenciasData).includes(cursoNome)) {
    return cursoNome;
  }
  
  // Try to find by partial match
  const cursoUpper = cursoNome.toUpperCase();
  for (const code of Object.keys(competenciasData)) {
    if (cursoUpper.includes(code) || code.includes(cursoUpper)) {
      return code;
    }
  }
  
  return null;
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

// Professores route
app.get('/api/professores', (req, res) => {
  const { departamento } = req.query;
  
  // Set charset UTF-8 in response header
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (!departamento) {
    // If no department specified, return all professors grouped by department
    return res.json(professoresData);
  }
  
  // Extract department code from format "ADM - Administração..." or just "ADM"
  let deptCode = '';
  if (departamento.includes(' - ')) {
    deptCode = departamento.split(' - ')[0].trim();
  } else {
    deptCode = departamento.trim();
  }
  
  // Get professors for this department
  const professores = professoresData[deptCode] || [];
  
  // Return as array of objects with nome field (to match disciplines API format)
  const result = professores.map(nome => ({ nome }));
  res.json(result);
});

// Competências endpoint
app.get('/api/competencias', (req, res) => {
  const { curso } = req.query;
  
  if (!curso) {
    return res.status(400).json({ error: 'Curso é obrigatório' });
  }

  // Map curso name to code
  const cursoCode = getCursoCode(curso);
  
  if (!cursoCode || !competenciasData[cursoCode]) {
    return res.json([]);
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(competenciasData[cursoCode]);
});

// Google Scholar endpoint (via backend para usar API key do servidor)
app.get('/api/search-scholar', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query é obrigatória' });
  }

  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    return res.status(400).json({ 
      error: 'API key do SerpApi não configurada',
      message: 'Configure SERPAPI_KEY nas variáveis de ambiente do servidor'
    });
  }

  try {
    const response = await axios.get(
      `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(q)}&api_key=${serpApiKey}&num=10`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const items = (response.data.organic_results || []).map(item => ({
      type: 'scholar',
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: 'Google Scholar',
      publication_info: item.publication_info,
      authors: item.publication_info?.authors || []
    }));
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar no Google Scholar:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar no Google Scholar',
      message: error.response?.data?.error || error.message
    });
  }
});

// Dataverse endpoint (Harvard Dataverse Search API)
app.get('/api/search-arxiv', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query é obrigatória' });
  }

  try {
    // arXiv API usa formato Atom XML - fazer via backend para evitar CORS
    const response = await axios.get(
      `http://export.arxiv.org/api/query`,
      {
        params: {
          search_query: `all:${encodeURIComponent(q)}`,
          start: 0,
          max_results: 10
        },
        headers: {
          'Accept': 'application/atom+xml'
        },
        responseType: 'text'
      }
    );

    // Parsear XML usando xml2js ou simples parsing manual
    const items = [];
    const xmlText = response.data;
    
    // Parsear XML manualmente (simples e eficiente)
    const entryMatches = xmlText.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g);
    
    if (entryMatches) {
      entryMatches.forEach(entryXml => {
        const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Sem título';
        
        const authorMatches = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
        const authors = authorMatches 
          ? authorMatches.map(a => {
              const nameMatch = a.match(/<name>([\s\S]*?)<\/name>/);
              return nameMatch ? nameMatch[1].trim() : '';
            }).filter(n => n).join(', ')
          : 'Autor não especificado';
        
        const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
        const published = publishedMatch ? publishedMatch[1] : '';
        const year = published ? published.split('-')[0] : '';
        
        const idMatch = entryXml.match(/<id>([^<]+)<\/id>/);
        const arxivId = idMatch ? idMatch[1].split('/').pop() : '';
        
        if (title && title !== 'Sem título' && authors && authors !== 'Autor não especificado') {
          items.push({
            type: 'arxiv',
            title: title,
            authors: authors,
            year: year,
            published: published,
            arxivId: arxivId,
            source: 'arXiv'
          });
        }
      });
    }

    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar na API do arXiv:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar no arXiv',
      message: error.message 
    });
  }
});

app.get('/api/search-dataverse', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query é obrigatória' });
  }

  // URL do Dataverse - pode ser configurada via env ou usar o padrão do Harvard
  const dataverseUrl = process.env.DATAVERSE_URL || 'https://dataverse.harvard.edu';
  const dataverseApiKey = process.env.DATAVERSE_API_KEY; // Opcional - algumas buscas públicas funcionam sem

  try {
    // Construir URL da Search API - incluir metadados de citação para ter acesso aos autores
    const searchUrl = `${dataverseUrl}/api/search?q=${encodeURIComponent(q)}&type=dataset&per_page=10`;
    
    const headers = {
      'Accept': 'application/json'
    };

    // Adicionar API key se disponível (opcional para buscas públicas)
    if (dataverseApiKey) {
      headers['X-Dataverse-key'] = dataverseApiKey;
    }

    const response = await axios.get(searchUrl, { headers });

    // Transformar resposta do Dataverse para formato padronizado
    const items = [];
    if (response.data.data && response.data.data.items) {
      // Processar cada item encontrado
      for (const item of response.data.data.items) {
        const dataset = item;
        let metadata = dataset.metadataBlocks?.citation?.fields || [];
        
        // Se não tiver metadados completos na busca, tentar buscar o dataset individual
        // para obter os metadados completos (incluindo autores)
        if (!metadata.length && (dataset.globalId || dataset.persistentId)) {
          try {
            const persistentId = encodeURIComponent(dataset.globalId || dataset.persistentId);
            // Usar a Native API correta para buscar o dataset
            const datasetUrl = `${dataverseUrl}/api/datasets/:persistentId?persistentId=${persistentId}`;
            const datasetHeaders = { 'Accept': 'application/json' };
            if (dataverseApiKey) {
              datasetHeaders['X-Dataverse-key'] = dataverseApiKey;
            }
            
            const datasetResponse = await axios.get(datasetUrl, { headers: datasetHeaders });
            if (datasetResponse.data?.data?.metadataBlocks?.citation?.fields) {
              metadata = datasetResponse.data.data.metadataBlocks.citation.fields;
            }
          } catch (err) {
            // Se falhar, continuar com os dados da busca
            console.log('Não foi possível obter metadados completos do dataset:', err.message);
          }
        }
        
        // Tentar também extrair de outras estruturas possíveis
        if (!metadata.length && dataset.citation) {
          // Se houver uma citation pronta, tentar extrair dela
          const citation = dataset.citation;
          if (citation.author && citation.author.length > 0) {
            metadata = [{ typeName: 'author', value: citation.author }];
          }
        }
        
        // Extrair informações relevantes dos metadados
        const getFieldValue = (fieldName) => {
          const field = metadata.find(f => f.typeName === fieldName || f.type === fieldName);
          if (field) {
            if (field.value) {
              return Array.isArray(field.value) ? field.value : field.value;
            }
            return field.value;
          }
          return null;
        };

        const title = getFieldValue('title') || dataset.name || 'Sem título';
        
        // Extrair autores - pode ser um array de objetos compostos
        let authorsStr = 'Autor não especificado';
        const authorField = metadata.find(f => f.typeName === 'author');
        
        if (authorField && authorField.value) {
          const authors = Array.isArray(authorField.value) ? authorField.value : [authorField.value];
          const authorNames = authors
            .map(authorObj => {
              // authorObj pode ser um objeto com authorName dentro
              if (typeof authorObj === 'object' && authorObj !== null) {
                // Pode ter authorName como objeto com .value ou como string direta
                if (authorObj.authorName) {
                  if (typeof authorObj.authorName === 'object' && authorObj.authorName !== null) {
                    return authorObj.authorName.value || authorObj.authorName.name || null;
                  }
                  return authorObj.authorName;
                }
                // Ou pode ter o nome diretamente em algum campo
                return authorObj.value || authorObj.name || authorObj.author || null;
              }
              // Se for string direta
              if (typeof authorObj === 'string') {
                return authorObj;
              }
              return null;
            })
            .filter(name => name && name.trim() !== '' && name !== 'Autor desconhecido');
          
          if (authorNames.length > 0) {
            authorsStr = authorNames.join(', ');
          }
        }
        
        // Fallback: tentar buscar em outras estruturas do dataset
        if (authorsStr === 'Autor não especificado') {
          // Tentar em dataset.citation
          if (dataset.citation) {
            const citationAuthors = dataset.citation.author || dataset.citation.authors;
            if (citationAuthors) {
              const names = Array.isArray(citationAuthors) 
                ? citationAuthors.map(a => typeof a === 'string' ? a : (a.name || a.authorName || a)).filter(Boolean)
                : [typeof citationAuthors === 'string' ? citationAuthors : (citationAuthors.name || citationAuthors.authorName || citationAuthors)];
              if (names.length > 0) {
                authorsStr = names.join(', ');
              }
            }
          }
          
          // Tentar em dataset.author ou dataset.authors diretamente
          if (authorsStr === 'Autor não especificado' && (dataset.author || dataset.authors)) {
            const directAuthors = dataset.authors || (dataset.author ? [dataset.author] : []);
            const names = directAuthors
              .map(a => typeof a === 'string' ? a : (a.name || a.authorName || a.value || a))
              .filter(Boolean);
            if (names.length > 0) {
              authorsStr = names.join(', ');
            }
          }
        }
        
        // Extrair data de publicação - tentar diferentes campos
        let publicationDate = null;
        
        // Tentar vários campos de data nos metadados
        const dateFields = ['datePublished', 'distributionDate', 'dateOfDeposit', 'publicationDate', 'date', 'year'];
        for (const fieldName of dateFields) {
          const dateValue = getFieldValue(fieldName);
          if (dateValue) {
            publicationDate = dateValue;
            break;
          }
        }
        
        // Se não encontrou nos metadados, tentar diretamente no dataset
        if (!publicationDate) {
          publicationDate = dataset.publicationDate || 
                           dataset.dateOfDeposit || 
                           dataset.distributionDate ||
                           dataset.date ||
                           dataset.year;
        }
        
        // Se ainda não encontrou, tentar extrair de outras estruturas
        if (!publicationDate && dataset.citation) {
          // Tentar extrair da citation pronta
          const citation = dataset.citation;
          publicationDate = citation.datePublished || 
                           citation.dateOfDeposit || 
                           citation.year ||
                           citation.date;
        }
        
        // Tentar extrair do campo "date" que pode estar em diferentes formatos
        if (!publicationDate) {
          const dateField = metadata.find(f => f.typeName === 'date' || f.typeName === 'year');
          if (dateField && dateField.value) {
            publicationDate = dateField.value;
          }
        }
        
        // Tentar extrair ano diretamente da citation string se disponível
        if (!publicationDate && dataset.citation) {
          // A citation pode vir como string completa do tipo "Autor, Ano, Título..."
          const citationStr = typeof dataset.citation === 'string' ? dataset.citation : 
                             (dataset.citation.citation || dataset.citation.text || '');
          if (citationStr) {
            // Procurar por padrão de data na citation (ex: ", 2022," ou ", 2022 ")
            const yearMatch = citationStr.match(/,\s*(\d{4})\s*,/);
            if (yearMatch) {
              publicationDate = yearMatch[1];
            }
          }
        }
        
        // Se ainda não encontrou, tentar buscar no dataset completo via Native API
        if (!publicationDate && (dataset.globalId || dataset.persistentId)) {
          try {
            const persistentId = encodeURIComponent(dataset.globalId || dataset.persistentId);
            const datasetUrl = `${dataverseUrl}/api/datasets/:persistentId?persistentId=${persistentId}`;
            const datasetHeaders = { 'Accept': 'application/json' };
            if (dataverseApiKey) {
              datasetHeaders['X-Dataverse-key'] = dataverseApiKey;
            }
            
            const datasetResponse = await axios.get(datasetUrl, { headers: datasetHeaders });
            const fullDataset = datasetResponse.data?.data;
            
            if (fullDataset) {
              // Tentar extrair data dos metadados completos
              const fullMetadata = fullDataset.metadataBlocks?.citation?.fields || [];
              const dateFieldsFull = ['datePublished', 'distributionDate', 'dateOfDeposit', 'publicationDate', 'date', 'year'];
              for (const fieldName of dateFieldsFull) {
                const dateField = fullMetadata.find(f => f.typeName === fieldName);
                if (dateField && dateField.value) {
                  publicationDate = dateField.value;
                  break;
                }
              }
              
              // Se ainda não encontrou, tentar diretamente no dataset completo
              if (!publicationDate) {
                publicationDate = fullDataset.publicationDate || 
                                 fullDataset.dateOfDeposit || 
                                 fullDataset.distributionDate;
              }
              
              // Tentar extrair da citation completa se disponível
              if (!publicationDate && fullDataset.citation) {
                const citationStr = typeof fullDataset.citation === 'string' ? fullDataset.citation : 
                                   (fullDataset.citation.citation || fullDataset.citation.text || '');
                if (citationStr) {
                  const yearMatch = citationStr.match(/,\s*(\d{4})\s*,/);
                  if (yearMatch) {
                    publicationDate = yearMatch[1];
                  }
                }
              }
            }
          } catch (err) {
            // Se falhar, continuar sem data
            console.log('Não foi possível obter data do dataset:', err.message);
          }
        }
        
        const publisher = getFieldValue('publisher') || 
                         getFieldValue('publisherName') || 
                         'Dataverse';
        
        const description = getFieldValue('dsDescription') || '';
        const descriptionStr = Array.isArray(description) 
          ? (description[0]?.dsDescriptionValue?.value || description[0]?.value || '')
          : (description?.dsDescriptionValue?.value || description?.value || description || '');

        items.push({
          type: 'dataverse',
          title: title,
          authors: authorsStr,
          publicationDate: publicationDate,
          publisher: publisher,
          description: descriptionStr,
          source: 'Dataverse',
          persistentId: dataset.persistentId || dataset.globalId,
          doi: dataset.persistentId || '',
          url: dataset.persistentUrl || `${dataverseUrl}/dataset.xhtml?persistentId=${dataset.persistentId || dataset.globalId}`
        });
      }
    }
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar no Dataverse:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar no Dataverse',
      message: error.response?.data?.message || error.message || 'Erro ao buscar datasets no Dataverse'
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

// Endpoint para tradução usando LibreTranslate
app.post('/api/translate', authenticateToken, async (req, res) => {
  const { text, source, target } = req.body;

  if (!text || !source || !target) {
    return res.status(400).json({ error: 'Texto, idioma origem e idioma destino são obrigatórios' });
  }

  if (source === target) {
    return res.json({ translatedText: text });
  }

  try {
    // Mapear nomes de idiomas para códigos ISO
    const languageMap = {
      'Português': 'pt',
      'English': 'en',
      'Español': 'es',
      'Français': 'fr',
      'Deutsch': 'de',
      'Italiano': 'it',
      'pt': 'pt',
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it'
    };

    const sourceCode = languageMap[source] || source.toLowerCase().substring(0, 2);
    const targetCode = languageMap[target] || target.toLowerCase().substring(0, 2);

    const translateData = {
      q: text,
      source: sourceCode,
      target: targetCode
    };

    if (LIBRETRANSLATE_API_KEY) {
      translateData.api_key = LIBRETRANSLATE_API_KEY;
    }

    // Converter dados para formato URL-encoded
    const formData = new URLSearchParams();
    formData.append('q', translateData.q);
    formData.append('source', translateData.source);
    formData.append('target', translateData.target);
    if (translateData.api_key) {
      formData.append('api_key', translateData.api_key);
    }

    const response = await axios.post(`${LIBRETRANSLATE_URL}/translate`, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && response.data.translatedText) {
      res.json({ translatedText: response.data.translatedText });
    } else {
      res.status(500).json({ error: 'Resposta inválida da API de tradução' });
    }
  } catch (error) {
    console.error('Erro ao traduzir:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao traduzir texto',
      details: error.response?.data?.error || error.message
    });
  }
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
    aula_aula, compromisso_etico, sobre_professor, referencias, referencias_layout, competencias,
    custom_tab_name, custom_tab_content, custom_tab_position, professores_data, contatos, ods, o_que_e_esperado
  } = req.body;

  db.run(
    `INSERT INTO syllabi 
     (usuario_id, curso, disciplina, linha, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao, aula_aula, compromisso_etico, sobre_professor, referencias, referencias_layout, competencias, custom_tab_name, custom_tab_content, custom_tab_position, professores_data, contatos, ods, o_que_e_esperado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id, curso, disciplina, linha, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao, aula_aula, compromisso_etico, sobre_professor, referencias, referencias_layout, competencias, custom_tab_name, custom_tab_content, custom_tab_position, professores_data, contatos, ods, o_que_e_esperado
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
    aula_aula, compromisso_etico, sobre_professor, referencias, referencias_layout, competencias,
    custom_tab_name, custom_tab_content, custom_tab_position, professores_data, contatos, ods, o_que_e_esperado
  } = req.body;

  db.run(
    `UPDATE syllabi 
     SET curso=?, disciplina=?, linha=?, semestre_ano=?, turma=?, departamento=?,
         num_creditos=?, sem_curricular=?, idioma=?, coordenador=?, professores=?, programa=?, sobre_disciplina=?, conteudo=?, metodologia=?, criterio_avaliacao=?, aula_aula=?, compromisso_etico=?, sobre_professor=?, referencias=?, referencias_layout=?, competencias=?, custom_tab_name=?, custom_tab_content=?, custom_tab_position=?, professores_data=?, contatos=?, ods=?, o_que_e_esperado=?
     WHERE id=? AND usuario_id=?`,
    [
      curso, disciplina, linha, semestre_ano, turma, departamento,
      num_creditos, sem_curricular, idioma, coordenador, professores, programa, sobre_disciplina, conteudo, metodologia, criterio_avaliacao, aula_aula, compromisso_etico, sobre_professor, referencias, referencias_layout, competencias, custom_tab_name, custom_tab_content, custom_tab_position, professores_data, contatos, ods, o_que_e_esperado,
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
// Verificar se estamos em produção OU se o build existe (para Railway)
const buildPath = path.join(__dirname, '..', 'client', 'build');
const buildExists = fs.existsSync(buildPath);
const isProduction = process.env.NODE_ENV === 'production' || buildExists;

console.log('=== FRONTEND CONFIGURATION ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('Build path:', buildPath);
console.log('Build exists:', buildExists);
console.log('Will serve frontend:', isProduction);
console.log('=== END FRONTEND CONFIGURATION ===');

if (isProduction && buildExists) {
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
  // Esta rota deve ser a ÚLTIMA, depois de todas as rotas de API
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found');
    }
  });
} else {
  console.warn('⚠️  Frontend build not found. API endpoints will work, but frontend will not be served.');
  console.warn('⚠️  Build path:', buildPath);
}

// Endpoint para gerar PDF usando wkhtmltopdf
app.post('/api/generate-pdf', authenticateToken, async (req, res) => {
  const { html, filename } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML é obrigatório' });
  }

  try {
    // Criar diretório temporário se não existir
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Criar arquivo HTML temporário
    const htmlPath = path.join(tempDir, `temp-${Date.now()}.html`);
    const pdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);

    // Escrever HTML no arquivo
    fs.writeFileSync(htmlPath, html, 'utf8');

    // Opções do wkhtmltopdf
    // --page-size A4: formato A4
    // --margin-top/bottom/left/right: margens em mm
    // --encoding UTF-8: encoding UTF-8
    // --no-outline: não gerar outline
    // --enable-local-file-access: permitir acesso a arquivos locais (para imagens)
    // --disable-smart-shrinking: desabilitar smart shrinking para melhor controle
    const wkhtmltopdfOptions = [
      '--page-size A4',
      '--orientation Portrait',
      '--margin-top 40mm',
      '--margin-bottom 40mm',
      '--margin-left 25mm',
      '--margin-right 25mm',
      '--encoding UTF-8',
      '--no-outline',
      '--enable-local-file-access',
      '--disable-smart-shrinking',
      '--print-media-type',
      '--quiet'
    ].join(' ');

    // Executar wkhtmltopdf (tentar diferentes caminhos possíveis)
    // O wkhtmltopdf geralmente está em /usr/local/bin/wkhtmltopdf após instalação
    const wkhtmltopdfPaths = ['wkhtmltopdf', '/usr/local/bin/wkhtmltopdf', '/usr/bin/wkhtmltopdf'];
    let wkhtmltopdfPath = null;
    
    // Verificar qual caminho funciona (usar fs.existsSync que é síncrono e mais confiável)
    for (const testPath of wkhtmltopdfPaths) {
      if (testPath === 'wkhtmltopdf') {
        // Para 'wkhtmltopdf', tentar usar which
        try {
          await execAsync(`which wkhtmltopdf`);
          wkhtmltopdfPath = testPath;
          break;
        } catch (e) {
          continue;
        }
      } else {
        // Para caminhos absolutos, verificar se o arquivo existe
        if (fs.existsSync(testPath)) {
          wkhtmltopdfPath = testPath;
          break;
        }
      }
    }
    
    if (!wkhtmltopdfPath) {
      // Se não encontrar, tentar usar 'wkhtmltopdf' mesmo assim
      wkhtmltopdfPath = 'wkhtmltopdf';
    }
    
    const command = `${wkhtmltopdfPath} ${wkhtmltopdfOptions} "${htmlPath}" "${pdfPath}"`;
    
    console.log('Executando wkhtmltopdf...', command);
    
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 }); // 30 segundos timeout

      if (stderr && !stderr.includes('Warning') && !stderr.includes('QFont')) {
        console.warn('Aviso do wkhtmltopdf:', stderr);
      }
    } catch (execError) {
      console.error('Erro ao executar wkhtmltopdf:', execError);
      // Se o erro for que o comando não foi encontrado, dar mensagem mais clara
      if (execError.code === 127 || execError.message.includes('not found')) {
        throw new Error('wkhtmltopdf não está instalado ou não está no PATH. Verifique a instalação no servidor.');
      }
      throw execError;
    }

    // Verificar se o PDF foi criado
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF não foi gerado. Verifique os logs do wkhtmltopdf para mais detalhes.');
    }

    // Ler o PDF
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Limpar arquivos temporários
    try {
      fs.unlinkSync(htmlPath);
      fs.unlinkSync(pdfPath);
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivos temporários:', cleanupError);
    }

    // Enviar PDF como resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'syllabus.pdf'}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF',
      message: error.message,
      details: error.stderr || error.stdout
    });
  }
});

// Iniciar servidor (independente do carregamento de CSV)
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ wkhtmltopdf endpoint ready at POST /api/generate-pdf`);
  console.log(`✓ Server ready to accept connections`);
});

// Carregar dados CSV em background (não bloqueia)
setTimeout(() => {
  try {
    loadCSVData();
  } catch (error) {
    console.error('Erro ao carregar dados CSV (não crítico):', error);
  }
}, 1000);

