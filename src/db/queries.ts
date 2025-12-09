import * as SQLite from 'expo-sqlite';
// Note: We import both the new Directory/File API and the old FileSystem API
// The new API is used for database file operations, the old API is needed for readDirectoryAsync
import { File, Directory, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import { Entry, CreateEntryInput } from './types';
import { initializeDatabase } from './schema';
import { DB_DELAYS } from '@utils/constants';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initializingPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(retries = 0): Promise<SQLite.SQLiteDatabase> {
  // If we have an instance, verify it's still valid
  if (dbInstance) {
    try {
      // Quick health check - try a simple query
      await dbInstance.getFirstAsync('SELECT 1');
      return dbInstance;
    } catch (error) {
      // Instance is stale or closed, reset it
      console.warn('Database instance is stale, reinitializing...', error);
      dbInstance = null;
      initializingPromise = null;
    }
  }

  // If initialization is already in progress, wait for it
  if (initializingPromise) {
    return initializingPromise;
  }

  // Start initialization
  initializingPromise = (async () => {
    try {
      dbInstance = await initializeDatabase();
      // Small delay to ensure database is fully ready
      await new Promise(resolve => setTimeout(resolve, DB_DELAYS.INIT));
      initializingPromise = null;
      return dbInstance;
    } catch (error) {
      console.error(`Failed to initialize database (attempt ${retries + 1}):`, error);
      
      // Reset instance and promise
      dbInstance = null;
      initializingPromise = null;
      
      // Retry up to 2 times with increasing delay
      if (retries < 2) {
        await new Promise(resolve => setTimeout(resolve, DB_DELAYS.RETRY * (retries + 1)));
        return getDb(retries + 1);
      }
      
      // If all retries failed, throw
      throw new Error('Failed to initialize database after multiple attempts');
    }
  })();

  return initializingPromise;
}

/**
 * Helper function to manually update FTS5 index (safer than triggers on iOS)
 * This prevents database corruption from trigger conflicts
 */
async function updateFTS5Index(
  db: SQLite.SQLiteDatabase,
  operation: 'insert' | 'update' | 'delete',
  entryId: string
): Promise<void> {
  try {
    if (operation === 'insert' || operation === 'update') {
      // Delete existing FTS5 entry if it exists (for update case)
      await db.runAsync(
        `DELETE FROM entries_fts WHERE rowid = (SELECT rowid FROM entries WHERE id = ?)`,
        [entryId]
      );
      // Insert new FTS5 entry with current data from entries table
      await db.runAsync(
        `INSERT INTO entries_fts(rowid, prompt, transcript)
         SELECT rowid, prompt, transcript FROM entries WHERE id = ?`,
        [entryId]
      );
    } else if (operation === 'delete') {
      // Delete from FTS5
      await db.runAsync(
        `DELETE FROM entries_fts WHERE rowid = (SELECT rowid FROM entries WHERE id = ?)`,
        [entryId]
      );
    }
  } catch (ftsError) {
    // FTS5 might not be available, log but don't fail the main operation
    console.warn('Failed to update FTS5 index (non-critical):', ftsError);
  }
}

/**
 * Recreate database when corruption is detected
 * This will delete the corrupted database and create a fresh one
 * WARNING: This will lose all existing data
 */
async function recreateDatabase(): Promise<void> {
  console.error('[Database] Corruption detected! Recreating database...');
  
  // Close existing instance
  if (dbInstance) {
    try {
      await dbInstance.closeAsync();
    } catch (error) {
      console.warn('[Database] Error closing corrupted database:', error);
    }
  }
  
  // Reset state
  dbInstance = null;
  initializingPromise = null;
  
  // Delete corrupted database file using expo-file-system
  try {
    // Use Directory API to construct the path correctly (expo-sqlite stores in SQLite subdirectory)
    const sqliteDir = new Directory(Paths.document, 'SQLite');
    const dbFile = new File(sqliteDir, 'minmo.db');
    const walFile = new File(sqliteDir, 'minmo.db-wal');
    const shmFile = new File(sqliteDir, 'minmo.db-shm');
    
    console.log('[Database] Database paths:', {
      documentPath: Paths.document.uri,
      dbPath: dbFile.uri,
      dbPathWAL: walFile.uri,
      dbPathSHM: shmFile.uri,
    });
    
    // Delete main database and WAL files
    try {
      if (dbFile.exists) {
        dbFile.delete(); // Synchronous
        console.log('[Database] Deleted corrupted database file');
      } else {
        console.log('[Database] Database file does not exist at:', dbFile.uri);
      }
    } catch (error) {
      console.warn('[Database] Error deleting main database file:', error);
    }
    
    try {
      if (walFile.exists) {
        walFile.delete(); // Synchronous
        console.log('[Database] Deleted WAL file');
      }
    } catch (error) {
      console.warn('[Database] Error deleting WAL file:', error);
    }
    
    try {
      if (shmFile.exists) {
        shmFile.delete(); // Synchronous
        console.log('[Database] Deleted SHM file');
      }
    } catch (error) {
      console.warn('[Database] Error deleting SHM file:', error);
    }
  } catch (error) {
    console.error('[Database] Error deleting corrupted database files:', error);
    // Continue anyway - SQLite will create a new one
  }
  
  // Wait a bit before recreating
  await new Promise(resolve => setTimeout(resolve, DB_DELAYS.RECREATE));
  
  // Recreate database - wrap in try/catch to prevent crashes
  try {
    dbInstance = await initializeDatabase();
    console.log('[Database] Fresh database recreated successfully');
  } catch (initError) {
    console.error('[Database] Failed to initialize new database:', initError);
    // Reset state so next attempt can try again
    dbInstance = null;
    initializingPromise = null;
    throw new Error('Failed to recreate database. Please restart the app.');
  }
}

/**
 * Manually reset the database by deleting and recreating it
 * 
 * This will delete the entire database and create a fresh one.
 * WARNING: This will lose all existing data and cannot be undone.
 * 
 * @throws {Error} If database recreation fails
 */
export async function resetDatabase(): Promise<void> {
  console.log('[Database] Manual database reset requested');
  await recreateDatabase();
}

/**
 * Nuclear reset: Delete ALL app data (database, files, SecureStore)
 * 
 * This function performs a complete reset of the app by:
 * 1. Closing and deleting the database
 * 2. Deleting all database files (.db, .db-wal, .db-shm)
 * 3. Deleting all audio files from the audio/ directory
 * 4. Deleting all photo files from the photos/ directory
 * 5. Clearing the device_id from SecureStore
 * 6. Creating a fresh database
 * 
 * WARNING: This will lose ALL data and cannot be undone.
 * 
 * @throws {Error} If database recreation fails after deletion
 */
export async function nuclearReset(): Promise<void> {
  console.log('[Database] Nuclear reset requested - deleting ALL app data');
  
  // 1. Close and delete database
  if (dbInstance) {
    try {
      await dbInstance.closeAsync();
      // Wait to ensure database is fully closed
      await new Promise(resolve => setTimeout(resolve, DB_DELAYS.RECREATE));
    } catch (error) {
      console.warn('[Database] Error closing database:', error);
    }
  }
  
  dbInstance = null;
  initializingPromise = null;
  
  // 2. Delete database files
  try {
    const sqliteDir = new Directory(Paths.document, 'SQLite');
    if (sqliteDir.exists) {
      const dbFile = new File(sqliteDir, 'minmo.db');
      const walFile = new File(sqliteDir, 'minmo.db-wal');
      const shmFile = new File(sqliteDir, 'minmo.db-shm');
      
      [dbFile, walFile, shmFile].forEach(file => {
        try {
          if (file.exists) {
            file.delete();
            console.log(`[Database] Deleted ${file.uri}`);
          }
        } catch (error) {
          console.warn(`[Database] Error deleting ${file.uri}:`, error);
        }
      });
    }
  } catch (error) {
    console.error('[Database] Error deleting database files:', error);
  }
  
  // 3. Delete all audio files using old API for listing
  try {
    const audioDirPath = `${Paths.document.uri}audio/`;
    try {
      const files = await FileSystem.readDirectoryAsync(audioDirPath);
      for (const filename of files) {
        try {
          const filePath = `${audioDirPath}${filename}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          console.log(`[Database] Deleted audio file: ${filename}`);
        } catch (error) {
          console.warn(`[Database] Error deleting audio file ${filename}:`, error);
        }
      }
    } catch (error) {
      // Directory might not exist, which is fine
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.warn('[Database] Error reading audio directory:', error);
      }
    }
  } catch (error) {
    console.error('[Database] Error deleting audio files:', error);
  }
  
  // 4. Delete all photo files using old API for listing
  try {
    const photoDirPath = `${Paths.document.uri}photos/`;
    try {
      const files = await FileSystem.readDirectoryAsync(photoDirPath);
      for (const filename of files) {
        try {
          const filePath = `${photoDirPath}${filename}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          console.log(`[Database] Deleted photo file: ${filename}`);
        } catch (error) {
          console.warn(`[Database] Error deleting photo file ${filename}:`, error);
        }
      }
    } catch (error) {
      // Directory might not exist, which is fine
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.warn('[Database] Error reading photo directory:', error);
      }
    }
  } catch (error) {
    console.error('[Database] Error deleting photo files:', error);
  }
  
  // 5. Clear SecureStore (device_id)
  try {
    const { deleteItemAsync } = await import('expo-secure-store');
    await deleteItemAsync('device_id');
    console.log('[Database] Cleared device_id from SecureStore');
  } catch (error) {
    console.warn('[Database] Error clearing SecureStore:', error);
  }
  
  // 6. Wait before recreating
  await new Promise(resolve => setTimeout(resolve, DB_DELAYS.CLOSE));
  
  // 7. Recreate fresh database
  try {
    dbInstance = await initializeDatabase();
    console.log('[Database] Fresh database created after nuclear reset');
  } catch (error) {
    console.error('[Database] Error creating fresh database:', error);
    throw error;
  }
}

