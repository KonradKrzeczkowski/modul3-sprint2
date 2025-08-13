import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import { addClient } from "./sse";
import getUserPg from "./getUsersPg"; 
import crudCarsPg from "./crudCarsPg";
import crudUsersPg from "./crudUserPg";
import buyCarHandler from "./buyCarHandlerPg";
import regLogHandler from "./regLogPg";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, "..", "frontend");

app.use(express.json());
app.use("/static", express.static(frontendDir));

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, val] = cookie.trim().split("=");
    acc[key] = val;
    return acc;
  }, {} as Record<string, string>);
}


function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.auth;

  if (!token || !token.startsWith("token-")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = token.slice("token-".length);
  (req as any).userId = userId;
  next();
}

// Endpointy

app.get("/check-auth", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const user = await getUserPg(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.get("/me", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const user = await getUserPg(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// CRUD Users
app.route("/users")
  .get(crudUsersPg)  
  .post(crudUsersPg);

app.route("/users/:id")
  .get(crudUsersPg)    
  .put(crudUsersPg)    
  .delete(crudUsersPg);

// CRUD Cars
app.route("/cars")
  .get(crudCarsPg)  
  .post(crudCarsPg);

app.route("/cars/:id")
  .get(crudCarsPg)  
  .put(crudCarsPg)   
  .delete(crudCarsPg);

app.post("/login", regLogHandler);
app.post("/register", regLogHandler);

app.post("/buy", buyCarHandler);

app.get("/sse", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write(": ping\n\n");
  addClient(res, req);
});

app.get("/", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

