import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import crypto from 'crypto'; 

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

const USERS_FILE = path.join(process.cwd(), 'users.json');
const ARTICLES_FILE = path.join(process.cwd(), 'articles.json');

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Route d'accueil
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Tech-News');
});

// Intégration de Swagger
let swaggerDocument;
try {
  swaggerDocument = yaml.load(fs.readFileSync('./swagger.yml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Documentation Swagger chargée sur http://localhost:5000/api-docs/');
} catch (err) {
  console.error('Erreur lors du chargement du fichier swagger.yml:', err);
}

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configuration de Multer pour la gestion des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Ajoute un timestamp pour éviter les collisions
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware d'authentification pour vérifier le token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token invalide' });
    req.user = decoded;
    next();
  });
}

// Middleware pour vérifier le rôle admin
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Accès refusé, rôle admin requis' });
  }
}

// Fonctions utilitaires pour gérer les utilisateurs
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// === Endpoint d'inscription (Register) ===
app.post('/auth/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Veuillez fournir email, username et password.' });
  }
  const users = readUsers();
  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    const conflictField = existingUser.email === email ? 'email' : 'username';
    return res.status(400).json({ error: `Utilisateur existant avec ce ${conflictField}.` });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = {
      id: users.length + 1,
      email,
      username,
      password: hashedPassword,
      role: 'user'
    };
    users.push(newUser);
    writeUsers(users);
    // Générer et renvoyer le token JWT + temps expiration
    jwt.sign(
      { id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role },
      SECRET_KEY,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) return res.status(500).json({ error: 'Erreur lors de la génération du token' });
        res.status(201).json({ message: 'Utilisateur créé avec succès', token });
      }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l’utilisateur', error);
    res.status(500).json({ error: 'Erreur interne lors de la création de l’utilisateur' });
  }
});

// === Endpoint de connexion (Login) ===
app.post('/auth/login', async (req, res) => {
  const { email, username, password } = req.body;
  
  if (!email) {
    console.error('Erreur de connexion: Email requis');
    return res.status(400).json({ error: 'Email requis' });
  }
  
  // Vérifier le format de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`Erreur de connexion: Format d'email invalide (${email}).`);
    return res.status(400).json({ error: 'Email invalide' });
  }
  
  if (!password) {
    console.error('Erreur de connexion: Mot de passe requis');
    return res.status(400).json({ error: 'Mot de passe requis' });
  }

  const users = readUsers();
  let userByEmail, userByUsername;

  if (email) {
    userByEmail = users.find(u => u.email === email);
    if (!userByEmail) {
      console.error(`Erreur de connexion: Email incorrect (${email}).`);
      return res.status(401).json({ error: 'Email incorrect' });
    }
  }

  if (username) {
    userByUsername = users.find(u => u.username === username);
    if (!userByUsername) {
      console.error(`Erreur de connexion: Username incorrect (${username}).`);
      return res.status(401).json({ error: 'Username incorrect' });
    }
  }

  let user;
  if (email && username) {
    if (userByEmail.id !== userByUsername.id) {
      console.error(`Erreur de connexion: L'email (${email}) et le username (${username}) ne correspondent pas.`);
      return res.status(401).json({ error: "L'email et le username ne correspondent pas" });
    }
    user = userByEmail;
  } else {
    user = userByEmail || userByUsername;
  }

  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.error(`Erreur de connexion: Mot de passe incorrect pour l'utilisateur (${user.email}).`);
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    // Générer le token JWT
    jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) {
          console.error('Erreur lors de la génération du token', err);
          return res.status(500).json({ error: 'Erreur lors de la génération du token' });
        }
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Erreur lors de la comparaison des mots de passe', error);
    res.status(500).json({ error: 'Erreur lors de la comparaison des mots de passe' });
  }
});

// === Endpoint pour accéder au profil (authentification requise) ===
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// === Endpoints pour les articles ===
// Récupérer tous les articles
app.get('/articles', (req, res) => {
  fs.readFile(ARTICLES_FILE, (err, data) => {
    if (err) return res.status(500).json({ error: 'Erreur de lecture des articles' });
    const articles = JSON.parse(data);
    res.json(articles);
  });
});

