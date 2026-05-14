import postgres from 'postgres';
import type { Task, ExtractedTask } from './types';

const sql = postgres(process.env.DATABASE_URL!);

// Run once per process lifetime
let migrated: Promise<void> | null = null;

function ensureMigrated(): Promise<void> {
  if (!migrated) migrated = migrate();
  return migrated;
}

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      priority    TEXT NOT NULL CHECK(priority IN ('high','medium','low')),
      hours       REAL NOT NULL,
      deadline    TEXT,
      requester   TEXT,
      status      TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
      raw_input   TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `;

  await sql`
    DROP TRIGGER IF EXISTS tasks_updated_at ON tasks
  `;

  await sql`
    CREATE TRIGGER tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `;
}

interface RawTask {
  id: number;
  user_id: string;
  title: string;
  priority: string;
  hours: number;
  deadline: string | null;
  requester: string | null;
  status: string;
  raw_input: string;
  created_at: Date | string;
  updated_at: Date | string;
}

function toTask(row: RawTask): Task {
  return {
    ...row,
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

const ORDER_BY = sql`
  ORDER BY
    CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
    created_at DESC
`;

export async function getAllTasks(userId: string, status?: string | null): Promise<Task[]> {
  await ensureMigrated();
  const rows = status && status !== 'all'
    ? await sql<RawTask[]>`SELECT * FROM tasks WHERE user_id = ${userId} AND status = ${status} ${ORDER_BY}`
    : await sql<RawTask[]>`SELECT * FROM tasks WHERE user_id = ${userId} ${ORDER_BY}`;
  return rows.map(toTask);
}

export async function getOpenTasks(userId: string): Promise<Task[]> {
  await ensureMigrated();
  const rows = await sql<RawTask[]>`
    SELECT * FROM tasks
    WHERE user_id = ${userId} AND status != 'done'
    ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
      deadline ASC,
      created_at DESC
  `;
  return rows.map(toTask);
}

export async function getInProgressTasks(userId: string): Promise<Task[]> {
  await ensureMigrated();
  const rows = await sql<RawTask[]>`
    SELECT * FROM tasks WHERE user_id = ${userId} AND status = 'in_progress'
    ORDER BY created_at DESC
  `;
  return rows.map(toTask);
}

export async function getRecentlyDoneTasks(userId: string): Promise<Task[]> {
  await ensureMigrated();
  const rows = await sql<RawTask[]>`
    SELECT * FROM tasks
    WHERE user_id = ${userId}
      AND status = 'done'
      AND updated_at >= NOW() - INTERVAL '24 hours'
    ORDER BY updated_at DESC
  `;
  return rows.map(toTask);
}

export async function insertTask(userId: string, extracted: ExtractedTask, rawInput: string): Promise<Task> {
  await ensureMigrated();
  const rows = await sql<RawTask[]>`
    INSERT INTO tasks (user_id, title, priority, hours, deadline, requester, raw_input)
    VALUES (${userId}, ${extracted.title}, ${extracted.priority}, ${extracted.hours},
            ${extracted.deadline ?? null}, ${extracted.requester ?? null}, ${rawInput})
    RETURNING *
  `;
  return toTask(rows[0]);
}

export async function updateTask(
  id: number,
  userId: string,
  fields: Partial<Pick<Task, 'status' | 'priority' | 'hours'>>
): Promise<Task | null> {
  await ensureMigrated();
  const rows = await sql<RawTask[]>`
    UPDATE tasks SET
      status   = COALESCE(${fields.status   ?? null}, status),
      priority = COALESCE(${fields.priority ?? null}, priority),
      hours    = COALESCE(${fields.hours    ?? null}::real, hours)
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  return rows[0] ? toTask(rows[0]) : null;
}

export async function deleteTask(id: number, userId: string): Promise<boolean> {
  await ensureMigrated();
  const result = await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${userId}`;
  return result.count > 0;
}
