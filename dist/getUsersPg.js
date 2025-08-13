"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
async function getUserPg(id) {
    const result = await db_1.default.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}
exports.default = getUserPg;
