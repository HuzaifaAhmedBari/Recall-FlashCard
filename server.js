const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data.json');
const TMP_PATH = path.join(__dirname, 'data.json.tmp');
const PUBLIC_DIR = path.join(__dirname, 'public');

let db = { cards: [] };

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

async function loadDatabase() {
  try {
    const exists = await fs.access(DB_PATH).then(() => true).catch(() => false);
    if (!exists) {
      await saveDatabase({ cards: [] });
      return { cards: [] };
    }
    const content = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { cards: [] };
  }
}

async function saveDatabase(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(TMP_PATH, jsonString, 'utf8');
    await fs.rename(TMP_PATH, DB_PATH);
    db = data;
  } catch (error) {
    throw error;
  }
}

async function serveStaticFile(res, filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fs.readFile(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = req.url || '';
  const parsedUrl = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const idQuery = parsedUrl.searchParams.get('id');

  if (pathname === '/api/cards' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  if (pathname === '/api/cards' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      if (!body.question || !body.answer) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Question and answer are required' }));
        return;
      }
      const newCard = {
        id: crypto.randomUUID(),
        question: body.question,
        answer: body.answer
      };
      db.cards.push(newCard);
      await saveDatabase(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newCard));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
    return;
  }

  if (pathname === '/api/cards' && req.method === 'PUT') {
    try {
      if (!idQuery) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Card ID is required' }));
        return;
      }
      const body = await getRequestBody(req);
      const cardIndex = db.cards.findIndex(c => c.id === idQuery);
      if (cardIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Card not found' }));
        return;
      }
      if (body.question) db.cards[cardIndex].question = body.question;
      if (body.answer) db.cards[cardIndex].answer = body.answer;
      await saveDatabase(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.cards[cardIndex]));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request' }));
    }
    return;
  }

  if (pathname === '/api/cards' && req.method === 'DELETE') {
    if (!idQuery) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Card ID is required' }));
      return;
    }
    const cardIndex = db.cards.findIndex(c => c.id === idQuery);
    if (cardIndex === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Card not found' }));
      return;
    }
    const deletedCard = db.cards.splice(cardIndex, 1)[0];
    await saveDatabase(db);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(deletedCard));
    return;
  }

  let safePath = pathname;
  if (safePath === '/' || safePath === '/index.html') {
    safePath = '/index.html';
  }

  const targetPath = path.join(PUBLIC_DIR, safePath);
  if (!targetPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  await serveStaticFile(res, targetPath);
});

(async () => {
  db = await loadDatabase();
  server.listen(PORT, () => {});
})();
