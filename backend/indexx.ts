import { createServer } from "http";
import { readFile } from "fs/promises";
import { join } from "path";
import { User } from "./types";
import regLog from "./regLog";
import { addClient } from "./sse";
import dotenv from "dotenv";
import getUsers from "./getUsers";

const PORT = 3000;
const frontendDir = join(__dirname, "..", "frontend");

// Funkcja pomocnicza do parsowania ciasteczek z nagłówka
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, val] = cookie.trim().split("=");
    acc[key] = val;
    return acc;
  }, {} as Record<string, string>);
}

dotenv.config();

async function startServer() {

  let crudCars;
  let crudUsers;
  let buyCarHandler;
  let regLog;

  if (process.env.DB === "pg") {
    crudCars = (await import("./crudCarsPg")).default;
    crudUsers = (await import("./crudUserPg")).default;
    buyCarHandler = (await import("./buyCarHandlerPg")).default;
     regLog = (await import("./regLogPg")).default;
  } else {
    crudCars = (await import("./crudCars")).default;
    crudUsers = (await import("./crudUser")).default;
    buyCarHandler = (await import("./buyCarHandler")).default;
    regLog = (await import("./regLog")).default;
  }

  const server = createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400);
        res.end("Bad Request");
        return;
      }

      //  Sprawdzenie autoryzacji użytkownika
      if (req.url === "/check-auth" && req.method === "GET") {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.auth;
        if (!token || !token.startsWith("token-")) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
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

      //  Serwowanie plików statycznych (frontend)
      if (req.url.startsWith("/static/")) {
        const filePath = join(frontendDir, req.url.replace("/static/", ""));
        try {
          const data = await readFile(filePath);
          let contentType = "text/plain";
          if (filePath.endsWith(".html")) contentType = "text/html";
          else if (filePath.endsWith(".css")) contentType = "text/css";
          else if (filePath.endsWith(".js")) contentType = "application/javascript";
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end("Not Found");
        }
        return;
      }

      //  Obsługa użytkowników (CRUD)
      if (req.url.startsWith("/users")) {
        await crudUsers(req, res);
        return;
      }

      //  Logowanie / Rejestracja
      if (req.url === "/login" || req.url === "/register") {
        await regLog(req, res);
        return;
      }

      //  Obsługa samochodów (CRUD)
      if (req.url.startsWith("/cars")) {
        await crudCars(req, res);
        return;
      }

      //  Zakup samochodu
      if (req.url.startsWith("/buy")) {
        await buyCarHandler(req, res);
        return;
      }

      // SSE (Server-Sent Events) — strumieniowanie danych na żywo
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

      //  Sprawdzenie statusu serwera
      if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      //  Endpoint GET /me — zwraca dane zalogowanego użytkownika
      if (req.url === "/me" && req.method === "GET") {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.auth;

        if (!token || !token.startsWith("token-")) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized" }));
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
      //  Obsługa błędów serwera
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
