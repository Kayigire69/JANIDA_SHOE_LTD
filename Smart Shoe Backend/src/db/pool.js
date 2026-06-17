// Re-export pool from config/db.js
// This file exists so modules can import from 'db/pool.js' consistently
export { pool as default, pool, query } from '../config/db.js';
