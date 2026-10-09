let usuariosRegistrados = [
  {
    idUsuario: `leon123`,
    nombre: `Leon`,
    apellido: `Perez`,
    email: `leonperez@ejemplo.com`,
    celular: `3001234567`,
    contrasena: `12345670`,
  },

  {
    idUsuario: `lobo43`,
    nombre: `Camilo`,
    apellido: `Ramirez`,
    email: `loboramirez@ejemplo.com`,
    celular: ``,
    contrasena: `1234567`,
  },

  {
    idUsuario: `usuario1`,
    nombre: `Daniela`,
    apellido: `Hernandez`,
    email: `danielahernandez@ejemplo.com`,
    celular: `123345634`,
    contrasena: `12345678`,
  },
];

let btnRegistrarUsuarios = document.getElementById(`btnRegistrarUsuario`);

btnRegistrarUsuarios.addEventListener("click", function () {
  let idUsuario = document
    .getElementById("idUsuario")
    .value.trim()
    .toLowerCase();
  let nombre = document.getElementById("nombreUsuario").value;
  let apellido = document.getElementById("apellidoUsuario").value;
  let email = document
    .getElementById("emailUsuario")
    .value.trim()
    .toLowerCase();
  let celular = document.getElementById("celularUsuario").value;
  let contrasena = document
    .getElementById("contrasenaUsuario")
    .value.trim()
    .toLowerCase();

  //Validacion de campos obligatorios para que no tenga campos vacios en los
  if (
    idUsuario === `` ||
    nombre === `` ||
    apellido === `` ||
    email === `` ||
    contrasena === ``
  ) {
    alert(
      `Los campos Usuario, Nombre, Apellido, Email y Contraseña son obligatorios`,
    );
    return;
  }

  //Segunda validacion en el correo
  if (!email.includes("@") || !email.includes(`.com`)) {
    alert(`El correo electronico debe tener un dominio como @gmail.com u otro`);
    return;
  }

  // Minimo de carateres en contrasena
  if (contrasena.length < 6) {
    alert("La contrasena debe tener minimo 6 caracteres");
    return;
  }

  // Que no tenga usuarios repetidos validando que no exista el id y el correo
  let usuariosrepetidos = usuariosRegistrados.some(function (usuarioNuevo) {
    return usuarioNuevo.idUsuario === idUsuario || usuarioNuevo.email === email;
  });

  if (usuariosrepetidos === true) {
    alert(
      `Ya existe un usuario registrado con ese usuario o ese correo electrónico`,
    );
    return;
  }

  let usuarioNuevo = {
    idUsuario: idUsuario,
    nombre: nombre,
    apellido: apellido,
    email: email,
    celular: celular,
    contrasena: contrasena,
  };

  usuariosRegistrados.push(usuarioNuevo);
  console.log(usuariosRegistrados);
  alert("Se creo el nuevo usuario con exito");
});
