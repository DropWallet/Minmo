import * as SQLite from 'expo-sqlite';

export async function initializeDatabase() {
  const db = await SQLite.openDatabaseAsync('minmo.db');

  // Create entries table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      recorded_at INTEGER NOT NULL,
      prompt TEXT,
      duration_seconds REAL,
      audio_local_uri TEXT NOT NULL,
      audio_remote_uri TEXT,
      photo_local_uri TEXT,
      photo_remote_uri TEXT,
      transcript TEXT,
      transcript_segments TEXT,
      transcribed INTEGER DEFAULT 0,
      tags TEXT,
      favourite INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_recorded_at ON entries(recorded_at DESC);
  `);

  // Create FTS5 virtual table for full-text search
  // Note: FTS5 may not be available on all SQLite builds
  // Fallback to LIKE search if FTS5 fails
  try {
    await db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        prompt,
        transcript,
        content='entries',
        content_rowid='rowid'
      );
    `);

    // NOTE: Triggers removed to prevent database corruption on iOS
    // FTS5 index is now updated manually in queries.ts (updateFTS5Index function)
    // This prevents trigger conflicts that cause "database disk image is malformed" errors
    // 
    // Old triggers (commented out for reference):
    // CREATE TRIGGER IF NOT EXISTS entries_fts_insert AFTER INSERT ON entries BEGIN
    //   INSERT INTO entries_fts(rowid, prompt, transcript)
    //   VALUES (new.rowid, new.prompt, new.transcript);
    // END;
    //
    // CREATE TRIGGER IF NOT EXISTS entries_fts_update AFTER UPDATE ON entries BEGIN
    //   UPDATE entries_fts SET prompt = new.prompt, transcript = new.transcript
    //   WHERE rowid = new.rowid;
    // END;
    //
    // CREATE TRIGGER IF NOT EXISTS entries_fts_delete AFTER DELETE ON entries BEGIN
    //   DELETE FROM entries_fts WHERE rowid = old.rowid;
    // END;
  } catch (error) {
    console.warn('FTS5 not available, will use LIKE search:', error);
  }

  return db;
}


