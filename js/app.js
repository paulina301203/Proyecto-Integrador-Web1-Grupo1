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

("use strict");

const sessionKey = "gatogo_api_demo_session";

function session() {
  try {
    return JSON.parse(sessionStorage.getItem(sessionKey)) || null;
  } catch {
    return null;
  }
}

function parsearFecha(textoFechaOriginal) {
  if (!textoFechaOriginal) return null;
  const textoFechaLimpio = String(textoFechaOriginal).trim();
  // Formato DDMMAAAA de 8 dígitos (ej. "01102026")
  if (/^\d{8}$/.test(textoFechaLimpio)) {
    const diaDelMes = textoFechaLimpio.slice(0, 2);
    const mesDelAnio = textoFechaLimpio.slice(2, 4);
    const anioCompleto = textoFechaLimpio.slice(4, 8);
    const fechaObjetoCalculada = new Date(
      `${anioCompleto}-${mesDelAnio}-${diaDelMes}T12:00:00`,
    );
    return isNaN(fechaObjetoCalculada.getTime()) ? null : fechaObjetoCalculada;
  }
  const fechaGenerica = new Date(textoFechaLimpio);
  return isNaN(fechaGenerica.getTime()) ? null : fechaGenerica;
}

function formatearFecha(textoFechaOriginal) {
  if (!textoFechaOriginal) return "";
  const fechaParseada = parsearFecha(textoFechaOriginal);
  return fechaParseada
    ? fechaParseada.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : String(textoFechaOriginal);
}

