import { Request, Response } from "express";
import pool from "./db";

function generateToken(userId: number): string {
  return `token-${userId}`;
}

function setAuthCookie(res: Response, token: string) {
  res.cookie("auth", token, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
  });
}

async function regLogPg(req: Request, res: Response) {
  try {
    // LOGIN
    if (req.path === "/login" && req.method === "POST") {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Brakuje username lub password" });
        return;
      }

      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1 AND password = $2",
        [username, password]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: "Niepoprawne dane logowania" });
        return;
      }

      const user = result.rows[0];
      const token = generateToken(user.id);
      setAuthCookie(res, token);

      res.status(200).json({ message: "Zalogowano", userId: user.id });
      return;
    }

    // REGISTER
    if (req.path === "/register" && req.method === "POST") {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Brakuje username lub password" });
        return;
      }

      // sprawdzamy czy user istnieje
      const checkUser = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );

      if (checkUser.rows.length > 0) {
        res.status(409).json({ error: "Użytkownik już istnieje" });
        return;
      }

      // tworzymy nowego usera (Postgres sam ustawi ID)
      const insertResult = await pool.query(
        "INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING id",
        [username, password, "user", 10000]
      );

      const newUserId = insertResult.rows[0].id;
      res
        .status(201)
        .json({ message: "Użytkownik zarejestrowany", userId: newUserId });
      return;
    }

    // INNE ENDPOINTY
    res.status(404).json({ error: "Nieznany endpoint lub metoda" });
  } catch (err) {
    console.error("Błąd regLogPg:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
}

export default regLogPg;
