import Database from 'better-sqlite3';
import path from 'path';
import type { Task, ExtractedTask } from './types';

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(path.join(process.cwd(), 'taskflow.db'));
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL,
        priority    TEXT    NOT NULL CHECK(priority IN ('high','medium','low')),
        hours       REAL    NOT NULL,
        deadline    TEXT,
        requester   TEXT,
        status      TEXT    NOT NULL DEFAULT 'todo'
                    CHECK(status IN ('todo','in_progress','done')),
        raw_input   TEXT    NOT NULL DEFAULT '',
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TRIGGER IF NOT EXISTS tasks_updated_at
        AFTER UPDATE ON tasks
        BEGIN
          UPDATE tasks SET updated_at = datetime('now') WHERE id = OLD.id;
        END;
    `);
  }
  return _db;
}

export function getAllTasks(status?: string | null): Task[] {
  const db = getDb();
  if (status && status !== 'all') {
    return db.prepare(
      `SELECT * FROM tasks WHERE status = ?
       ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`
    ).all(status) as Task[];
  }
  return db.prepare(
    `SELECT * FROM tasks
     ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`
  ).all() as Task[];
}

export function getOpenTasks(): Task[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM tasks WHERE status != 'done'
     ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
              CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC, created_at DESC`
  ).all() as Task[];
}

export function insertTask(extracted: ExtractedTask, rawInput: string): Task {
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO tasks (title, priority, hours, deadline, requester, raw_input)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(extracted.title, extracted.priority, extracted.hours, extracted.deadline, extracted.requester, rawInput);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
}

export function updateTask(
  id: number,
  fields: Partial<Pick<Task, 'status' | 'priority' | 'hours'>>
): Task | null {
  const db = getDb();
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return null;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values: unknown[] = [...entries.map(([, v]) => v), id];
  (db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`) as any).run(...values);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | null;
}

export function deleteTask(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
