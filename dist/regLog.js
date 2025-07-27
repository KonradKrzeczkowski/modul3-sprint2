"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUsers_1 = __importDefault(require("./getUsers"));
const promises_1 = require("fs/promises");
const path_1 = require("path");
const usersFilePath = (0, path_1.join)(__dirname, "..", "db", "users.json");
function generateToken(userId) {
    return `token-${userId}`;
}
function setAuthCookie(res, token) {
    res.setHeader("Set-Cookie", `auth=${token}; HttpOnly; Path=/; SameSite=Strict`);
}
async function saveUsers(users) {
    await (0, promises_1.writeFile)(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
}
async function regLog(req, res) {
    if (req.url === "/login" && req.method === "POST") {
        let body = "";
        for await (const chunk of req) {
            body += chunk;
        }
        try {
            const { username, password } = JSON.parse(body);
            const users = await (0, getUsers_1.default)();
            console.log(users);
            const user = users.find((u) => u.username === username && u.password === password);
            if (!user) {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Niepoprawne dane logowania" }));
                return;
            }
            const token = generateToken(user.id);
            setAuthCookie(res, token);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Zalogowano", userId: user.id }));
        }
        catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Niepoprawne dane w body" }));
        }
        return;
    }
    else if (req.url === "/register" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", async () => {
            try {
                const { username, password } = JSON.parse(body);
                if (!username || !password) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Brakuje username lub password" }));
                    return;
                }
                const users = await (0, getUsers_1.default)();
                if (users.some((u) => u.username === username)) {
                    res.writeHead(409, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Użytkownik już istnieje" }));
                    return;
                }
                const newUser = {
                    id: `user_${Date.now()}`,
                    username,
                    password,
                    role: "user",
                    balance: 1000,
                };
                users.push(newUser);
                await saveUsers(users);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Użytkownik zarejestrowany" }));
            }
            catch (err) {
                console.error("Błąd rejestracji:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Błąd serwera" }));
            }
        });
        return;
    }
}
exports.default = regLog;