async function validarUsuario(correo, contrasena) {
  const email = correo.trim().toLowerCase();
  const usuariosLocales =
    JSON.parse(localStorage.getItem("gatogo_usuarios")) || [];

  const usuarioLocal = usuariosLocales.find(
    (usuario) =>
      usuario &&
      String(usuario.email ?? "")
        .trim()
        .toLowerCase() === email,
  );

  if (usuarioLocal) {
    if (usuarioLocal.password === contrasena) {
      const { password, ...datosSesion } = usuarioLocal; // Extraemos todo menos el password
      return { ok: true, usuario: datosSesion };
    } else {
      // Si la contraseña falla, cortamos el proceso. No tiene sentido ir a la API.
      return { ok: false, error: "Correo o contraseña incorrectos" };
    }
  }
  const url = new URL(window.GatoGoConfig.api.usuarios);
  url.searchParams.set("email", email);

  const respuesta = await fetch(url);

  if (respuesta.status === 404) {
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar la API de usuarios.");
  }

  const usuariosAPI = await respuesta.json();

  const usuarioAPI = usuariosAPI.find(
    (usuario) =>
      usuario &&
      String(usuario.email ?? "")
        .trim()
        .toLowerCase() === email,
  );

  if (!usuarioAPI || usuarioAPI.password !== contrasena) {
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }

  const { password, ...datosSesion } = usuarioAPI;

  return { ok: true, usuario: datosSesion };
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

      if (respuesta.status === 404) {
      } else if (!respuesta.ok) {
        mensaje.textContent =
          "No se pudo consultar la API. Intenta nuevamente.";
        return;
      } else {
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
      }

      mensaje.textContent = "Guardando tu cuenta...";

      async function crearUsuario(datosUsuario) {
        const usuariosLocales =
          JSON.parse(localStorage.getItem("gatogo_usuarios")) || [];

        const idUnico =
          window.crypto && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).substring(2);

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
      boton.textContent = "Registrarme";
      boton.disabled = false;
    }
  });
}
function iniciar() {
  nav();
  login();
  registro();

  const paginaActual = document.body.dataset.page;
  if (paginaActual === "capturas" || document.querySelector("#list")) {
    cargarCards();
  } else if (paginaActual === "captura" || document.querySelector("#capture")) {
    cargarDetalle();
  } else if (
    paginaActual === "registrar" ||
    document.querySelector("#cat-form")
  ) {
    registrarGato();
  } else if (
    paginaActual === "home" ||
    document.querySelector("#ultimas-grid")
  ) {
    cargarHome();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}

// Consultar los datos de la API de gatos (solo lectura GET) y combinar con registros locales
async function obtenerGatos() {
  let coleccionGatosLocales = [];
  try {
    const datosGatosLocalesGuardados = localStorage.getItem(
      "gatogo_gatos_locales",
    );
    if (datosGatosLocalesGuardados) {
      coleccionGatosLocales = JSON.parse(datosGatosLocalesGuardados);
      if (!Array.isArray(coleccionGatosLocales)) {
        coleccionGatosLocales = [];
      }
    }
  } catch (errorLecturaGatosLocales) {
    console.error("Error al leer gatos locales:", errorLecturaGatosLocales);
    coleccionGatosLocales = [];
  }

  try {
    const urlEndpointGatos = window.GatoGoConfig.api.gatos;
    const respuestaServidor = await fetch(urlEndpointGatos);

    if (!respuestaServidor.ok) {
      throw new Error(`Error HTTP: ${respuestaServidor.status}`);
    }
    const listaGatosServidor = await respuestaServidor.json();

    if (!Array.isArray(listaGatosServidor)) {
      throw new Error("La API no devolvió una lista de gatos.");
    }
    return [...coleccionGatosLocales, ...listaGatosServidor];
  } catch (errorConsultaServidor) {
    if (coleccionGatosLocales.length > 0) {
      console.warn(
        "No se pudo consultar la API remota, devolviendo registros locales:",
        errorConsultaServidor,
      );
      return coleccionGatosLocales;
    }
    throw errorConsultaServidor;
  }
}

// Obtener los datos de la API para las tarjetas y relacionar avistamientos y ubicaciones
// La API se consulta únicamente mediante peticiones GET (lectura) y se combina con los datos locales
async function datosAPI() {
  let coleccionGatosLocales = [];
  let coleccionAvistamientosLocales = [];

  try {
    const datosGatosLocalesGuardados = localStorage.getItem(
      "gatogo_gatos_locales",
    );
    if (datosGatosLocalesGuardados) {
      coleccionGatosLocales = JSON.parse(datosGatosLocalesGuardados);
      if (!Array.isArray(coleccionGatosLocales)) {
        coleccionGatosLocales = [];
      }
    }
  } catch (errorLecturaGatosLocales) {
    console.error("Error al leer gatos locales:", errorLecturaGatosLocales);
    coleccionGatosLocales = [];
  }

  try {
    const datosAvistamientosLocalesGuardados = localStorage.getItem(
      "gatogo_avistamientos_locales",
    );
    if (datosAvistamientosLocalesGuardados) {
      coleccionAvistamientosLocales = JSON.parse(
        datosAvistamientosLocalesGuardados,
      );
      if (!Array.isArray(coleccionAvistamientosLocales)) {
        coleccionAvistamientosLocales = [];
      }
    }
  } catch (errorLecturaAvistamientosLocales) {
    console.error(
      "Error al leer avistamientos locales:",
      errorLecturaAvistamientosLocales,
    );
    coleccionAvistamientosLocales = [];
  }

  let listadoOriginalGatos = [];
  let listadoOriginalAvistamientos = [];
  let listadoOriginalUbicaciones = [];

  try {
    const [
      respuestaPeticionGatos,
      respuestaPeticionAvistamientos,
      respuestaPeticionUbicaciones,
    ] = await Promise.all([
      fetch(window.GatoGoConfig.api.gatos),
      fetch(window.GatoGoConfig.api.Avistamientos),
      fetch(window.GatoGoConfig.api.Ubicaciones),
    ]);

    if (
      !respuestaPeticionGatos.ok ||
      !respuestaPeticionAvistamientos.ok ||
      !respuestaPeticionUbicaciones.ok
    ) {
      throw new Error("Error al consultar una o más APIs de MockAPI.");
    }

    listadoOriginalGatos = await respuestaPeticionGatos.json();
    listadoOriginalAvistamientos =
      await respuestaPeticionAvistamientos.json();
    listadoOriginalUbicaciones = await respuestaPeticionUbicaciones.json();
  } catch (errorConsultaServidor) {
    console.warn(
      "No se pudo consultar la API remota, usando datos disponibles:",
      errorConsultaServidor,
    );
    if (coleccionGatosLocales.length === 0) {
      throw errorConsultaServidor;
    }
  }

  const coleccionTotalGatos = [
    ...coleccionGatosLocales,
    ...(Array.isArray(listadoOriginalGatos) ? listadoOriginalGatos : []),
  ];

  const coleccionTotalAvistamientos = [
    ...coleccionAvistamientosLocales,
    ...(Array.isArray(listadoOriginalAvistamientos)
      ? listadoOriginalAvistamientos
      : []),
  ];

  let coleccionUbicacionesLocales = [];
  try {
    const datosUbicacionesGuardadas = localStorage.getItem(
      "gatogo_ubicaciones_locales",
    );
    if (datosUbicacionesGuardadas) {
      coleccionUbicacionesLocales = JSON.parse(datosUbicacionesGuardadas);
      if (!Array.isArray(coleccionUbicacionesLocales)) {
        coleccionUbicacionesLocales = [];
      }
    }
  } catch (errorLecturaUbicaciones) {
    console.error(
      "Error al leer ubicaciones locales:",
      errorLecturaUbicaciones,
    );
    coleccionUbicacionesLocales = [];
  }

  const coleccionUbicaciones = [
    ...coleccionUbicacionesLocales,
    ...(Array.isArray(listadoOriginalUbicaciones)
      ? listadoOriginalUbicaciones
      : []),
  ];
  const fotoRespaldoEjemplo = window.GatoGoConfig.examplePhoto;

  return coleccionTotalGatos.map((gatoIndividual) => {
    const identificadorGato = String(
      gatoIndividual.id_gato ?? gatoIndividual.id ?? "",
    );

    // Buscamos los avistamientos relacionados con este gato específico
    const historialAvistamientosGato = coleccionTotalAvistamientos
      .filter((avistamientoActual) => {
        const idGatoAvistamiento = String(
          avistamientoActual.id_gato ?? avistamientoActual.idGato ?? "",
        );
        return idGatoAvistamiento === identificadorGato;
      })
      .sort((avistamientoPrimero, avistamientoSegundo) => {
        const marcaTiempoSegundo =
          parsearFecha(avistamientoSegundo.fecha)?.getTime() || 0;
        const marcaTiempoPrimero =
          parsearFecha(avistamientoPrimero.fecha)?.getTime() || 0;
        return marcaTiempoSegundo - marcaTiempoPrimero;
      });

    const avistamientoMasReciente = historialAvistamientosGato[0] || null;

    let detalleUbicacionReciente = null;
    if (
      avistamientoMasReciente &&
      avistamientoMasReciente.id_ubicacion !== undefined
    ) {
      detalleUbicacionReciente =
        coleccionUbicaciones.find((ubicacionItem) => {
          const idUbicacionItem = String(
            ubicacionItem.Id_ubicacion ??
              ubicacionItem.Idubicacion ??
              ubicacionItem.id ??
              "",
          );
          return (
            idUbicacionItem ===
            String(avistamientoMasReciente.id_ubicacion)
          );
        }) || avistamientoMasReciente.ubicacion || null;
    } else if (avistamientoMasReciente?.ubicacion) {
      detalleUbicacionReciente = avistamientoMasReciente.ubicacion;
    }

    const imagenPrincipalGato =
      gatoIndividual.Foto ||
      gatoIndividual.foto ||
      gatoIndividual.imagen ||
      (Array.isArray(gatoIndividual.imagenes)
        ? gatoIndividual.imagenes[0]
        : null) ||
      fotoRespaldoEjemplo;

    return {
      ...gatoIndividual,
      id_gato: identificadorGato,
      Nombre_Gato:
        gatoIndividual.Nombre_Gato ??
        gatoIndividual.nombre ??
        gatoIndividual.name ??
        `Gato #${identificadorGato}`,
      Color:
        gatoIndividual.Color ??
        gatoIndividual.color ??
        "Sin color registrado",
      Descripcion:
        gatoIndividual.Descripcion ??
        gatoIndividual.descripcion ??
        gatoIndividual.description ??
        "Sin descripción registrada.",
      Foto: imagenPrincipalGato,
      imagenPrincipal: imagenPrincipalGato,
      totalAvistamientos: historialAvistamientosGato.length,
      ultimaFecha:
        avistamientoMasReciente?.fecha ??
        gatoIndividual.Fecha ??
        gatoIndividual.fecha ??
        null,
      ultimaUbicacion: detalleUbicacionReciente,
      ultimoAvistamiento: avistamientoMasReciente,
      historial: historialAvistamientosGato,
    };
  });
}

function cards(gatoInformacion) {
  const nombreGatoSeguro = esc(gatoInformacion.Nombre_Gato || "Gato");
  const colorGatoSeguro = esc(gatoInformacion.Color || "Sin color");
  const descripcionGatoSegura = esc(
    gatoInformacion.Descripcion || "Sin descripción.",
  );
  const identificadorGato =
    gatoInformacion.id_gato || gatoInformacion.id || "";
  const enlaceDetalleCaptura = `captura.html?id=${encodeURIComponent(identificadorGato)}`;

  const rutaFotoEjemplo = window.GatoGoConfig.examplePhoto;
  const imagenFinalGato =
    gatoInformacion.Foto ||
    gatoInformacion.imagenPrincipal ||
    rutaFotoEjemplo;
  const esFotografiaDeEjemplo = imagenFinalGato === rutaFotoEjemplo;

  const cantidadTotalAvistamientos =
    gatoInformacion.totalAvistamientos || 0;
  const textoTotalAvistamientos =
    cantidadTotalAvistamientos === 1 ? "avistamiento" : "avistamientos";
  const textoMetadatosAvistamiento =
    `${cantidadTotalAvistamientos} ${textoTotalAvistamientos}` +
    (gatoInformacion.ultimaFecha
      ? ` · ${formatearFecha(gatoInformacion.ultimaFecha)}`
      : "");

  let textoUbicacionFinal = "Sin avistamientos";
  if (gatoInformacion.ultimaUbicacion) {
    const barrioNombre =
      gatoInformacion.ultimaUbicacion.Barrio ||
      gatoInformacion.ultimaUbicacion.barrio;
    const ciudadNombre =
      gatoInformacion.ultimaUbicacion.Ciudad ||
      gatoInformacion.ultimaUbicacion.ciudad;
    const departamentoNombre =
      gatoInformacion.ultimaUbicacion.Departamento ||
      gatoInformacion.ultimaUbicacion.departamento;

    const partesUbicacion = [
      barrioNombre,
      ciudadNombre,
      departamentoNombre,
    ].filter(Boolean);
    if (partesUbicacion.length > 0) {
      textoUbicacionFinal = partesUbicacion.join(", ");
    } else {
      textoUbicacionFinal =
        gatoInformacion.ultimaUbicacion.Direccion ||
        gatoInformacion.ultimaUbicacion.direccion ||
        "Ubicación disponible";
    }
  } else if (gatoInformacion.ultimoAvistamiento?.id_ubicacion) {
    textoUbicacionFinal = `Ubicación #${gatoInformacion.ultimoAvistamiento.id_ubicacion}`;
  }

  return `
    <article class="card cat">

      <a class="image-wrap"
         href="${enlaceDetalleCaptura}"
         aria-label="Ver captura de ${nombreGatoSeguro}">

        <img
          src="${esc(imagenFinalGato)}"
          alt="${nombreGatoSeguro}"
          width="1024"
          height="768"
          loading="lazy"
          onerror="this.onerror=null;this.src='${esc(rutaFotoEjemplo)}';if(!this.parentElement.querySelector('.example')){this.insertAdjacentHTML('afterend','<span class=\\'example\\'>Foto de ejemplo</span>');}"
        >

        ${esFotografiaDeEjemplo ? '<span class="example">Foto de ejemplo</span>' : ""}

      </a>

      <div class="body">

        <div class="top">
          <h2>${nombreGatoSeguro}</h2>
          <span class="chip">${colorGatoSeguro}</span>
        </div>

        <p class="desc">${descripcionGatoSegura}</p>

        <p class="loc">${esc(textoUbicacionFinal)}</p>

        <p class="meta">${esc(textoMetadatosAvistamiento)}</p>

        <a class="btn btn-outline" href="${enlaceDetalleCaptura}">
          Ver captura
          <span aria-hidden="true">↗</span>
        </a>

      </div>
    </article>
  `;
}

let coleccionCompletaGatosMemoria = [];

async function cargarCards() {
  const contenedorListaTarjetas = document.querySelector("#list");
  if (!contenedorListaTarjetas) return;

  const elementoContadorRegistros = document.querySelector("#count");
  const elementoEstadoMensaje = document.querySelector("#status");
  const elementoConteoResultados = document.querySelector("#result-count");
  const campoBusquedaTexto = document.querySelector("#q");
  const selectElementoColor = document.querySelector("#color");

  const sesionUsuarioActiva = session();

  // El botón/selector de color se mantiene activo en la interfaz
  if (selectElementoColor) {
    selectElementoColor.disabled = false;
  }

  try {
    if (elementoEstadoMensaje) {
      elementoEstadoMensaje.textContent = "Cargando capturas...";
    }
    contenedorListaTarjetas.innerHTML = '<p class="status">Cargando capturas...</p>';

    coleccionCompletaGatosMemoria = await datosAPI();

    

    if (elementoEstadoMensaje) {
      elementoEstadoMensaje.textContent = "";
    }

    if (
      !coleccionCompletaGatosMemoria ||
      coleccionCompletaGatosMemoria.length === 0
    ) {
      contenedorListaTarjetas.innerHTML = `
        <div class="empty">
          <h2>Aún no hay capturas</h2>
          <p class="muted">No se encontraron gatos registrados.</p>
          <div class="actions" style="justify-content:center;margin-top:24px">
            <a class="btn btn-primary" href="registrar.html">Registrar gato</a>
          </div>
        </div>
      `;
      if (elementoContadorRegistros) {
        elementoContadorRegistros.textContent = "0 gatos registrados";
      }
      return;
    }

    // Calcular estadísticas globales
    const numeroTotalAvistamientos = coleccionCompletaGatosMemoria.reduce(
      (acumuladorTotal, gatoActual) =>
        acumuladorTotal + (gatoActual.totalAvistamientos || 0),
      0,
    );

    if (elementoContadorRegistros) {
      elementoContadorRegistros.textContent = `${coleccionCompletaGatosMemoria.length} gatos · ${numeroTotalAvistamientos} avistamientos`;
    }

    // Botón/selector para filtrar "Todas las capturas" o "Mis capturas" (se mantiene activo)
    const selectorFiltroUsuario = document.querySelector("#user-filter");
    if (selectorFiltroUsuario) {
      const capturasPertenecientesAlUsuario =
        coleccionCompletaGatosMemoria.filter((gatoParaFiltrar) =>
          gatoParaFiltrar.historial?.some(
            (avistamientoUsuarioItem) =>
              sesionUsuarioActiva &&
              sesionUsuarioActiva.id &&
              String(avistamientoUsuarioItem.id_usuario) ===
                String(sesionUsuarioActiva.id),
          ),
        );

      const opcionTodas = selectorFiltroUsuario.querySelector(
        'option[value="all"]',
      );
      const opcionMias = selectorFiltroUsuario.querySelector(
        'option[value="mine"]',
      );
      if (opcionTodas) {
        opcionTodas.textContent = `Todas las capturas (${coleccionCompletaGatosMemoria.length})`;
      }
      if (opcionMias) {
        opcionMias.textContent = `Mis capturas (${capturasPertenecientesAlUsuario.length})`;
      }

      selectorFiltroUsuario.addEventListener(
        "change",
        filtrarYRenderizarTarjetas,
      );
    }

    function filtrarYRenderizarTarjetas() {
      const opcionFiltroUsuario = selectorFiltroUsuario
        ? selectorFiltroUsuario.value
        : "all";

      let listadoGatosFiltrados = coleccionCompletaGatosMemoria;

      // Filtro de capturas: "Todas las capturas" o "Mis capturas" (se mantiene activo)
      if (opcionFiltroUsuario === "mine") {
        if (sesionUsuarioActiva && sesionUsuarioActiva.id) {
          listadoGatosFiltrados = listadoGatosFiltrados.filter(
            (gatoParaEvaluar) =>
              gatoParaEvaluar.historial?.some(
                (avistamientoItem) =>
                  String(avistamientoItem.id_usuario) ===
                  String(sesionUsuarioActiva.id),
              ),
          );
        } else {
          listadoGatosFiltrados = [];
        }
      }

      // La barra de búsqueda (#q) permanece activa en la interfaz para futuras implementaciones;
      // se eliminó la lógica de filtrado por nombre a petición.

      if (elementoConteoResultados) {
        const sufijoResultado =
          listadoGatosFiltrados.length === 1 ? "resultado" : "resultados";
        elementoConteoResultados.textContent = `${listadoGatosFiltrados.length} ${sufijoResultado}`;
      }

      if (listadoGatosFiltrados.length === 0) {
        if (
          opcionFiltroUsuario === "mine" &&
          (!sesionUsuarioActiva || !sesionUsuarioActiva.id)
        ) {
          contenedorListaTarjetas.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1;">
              <h2>Inicia sesión</h2>
              <p class="muted">Debes iniciar sesión para consultar tus capturas registradas.</p>
              <div class="actions" style="justify-content:center;margin-top:24px">
                <a class="btn btn-primary" href="login.html">Iniciar sesión</a>
              </div>
            </div>
          `;
        } else {
          contenedorListaTarjetas.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1;">
              <h2>Sin capturas</h2>
              <p class="muted">No hay gatos disponibles para mostrar.</p>
            </div>
          `;
        }
      } else {
        contenedorListaTarjetas.innerHTML = listadoGatosFiltrados
          .map((gatoParaTarjeta) => cards(gatoParaTarjeta))
          .join("");
      }
    }

    if (campoBusquedaTexto) {
      campoBusquedaTexto.addEventListener("input", filtrarYRenderizarTarjetas);
    }

    // Renderizar inicialmente
    filtrarYRenderizarTarjetas();
  } catch (errorCapturado) {
    console.error("Error al cargar las capturas:", errorCapturado);
    if (elementoEstadoMensaje) {
      elementoEstadoMensaje.textContent = `Hubo un problema al cargar los gatos: ${errorCapturado.message}`;
      elementoEstadoMensaje.classList.add("error");
    }
    contenedorListaTarjetas.innerHTML = `<p class="status error">Hubo un problema al cargar los gatos: ${esc(errorCapturado.message)}</p>`;
  }
}

async function cargarDetalle() {
  const contenedorDetalleCaptura = document.querySelector("#capture");
  if (!contenedorDetalleCaptura) return;

  const parametrosUrl = new URLSearchParams(window.location.search);
  const identificadorGatoParametro = parametrosUrl.get("id");

  if (!identificadorGatoParametro) {
    contenedorDetalleCaptura.innerHTML =
      '<p class="status error">Selecciona una captura para consultar su información.</p>';
    return;
  }

  const elementoEstadoMensaje = document.querySelector("#status");
  const seccionHistorialAvistamientos =
    document.querySelector("#history-section");
  const listaHistorialAvistamientos = document.querySelector("#history");
  const contadorHistorialAvistamientos =
    document.querySelector("#history-count");

  try {
    if (elementoEstadoMensaje) {
      elementoEstadoMensaje.textContent = "Cargando detalle de la captura...";
    }

    const listadoTodosLosGatos = await datosAPI();
    const gatoSeleccionado = listadoTodosLosGatos.find(
      (gatoBuscado) =>
        String(gatoBuscado.id_gato ?? gatoBuscado.id ?? "") ===
        String(identificadorGatoParametro),
    );

    if (elementoEstadoMensaje) {
      elementoEstadoMensaje.textContent = "";
    }

    if (!gatoSeleccionado) {
      contenedorDetalleCaptura.innerHTML = `
        <div class="empty">
          <h2>Gato no encontrado</h2>
          <p class="muted">No se encontró información para el identificador #${esc(identificadorGatoParametro)}.</p>
          <a class="btn btn-outline" href="capturas.html">Volver a capturas</a>
        </div>
      `;
      return;
    }

    const rutaFotoEjemplo = window.GatoGoConfig.examplePhoto;
    const imagenFinalGato =
      gatoSeleccionado.Foto ||
      gatoSeleccionado.imagenPrincipal ||
      rutaFotoEjemplo;
    const esFotografiaDeEjemplo = imagenFinalGato === rutaFotoEjemplo;
    const nombreGatoSeguro = esc(gatoSeleccionado.Nombre_Gato || "Gato");
    const colorGatoSeguro = esc(gatoSeleccionado.Color || "Sin color");
    const descripcionGatoSegura = esc(
      gatoSeleccionado.Descripcion || "Sin descripción registrada.",
    );

    let textoUbicacionDetalle = "Sin avistamientos";
    if (gatoSeleccionado.ultimaUbicacion) {
      const direccionNombre =
        gatoSeleccionado.ultimaUbicacion.Direccion ||
        gatoSeleccionado.ultimaUbicacion.direccion;
      const barrioNombre =
        gatoSeleccionado.ultimaUbicacion.Barrio ||
        gatoSeleccionado.ultimaUbicacion.barrio;
      const ciudadNombre =
        gatoSeleccionado.ultimaUbicacion.Ciudad ||
        gatoSeleccionado.ultimaUbicacion.ciudad;
      const departamentoNombre =
        gatoSeleccionado.ultimaUbicacion.Departamento ||
        gatoSeleccionado.ultimaUbicacion.departamento;
      textoUbicacionDetalle = [
        direccionNombre,
        barrioNombre,
        ciudadNombre,
        departamentoNombre,
      ]
        .filter(Boolean)
        .join(", ");
    } else if (gatoSeleccionado.ultimoAvistamiento?.id_ubicacion) {
      textoUbicacionDetalle = `Ubicación #${gatoSeleccionado.ultimoAvistamiento.id_ubicacion}`;
    }

    contenedorDetalleCaptura.innerHTML = `
      <div class="detail">
        <div class="detail-photo">
          <img
            src="${esc(imagenFinalGato)}"
            alt="${nombreGatoSeguro}"
            onerror="this.onerror=null;this.src='${esc(rutaFotoEjemplo)}';if(!this.parentElement.querySelector('.example')){this.insertAdjacentHTML('afterend','<span class=\\'example\\'>Foto de ejemplo</span>');}"
          >
          ${esFotografiaDeEjemplo ? '<span class="example">Foto de ejemplo</span>' : ""}
        </div>
        <div>
          <span class="chip">${colorGatoSeguro}</span>
          <h1>${nombreGatoSeguro}</h1>
          <p>${descripcionGatoSegura}</p>
          <dl>
            <div>
              <dt>Última ubicación</dt>
              <dd>${esc(textoUbicacionDetalle)}</dd>
            </div>
            <div>
              <dt>Último avistamiento</dt>
              <dd>${gatoSeleccionado.ultimaFecha ? formatearFecha(gatoSeleccionado.ultimaFecha) : "Sin avistamientos"}</dd>
            </div>
            <div>
              <dt>Avistamientos registrados</dt>
              <dd>${gatoSeleccionado.totalAvistamientos || 0}</dd>
            </div>
          </dl>
          <a class="btn btn-primary" href="registrar.html">＋ Nuevo avistamiento</a>
        </div>
      </div>
    `;

    if (seccionHistorialAvistamientos && listaHistorialAvistamientos) {
      seccionHistorialAvistamientos.classList.remove("hidden");
      const registrosHistorial = gatoSeleccionado.historial || [];
      if (contadorHistorialAvistamientos) {
        contadorHistorialAvistamientos.textContent = `(${registrosHistorial.length})`;
      }

      if (registrosHistorial.length === 0) {
        listaHistorialAvistamientos.innerHTML =
          '<li><p class="muted">Todavía no hay avistamientos registrados para este gato.</p></li>';
      } else {
        listaHistorialAvistamientos.innerHTML = registrosHistorial
          .map((avistamientoHistorico) => {
            const fechaFormateada = formatearFecha(avistamientoHistorico.fecha);
            const textoUsuarioExplorador = avistamientoHistorico.id_usuario
              ? `Explorador #${esc(avistamientoHistorico.id_usuario)}`
              : "";
            const observacionesTexto = avistamientoHistorico.observaciones
              ? `<p>${esc(avistamientoHistorico.observaciones)}</p>`
              : "";
            return `
              <li>
                <time>${esc(fechaFormateada)}</time>
                <div>
                  <strong>Avistamiento #${esc(avistamientoHistorico.id)}</strong>
                  ${textoUsuarioExplorador ? `<p class="muted">${textoUsuarioExplorador} · Ubicación #${esc(avistamientoHistorico.id_ubicacion)}</p>` : ""}
                  ${observacionesTexto}
                </div>
              </li>
            `;
          })
          .join("");
      }
    }
  } catch (errorCapturado) {
    if (elementoEstadoMensaje) {
      elementoEstadoMensaje.textContent = `Error al cargar la captura: ${errorCapturado.message}`;
      elementoEstadoMensaje.classList.add("error");
    }
  }
}

// Habilita y enlaza el registro de un gato y su avistamiento inicial
async function registrarGato() {
  const formularioRegistroGato = document.querySelector("#cat-form");
  if (!formularioRegistroGato) return;

  const elementoEstadoMensaje = document.querySelector("#status");
  const botonReintentar = document.querySelector("#retry");
  const contenedorCamposUbicacion = document.querySelector("#location-fields");
  const campoFechaAvistamiento =
    formularioRegistroGato.querySelector('[name="date"]');
  const botonGuardarCaptura = formularioRegistroGato.querySelector(
    'button[type="submit"]',
  );

  const sesionUsuarioActiva = session();

  // Fecha actual por defecto en formato YYYY-MM-DD
  const fechaHoyIso = new Date().toISOString().split("T")[0];
  if (campoFechaAvistamiento) {
    campoFechaAvistamiento.value = fechaHoyIso;
    campoFechaAvistamiento.max = fechaHoyIso;
  }

  // Hacer visible el formulario en registrar.html
  formularioRegistroGato.classList.remove("hidden");
  if (botonReintentar) {
    botonReintentar.classList.add("hidden");
  }

  // Cargar las opciones de ubicaciones disponibles en el formulario
  try {
    if (contenedorCamposUbicacion) {
      let coleccionUbicacionesLocales = [];
      try {
        const ubicacionesGuardadas = localStorage.getItem(
          "gatogo_ubicaciones_locales",
        );
        if (ubicacionesGuardadas) {
          coleccionUbicacionesLocales = JSON.parse(ubicacionesGuardadas);
          if (!Array.isArray(coleccionUbicacionesLocales)) {
            coleccionUbicacionesLocales = [];
          }
        }
      } catch (errorUbicacionesLocales) {
        coleccionUbicacionesLocales = [];
      }

      let listadoUbicacionesServidor = [];
      try {
        const respuestaServidorUbicaciones = await fetch(
          window.GatoGoConfig.api.Ubicaciones,
        );
        if (respuestaServidorUbicaciones.ok) {
          listadoUbicacionesServidor =
            await respuestaServidorUbicaciones.json();
          if (!Array.isArray(listadoUbicacionesServidor)) {
            listadoUbicacionesServidor = [];
          }
        }
      } catch (errorPeticionUbicaciones) {
        console.warn(
          "No se pudo consultar la API de ubicaciones, usando datos locales:",
          errorPeticionUbicaciones,
        );
      }

      const listadoTotalUbicaciones = [
        ...coleccionUbicacionesLocales,
        ...listadoUbicacionesServidor,
      ];

      const opcionesUbicacionHtml = listadoTotalUbicaciones
        .map((ubicacionItem) => {
          const identificadorUbicacion = String(
            ubicacionItem.Id_ubicacion ??
              ubicacionItem.Idubicacion ??
              ubicacionItem.id ??
              "",
          );
          const direccionTexto = String(
            ubicacionItem.Direccion ??
              ubicacionItem.direccion ??
              ubicacionItem.address ??
              "Sin dirección",
          ).trim();
          const barrioTexto = String(
            ubicacionItem.Barrio ??
              ubicacionItem.barrio ??
              ubicacionItem.neighborhood ??
              "Sin barrio",
          ).trim();
          const ciudadTexto = String(
            ubicacionItem.Ciudad ??
              ubicacionItem.ciudad ??
              ubicacionItem.city ??
              "Sin ciudad",
          ).trim();
          const departamentoTexto = String(
            ubicacionItem.Departamento ??
              ubicacionItem.departamento ??
              ubicacionItem.department ??
              "Sin departamento",
          ).trim();

          const descripcionUbicacion = `"Direccion": ${direccionTexto}, "Barrio": ${barrioTexto}, "Ciudad": ${ciudadTexto}, "Departamento": ${departamentoTexto}`;
          return `<option value="${esc(identificadorUbicacion)}">${esc(descripcionUbicacion)}</option>`;
        })
        .join("");

      contenedorCamposUbicacion.innerHTML = `
        <label>
          <span>Seleccionar ubicación</span>
          <select class="input" name="locationId" id="select-location" required>
            <option value="">Selecciona una ubicación</option>
            ${opcionesUbicacionHtml}
          </select>
        </label>
        <div id="location-preview" class="hidden" style="margin-top:10px;padding:12px 14px;background:var(--card);border:1px solid var(--border);border-radius:6px;font-size:0.9rem;line-height:1.7;">
          <div><strong style="color:var(--primary)">"Direccion":</strong> <span id="prev-direccion"></span></div>
          <div><strong style="color:var(--primary)">"Barrio":</strong> <span id="prev-barrio"></span></div>
          <div><strong style="color:var(--primary)">"Ciudad":</strong> <span id="prev-ciudad"></span></div>
          <div><strong style="color:var(--primary)">"Departamento":</strong> <span id="prev-departamento"></span></div>
        </div>
      `;

      const selectUbicacion = contenedorCamposUbicacion.querySelector("#select-location");
      const previewContenedor = contenedorCamposUbicacion.querySelector("#location-preview");
      const prevDireccion = contenedorCamposUbicacion.querySelector("#prev-direccion");
      const prevBarrio = contenedorCamposUbicacion.querySelector("#prev-barrio");
      const prevCiudad = contenedorCamposUbicacion.querySelector("#prev-ciudad");
      const prevDepartamento = contenedorCamposUbicacion.querySelector("#prev-departamento");

      if (selectUbicacion && previewContenedor) {
        selectUbicacion.addEventListener("change", () => {
          const idSeleccionado = String(selectUbicacion.value || "").trim();
          const itemEncontrado = listadoTotalUbicaciones.find(
            (u) => String(u.Id_ubicacion ?? u.Idubicacion ?? u.id ?? "") === idSeleccionado,
          );
          if (itemEncontrado) {
            previewContenedor.classList.remove("hidden");
            if (prevDireccion) prevDireccion.textContent = itemEncontrado.Direccion || itemEncontrado.direccion || "Sin dirección";
            if (prevBarrio) prevBarrio.textContent = itemEncontrado.Barrio || itemEncontrado.barrio || "Sin barrio";
            if (prevCiudad) prevCiudad.textContent = itemEncontrado.Ciudad || itemEncontrado.ciudad || "Sin ciudad";
            if (prevDepartamento) prevDepartamento.textContent = itemEncontrado.Departamento || itemEncontrado.departamento || "Sin departamento";
          } else {
            previewContenedor.classList.add("hidden");
          }
        });
      }
    }
  } catch (errorCargaUbicaciones) {
    console.error("Error al cargar ubicaciones:", errorCargaUbicaciones);
    if (contenedorCamposUbicacion) {
      contenedorCamposUbicacion.innerHTML = `
        <fieldset style="border:1px solid var(--border);border-radius:6px;padding:16px;margin-bottom:16px;">
          <legend style="padding:0 8px;font-size:0.9rem;color:var(--muted)">Seleccionar ubicación</legend>
          <div class="row">
            <label>
              <span>"Direccion":</span>
              <input class="input" name="Direccion" required placeholder="Ej. Calle 10 # 5-20" />
            </label>
            <label>
              <span>"Barrio":</span>
              <input class="input" name="Barrio" required placeholder="Ej. El Poblado" />
            </label>
          </div>
          <div class="row">
            <label>
              <span>"Ciudad":</span>
              <input class="input" name="Ciudad" required placeholder="Ej. Medellín" />
            </label>
            <label>
              <span>"Departamento":</span>
              <input class="input" name="Departamento" required placeholder="Ej. Antioquia" />
            </label>
          </div>
        </fieldset>
      `;
    }
  }

  // Gestión del evento de envío del formulario de registro
  formularioRegistroGato.addEventListener(
    "submit",
    async (eventoEnvioFormulario) => {
      eventoEnvioFormulario.preventDefault();

      if (
        botonGuardarCaptura.disabled ||
        !formularioRegistroGato.reportValidity()
      ) {
        return;
      }

      const obtenerValorDelCampo = (nombreDelCampo) =>
        formularioRegistroGato.elements.namedItem(nombreDelCampo)?.value;

      const nombreIngresado = String(
        obtenerValorDelCampo("name") || "",
      ).trim();
      const colorIngresado = String(
        obtenerValorDelCampo("color") || "",
      ).trim();
      const descripcionIngresada = String(
        obtenerValorDelCampo("description") || "",
      ).trim();
      const idUbicacionSeleccionada = String(
        obtenerValorDelCampo("locationId") || "",
      ).trim();
      const fechaSeleccionada = String(
        obtenerValorDelCampo("date") || fechaHoyIso,
      ).trim();

      if (!nombreIngresado) {
        if (elementoEstadoMensaje) {
          elementoEstadoMensaje.textContent =
            "El nombre del gato es obligatorio.";
          elementoEstadoMensaje.classList.add("error");
        }
        return;
      }

      botonGuardarCaptura.disabled = true;
      botonGuardarCaptura.textContent = "Guardando captura...";
      if (elementoEstadoMensaje) {
        elementoEstadoMensaje.textContent =
          "Registrando el gato en el sistema...";
        elementoEstadoMensaje.classList.remove("error");
      }

      try {
        // Generamos un identificador único para el nuevo gato registrado localmente
        const identificadorGatoCreado = `local-${Date.now()}`;
        const fechaHoraActualIso = new Date().toISOString();

        // 1. Guardar la ficha del gato localmente en localStorage (sin peticiones POST al servidor)
        const nuevoGatoRegistrado = {
          id: identificadorGatoCreado,
          id_gato: identificadorGatoCreado,
          Nombre_Gato: nombreIngresado,
          Color: colorIngresado,
          Descripcion: descripcionIngresada,
          Fecha: fechaHoraActualIso,
          Foto: window.GatoGoConfig.examplePhoto,
          esLocal: true,
        };

        let coleccionGatosLocales = [];
        try {
          const datosGatosLocalesPrevios = localStorage.getItem(
            "gatogo_gatos_locales",
          );
          if (datosGatosLocalesPrevios) {
            coleccionGatosLocales = JSON.parse(datosGatosLocalesPrevios);
            if (!Array.isArray(coleccionGatosLocales)) {
              coleccionGatosLocales = [];
            }
          }
        } catch (errorLecturaGatosLocales) {
          console.error(
            "Error al leer gatos locales:",
            errorLecturaGatosLocales,
          );
          coleccionGatosLocales = [];
        }

        coleccionGatosLocales.unshift(nuevoGatoRegistrado);
        localStorage.setItem(
          "gatogo_gatos_locales",
          JSON.stringify(coleccionGatosLocales),
        );

        // 2. Gestionar la ubicación seleccionada y el avistamiento inicial en localStorage
        let identificadorUbicacionFinal = idUbicacionSeleccionada;
        let objetoUbicacionAsociada = null;

        if (idUbicacionFinal) {
          let coleccionParaBuscar = [];
          try {
            const locs = localStorage.getItem("gatogo_ubicaciones_locales");
            if (locs) coleccionParaBuscar = JSON.parse(locs) || [];
          } catch (e) {
            coleccionParaBuscar = [];
          }
          objetoUbicacionAsociada = coleccionParaBuscar.find(
            (u) => String(u.Id_ubicacion ?? u.Idubicacion ?? u.id ?? "") === idUbicacionFinal,
          );
        } else {
          const direccionIngresada = String(
            obtenerValorDelCampo("Direccion") || "Sin dirección",
          ).trim();
          const barrioIngresado = String(
            obtenerValorDelCampo("Barrio") || "Sin barrio",
          ).trim();
          const ciudadIngresada = String(
            obtenerValorDelCampo("Ciudad") || "Sin ciudad",
          ).trim();
          const departamentoIngresado = String(
            obtenerValorDelCampo("Departamento") || "Sin departamento",
          ).trim();

          identificadorUbicacionFinal = `loc-${Date.now()}`;
          objetoUbicacionAsociada = {
            id: identificadorUbicacionFinal,
            Id_ubicacion: identificadorUbicacionFinal,
            Direccion: direccionIngresada,
            Barrio: barrioIngresado,
            Ciudad: ciudadIngresada,
            Departamento: departamentoIngresado,
          };

          let ubicacionesLocales = [];
          try {
            const locsGuardadas = localStorage.getItem("gatogo_ubicaciones_locales");
            if (locsGuardadas) ubicacionesLocales = JSON.parse(locsGuardadas) || [];
          } catch (e) {
            ubicacionesLocales = [];
          }
          ubicacionesLocales.unshift(objetoUbicacionAsociada);
          localStorage.setItem(
            "gatogo_ubicaciones_locales",
            JSON.stringify(ubicacionesLocales),
          );
        }

        const identificadorUsuarioActual = sesionUsuarioActiva
          ? sesionUsuarioActiva.id
          : 1;
        const partesFechaSeleccionada = fechaSeleccionada.split("-");
        const fechaFormatoNumericoApi =
          partesFechaSeleccionada.length === 3
            ? `${partesFechaSeleccionada[2]}${partesFechaSeleccionada[1]}${partesFechaSeleccionada[0]}`
            : "01102026";

        const identificadorAvistamientoCreado = `avistamiento-${Date.now()}`;
        const nuevoAvistamientoRegistrado = {
          id: identificadorAvistamientoCreado,
          id_gato: identificadorGatoCreado,
          id_usuario: Number(identificadorUsuarioActual) || 1,
          id_ubicacion:
            Number(identificadorUbicacionFinal) || idUbicacionFinal || 1,
          ubicacion: objetoUbicacionAsociada,
          id_foto: 1,
          fecha: fechaFormatoNumericoApi,
          observaciones: descripcionIngresada,
          esLocal: true,
        };

        let coleccionAvistamientosLocales = [];
        try {
          const datosAvistamientosLocalesPrevios = localStorage.getItem(
            "gatogo_avistamientos_locales",
          );
          if (datosAvistamientosLocalesPrevios) {
            coleccionAvistamientosLocales = JSON.parse(
              datosAvistamientosLocalesPrevios,
            );
            if (!Array.isArray(coleccionAvistamientosLocales)) {
              coleccionAvistamientosLocales = [];
            }
          }
        } catch (errorLecturaAvistamientosLocales) {
          console.error(
            "Error al leer avistamientos locales:",
            errorLecturaAvistamientosLocales,
          );
          coleccionAvistamientosLocales = [];
        }

        coleccionAvistamientosLocales.unshift(nuevoAvistamientoRegistrado);
        localStorage.setItem(
          "gatogo_avistamientos_locales",
          JSON.stringify(coleccionAvistamientosLocales),
        );

        if (elementoEstadoMensaje) {
          elementoEstadoMensaje.textContent =
            "¡Captura guardada con éxito en almacenamiento local! Redirigiendo a la colección...";
        }

        setTimeout(() => {
          window.location.href = `captura.html?id=${encodeURIComponent(identificadorGatoCreado)}`;
        }, 1200);
      } catch (errorAlGuardarCaptura) {
        console.error("Error al registrar captura localmente:", errorAlGuardarCaptura);
        if (elementoEstadoMensaje) {
          elementoEstadoMensaje.textContent = `No se pudo completar el registro: ${errorAlGuardarCaptura.message}`;
          elementoEstadoMensaje.classList.add("error");
        }
        botonGuardarCaptura.disabled = false;
        botonGuardarCaptura.textContent = "Guardar captura";
      }
    },
  );
}

async function cargarHome() {
  const elementoContadorGatos = document.querySelector("#s-cats");
  const elementoContadorAvistamientos = document.querySelector("#s-sightings");
  const contenedorGridUltimasCapturas = document.querySelector("#ultimas-grid");
  const seccionUltimasCapturas = document.querySelector("#ultimas");

  if (!elementoContadorGatos && !contenedorGridUltimasCapturas) return;

  try {
    const listadoGatosDisponibles = await datosAPI();
    const totalAvistamientosRegistrados = listadoGatosDisponibles.reduce(
      (acumuladorTotal, gatoActual) =>
        acumuladorTotal + (gatoActual.totalAvistamientos || 0),
      0,
    );

    if (elementoContadorGatos) {
      elementoContadorGatos.textContent = listadoGatosDisponibles.length;
    }
    if (elementoContadorAvistamientos) {
      elementoContadorAvistamientos.textContent =
        totalAvistamientosRegistrados;
    }

    if (
      contenedorGridUltimasCapturas &&
      listadoGatosDisponibles.length > 0
    ) {
      if (seccionUltimasCapturas) {
        seccionUltimasCapturas.classList.remove("hidden");
      }
      contenedorGridUltimasCapturas.innerHTML = listadoGatosDisponibles
        .slice(0, 3)
        .map((gatoParaTarjeta) => cards(gatoParaTarjeta))
        .join("");
    }
  } catch (errorCargaHome) {
    console.error("Error al cargar la página de inicio:", errorCargaHome);
  }
}

//Obtener y almacenar los datos de la API Gato

let allCats = [];

async function loadCats() {
  try {
    const response = await fetch('https://TU_API_ENDPOINT_DE_MOCKAPI/cats'); // Reemplaza con tu endpoint real
    allCats = await response.json();
    renderCats(allCats);
    updateResultCount(allCats.length);
  } catch (error) {
    console.error('Error al consultar la API:', error);
  }
}
