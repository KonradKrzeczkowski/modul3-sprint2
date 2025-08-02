"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUsers_1 = __importDefault(require("./getUsers"));
async function checkAuth(req, res) {
    if (req.url === "/check-auth" && req.method === "GET") {
        const cookie = req.headers.cookie || "";
        const match = cookie.match(/auth=token-(user_\d+)/);
        if (!match) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Brak lub nieprawidłowy token" }));
            return;
        }
        const userId = match[1];
        const users = await (0, getUsers_1.default)();
        const user = users.find((u) => u.id === userId);
        if (!user) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Nieprawidłowy token" }));
            return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            id: user.id,
            username: user.username,
            role: user.role,
            balance: user.balance
        }));
    }
}
exports.default = checkAuth;
