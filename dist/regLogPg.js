"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
function generateToken(userId) {
    return `token-${userId}`;
}
function setAuthCookie(res, token) {
    res.cookie("auth", token, {
        httpOnly: true,
        path: "/",
        sameSite: "strict",
    });
}
async function regLogPg(req, res) {
    try {
        // LOGIN
        if (req.path === "/login" && req.method === "POST") {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).json({ error: "Brakuje username lub password" });
                return;
            }
            const result = await db_1.default.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
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
            const checkUser = await db_1.default.query("SELECT * FROM users WHERE username = $1", [username]);
            if (checkUser.rows.length > 0) {
                res.status(409).json({ error: "Użytkownik już istnieje" });
                return;
            }
            // tworzymy nowego usera (Postgres sam ustawi ID)
            const insertResult = await db_1.default.query("INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4) RETURNING id", [username, password, "user", 10000]);
            const newUserId = insertResult.rows[0].id;
            res
                .status(201)
                .json({ message: "Użytkownik zarejestrowany", userId: newUserId });
            return;
        }
        // INNE ENDPOINTY
        res.status(404).json({ error: "Nieznany endpoint lub metoda" });
    }
    catch (err) {
        console.error("Błąd regLogPg:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
}
exports.default = regLogPg;
