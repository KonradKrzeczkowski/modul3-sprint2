"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const sse_1 = require("./sse");
const getUsersPg_1 = __importDefault(require("./getUsersPg"));
const crudCarsPg_1 = __importDefault(require("./crudCarsPg"));
const crudUserPg_1 = __importDefault(require("./crudUserPg"));
const buyCarHandlerPg_1 = __importDefault(require("./buyCarHandlerPg"));
const regLogPg_1 = __importDefault(require("./regLogPg"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const frontendDir = path_1.default.join(__dirname, "..", "frontend");
app.use(express_1.default.json());
app.use("/static", express_1.default.static(frontendDir));
function parseCookies(cookieHeader) {
    if (!cookieHeader)
        return {};
    return cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, val] = cookie.trim().split("=");
        acc[key] = val;
        return acc;
    }, {});
}
function authMiddleware(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.auth;
    if (!token || !token.startsWith("token-")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = token.slice("token-".length);
    req.userId = userId;
    next();
}
// Endpointy
app.get("/check-auth", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const user = await (0, getUsersPg_1.default)(userId);
    if (!user)
        return res.status(404).json({ error: "User not found" });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});
app.get("/me", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const user = await (0, getUsersPg_1.default)(userId);
    if (!user)
        return res.status(404).json({ error: "User not found" });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});
// CRUD Users
app.route("/users")
    .get(crudUserPg_1.default)
    .post(crudUserPg_1.default);
app.route("/users/:id")
    .get(crudUserPg_1.default)
    .put(crudUserPg_1.default)
    .delete(crudUserPg_1.default);
// CRUD Cars
app.route("/cars")
    .get(crudCarsPg_1.default)
    .post(crudCarsPg_1.default);
app.route("/cars/:id")
    .get(crudCarsPg_1.default)
    .put(crudCarsPg_1.default)
    .delete(crudCarsPg_1.default);
app.post("/login", regLogPg_1.default);
app.post("/register", regLogPg_1.default);
app.post("/buy", buyCarHandlerPg_1.default);
app.get("/sse", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
    });
    res.write(": ping\n\n");
    (0, sse_1.addClient)(res, req);
});
app.get("/", (req, res) => res.json({ status: "ok" }));
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
