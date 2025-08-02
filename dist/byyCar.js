"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUsers_1 = __importDefault(require("./getUsers"));
const path_1 = require("path");
const getCars_1 = __importDefault(require("./getCars"));
const promises_1 = require("fs/promises");
const sse_1 = require("./sse");
const carsFilePath = (0, path_1.join)(__dirname, "..", "db", "cars.json");
const usersFilePath = (0, path_1.join)(__dirname, "..", "db", "users.json");
async function saveUsers(users) {
    await (0, promises_1.writeFile)(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
}
async function saveCars(cars) {
    await (0, promises_1.writeFile)(carsFilePath, JSON.stringify(cars, null, 2), "utf-8");
}
async function buyCarHandler(req, res) {
    if (req.url === "/buy" && req.method === "POST") {
        let body = "";
        for await (const chunk of req) {
            body += chunk;
        }
        try {
            const { userId, carId } = JSON.parse(body);
            if (!userId || !carId) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Brak wymaganych danych" }));
                return;
            }
            const users = await (0, getUsers_1.default)();
            const cars = await (0, getCars_1.default)();
            const userIndex = users.findIndex((u) => u.id === userId);
            const carIndex = cars.findIndex((c) => c.id === carId);
            if (userIndex === -1) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Nie znaleziono użytkownika" }));
                return;
            }
            if (carIndex === -1) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Nie znaleziono auta" }));
                return;
            }
            const user = users[userIndex];
            const car = cars[carIndex];
            if (typeof car.price !== "number") {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Nieprawidłowa cena auta" }));
                return;
            }
            if (user.balance < car.price) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Niewystarczające środki" }));
                return;
            }
            if (car.status === "sold") {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Auto już sprzedane" }));
                return;
            }
            user.balance -= car.price;
            car.ownerId = user.id;
            car.status = "sold";
            await saveUsers(users);
            await saveCars(cars);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Zakup zakończony sukcesem", user, car }));
            (0, sse_1.sendEvent)({
                event: "carPurchased",
                carId: car.id,
                buyerId: user.id,
                model: car.model,
            });
        }
        catch (error) {
            console.error("Błąd w buyCarHandler:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Błąd serwera" }));
        }
    }
}
exports.default = buyCarHandler;
