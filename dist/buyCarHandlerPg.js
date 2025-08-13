"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const sse_1 = require("./sse");
async function buyCarHandlerPg(req, res) {
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
        const userResult = await db_1.default.query("SELECT * FROM users WHERE id = $1", [
            userId,
        ]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: "Nie znaleziono użytkownika" });
            return;
        }
        const user = userResult.rows[0];
        console.log(" Znaleziono użytkownika:", user);
        const carResult = await db_1.default.query("SELECT id, model, price::int, owner_id FROM cars WHERE id = $1", [carId]);
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
        await db_1.default.query("BEGIN");
        const updatedUserResult = await db_1.default.query("UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING *", [car.price, userId]);
        const updatedCarResult = await db_1.default.query("UPDATE cars SET owner_id = $1 WHERE id = $2 RETURNING *", [userId, carId]);
        await db_1.default.query("COMMIT");
        const updatedUser = updatedUserResult.rows[0];
        const updatedCar = updatedCarResult.rows[0];
        res.json({
            message: "Zakup zakończony sukcesem",
            user: updatedUser,
            car: updatedCar,
        });
        (0, sse_1.sendEvent)({
            event: "carPurchased",
            carId: updatedCar.id,
            buyerId: updatedUser.id,
            model: updatedCar.model,
        });
    }
    catch (error) {
        await db_1.default.query("ROLLBACK");
        console.error(" Błąd w buyCarHandlerPg:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
}
exports.default = buyCarHandlerPg;
