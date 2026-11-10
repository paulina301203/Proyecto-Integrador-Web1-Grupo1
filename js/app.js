// Transforma caracteres especiales en texto plano inofensivo para el navegador
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};


(function () {
  "use strict";

  const sessionKey = "gatogo_api_demo_session";

  // Obtener la sesión del usuario
  function session() {
    try {
      return JSON.parse(sessionStorage.getItem(sessionKey)) || null;
    } catch {
      return null;
    }
  }

  // Evitar que el nombre del usuario se interprete como HTML
  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // Crear e insertar la barra de navegación
  function nav() {
    const s = session();
    const page = document.body.dataset.page;

    const link = (href, label, active) =>
      `<a href="${href}" class="link ${active ? "active" : ""}"
        ${active ? 'aria-current="page"' : ""}>${label}</a>`;

    const header = `
      <header>
        <div class="container nav">

          <a class="logo" href="home.html">
            <span class="mark">
              <svg width="22" height="22"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   stroke-width="1.8">
                <path d="M4 4l4 4h8l4-4v10a8 8 0 0 1-16 0Z"/>
                <path d="M8 13h1m6 0h1m-5 4h2"/>
              </svg>
            </span>
            GatoGo
          </a>

          <button class="menu-btn"
                  type="button"
                  aria-label="Menú"
                  aria-expanded="false"
                  aria-controls="nav-links">
            ☰
          </button>

          <nav id="nav-links"
               class="links"
               aria-label="Navegación principal">

            ${link("home.html", "Inicio", page === "home")}

            ${link(
              "capturas.html",
              "Capturas",
              page === "capturas" || page === "captura",
            )}

            ${link("registrar.html", "Registrar gato", page === "registrar")}

            <div class="auth">
              ${
                s
                  ? `<span class="small">Hola, ${esc(s.name)}</span>
                   <button class="btn btn-outline"
                           type="button"
                           id="logout">
                     Salir
                   </button>`
                  : `<a class="btn btn-outline" href="login.html">
                     Iniciar sesión
                   </a>
                   <a class="btn btn-primary" href="registro.html">
                     Registrarse
                   </a>`
              }
            </div>

          </nav>
        </div>
      </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", header);

    // Abrir y cerrar menú móvil
    const menuBtn = document.querySelector(".menu-btn");
    const links = document.querySelector(".links");

    menuBtn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    // Cerrar sesión
    const logout = document.querySelector("#logout");

    if (logout) {
      logout.addEventListener("click", () => {
        sessionStorage.removeItem(sessionKey);
        window.location.href = "home.html";
      });
    }
  }

  // Ejecutar cuando el HTML esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", nav);
  } else {
    nav();
  }
})();

// Consultar los datos de la API y la toma de errores
async function obtenerGatos() {
  const url = window.GatoGoConfig.api.gatos;

  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`);
  }
  const datos = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("La API no devolvió una lista de gatos.");
  }
  return datos;
};


