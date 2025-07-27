"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.getUserFromToken = getUserFromToken;
exports.setAuthCookie = setAuthCookie;
exports.parseCookies = parseCookies;
const mockDatabase = {
    '123': { id: '123', name: 'Alice' },
};
function generateToken(userId) {
    return `token-${userId}`;
}
function getUserFromToken(token) {
    const userId = token.replace('token-', '');
    return mockDatabase[userId] || null;
}
function setAuthCookie(res, token) {
    res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/`);
}
function parseCookies(req) {
    const header = req.headers.cookie;
    const cookies = {};
    if (!header)
        return cookies;
    const pairs = header.split(';');
    for (const pair of pairs) {
        const [key, value] = pair.trim().split('=');
        cookies[key] = decodeURIComponent(value);
    }
    return cookies;
}
