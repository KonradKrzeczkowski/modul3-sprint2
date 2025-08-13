"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
async function userCrudPg(req, res) {
    const id = req.params.id;
    try {
        if (req.method === "GET" && !id) {
            const result = await db_1.default.query("SELECT * FROM users");
            res.json(result.rows);
            return;
        }
        if (req.method === "GET" && id) {
            const result = await db_1.default.query("SELECT * FROM users WHERE id = $1", [
                id,
            ]);
            if (result.rows.length === 0) {
                res.status(404).json({ message: "user not found" });
                return;
            }
            res.json(result.rows[0]);
            return;
        }
        if (req.method === "POST") {
            const { username, password, role, balance } = req.body;
            const result = await db_1.default.query("INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING *", [username, password, role, balance]);
            res.status(201).json(result.rows[0]);
            return;
        }
        if (req.method === "PUT" && id) {
            const { action, username, password, role, balance } = req.body;
            if (action === "add_balance") {
                const result = await db_1.default.query("UPDATE users SET balance = balance + 1000 WHERE id = $1 RETURNING *", [id]);
                if (result.rows.length === 0) {
                    res.status(404).json({ message: "user not found" });
                    return;
                }
                res.json(result.rows[0]);
                return;
            }
            const existingResult = await db_1.default.query("SELECT * FROM users WHERE id = $1", [id]);
            if (existingResult.rows.length === 0) {
                res.status(404).json({ message: "user not found" });
                return;
            }
            const existingUser = existingResult.rows[0];
            const updatedUsername = username !== null && username !== void 0 ? username : existingUser.username;
            const updatedPassword = password !== null && password !== void 0 ? password : existingUser.password;
            const updatedRole = role !== null && role !== void 0 ? role : existingUser.role;
            const updatedBalance = balance !== null && balance !== void 0 ? balance : existingUser.balance;
            const result = await db_1.default.query("UPDATE users SET username = $1, password = $2, role = $3, balance = $4 WHERE id = $5 RETURNING *", [updatedUsername, updatedPassword, updatedRole, updatedBalance, id]);
            res.json(result.rows[0]);
            return;
        }
        if (req.method === "DELETE" && id) {
            const result = await db_1.default.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
            if (result.rows.length === 0) {
                res.status(404).json({ message: "user not found" });
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
exports.default = userCrudPg;
