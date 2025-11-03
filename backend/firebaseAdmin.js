const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function resolveFirebaseCredentials() {
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  const credentialsFile = process.env.FIREBASE_CREDENTIALS_FILE; // caminho para JSON

  try {
    // 1) Preferir arquivo JSON, se fornecido
    if (credentialsFile) {
      const fullPath = path.isAbsolute(credentialsFile)
        ? credentialsFile
        : path.join(__dirname, credentialsFile);
      if (fs.existsSync(fullPath)) {
        const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        projectId = json.project_id || projectId;
        clientEmail = json.client_email || clientEmail;
        privateKey = json.private_key || privateKey;
      }
    }

    // 2) Se vier em Base64, decodifica (sobrescreve a anterior)
    if (privateKeyBase64) {
      privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
    }

    if (privateKey) {
      // Normaliza formatos: literal \n -> real \n, remove CR, remove aspas extras
      privateKey = privateKey
        .replace(/\r\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/^"|"$/g, '')
        .trim();
    }

    return { projectId, clientEmail, privateKey };
  } catch (e) {
    console.error('Erro ao resolver credenciais Firebase:', e);
    return { projectId, clientEmail, privateKey };
  }
}

const { projectId, clientEmail, privateKey } = resolveFirebaseCredentials();

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY (ou *_BASE64 ou CREDENTIALS_FILE) no .env');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

async function verifyIdToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (!admin.apps.length) {
      return res.status(500).json({ error: 'Firebase Admin não configurado' });
    }
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (err) {
    console.error('Erro ao verificar token Firebase:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { admin, db, verifyIdToken };


