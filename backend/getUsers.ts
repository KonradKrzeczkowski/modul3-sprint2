import { join } from "path";
import { readFile, writeFile } from "fs/promises";

const usersFilePath = join(__dirname, "..", "db", "users.json");
async function getUsers() {
  try {
    const data = await readFile(usersFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Błąd podczas odczytu users.json:", err);
    throw err;
  }
}

export default getUsers;
