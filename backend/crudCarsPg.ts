import { Request, Response } from "express";
import pool from "./db";
import { Car } from "./types";

async function crudCarsPg(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  try {
    if (req.method === "GET" && !id) {
      const result = await pool.query("SELECT * FROM cars");
      res.json(result.rows);
      return;
    }

    if (req.method === "GET" && id) {
      const result = await pool.query("SELECT * FROM cars WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ message: "car not found" });
        return;
      }
      res.json(result.rows[0]);
      return;
    }

    if (req.method === "POST") {
      const { model, price } = req.body as Partial<Car>;
      if (!model || typeof price !== "number") {
        res.status(400).json({ message: "Invalid model or price" });
        return;
      }
      const ownerId: string | null = null;
      const result = await pool.query(
        "INSERT INTO cars (model, price, owner_id) VALUES ($1, $2, $3) RETURNING *",
        [model, price, ownerId]
      );
      res.status(201).json(result.rows[0]);
      return;
    }

    if (req.method === "PUT" && id) {
      const { model, price, ownerId } = req.body as Partial<Car>;
      if (
        !model ||
        typeof price !== "number" ||
        (ownerId !== null && typeof ownerId !== "string")
      ) {
        res.status(400).json({ message: "Invalid data" });
        return;
      }
      const result = await pool.query(
        "UPDATE cars SET model = $1, price = $2, owner_id = $3 WHERE id = $4 RETURNING *",
        [model, price, ownerId, id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ message: "car not found" });
        return;
      }
      res.json(result.rows[0]);
      return;
    }

    if (req.method === "DELETE" && id) {
      const result = await pool.query(
        "DELETE FROM cars WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ message: "car not found" });
        return;
      }
      res.json(result.rows[0]);
      return;
    }

    res.status(404).json({ message: "Route not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export default crudCarsPg;
