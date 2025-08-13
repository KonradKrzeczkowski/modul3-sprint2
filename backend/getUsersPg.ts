import pool from "./db";

async function getUserPg(id: string) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

export default getUserPg;