/**
 * Save a new entry to the database
 * 
 * Creates a new entry with the provided data and updates the FTS5 search index.
 * Automatically generates a unique ID and timestamps.
 * 
 * @param input - Entry data to save
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to the saved Entry
 * @throws {Error} If database initialization fails after retries or entry cannot be retrieved
 */
export async function saveEntry(input: CreateEntryInput, retries = 0): Promise<Entry> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    
    const now = Date.now();
    const id = `${now}-${Math.random().toString(36).substr(2, 9)}`;

    const createdAt = input.created_at || input.recorded_at || now;
    const recordedAt = input.recorded_at || now;
    const updatedAt = input.created_at ? createdAt : now; // Use createdAt only if explicitly provided (seed data), otherwise use now

    await db.runAsync(
      `INSERT INTO entries (
        id, created_at, recorded_at, prompt, duration_seconds,
        audio_local_uri, photo_local_uri, transcript, transcribed, favourite, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        createdAt,
        recordedAt,
        input.prompt || null,
        input.duration_seconds || null,
        input.audio_local_uri,
        input.photo_local_uri || null,
        input.transcript || null,
        input.transcript ? 1 : 0, // transcribed (1 if transcript provided)
        0, // favourite
        updatedAt, // Use the calculated updatedAt
      ]
    );

    // Manually update FTS5 index (safer than triggers on iOS)
    await updateFTS5Index(db, 'insert', id);

    // Small delay before retrieving to ensure write is complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const entry = await getEntry(id);
    if (!entry) {
      throw new Error('Failed to retrieve saved entry');
    }
    return entry;
  } catch (error) {
    console.error('Error in saveEntry:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync') ||
      error.message.includes('Database not initialized')
    )) {
      console.log(`Retrying saveEntry (attempt ${retries + 1})...`);
      dbInstance = null;
      initializingPromise = null;
      return saveEntry(input, retries + 1);
    }
    
    throw error; // Re-throw if retries exhausted or different error
  }
}

/**
 * Get a single entry by ID
 * 
 * @param id - The entry ID to retrieve
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to the Entry if found, or null if not found
 */
export async function getEntry(id: string, retries = 0): Promise<Entry | null> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    const result = await db.getFirstAsync<Entry>(
      'SELECT * FROM entries WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('Error in getEntry:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return getEntry(id, retries + 1);
    }
    
    return null;
  }
}

/**
 * Get all entries, ordered by creation date (newest first)
 * 
 * @param limit - Maximum number of entries to return (default: 100)
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to an array of Entry objects
 */
export async function getEntries(limit = 100, retries = 0): Promise<Entry[]> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    const results = await db.getAllAsync<Entry>(
      'SELECT * FROM entries ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return results || [];
  } catch (error) {
    console.error('Error in getEntries:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return getEntries(limit, retries + 1);
    }
    
    return [];
  }
}

/**
 * Update an existing entry
 * 
 * Updates the specified fields of an entry and automatically updates the FTS5 search index.
 * Uses a transaction to ensure atomicity and prevent database corruption.
 * 
 * @param id - The entry ID to update
 * @param updates - Partial Entry object containing fields to update
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to the updated Entry if successful, or null if update fails or entry not found
 * @throws {Error} If database corruption is detected and recreation fails
 */
export async function updateEntry(
  id: string,
  updates: Partial<Entry>,
  retries = 0
): Promise<Entry | null> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    const now = Date.now();

    // Use a transaction to ensure atomicity and prevent corruption
    await db.withTransactionAsync(async () => {
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (updates.prompt !== undefined) {
        fields.push('prompt = ?');
        values.push(updates.prompt);
      }
      if (updates.transcript !== undefined) {
        fields.push('transcript = ?');
        values.push(updates.transcript);
      }
      if (updates.favourite !== undefined) {
        fields.push('favourite = ?');
        values.push(updates.favourite ? 1 : 0);
      }
      if (updates.photo_local_uri !== undefined) {
        fields.push('photo_local_uri = ?');
        values.push(updates.photo_local_uri);
      }

      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        const query = `UPDATE entries SET ${fields.join(', ')} WHERE id = ?`;
        console.log('[Database] updateEntry: Executing UPDATE in transaction', {
          id,
          fields: fields.length,
          hasTranscript: updates.transcript !== undefined,
        });
        await db.runAsync(query, values);
        console.log('[Database] updateEntry: UPDATE successful');
      }
    });

    // TEMPORARILY DISABLED: FTS5 update causing corruption on iOS
    // Manually update FTS5 index if transcript or prompt changed (safer than triggers on iOS)
    // TODO: Re-enable once corruption issue is resolved
    // For now, skip FTS5 updates to prevent database corruption
    // Search will still work, but transcript updates won't be indexed until we fix this
    if (updates.transcript !== undefined || updates.prompt !== undefined) {
      console.log('[Database] FTS5 update skipped to prevent corruption (transcript updates will not be searchable until fixed)');
    }

    // Small delay before retrieving
    await new Promise(resolve => setTimeout(resolve, 50));

    return getEntry(id);
  } catch (error) {
    console.error('Error in updateEntry:', error);
    
    // Check for database corruption error
    const isCorruptionError = error instanceof Error && (
      error.message.includes('database disk image is malformed') ||
      error.message.includes('Error code 11') ||
      error.message.includes('malformed') ||
      error.message.includes('finalizeAsync')
    );
    
    // Handle corruption by recreating database (only once)
    if (isCorruptionError && retries === 0) {
      try {
        await recreateDatabase();
        // Retry once after recreation
        console.log('[Database] Retrying updateEntry after database recreation');
        return updateEntry(id, updates, retries + 1);
      } catch (recreateError) {
        console.error('[Database] Failed to recreate database:', recreateError);
        // Don't throw - return null instead to prevent app crash
        // The user can try again later or restart the app
        console.error('[Database] Returning null to prevent app crash. User should restart app.');
        return null;
      }
    }
    
    // Retry on other database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return updateEntry(id, updates, retries + 1);
    }
    
    throw error;
  }
}

/**
 * Delete an entry from the database
 * 
 * Deletes the entry and updates the FTS5 search index.
 * 
 * @param id - The entry ID to delete
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to true if entry was deleted, false if not found
 * @throws {Error} If database operation fails after retries
 */
export async function deleteEntry(id: string, retries = 0): Promise<boolean> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    
    // Manually delete from FTS5 before deleting entry (safer than triggers on iOS)
    await updateFTS5Index(db, 'delete', id);
    
    const result = await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  } catch (error) {
    console.error('Error in deleteEntry:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return deleteEntry(id, retries + 1);
    }
    
    throw error; // Re-throw so caller can handle it
  }
}

/**
 * Get today's entry (if one exists)
 * 
 * Retrieves the entry recorded today based on the current date.
 * Uses the start of today (00:00:00) to start of tomorrow for the date range.
 * 
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to today's Entry if found, or null if no entry exists for today
 */
export async function getTodaysEntry(retries = 0): Promise<Entry | null> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const result = await db.getFirstAsync<Entry>(
      `SELECT * FROM entries 
       WHERE recorded_at >= ? AND recorded_at < ?
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [startOfDay, endOfDay]
    );
    return result || null;
  } catch (error) {
    console.error('Error in getTodaysEntry:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return getTodaysEntry(retries + 1);
    }
    
    return null;
  }
}

