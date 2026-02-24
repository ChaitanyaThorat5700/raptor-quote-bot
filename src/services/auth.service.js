import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = "raptor_secret_key"; // later move to .env

export async function createUser({ name, email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role
    `,
    [name, email, hashedPassword, role || "SALES"]
  );

  return result.rows[0];
}

export async function loginUser({ email, password }) {
  const userRes = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_active = true",
    [email]
  );

  if (userRes.rows.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = userRes.rows[0];

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}