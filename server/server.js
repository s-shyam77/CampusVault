import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { auth, roles } from './middleware.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_change_me';
const here = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(here, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|ppt|pptx)$/i.test(file.originalname);
    cb(allowed ? null : new Error('Only PDF, DOC, DOCX, PPT and PPTX files are allowed.'), allowed);
  }
});

const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const makeToken = u => jwt.sign(publicUser(u), JWT_SECRET, { expiresIn: '7d' });

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'CampusVault API', database: 'SQLite' }));

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const normalized = email.trim().toLowerCase();
  const role = process.env.ADMIN_EMAIL && normalized === process.env.ADMIN_EMAIL.toLowerCase() ? 'admin' : 'student';
  try {
    const result = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
      .run(name.trim(), normalized, bcrypt.hashSync(password, 12), role);
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json({ token: makeToken(user), user });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'An account with this email already exists.' });
    res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').get((email || '').trim());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) return res.status(401).json({ error: 'Invalid email or password.' });
  const safe = publicUser(user);
  res.json({ token: makeToken(safe), user: safe });
});

app.get('/api/auth/me', auth(), (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

app.get('/api/dashboard', auth(), (req, res) => {
  const resources = db.prepare('SELECT COUNT(*) n FROM resources WHERE approved=1').get().n;
  const questions = db.prepare('SELECT COUNT(*) n FROM questions').get().n;
  const bookmarks = db.prepare('SELECT COUNT(*) n FROM bookmarks WHERE user_id=?').get(req.user.id).n;
  const myUploads = db.prepare('SELECT COUNT(*) n FROM resources WHERE uploader_id=?').get(req.user.id).n;
  res.json({ stats: { resources, questions, bookmarks, myUploads } });
});

app.get('/api/resources', auth(false), (req, res) => {
  const q = (req.query.q || '').trim();
  const subject = (req.query.subject || '').trim();
  const category = (req.query.category || '').trim();
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit || '12', 10) || 12));
  const where = ['r.approved=1'];
  const params = [];
  if (q) { where.push('(r.title LIKE ? OR r.description LIKE ? OR r.subject LIKE ?)'); params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  if (subject) { where.push('r.subject=?'); params.push(subject); }
  if (category) { where.push('r.category=?'); params.push(category); }
  const clause = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) n FROM resources r WHERE ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT r.id,r.title,r.description,r.subject,r.category,r.semester,r.file_name,r.external_url,r.downloads,r.created_at,u.name uploader,
    CASE WHEN b.user_id IS NULL THEN 0 ELSE 1 END bookmarked
    FROM resources r LEFT JOIN users u ON u.id=r.uploader_id
    LEFT JOIN bookmarks b ON b.resource_id=r.id AND b.user_id=?
    WHERE ${clause} ORDER BY r.created_at DESC,r.id DESC LIMIT ? OFFSET ?`)
    .all(req.user?.id || -1, ...params, limit, (page - 1) * limit);
  res.json({ resources: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

app.post('/api/resources', auth(), upload.single('file'), (req, res) => {
  const { title, description = '', subject, category = 'Notes', semester = 'Any', external_url = '' } = req.body || {};
  if (!title?.trim() || !subject?.trim()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Title and subject are required.' });
  }
  if (!req.file && !/^https?:\/\//i.test(external_url)) return res.status(400).json({ error: 'Upload a file or provide a valid http(s) resource URL.' });
  const result = db.prepare(`INSERT INTO resources (title,description,subject,category,semester,file_name,file_path,external_url,uploader_id,approved)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(title.trim(), description.trim(), subject.trim(), category, semester, req.file?.originalname || null, req.file?.filename || null, external_url || null, req.user.id, req.user.role === 'admin' ? 1 : 0);
  res.status(201).json({ message: req.user.role === 'admin' ? 'Resource published.' : 'Resource submitted for admin review.', id: result.lastInsertRowid });
});

app.get('/api/resources/:id/download', auth(false), (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id=? AND approved=1').get(Number(req.params.id));
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });
  if (resource.file_path) {
    const fullPath = path.join(uploadsDir, path.basename(resource.file_path));
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File is missing from server storage.' });
    db.prepare('UPDATE resources SET downloads=downloads+1 WHERE id=?').run(resource.id);
    return res.download(fullPath, resource.file_name || path.basename(fullPath));
  }
  if (resource.external_url && /^https?:\/\//i.test(resource.external_url)) {
    db.prepare('UPDATE resources SET downloads=downloads+1 WHERE id=?').run(resource.id);
    return res.redirect(resource.external_url);
  }
  res.status(404).json({ error: 'No downloadable file or URL found.' });
});

