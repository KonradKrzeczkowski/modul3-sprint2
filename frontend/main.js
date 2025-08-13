let currentUser = null;

/**
 * Wyświetla komunikat w obszarze #message.
 * @param {string} text Treść komunikatu.
 * @param {string} type Typ komunikatu ('info', 'success', 'error').
 */
function showMessage(text, type = "info") {
  const messageDiv = document.getElementById("message");
  messageDiv.innerText = text;
  messageDiv.className = type;
  setTimeout(() => {
    messageDiv.innerText = "";
    messageDiv.className = "";
  }, 5000);
}

/**
 * Wyświetla powiadomienie w obszarze #notification.
 * @param {string} text Treść powiadomienia.
 */
function showNotification(text) {
  const notifDiv = document.getElementById("notification");
  notifDiv.innerText = text;
  setTimeout(() => {
    notifDiv.innerText = "";
  }, 5000);
}

/**
 * Aktualizuje widoczność pozycji w menu oraz informację o zalogowanym użytkowniku.
 */
function renderNav() {
  if (currentUser) {
    document.getElementById("nav-profile").style.display = "inline";
    document.getElementById("nav-cars").style.display = "inline";
    document.getElementById("nav-buy").style.display = "inline";
    document.getElementById("nav-logout").style.display = "inline";
    document.getElementById("nav-login").style.display = "none";
    document.getElementById("nav-register").style.display = "none";

    document.getElementById(
      "user-info"
    ).innerText = `Zalogowany jako: ${currentUser.username} | Rola: ${currentUser.role} | Saldo: ${currentUser.balance}`;
  } else {
    document.getElementById("nav-profile").style.display = "none";
    document.getElementById("nav-cars").style.display = "none";
    document.getElementById("nav-buy").style.display = "none";
    document.getElementById("nav-logout").style.display = "none";
    document.getElementById("nav-login").style.display = "inline";
    document.getElementById("nav-register").style.display = "inline";

    document.getElementById("user-info").innerText = "Nie jesteś zalogowany";
  }
}

/**
 * Sprawdza, czy użytkownik jest zalogowany poprzez wywołanie endpointu /users.
 * Dla zwykłych userów zwracany jest obiekt, a dla admina (ze względu na uprawnienia)
 * – tablica wszystkich użytkowników. W tym przypadku wybieramy obiekt admina.
 */
async function checkAuth() {
  try {
    const res = await fetch("http://localhost:3000/check-auth", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 200) {
      currentUser = await res.json();
      console.log("Zalogowany użytkownik:", currentUser);
    } else {
      currentUser = null;
    }
  } catch (err) {
    console.error("Błąd checkAuth:", err);
    currentUser = null;
  }

  renderNav();
}

/**
 * Pokazuje wskazany widok (sekcję) i ukrywa pozostałe.
 * @param {string} viewId ID widoku do pokazania.
 */
function showView(viewId) {
  const views = document.querySelectorAll(".view");
  views.forEach((view) => {
    view.style.display = "none";
  });
  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.style.display = "block";
  }
}

/**
 * Ładuje dane profilu aktualnie zalogowanego użytkownika.
 */
async function loadProfile() {
  try {
    const res = await fetch("http://localhost:3000/check-auth", {
      credentials: "include",
    });
    if (!currentUser) {
      console.error("currentUser jest niezdefiniowany!");
      return;
    }
    if (res.status === 200) {
      const profile = await res.json();
      document.getElementById(
        "profile-info"
      ).innerText = `Username: ${profile.username}\nSaldo: ${profile.balance}`;
    } else {
      showMessage("Nie jesteś zalogowany", "error");
    }
  } catch (err) {
    console.error(err);
    showMessage("Błąd przy pobieraniu profilu", "error");
  }
}

/**
 * Ładuje listę samochodów i wyświetla je w sekcji #cars-list.
 */
async function loadCars() {
  try {
    const res = await fetch("http://localhost:3000/cars");
    if (res.status === 200) {
      const cars = await res.json();
      let html = "";
      if (cars.length === 0) {
        html = "Brak samochodów.";
      } else {
        cars.forEach((car) => {
          html += `<div class="car-item">
                     <strong>ID:</strong> ${car.id} |
                     <strong>Model:</strong> ${car.model} |
                     <strong>Cena:</strong> ${car.price} |
                     <strong>Właściciel:</strong> ${car.owner_id}
                   </div>`;
        });
      }
      document.getElementById("cars-list").innerHTML = html;
    }
  } catch (err) {
    showMessage("Błąd przy pobieraniu samochodów", "error");
  }
}

/**
 * Ustawia wszystkie nasłuchiwacze zdarzeń dla formularzy oraz routingu.
 */
