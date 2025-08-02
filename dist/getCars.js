"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const promises_1 = require("fs/promises");
const usersFilePath = (0, path_1.join)(__dirname, "..", "db", "cars.json");
async function getCars() {
    try {
        const data = await (0, promises_1.readFile)(usersFilePath, "utf-8");
        return JSON.parse(data);
    }
    catch (err) {
        console.error("Błąd podczas odczytu cars.json:", err);
        throw err;
    }
}
exports.default = getCars;