app.post('/api/resources/:id/bookmark', auth(), (req, res) => {
  const id = Number(req.params.id);
  const exists = db.prepare('SELECT 1 FROM bookmarks WHERE user_id=? AND resource_id=?').get(req.user.id, id);
  if (exists) {
    db.prepare('DELETE FROM bookmarks WHERE user_id=? AND resource_id=?').run(req.user.id, id);
    return res.json({ bookmarked: false });
  }
  const resource = db.prepare('SELECT id FROM resources WHERE id=? AND approved=1').get(id);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });
  db.prepare('INSERT INTO bookmarks (user_id,resource_id) VALUES (?,?)').run(req.user.id, id);
  res.json({ bookmarked: true });
});

app.get('/api/bookmarks', auth(), (req, res) => {
  const resources = db.prepare(`SELECT r.id,r.title,r.description,r.subject,r.category,r.semester,r.file_name,r.external_url,r.downloads,r.created_at,u.name uploader,1 bookmarked
    FROM bookmarks b JOIN resources r ON r.id=b.resource_id LEFT JOIN users u ON u.id=r.uploader_id
    WHERE b.user_id=? AND r.approved=1 ORDER BY b.created_at DESC`).all(req.user.id);
  res.json({ resources });
});

app.get('/api/questions', auth(false), (req, res) => {
  const questions = db.prepare(`SELECT q.id,q.title,q.body,q.subject,q.created_at,u.name author,
    (SELECT COUNT(*) FROM answers a WHERE a.question_id=q.id) answer_count
    FROM questions q LEFT JOIN users u ON u.id=q.author_id ORDER BY q.created_at DESC LIMIT 100`).all();
  res.json({ questions });
});
app.post('/api/questions', auth(), (req, res) => {
  const { title, body, subject } = req.body || {};
  if (!title?.trim() || !body?.trim() || !subject?.trim()) return res.status(400).json({ error: 'Title, question details and subject are required.' });
  const r = db.prepare('INSERT INTO questions (title,body,subject,author_id) VALUES (?,?,?,?)').run(title.trim(), body.trim(), subject.trim(), req.user.id);
  res.status(201).json({ id: r.lastInsertRowid, message: 'Question posted.' });
});
app.get('/api/questions/:id/answers', (req, res) => {
  const answers = db.prepare(`SELECT a.id,a.body,a.accepted,a.created_at,u.name author FROM answers a LEFT JOIN users u ON u.id=a.author_id WHERE a.question_id=? ORDER BY a.accepted DESC,a.created_at ASC`).all(Number(req.params.id));
  res.json({ answers });
});
app.post('/api/questions/:id/answers', auth(), (req, res) => {
  const body = (req.body?.body || '').trim();
  const q = db.prepare('SELECT id FROM questions WHERE id=?').get(Number(req.params.id));
  if (!q) return res.status(404).json({ error: 'Question not found.' });
  if (!body) return res.status(400).json({ error: 'Answer cannot be empty.' });
  const r = db.prepare('INSERT INTO answers (question_id,body,author_id) VALUES (?,?,?)').run(q.id, body, req.user.id);
  res.status(201).json({ id: r.lastInsertRowid, message: 'Answer posted.' });
});

app.get('/api/admin/resources', auth(), roles('admin'), (_req, res) => {
  const resources = db.prepare(`SELECT r.*,u.name uploader FROM resources r LEFT JOIN users u ON u.id=r.uploader_id ORDER BY r.created_at DESC`).all();
  res.json({ resources });
});
app.patch('/api/admin/resources/:id', auth(), roles('admin'), (req, res) => {
  const approved = req.body?.approved ? 1 : 0;
  const result = db.prepare('UPDATE resources SET approved=? WHERE id=?').run(approved, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Resource not found.' });
  res.json({ message: approved ? 'Resource approved.' : 'Resource hidden.' });
});
app.delete('/api/admin/resources/:id', auth(), roles('admin'), (req, res) => {
  const resource = db.prepare('SELECT file_path FROM resources WHERE id=?').get(Number(req.params.id));
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });
  db.prepare('DELETE FROM resources WHERE id=?').run(Number(req.params.id));
  if (resource.file_path) {
    const fullPath = path.join(uploadsDir, path.basename(resource.file_path));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  res.json({ message: 'Resource deleted.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err instanceof multer.MulterError ? 400 : 500;
  res.status(status).json({ error: err.message || 'Unexpected server error.' });
});
app.listen(PORT, () => console.log(`CampusVault API running at http://localhost:${PORT} (SQLite)`));
