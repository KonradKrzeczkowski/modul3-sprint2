"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const carsFilePath = (0, path_1.join)(__dirname, "..", "db", "cars.json");
async function crudCars(req, res) {
    async function getCars() {
        try {
            const data = await (0, promises_1.readFile)(carsFilePath, "utf-8");
            return JSON.parse(data);
        }
        catch (err) {
            console.error("Błąd podczas odczytu cars.json:", err);
            throw err;
        }
    }
    async function saveCars(cars) {
        await (0, promises_1.writeFile)(carsFilePath, JSON.stringify(cars, null, 2), "utf-8");
    }
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const id = url.pathname.split("/")[2];
    // Obsługa GET /users
    if (url.pathname === "/cars" && req.method === "GET") {
        const cars = await getCars();
        res.end(JSON.stringify(cars));
    }
    // Obsługa POST /users
    else if (url.pathname === "/cars" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            const newCar = JSON.parse(body);
            const cars = await getCars();
            const maxId = cars.reduce((max, car) => (car.id > max ? car.id : max), 0);
            newCar.id = maxId + 1;
            cars.push(newCar);
            await saveCars(cars);
            res.writeHead(201);
            res.end(JSON.stringify(newCar));
        });
    }
    // Obsługa GET /users/:id
    else if (id && url.pathname.startsWith("/cars/") && req.method === "GET") {
        const cars = await getCars();
        const car = cars.find((c) => c.id === id);
        if (car) {
            res.end(JSON.stringify(car));
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: "car not found" }));
        }
    }
    // Obsługa PUT /users/:id
    else if (id && url.pathname.startsWith("/cars/") && req.method === "PUT") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            const updatedCars = JSON.parse(body);
            const cars = await getCars();
            const index = cars.findIndex((c) => c.id === id);
            if (index !== -1) {
                cars[index] = { id: String(id), ...updatedCars };
                await saveCars(cars);
                res.end(JSON.stringify(cars[index]));
            }
            else {
                res.writeHead(404);
                res.end(JSON.stringify({ message: "car not found" }));
            }
        });
    }
    // Obsługa DELETE /users/:id
    else if (id && url.pathname.startsWith("/cars/") && req.method === "DELETE") {
        const cars = await getCars();
        const index = cars.findIndex((c) => c.id === id);
        if (index !== -1) {
            const deletedCars = cars.splice(index, 1)[0];
            await saveCars(cars);
            res.end(JSON.stringify(deletedCars));
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: "car not found" }));
        }
    }
    // Nieznana ścieżka
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: "Route not found" }));
    }
}
exports.default = crudCars;
