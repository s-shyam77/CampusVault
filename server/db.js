import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');
fs.mkdirSync(dataDir, { recursive: true });
export const db = new Database(path.join(dataDir, 'campusvault.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','teacher','admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Notes',
  semester TEXT NOT NULL DEFAULT 'Any',
  file_name TEXT,
  file_path TEXT,
  external_url TEXT,
  uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved INTEGER NOT NULL DEFAULT 1,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, resource_id)
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  subject TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const count = db.prepare('SELECT COUNT(*) AS n FROM resources').get().n;
if (count === 0) {
  const insert = db.prepare(`INSERT INTO resources (title,description,subject,category,semester,external_url,approved)
    VALUES (?,?,?,?,?,?,1)`);
  const seed = [
    ['DSA: Arrays & Complexity','Beginner-friendly notes on arrays, time complexity and common patterns.','Data Structures','Notes','Semester 3','https://www.geeksforgeeks.org/array-data-structure/'],
    ['Object-Oriented Programming Revision','Classes, objects, inheritance, polymorphism and encapsulation.','OOPS','Revision','Semester 3','https://docs.oracle.com/javase/tutorial/java/concepts/'],
    ['Digital Electronics: Number Systems','Binary, octal, decimal, hexadecimal and conversions.','Digital Electronics','Notes','Semester 3','https://www.geeksforgeeks.org/number-system-and-base-conversions/'],
    ['Software Engineering: Waterfall Model','A quick overview of phases, strengths and limitations.','Software Engineering','Revision','Semester 3','https://www.geeksforgeeks.org/software-engineering-waterfall-model/'],
    ['Probability: Random Variables','Introductory learning resource for random variables.','Advanced Mathematics','Reference','Semester 3','https://www.khanacademy.org/math/statistics-probability/random-variables-stats-library']
  ];
  const tx = db.transaction(rows => rows.forEach(r => insert.run(...r)));
  tx(seed);
}
