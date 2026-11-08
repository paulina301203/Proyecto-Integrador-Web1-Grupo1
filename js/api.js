// Consultar los usuarios
async function obtenerUsuarios() {
  try {
    const respuesta = await fetch(API_URLS.users);

    if (!respuesta.ok) {
      throw new Error("Error al consultar los usuarios");
    }

    const usuarios = await respuesta.json();

    return usuarios;

  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Registrar un usuario nuevo
async function crearUsuario(datosUsuario) {
  const respuesta = await fetch(API_URLS.users, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosUsuario)
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo registrar el usuario.");
  }

  return await respuesta.json();
}

