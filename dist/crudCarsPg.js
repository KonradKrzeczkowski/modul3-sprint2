"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
async function crudCarsPg(req, res) {
    const id = req.params.id;
    try {
        if (req.method === "GET" && !id) {
            const result = await db_1.default.query("SELECT * FROM cars");
            res.json(result.rows);
            return;
        }
        if (req.method === "GET" && id) {
            const result = await db_1.default.query("SELECT * FROM cars WHERE id = $1", [id]);
            if (result.rows.length === 0) {
                res.status(404).json({ message: "car not found" });
                return;
            }
            res.json(result.rows[0]);
            return;
        }
        if (req.method === "POST") {
            const { model, price } = req.body;
            if (!model || typeof price !== "number") {
                res.status(400).json({ message: "Invalid model or price" });
                return;
            }
            const ownerId = null;
            const result = await db_1.default.query("INSERT INTO cars (model, price, owner_id) VALUES ($1, $2, $3) RETURNING *", [model, price, ownerId]);
            res.status(201).json(result.rows[0]);
            return;
        }
        if (req.method === "PUT" && id) {
            const { model, price, ownerId } = req.body;
            if (!model ||
                typeof price !== "number" ||
                (ownerId !== null && typeof ownerId !== "string")) {
                res.status(400).json({ message: "Invalid data" });
                return;
            }
            const result = await db_1.default.query("UPDATE cars SET model = $1, price = $2, owner_id = $3 WHERE id = $4 RETURNING *", [model, price, ownerId, id]);
            if (result.rows.length === 0) {
                res.status(404).json({ message: "car not found" });
                return;
            }
            res.json(result.rows[0]);
            return;
        }
        if (req.method === "DELETE" && id) {
            const result = await db_1.default.query("DELETE FROM cars WHERE id = $1 RETURNING *", [id]);
            if (result.rows.length === 0) {
                res.status(404).json({ message: "car not found" });
                return;
            }
            res.json(result.rows[0]);
            return;
        }
        res.status(404).json({ message: "Route not found" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
exports.default = crudCarsPg;