/**
 * Search entries using FTS5 full-text search
 * 
 * Searches both prompt and transcript fields using FTS5 with BM25 ranking.
 * Prioritizes exact phrase matches and prompt matches over transcript matches.
 * Falls back to LIKE search if FTS5 is not available.
 * 
 * @param query - Search query string (minimum 2 characters recommended)
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to an array of matching Entry objects, ordered by relevance
 */
export async function searchEntries(query: string, retries = 0): Promise<Entry[]> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();

    // Format query for FTS5 - prioritize exact matches
    // Use quoted phrase for exact match, OR prefix match for flexibility
    // This ensures exact matches (e.g., "moment") rank higher than prefix matches (e.g., "moment*")
    const formatFTS5Query = (q: string): string => {
      const trimmed = q.trim();
      // For single word: exact match OR prefix match
      // For multi-word: exact phrase OR each word as prefix
      if (trimmed.split(/\s+/).length === 1) {
        // Single word: "moment" OR moment*
        return `"${trimmed}" OR ${trimmed}*`;
      } else {
        // Multi-word: exact phrase OR prefix for each word
        const words = trimmed.split(/\s+/);
        const exactPhrase = `"${trimmed}"`;
        const prefixQuery = words.map(w => `${w}*`).join(' ');
        return `${exactPhrase} OR ${prefixQuery}`;
      }
    };

    const fts5Query = formatFTS5Query(query);

    // Try FTS5 first, fallback to LIKE if not available
    try {
      // Use BM25 ranking with column weights to prioritize:
      // 1. Exact matches over prefix matches (handled by query format)
      // 2. Prompt matches over transcript matches (2.0 vs 1.0 weight)
      // Lower BM25 score = better match
      const results = await db.getAllAsync<Entry & { rank?: number }>(
        `SELECT e.*, 
         bm25(entries_fts, 2.0, 1.0) as rank
         FROM entries e
         JOIN entries_fts fts ON e.rowid = fts.rowid
         WHERE entries_fts MATCH ?
         ORDER BY rank ASC, e.created_at DESC
         LIMIT 50`,
        [fts5Query]
      );
      // Remove rank property before returning (it's not part of Entry type)
      return (results || []).map(({ rank, ...entry }) => entry);
    } catch (error) {
      // Fallback to LIKE search with simple scoring
      // Prompt matches rank higher (1) than transcript matches (2)
      const searchTerm = `%${query}%`;
      const lowerQuery = query.toLowerCase();
      const results = await db.getAllAsync<Entry & { match_rank?: number }>(
        `SELECT *,
         CASE 
           WHEN LOWER(prompt) LIKE ? THEN 1
           WHEN LOWER(transcript) LIKE ? THEN 2
           ELSE 3
         END as match_rank
         FROM entries
         WHERE prompt LIKE ? OR transcript LIKE ?
         ORDER BY match_rank ASC, created_at DESC
         LIMIT 50`,
        [`%${lowerQuery}%`, `%${lowerQuery}%`, searchTerm, searchTerm]
      );
      // Remove match_rank property before returning
      return (results || []).map(({ match_rank, ...entry }) => entry);
    }
  } catch (error) {
    console.error('Error in searchEntries:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return searchEntries(query, retries + 1);
    }
    
    return [];
  }
}

