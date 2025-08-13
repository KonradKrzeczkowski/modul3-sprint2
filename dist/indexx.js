"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const sse_1 = require("./sse");
const getUsers_1 = __importDefault(require("./getUsers"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const frontendDir = path_1.default.join(__dirname, "..", "frontend");
// Middleware do parsowania JSON
app.use(express_1.default.json());
// Middleware do serwowania statycznych plików frontendowych pod /static
app.use("/static", express_1.default.static(path_1.default.join(frontendDir)));
// Zmienne na handler’y, które dynamicznie załadujemy
let crudCars;
let crudUsers;
let buyCarHandler;
let regLogHandler;
// Helper do ładowania modułów na podstawie env.DB
async function loadHandlers() {
    if (process.env.DB === "pg") {
        crudCars = (await Promise.resolve().then(() => __importStar(require("./crudCarsPg")))).default;
        crudUsers = (await Promise.resolve().then(() => __importStar(require("./crudUserPg")))).default;
        buyCarHandler = (await Promise.resolve().then(() => __importStar(require("./buyCarHandlerPg")))).default;
        regLogHandler = (await Promise.resolve().then(() => __importStar(require("./regLogPg")))).default;
    }
    else {
        crudCars = (await Promise.resolve().then(() => __importStar(require("./crudCars")))).default;
        crudUsers = (await Promise.resolve().then(() => __importStar(require("./crudUser")))).default;
        buyCarHandler = (await Promise.resolve().then(() => __importStar(require("./buyCarHandler")))).default;
        regLogHandler = (await Promise.resolve().then(() => __importStar(require("./regLog")))).default;
    }
}
// Middleware do parsowania ciasteczek
function parseCookies(cookieHeader) {
    if (!cookieHeader)
        return {};
    return cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, val] = cookie.trim().split("=");
        acc[key] = val;
        return acc;
    }, {});
}
// Autoryzacja: middleware sprawdzający token w cookie i ustawiający req.userId
function authMiddleware(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.auth;
    if (!token || !token.startsWith("token-")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = token.slice("token-".length);
    req.userId = userId; // dodaj userId do req
    next();
}
(async () => {
    await loadHandlers();
    // Endpoint GET /check-auth — sprawdza czy token jest ważny i zwraca usera bez hasła
    app.get("/check-auth", authMiddleware, async (req, res) => {
        const userId = req.userId;
        const users = await (0, getUsers_1.default)();
        const user = users.find((u) => u.id === userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    });
    // Endpoint GET /me — zwraca zalogowanego użytkownika
    app.get("/me", authMiddleware, async (req, res) => {
        const userId = req.userId;
        const users = await (0, getUsers_1.default)();
        const user = users.find((u) => u.id === userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    });
    // Użytkownicy CRUD - obsługa wszystkich metod pod /users/:id?
    app.route("/users/:id?")
        .get(async (req, res) => crudUsers(req, res))
        .post(async (req, res) => crudUsers(req, res))
        .put(async (req, res) => crudUsers(req, res))
        .delete(async (req, res) => crudUsers(req, res));
    // Samochody CRUD - obsługa wszystkich metod pod /cars/:id?
    app.route("/cars/:id?")
        .get(async (req, res) => crudCars(req, res))
        .post(async (req, res) => crudCars(req, res))
        .put(async (req, res) => crudCars(req, res))
        .delete(async (req, res) => crudCars(req, res));
    // Logowanie i rejestracja
    app.post("/login", async (req, res) => regLogHandler(req, res));
    app.post("/register", async (req, res) => regLogHandler(req, res));
    // Zakup samochodu
    app.post("/buy", async (req, res) => buyCarHandler(req, res));
    // SSE (Server-Sent Events)
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
    // Status serwera
    app.get("/", (req, res) => res.json({ status: "ok" }));
    // Domyślna obsługa 404
    app.use((req, res) => {
        res.status(404).json({ message: "Route not found" });
    });
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})();
