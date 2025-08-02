"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEvent = sendEvent;
exports.addClient = addClient;
const clients = [];
function sendEvent(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => res.write(payload));
}
function addClient(res, req) {
    clients.push(res);
    req.on("close", () => {
        const index = clients.indexOf(res);
        if (index !== -1)
            clients.splice(index, 1);
    });
}
