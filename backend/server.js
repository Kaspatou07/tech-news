import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import crypto from "crypto";

const app = express();

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const BASE_URL = process.env.BASE_URL;

const USERS_FILE = path.join(process.cwd(), "users.json");
const ARTICLES_FILE = path.join(process.cwd(), "articles.json");

/* =========================
   MIDDLEWARES
========================= */

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://kaspatou07.github.io",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

/* =========================
   ROUTE ROOT
========================= */

app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API Tech-News");
});

/* =========================
   SWAGGER
========================= */

try {
  const swaggerDocument = yaml.load(
    fs.readFileSync("./swagger.yml", "utf8")
  );
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.error("Erreur Swagger:", error);
}

/* =========================
   STATIC FILES
========================= */

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(
  "/quill-uploads",
  express.static(path.join(process.cwd(), "quill-uploads"))
);

/* =========================
   MULTER
========================= */

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

const quillUpload = multer({
  storage: multer.diskStorage({
    destination: "quill-uploads/",
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

/* =========================
   AUTH MIDDLEWARES
========================= */

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token invalide" });
    }
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Accès admin requis" });
}

/* =========================
   USERS UTILS
========================= */

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* =========================
   AUTH ROUTES
========================= */

app.post("/auth/register", async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const users = readUsers();
  if (users.find(u => u.email === email || u.username === username)) {
    return res.status(400).json({ error: "Utilisateur existant" });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = {
    id: crypto.randomUUID(),
    email,
    username,
    password: hashedPassword,
    role: "user",
  };

  users.push(newUser);
  writeUsers(users);

  const token = jwt.sign(
    { id: newUser.id, email, username, role: "user" },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.status(201).json({ token });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: "Email incorrect" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

app.get("/profile", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

/* =========================
   ARTICLES
========================= */

app.get("/articles", (req, res) => {
  try {
    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
    res.json(articles);
  } catch {
    res.status(500).json({ error: "Erreur lecture articles" });
  }
});

app.get("/articles/:id", (req, res) => {
  try {
    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
    const article = articles.find(a => a.id === req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    res.json(article);
  } catch {
    res.status(500).json({ error: "Erreur lecture articles" });
  }
});

app.post(
  "/articles",
  authenticateToken,
  requireAdmin,
  upload.single("imageFile"),
  (req, res) => {
    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));

    const imageUrl = req.file
      ? `${BASE_URL}/uploads/${req.file.filename}`
      : req.body.image || "";

    const newArticle = {
      id: crypto.randomUUID(),
      title: req.body.title,
      image: imageUrl,
      content: req.body.content,
      category: req.body.category || "",
      createdAt: new Date().toISOString(),
    };

    articles.push(newArticle);
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));

    res.status(201).json(newArticle);
  }
);

app.patch(
  "/articles/:id",
  authenticateToken,
  requireAdmin,
  upload.single("imageFile"),
  (req, res) => {
    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
    const index = articles.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    const article = articles[index];

    if (req.file) {
      article.image = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    article.title = req.body.title ?? article.title;
    article.content = req.body.content ?? article.content;
    article.category = req.body.category ?? article.category;
    article.updatedAt = new Date().toISOString();

    articles[index] = article;
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));

    res.json(article);
  }
);

app.delete(
  "/articles/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
    const index = articles.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    articles.splice(index, 1);
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));

    res.json({ message: "Article supprimé" });
  }
);

/* =========================
   QUILL UPLOAD
========================= */

app.post(
  "/quill-upload",
  authenticateToken,
  quillUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Fichier manquant" });
    }

    res.status(201).json({
      location: `${BASE_URL}/quill-uploads/${req.file.filename}`,
    });
  }
);

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`API Tech-News en écoute sur le port ${PORT}`);
});
