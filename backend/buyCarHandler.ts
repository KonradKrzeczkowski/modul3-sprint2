import { IncomingMessage, ServerResponse } from "http";
import getUsers from "./getUsers";
import { User, Car } from "./types";
import { join } from "path";
import getCars from "./getCars";
import { writeFile } from "fs/promises";
import { sendEvent } from "./sse";

const carsFilePath = join(__dirname, "..", "db", "cars.json");
const usersFilePath = join(__dirname, "..", "db", "users.json");

async function saveUsers(users: User[]) {
  await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
}
async function saveCars(cars: Car[]) {
  await writeFile(carsFilePath, JSON.stringify(cars, null, 2), "utf-8");
}
async function buyCarHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.url === "/buy" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    try {
      const { userId, carId } = JSON.parse(body);
      if (!userId || !carId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Brak wymaganych danych" }));
        return;
      }
      const users = await getUsers();
      const cars = await getCars();
      const userIndex = users.findIndex((u: User) => u.id === userId);
      const carIndex = cars.findIndex((c: Car) => c.id === carId);
      if (userIndex === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Nie znaleziono użytkownika" }));
        return;
      }
      if (carIndex === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Nie znaleziono auta" }));
        return;
      }
      const user = users[userIndex];
      const car = cars[carIndex];
      if (typeof car.price !== "number") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Nieprawidłowa cena auta" }));
        return;
      }
      if (user.balance < car.price) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Niewystarczające środki" }));
        return;
      }
      if (car.status === "sold") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Auto już sprzedane" }));
        return;
      }
      user.balance -= car.price;
      car.ownerId = user.id;
      car.status = "sold";
      await saveUsers(users);
      await saveCars(cars);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Zakup zakończony sukcesem", user, car })
      );
      sendEvent({
        event: "carPurchased",
        carId: car.id,
        buyerId: user.id,
        model: car.model,
      });
    } catch (error) {
      console.error("Błąd w buyCarHandler:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Błąd serwera" }));
    }
  }
}

export default buyCarHandler;
