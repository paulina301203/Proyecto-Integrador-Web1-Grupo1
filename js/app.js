// Transforma caracteres especiales en texto plano inofensivo para el navegador
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

(function () {
  "use strict";

  const sessionKey = "gatogo_api_demo_session";

  function session() {
    try {
      return JSON.parse(sessionStorage.getItem(sessionKey)) || null;
    } catch {
      return null;
    }
  }

  async function validarUsuario(correo, contrasena) {
  const email = correo.trim().toLowerCase();
  const url = new URL(
    "https://6ae601ec877d34ccafc29a11.mockapi.io/gatogousers/user"
  );
  url.searchParams.set("email", email);

  const respuesta = await fetch(url);

  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new Error("No se pudo consultar la API de usuarios.");

  const usuarios = await respuesta.json();

  return usuarios.find(
    (usuario) =>
      usuario.email?.trim().toLowerCase() === email &&
      usuario.password === contrasena
  ) ?? null;
}
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
              ${s
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
                  </a>`}
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

  function login() {
    if (document.body.dataset.page !== "login") return;

    const formulario = document.querySelector("#auth-form");
    const mensaje = document.querySelector("#status");
    const boton = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (boton.disabled || !formulario.reportValidity()) return;

      const correo = formulario.elements
        .namedItem("email")
        .value.trim()
        .toLowerCase();

      const contrasena = formulario.elements
        .namedItem("password")
        .value;

      boton.disabled = true;
      boton.textContent = "Ingresando...";
      mensaje.textContent = "Consultando usuario...";

      try {
        const usuario = await validarUsuario(correo, contrasena);
      
        if (!usuario) {
          mensaje.textContent = "Correo o contraseña incorrectos.";
          return;
        }

        const datosSesion = {
          id: usuario.id_User,
          name: usuario.name,
          email: usuario.email
        };

        sessionStorage.setItem(
          sessionKey,
          JSON.stringify(datosSesion)
        );

        formulario.elements.namedItem("password").value = "";

        window.location.href = "home.html";

      } catch (error) {
        mensaje.textContent =
          "No se pudo iniciar sesión. Intenta nuevamente.";

      } finally {
        boton.disabled = false;
        boton.textContent = "Iniciar sesión";
      }
    });
  }

function registro() {
  if (document.body.dataset.page !== "registro") return;

  const formulario = document.querySelector("#auth-form");
  const mensaje = document.querySelector("#status");
  const boton = formulario.querySelector('button[type="submit"]');

  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (boton.disabled || !formulario.reportValidity()) return;

    const campo = (nombre) =>
      formulario.elements.namedItem(nombre).value;

    const datosUsuario = {
      name: campo("name").trim(),
      last_name: campo("last_name").trim(),
      email: campo("email").trim().toLowerCase(),
      cel_phone: campo("cel_phone").trim(),
      password: campo("password")
    };

    if (!datosUsuario.name || !datosUsuario.last_name) {
      mensaje.textContent = "Escribe tu nombre y apellido.";
      return;
    }

    boton.disabled = true;
    boton.textContent = "Registrando...";
    mensaje.textContent = "Comprobando el correo...";

    try {
      const usuarios = await obtenerUsuarios();

      if (!Array.isArray(usuarios)) {
        mensaje.textContent =
          "No se pudo consultar la API. Intenta nuevamente.";
        return;
      }

      const correoExiste = usuarios.some((usuario) =>
        usuario &&
        String(usuario.email ?? "").trim().toLowerCase() ===
          datosUsuario.email
      );

      if (correoExiste) {
        mensaje.textContent =
          "Ese correo ya está registrado. Inicia sesión.";
        return;
      }

      mensaje.textContent = "Guardando tu cuenta...";

      await crearUsuario(datosUsuario);

      formulario.reset();
      mensaje.textContent = "Cuenta creada correctamente. ";

      const enlace = document.createElement("a");
      enlace.href = "login.html";
      enlace.textContent = "Ahora puedes iniciar sesión.";
      mensaje.appendChild(enlace);

    } catch (error) {
      mensaje.textContent =
        "No se pudo confirmar el registro. Intenta iniciar sesión antes de volver a registrarte.";

    } finally {
      boton.disabled = false;
      boton.textContent = "Registrarme";
    }
  });
}
  function iniciar() {
  nav();
  login();
  registro();
}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

})();;

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
}

// Obtener lo datos de la API para las tarejtas
async function datosAPI() {
  const [datosGatos, datosAvistamientos, datosUbicaciones] = await Promise.all([
    fetch(window.GatoGoConfig.api.gatos),
    fetch(window.GatoGoConfig.api.Avistamientos),
    fetch(window.GatoGoConfig.api.Ubicaciones),
  ]);
  if (!datosGatos.ok || !datosAvistamientos.ok || !datosUbicaciones.ok) {
    throw new Error("Error al consultar una o más APIs de MockAPI.");
  }

  // convertirmos datos
  const gatos = await datosGatos.json();
  const avistamientos = await datosAvistamientos.json();
  const ubicaciones = await datosUbicaciones.json();

  // copiamos el arreglo gatos
  return gatos.map((gato) => {
    //busqueda del gato en especifico relacionado por id
    const historial = avistamientos.filter((a) => a.id_gato === gato.id);

    const ultimoSighting = historial[historial.length - 1];
    let ubicacionDetalle = null;

    if (ultimoSighting) {
      // Buscamos el objeto de ubicación que coincida con la llave foránea
      ubicacionDetalle = ubicaciones.find(
        (u) =>
          u.Idubicacion === ultimoSighting.id_ubicacion ||
          u.id === ultimoSighting.id_ubicacion,
      );
    }

    return {
      ...gato,
      totalAvistamientos: historial.length,
      ultimaFecha: ultimoSighting ? ultimoSighting.fecha : null,
      ultimaUbicacion: ubicacionDetalle,
    };
  });
}

function cards(gato) {
  const imagen =
    gato.imagenes && gato.imagenes[0]
      ? gato.imagenes[0]
      : window.GatoGoConfig.examplePhoto;

  const esFotoEjemplo = imagen === window.GatoGoConfig.examplePhoto;

  // Lógica de formateo condicional para la tarjeta
  const textoUbicacion = gato.ultimaUbicacion
    ? `${gato.ultimaUbicacion.Barrio}, ${gato.ultimaUbicacion.Ciudad}`
    : "Sin avistamientos";

  const textoMeta =
    gato.totalAvistamientos > 0
      ? `${gato.totalAvistamientos} avistamiento(s) · ${gato.ultimaFecha}`
      : "0 avistamientos";

  return `
    <article class="card cat">
      <a class="image-wrap" href="captura.html?id=${esc(gato.id)}" aria-label="Ver captura de ${esc(gato.Nombre_Gato)}">
        <img src="${esc(imagen)}" alt="Foto de ${esc(gato.Nombre_Gato)}" loading="lazy">
      </a>
      <div class="body">
        <div class="top">
          <h2>${esc(gato.Nombre_Gato)}</h2>
          <span class="chip">${esc(gato.Color)}</span>
        </div>
        <p class="desc">${esc(gato.Descripcion)}</p>
        <a class="btn btn-outline" href="captura.html?id=${esc(gato.id)}">Ver captura</a>
      </div>
    </article>
  `;
}

async function cargarCards() {
  const contenedor = document.querySelector("#list");

  try {
    contenedor.innerHTML = '<p class="status">Cargando capturas...</p>';

    const gatosCompletos = await obtenerDatosCompletos();

    const htmlTarjetas = gatosCompletos.map((gato) => cards(gato)).join("");

    contenedor.innerHTML = htmlTarjetas;
  } catch (error) {
    contenedor.innerHTML = `<p class="status error">Hubo un problema al cargar los gatos: ${esc(error.message)}</p>`;
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarCards);
} else {
  cargarCards();
}
