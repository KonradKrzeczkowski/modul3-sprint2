import { join } from "path";
import { readFile } from "fs/promises";

const usersFilePath = join(__dirname, "..", "db", "cars.json");
async function getCars() {
  try {
    const data = await readFile(usersFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Błąd podczas odczytu cars.json:", err);
    throw err;
  }
}

export default getCars;