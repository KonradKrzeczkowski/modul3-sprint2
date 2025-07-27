"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUser = getAuthUser;
const getUsers_1 = __importDefault(require("./getUsers"));
async function getAuthUser(req) {
    var _a;
    const cookie = req.headers.cookie || "";
    const token = (_a = cookie.split(";").find((c) => c.trim().startsWith("auth="))) === null || _a === void 0 ? void 0 : _a.split("=")[1];
    if (!token || !token.startsWith("token-"))
        return null;
    const userId = token.slice("token-".length);
    const users = await (0, getUsers_1.default)();
    return users.find((u) => u.id === userId) || null;
}