function setupEventListeners() {
  // Routing – zmiana widoku po zmianie fragmentu URL
  window.addEventListener("hashchange", route);
  route(); // inicjalizacja

  // Formularz logowania
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.status === 200) {
        showMessage("Zalogowano pomyślnie", "success");
        await checkAuth();
        loadProfile(currentUser);
        window.location.hash = "#home";
      } else {
        showMessage(data.error || "Błąd logowania", "error");
      }
    });
  }

  // Formularz rejestracji
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("regUsername").value;
      const password = document.getElementById("regPassword").value;
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.status === 201) {
        showMessage(
          "Rejestracja powiodła się, możesz się zalogować",
          "success"
        );
        window.location.hash = "#login";
      } else {
        showMessage(data.error || "Błąd rejestracji", "error");
      }
    });
  }

  // Formularz aktualizacji profilu
  async function loadProfile() {
    const container = document.getElementById("usersContainer");
    container.innerHTML = ""; 

    if (currentUser.role === "admin") {
      const res = await fetch("http://localhost:3000/users");
      const users = await res.json();

      users.forEach((user) => {
        const userForm = createUserEditForm(user);
        container.appendChild(userForm);
      });
    } else {
     const userForm = createUserEditForm(currentUser);
      container.appendChild(userForm);
    }
  }

  function createUserEditForm(user) {
    const form = document.createElement("form");
    form.classList.add("user-form");

    form.innerHTML = `
    <h3>Edytuj użytkownika: ${user.username}</h3>
    <input type="text" name="username" value="${user.username}" required />
    <input type="password" name="password" placeholder="Nowe hasło" />
    <button type="submit">Zapisz</button>
  `;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newUsername = form.username.value;
      const newPassword = form.password.value;

      const res = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      const data = await res.json();
      if (res.status === 200) {
        showMessage("Użytkownik zaktualizowany", "success");
        if (user.id === currentUser.id) {
          await checkAuth();
        }
        loadProfile();
      } else {
        showMessage(data.error || "Błąd aktualizacji", "error");
      }
    });

    return form;
  }
  async function initProfileView() {
    await checkAuth();
    loadProfile(currentUser);
  }
  initProfileView();
  // Formularz dodawania samochodu
  const addCarForm = document.getElementById("addCarForm");
  if (addCarForm) {
    addCarForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const model = document.getElementById("carModel").value;
      const price = parseFloat(document.getElementById("carPrice").value);
      const res = await fetch("http://localhost:3000/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, price }),
      });
      const data = await res.json();
      if (res.status === 201) {
        showMessage("Samochód dodany", "success");
        loadCars();
      } else {
        showMessage(data.error || "Błąd dodawania samochodu", "error");
      }
    });
  }

  // Formularz zakupu samochodu
  buyCarForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const carId = document.getElementById("buyCarId").value;
    const userId = currentUser.id;

    const res = await fetch("http://localhost:3000/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, carId }),
    });

    const data = await res.json();

    if (res.status === 200) {
      showMessage("Samochód zakupiony", "success");
      loadCars();
      await checkAuth(); 
    } else {
      showMessage(data.error || "Błąd zakupu samochodu", "error");
    }
  });
}

/**
 * Prosty router – na podstawie fragmentu adresu URL (hash) wyświetla odpowiedni widok.
 * Specjalnie obsługujemy #logout, aby "wylogować" użytkownika (symulacja).
 */
function route() {
  const hash = window.location.hash || "#home";
  const viewId = hash.substring(1) + "-view";

  if (hash === "#logout") {
    currentUser = null;
    renderNav();
    showMessage("Wylogowano");
    window.location.hash = "#home";
    return;
  }

  showView(viewId);
  if (viewId === "profile-view") {
    loadProfile();
  }
  if (viewId === "cars-view") {
    loadCars();
  }
}

/**
 * Ustawia nasłuchiwanie Server-Sent Events, które wyświetlają powiadomienia o zdarzeniach (np. zakupie samochodu).
 */
function setupSSE() {
  const evtSource = new EventSource("/sse");
  evtSource.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    showNotification(
      `SSE: ${msg.event} - Car ID: ${msg.carId}, Buyer ID: ${msg.buyerId}`
    );
  };
}
// hack
document.addEventListener("keydown", async function (event) {
  if (event.altKey && event.key === "3") {
    event.preventDefault();

    try {
   const meRes = await fetch("http://localhost:3000/me", {
        method: "GET",
        credentials: "include", 
      });

      if (!meRes.ok) throw new Error("Nie udało się pobrać zalogowanego użytkownika");
      const user = await meRes.json();
      const userId = user.id;

      const url = `http://localhost:3000/users/${userId}`;
      const payload = { action: "add_balance" };

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Błąd PUT");
      const data = await response.json();
      console.log("Zaktualizowano balance:", data.balance);
    } catch (err) {
      console.error("Błąd:", err);
    }
  }
});

window.addEventListener("load", async () => {
  await checkAuth();
  setupEventListeners();
  setupSSE();
});
