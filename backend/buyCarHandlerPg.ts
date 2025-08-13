import { Request, Response } from "express";
import pool from "./db";
import { sendEvent } from "./sse";

async function buyCarHandlerPg(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { userId, carId } = req.body;

    if (!userId || !carId) {
      res.status(400).json({ error: "Brak wymaganych danych" });
      return;
    }

    console.log(" Odebrano żądanie zakupu:", { userId, carId });

    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "Nie znaleziono użytkownika" });
      return;
    }
    const user = userResult.rows[0];
    console.log(" Znaleziono użytkownika:", user);

    const carResult = await pool.query(
      "SELECT id, model, price::int, owner_id FROM cars WHERE id = $1",
      [carId]
    );
    if (carResult.rows.length === 0) {
      res.status(404).json({ error: "Nie znaleziono auta" });
      return;
    }
    const car = carResult.rows[0];
    console.log(" Znaleziono auto:", car);

    if (typeof car.price !== "number") {
      res.status(400).json({ error: "Nieprawidłowa cena auta" });
      return;
    }
    if (typeof user.balance !== "number") {
      res.status(400).json({ error: "Nieprawidłowy balance" });
      return;
    }
    if (user.balance < car.price) {
      res.status(400).json({ error: "Niewystarczające środki" });
      return;
    }

    if (car.owner_id !== null) {
      res.status(400).json({ error: "Auto już sprzedane" });
      return;
    }

    await pool.query("BEGIN");

    const updatedUserResult = await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING *",
      [car.price, userId]
    );

    const updatedCarResult = await pool.query(
      "UPDATE cars SET owner_id = $1 WHERE id = $2 RETURNING *",
      [userId, carId]
    );

    await pool.query("COMMIT");

    const updatedUser = updatedUserResult.rows[0];
    const updatedCar = updatedCarResult.rows[0];

    res.json({
      message: "Zakup zakończony sukcesem",
      user: updatedUser,
      car: updatedCar,
    });

    sendEvent({
      event: "carPurchased",
      carId: updatedCar.id,
      buyerId: updatedUser.id,
      model: updatedCar.model,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(" Błąd w buyCarHandlerPg:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
}

export default buyCarHandlerPg;
