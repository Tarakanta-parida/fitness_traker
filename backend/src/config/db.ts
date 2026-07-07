import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('Warning: DATABASE_URL environment variable is not defined. Database operations will fail.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const db = {
  /**
   * Run query with text parameters
   */
  query(text: string, params?: any[]) {
    return pool.query(text, params);
  },
  
  /**
   * Acquire a client from the pool
   */
  getClient() {
    return pool.connect();
  },
  
  /**
   * Close the pool (for clean shutdowns)
   */
  async close() {
    await pool.end();
  }
};