/**
 * Get all favourite entries, ordered by creation date (newest first)
 * 
 * @param limit - Maximum number of entries to return (default: 100)
 * @param retries - Internal retry counter (default: 0, used for automatic retries on failure)
 * @returns Promise resolving to an array of Entry objects where favourite = 1
 */
export async function getFavouriteEntries(limit = 100, retries = 0): Promise<Entry[]> {
  try {
    // Reset instance if we're retrying
    if (retries > 0) {
      dbInstance = null;
      initializingPromise = null;
      await new Promise(resolve => setTimeout(resolve, 200 * retries));
    }

    const db = await getDb();
    const results = await db.getAllAsync<Entry>(
      'SELECT * FROM entries WHERE favourite = 1 ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return results || [];
  } catch (error) {
    console.error('Error in getFavouriteEntries:', error);
    
    // Retry on database errors
    if (retries < 2 && error instanceof Error && (
      error.message.includes('NullPointerException') || 
      error.message.includes('prepareAsync') || 
      error.message.includes('execAsync')
    )) {
      dbInstance = null;
      initializingPromise = null;
      return getFavouriteEntries(limit, retries + 1);
    }
    
    return [];
  }
}

/**
 * Clear all entries from the database
 * 
 * WARNING: This will delete ALL entries from the database and cannot be undone.
 * Also clears the FTS5 search index.
 * 
 * @throws {Error} If database operation fails
 */
export async function clearAllEntries(): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM entries');
    console.log('All entries cleared!');
  } catch (error) {
    console.error('Error clearing entries:', error);
    throw error;
  }
}

