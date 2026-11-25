import mysql from 'mysql2/promise';
import { env } from './env.js';
export const pool = mysql.createPool({ ...env.db, waitForConnections: true, queueLimit: 0, decimalNumbers: true });
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
