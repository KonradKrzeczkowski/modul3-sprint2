import { ServerResponse } from "http";

const clients: ServerResponse[] = [];

export function sendEvent(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

export function addClient(res: ServerResponse, req: import("http").IncomingMessage) {
  clients.push(res);

  req.on("close", () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
}