import { IncomingMessage } from "http";
import getUsers from "./getUsers";
import { User } from "./types";

export async function getAuthUser(req: IncomingMessage): Promise<User | null> {
  const cookie = req.headers.cookie || "";
  const token = cookie.split(";").find((c) => c.trim().startsWith("auth="))?.split("=")[1];

  if (!token || !token.startsWith("token-")) return null;

  const userId = token.slice("token-".length);
  const users = await getUsers();
  return users.find((u:User) => u.id === userId) || null;
}