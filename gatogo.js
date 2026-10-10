let gatos = [
  {
    nombre: "Misifus",
    color: "Negro",
    descripcion: "Un gatico muy consentido",
  },

  {
    nombre: "Rogelio",
    color: "Gris",
    descripcion: "Es pequeño",
  },
];

let michi = {
  nombre: "Michi",
  color: "Blanco",
  descripcion: "Gato pequeño",
};

gatos.push(michi);
console.log(gatos);

function mostrarGatos() {
  let resultado = document.getElementById("resultadoRegistro");
  resultado.innerHTML = "";
  gatos.forEach(function (gato) {
    resultado.innerHTML += `<p>
                ${gato.nombre} -
                ${gato.color} -
                ${gato.descripcion}
            </p>`;
  });
}

mostrarGatos();

let botonAgregar = document.getElementById("btnAgregar");

botonAgregar.addEventListener("click", function () {
  let nombre = document.getElementById("nombreGato").value;
  let color = document.getElementById("colorGato").value;
  let descripcion = document.getElementById("descripcionGato").value;

  //Validacion para que no existan gatos sin nombre ya que el buscar gatos esta relacionado con el nombre
  if (nombre === ``) {
    alert(`Ingrese el nombre del gato`);
    return;
  }

  let otroGato = {
    nombre: nombre,
    color: color,
    descripcion: descripcion,
  };

  gatos.push(otroGato);
  mostrarGatos();
});

let botonBuscar = document.getElementById("btnBuscar");

botonBuscar.addEventListener("click", function () {
  let nombreABuscar = document
    .getElementById("buscarGato")
    .value.trim()
    .toLowerCase();

  let espacioBusqueda = document.getElementById("resultadoBusqueda");
  espacioBusqueda.textContent = "";

  if (nombreABuscar === "") {
    espacioBusqueda.textContent = "Escribe el nombre del Michi que estas buscando.";
    return;
  }

  let michisEncontrados = gatos.filter(function (gato) {
    let nombreDelMichi = gato.nombre.toLowerCase();

    return nombreDelMichi.includes(nombreABuscar);
  });

  if (michisEncontrados.length === 0) {
    espacioBusqueda.textContent = "No encontramos Michis con ese nombre.";
    return;
  }

  espacioBusqueda.textContent =
    "Gatos encontrados: " + michisEncontrados.length;

  michisEncontrados.forEach(function (gato) {
    let detalleGato = document.createElement("p");

    detalleGato.textContent =
      "Nombre: " +
      gato.nombre +
      " | Color: " +
      gato.color +
      " | Descripción: " +
      gato.descripcion;

    espacioBusqueda.appendChild(detalleGato);
  });
});
