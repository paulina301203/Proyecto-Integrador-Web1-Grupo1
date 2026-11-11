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
    const url = new URL(window.GatoGoConfig.api.usuarios);
    url.searchParams.set("email", email);

    const respuesta = await fetch(url);

    if (respuesta.status === 404) return null;
    if (!respuesta.ok)
      throw new Error("No se pudo consultar la API de usuarios.");

    const usuarios = await respuesta.json();

    const usuario = usuarios.find(
      (usuario) => usuario.email.trim().toLowerCase() === email,
    );
    //Muestra que la contrasena o correo es incorrecta
    if (!usuario || usuario.password !== contrasena) {
      return { ok: false, error: "Correo o contraseña incorrectos" };
    }

    const { password, ...datosSesion } = usuario;

    return {
      ok: true,
      usuario: datosSesion,
    };
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

      const contrasena = formulario.elements.namedItem("password").value;

      boton.disabled = true;
      boton.textContent = "Ingresando...";
      mensaje.textContent = "Consultando usuario...";

      try {
        const respuesta = await validarUsuario(correo, contrasena);

        if (!respuesta.ok) {
          mensaje.textContent = respuesta.error;
          return;
        }

        //traemos la respuesta
        const sesion = respuesta.usuario;

        const datosSesion = {
          id: sesion.id || sesion.id_User,
          name: sesion.name,
          email: sesion.email,
        };

        sessionStorage.setItem(sessionKey, JSON.stringify(datosSesion));

        formulario.elements.namedItem("password").value = "";

        window.location.href = "home.html";
      } catch (error) {
        console.error("Error capturado en login:", error);
        mensaje.textContent = "No se pudo iniciar sesión. Intenta nuevamente.";
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

      const campo = (nombre) => formulario.elements.namedItem(nombre).value;

      const datosUsuario = {
        name: campo("name").trim(),
        last_name: campo("last_name").trim(),
        email: campo("email").trim().toLowerCase(),
        cel_phone: campo("cel_phone").trim(),
        password: campo("password"),
      };

      if (!datosUsuario.name || !datosUsuario.last_name) {
        mensaje.textContent = "Escribe tu nombre y apellido.";
        return;
      }

      const regex = {
        email:
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
        password:
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/,
        cel_phone: /^\+?[1-9]\d{9}$/,
      };

      if (!regex.email.test(datosUsuario.email)) {
        mensaje.textContent = "El formato del correo electrónico no es válido.";
        return;
      }

      if (!regex.password.test(datosUsuario.password)) {
        mensaje.textContent =
          "La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y un símbolo.";
        return;
      }

      if (
        datosUsuario.cel_phone &&
        !regex.cel_phone.test(datosUsuario.cel_phone)
      ) {
        mensaje.textContent =
          "El número telefónico debe contener solo dígitos (entre 7 y 15).";
        return;
      }

      boton.disabled = true;
      boton.textContent = "Registrando...";
      mensaje.textContent = "Verificando datos locales...";

      try {
        const usuariosLocales =
          JSON.parse(localStorage.getItem("gatogo_usuarios")) || [];
        const correoExisteLocal = usuariosLocales.some(
          (usuario) =>
            usuario &&
            String(usuario.email ?? "")
              .trim()
              .toLocaleLowerCase() === datosUsuario.email,
        );

        if (correoExisteLocal) {
          mensaje.textContent =
            "Ese correo ya está registrado localmente. Inicia sesión.";
          return;
        }
        const urlBusqueda = new URL(window.GatoGoConfig.api.usuarios);
        urlBusqueda.searchParams.set("email", datosUsuario.email);

        const respuesta = await fetch(urlBusqueda);

        if (!respuesta.ok) {
          mensaje.textContent =
            "No se pudo consultar la API. Intenta nuevamente.";
          return;
        }

        const usuariosAPI = await respuesta.json();

        const correoExisteAPI = usuariosAPI.some(
          (usuario) =>
            usuario &&
            String(usuario.email ?? "")
              .trim()
              .toLowerCase() === datosUsuario.email,
        );

        if (correoExisteAPI) {
          mensaje.textContent =
            "Ese correo ya está registrado en la base de datos. Inicia sesión.";
          return;
        }

        mensaje.textContent = "Guardando tu cuenta...";

        async function crearUsuario(datosUsuario) {
          const usuariosLocales =
            JSON.parse(localStorage.getItem("gatogo_usuarios")) || [];

          const idUnico =
            window.crypto && crypto.randomUUID
              ? crypto.randomUUID()
              : Date.now().toString(36) +
                Math.random().toString(36).substring(2);

          const nuevoUsuario = {
            id: idUnico,
            ...datosUsuario,
            createdAt: new Date().toISOString(), 
          };

          usuariosLocales.push(nuevoUsuario);

          localStorage.setItem(
            "gatogo_usuarios",
            JSON.stringify(usuariosLocales),
          );

          return nuevoUsuario;
        }

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
        boton.textContent = "Registrarme";
        boton.disabled = false;
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
        ${esFotoEjemplo ? '<span class="example">Foto de ejemplo</span>' : ""}
      </a>
      <div class="body">
        <div class="top">
          <h2>${esc(gato.Nombre_Gato)}</h2>
          <span class="chip">${esc(gato.Color)}</span>
        </div>
        <p class="desc">${esc(gato.Descripcion)}</p>
        
        <p class="loc">${esc(textoUbicacion)}</p>
        <p class="meta">${esc(textoMeta)}</p>
        
        <a class="btn btn-outline" href="captura.html?id=${esc(gato.id)}">
          Ver captura <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  `;
}

async function cargarCards() {
  const contenedor = document.querySelector("#list");
  if (!contenedor) return;

  try {
    contenedor.innerHTML = '<p class="status">Cargando capturas...</p>';

    const gatosCompletos = await datosAPI();

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

async function cargarDetalle() {
  const contenedor = document.querySelector("#capture");
  if (!contenedor) return;

  // 1. Escaneamos la etiqueta de la URL (todo lo que va después del '?')
  const parametros = new URLSearchParams(window.location.search);

  // 2. Extraemos específicamente el valor de la variable "id"
  const idGato = parametros.get("id");

  // 3. Validación de seguridad (Early Return)
  if (!idGato) {
    contenedor.innerHTML =
      '<p class="status error">Selecciona una captura para consultar su información.</p>';
    return; // Detiene la función aquí mismo
  }

  try {
    contenedor.innerHTML = '<p class="status">Cargando captura...</p>';

    // 4. Aquí haremos la petición a la API pidiendo SOLO el gato con ese ID
    // const respuesta = await fetch(`${window.GatoGoConfig.api.gatos}/${idGato}`);
    // const gato = await respuesta.json();

    // Por ahora, solo confirmaremos que lo leímos bien:
    contenedor.innerHTML = `<h1>Ficha técnica del gato #${esc(idGato)}</h1>`;
  } catch (error) {
    contenedor.innerHTML = `<p class="status error">Error: ${esc(error.message)}</p>`;
  }
}

// Ejecutar cuando se cargue la página
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarDetalle);
} else {
  cargarDetalle();
}