// Récupérer un article par ID
app.get('/articles/:id', (req, res) => {
  const id = req.params.id;
  fs.readFile(ARTICLES_FILE, (err, data) => {
    if (err) return res.status(500).json({ error: 'Erreur de lecture des articles' });
    const articles = JSON.parse(data);
    const article = articles.find(a => a.id === id);
    if (article) {
      res.json(article);
    } else {
      res.status(404).json({ error: 'Article non trouvé' });
    }
  });
});

// === Endpoint de mise à jour du mot de passe (authentification requise) ===
app.patch('/auth/update-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;

  // Vérification de la validité du mot de passe
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' });
  }

  try {
    const users = readUsers();
    
    // Trouver l'utilisateur actuel (l'utilisateur authentifié via JWT)
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    writeUsers(users);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe', error);
    res.status(500).json({ error: 'Erreur interne lors de la mise à jour du mot de passe' });
  }
});

// Ajout d'un article (réservé aux administrateurs) avec upload d'image
app.post('/articles', authenticateToken, requireAdmin, upload.single('imageFile'), (req, res) => {
  fs.readFile(ARTICLES_FILE, (err, data) => {
    if (err) return res.status(500).json({ error: 'Erreur de lecture des articles' });
    const articles = JSON.parse(data);
    let imageUrl = req.body.image;
    if (req.file) {
      imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    }
    const newArticle = {
      id: crypto.randomBytes(4).toString('hex'), // Génère un ID aléatoire de 8 caractères
      title: req.body.title,
      image: imageUrl,
      content: req.body.content,
      category: req.body.category || "",
      createdAt: new Date().toISOString()
    };
    articles.push(newArticle);
    fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erreur lors de l\'écriture de l\'article' });
      res.status(201).json(newArticle);
    });
  });
});

// Supprimer un article (réservé aux administrateurs)
app.delete('/articles/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id; 
  fs.readFile(ARTICLES_FILE, (err, data) => {
    if (err) return res.status(500).json({ error: 'Erreur de lecture des articles' });
    let articles = JSON.parse(data);
    const index = articles.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: 'Article non trouvé' });
    const articleToDelete = articles[index];
    articles.splice(index, 1);
    fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
      if (articleToDelete.image) {
        const parts = articleToDelete.image.split('/uploads/');
        if (parts.length === 2) {
          const filename = parts[1];
          const filepath = path.join(process.cwd(), 'uploads', filename);
          fs.unlink(filepath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Erreur lors de la suppression de l\'image', unlinkErr);
            }
            res.json({ message: 'Article et image supprimés avec succès' });
          });
        } else {
          res.json({ message: 'Article supprimé (aucune image à supprimer)' });
        }
      } else {
        res.json({ message: 'Article supprimé avec succès' });
      }
    });
  });
});

// === Endpoint de mise à jour partielle d'un article (réservé aux administrateurs) ===
app.patch('/articles/:id', authenticateToken, requireAdmin, upload.single('imageFile'), (req, res) => {
  const id = req.params.id; 
  fs.readFile(ARTICLES_FILE, (err, data) => {
    if (err) return res.status(500).json({ error: 'Erreur de lecture des articles' });
    const articles = JSON.parse(data);
    const articleIndex = articles.findIndex(a => a.id === id);
    if (articleIndex === -1) return res.status(404).json({ error: 'Article non trouvé' });

    const article = articles[articleIndex];

    // Si une nouvelle image est fournie, supprimer l'ancienne image
    if (req.file) {
      if (article.image) {
        const parts = article.image.split('/uploads/');
        if (parts.length === 2) {
          const oldFilename = parts[1];
          const oldFilePath = path.join(process.cwd(), 'uploads', oldFilename);
          fs.unlink(oldFilePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Erreur lors de la suppression de l\'ancienne image:', unlinkErr);
            }
          });
        }
      }
      article.image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    }

    // Mise à jour partielle des autres champs si fournis
    if (req.body.title) article.title = req.body.title;
    if (req.body.content) article.content = req.body.content;
    if (req.body.category !== undefined) article.category = req.body.category;

    articles[articleIndex] = article;
    fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
      res.json(article);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
