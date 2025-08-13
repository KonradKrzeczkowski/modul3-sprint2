import { IncomingMessage, ServerResponse } from "http";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { User } from "./types";
import { getAuthUser } from "./getAuthUser";
const usersFilePath = join(__dirname, "..", "db", "users.json");
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
function getUserIdFromToken(token: string): string | null {
  if (!token.startsWith("token-")) return null;
  return token.slice("token-".length);
}
async function crudUser(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const id = url.pathname.split("/")[2];

  async function getUsers() {
    const data = await readFile(usersFilePath, "utf-8");
    return JSON.parse(data);
  }

  async function saveUsers(users: any[]) {
    await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
  }

  // GET /users
  if (url.pathname === "/users" && req.method === "GET") {
    const users = await getUsers();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
    return;
  }

  // POST /users
  if (url.pathname === "/users" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const newUser = JSON.parse(body);
      const users = await getUsers();
      const newId = `user_${Date.now()}`;
      newUser.id = newId;
      users.push(newUser);
      await saveUsers(users);
      res.writeHead(201);
      res.end(JSON.stringify(newUser));
    });
    return;
  }

  // GET /users/:id
  if (id && url.pathname.startsWith("/users/") && req.method === "GET") {
    const users = await getUsers();
    const user = users.find((u: User) => u.id === id);
    if (user) {
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ message: "User not found" }));
    }
    return;
  }

  // PUT /users/:id
  if (id && url.pathname.startsWith("/users/") && req.method === "PUT") {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const isAdmin = authUser.role === "admin";
    const isOwner = authUser.id === id;
    if (!isAdmin && !isOwner) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Brak uprawnień" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const updatedUser = JSON.parse(body);
        const users = await getUsers();
        const index = users.findIndex((u: User) => u.id === id);

        if (index === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "User not found" }));
          return;
        }

        if (
          !isAdmin &&
          updatedUser.role &&
          updatedUser.role !== users[index].role
        ) {
          delete updatedUser.role;
        }

        if (updatedUser.action === "add_balance") {
          updatedUser.balance = (users[index].balance || 0) + 5000;
          delete updatedUser.action;
        } else {
          updatedUser.balance = users[index].balance;
        }

        users[index] = {
          ...users[index],
          ...updatedUser,
          id: users[index].id,
        };

        await saveUsers(users);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(users[index]));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // DELETE /users/:id
  if (id && url.pathname.startsWith("/users/") && req.method === "DELETE") {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const isAdmin = authUser.role === "admin";
    const isOwner = authUser.id === id;
    if (!isAdmin && !isOwner) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: "Brak uprawnień" }));
      return;
    }

    const users = await getUsers();
    const index = users.findIndex((u: User) => u.id === id);
    if (index !== -1) {
      const deletedUser = users.splice(index, 1)[0];
      await saveUsers(users);
      res.end(JSON.stringify(deletedUser));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ message: "User not found" }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ message: "Route not found" }));
}
export default crudUser;
