import { createServer } from "http";
import { readFile } from "fs/promises";
import { join } from "path";
import crudUser from "./crudUser";
import crudCars from "./crudCars";
import getUsers from "./getUsers";
import regLog from "./regLog";
import { User } from "./types";
import buyCarHandler from "./buyCarHandler";
import { addClient } from "./sse";
const PORT = 3000;
const frontendDir = join(__dirname, "..", "frontend");

function parseCookies(
  cookieHeader: string | undefined
): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, val] = cookie.trim().split("=");
    acc[key] = val;
    return acc;
  }, {} as Record<string, string>);
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }
    if (req.url === "/check-auth" && req.method === "GET") {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies.auth;

      if (!token) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      if (!token.startsWith("token-")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid token" }));
        return;
      }

      const userId = token.slice("token-".length);
      const users = await getUsers();
      const user = users.find((u: User) => u.id === userId);

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }

      const { password, ...userWithoutPassword } = user;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(userWithoutPassword));
      return;
    }

    if (req.url.startsWith("/static/")) {
      const filePath = join(frontendDir, req.url.replace("/static/", ""));
      try {
        const data = await readFile(filePath);
        let contentType = "text/plain";
        if (filePath.endsWith(".html")) contentType = "text/html";
        else if (filePath.endsWith(".css")) contentType = "text/css";
        else if (filePath.endsWith(".js"))
          contentType = "application/javascript";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
      return;
    }

    if (req.url.startsWith("/users")) {
      await crudUser(req, res);
      return;
    }

    if (req.url === "/login" || req.url === "/register") {
      await regLog(req, res);
      return;
    }
    if (req.url.startsWith("/cars")) {
      await crudCars(req, res);
      return;
    }
    if (req.url.startsWith("/buy")) {
      await buyCarHandler(req, res);
      return;
    }
    if (req.url === "/sse") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.write(": ping\n\n");
      addClient(res, req);
      return;
    }

    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Endpoint GET /me
    if (req.url === "/me" && req.method === "GET") {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies.auth;

      if (!token) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      if (!token.startsWith("token-")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid token" }));
        return;
      }

      const userId = token.slice("token-".length);

      const users = await getUsers();
      const user = users.find((u: User) => u.id === userId);

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }
      const { password, ...userWithoutPassword } = user;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(userWithoutPassword));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
