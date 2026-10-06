let gatos = [
    {
        nombre: "Misifus",
        color: "Negro",
        descripcion: "Un gatico muy consentido"
    },

    {
        nombre: "Rogelio",
        color: "Gris",
        descripcion: "Es pequeño"
    },
]

let michi = {
    nombre: "Michi",
    color: "Blanco",
    descripcion: "Gato pequeño"
};

gatos.push(michi);
console.log(gatos);

function mostrarGatos() {
    let resultado = document.getElementById("resultadoRegistro");
    resultado.innerHTML = "";
    gatos.forEach(function(gato) {

        resultado.innerHTML += 
            `<p>
                ${gato.nombre} -
                ${gato.color} -
                ${gato.descripcion}
            </p>`;

    });
}

mostrarGatos();

let botonAgregar = document.getElementById("btnAgregar");

botonAgregar.addEventListener("click", function() {
    let nombre = document.getElementById("nombreGato").value;
    let color = document.getElementById("colorGato").value;
    let descripcion = document.getElementById("descripcionGato").value;


    let otroGato = {
        nombre: nombre,
        color: color,
        descripcion: descripcion
    };

    gatos.push(otroGato);
    mostrarGatos();
});

let botonBuscar = document.getElementById("btnBuscar");

botonBuscar.addEventListener("click", function() {
    let nombreBuscado = document.getElementById("buscarGato")
        .value.trim().toLowerCase();

    let resultado = document.getElementById("resultadoBusqueda");
    resultado.textContent = "";

    if (nombreBuscado === "") {
        resultado.textContent = "Escribe el nombre del gato.";
        return;
    }

    let gatosEncontrados = gatos.filter(function(gato) {
        return gato.nombre.trim().toLowerCase() === nombreBuscado;
    });

    if (gatosEncontrados.length === 0) {
        resultado.textContent = "No se encontró ese gato.";
        return;
    }

    gatosEncontrados.forEach(function(gato) {
        let parrafo = document.createElement("p");

        parrafo.textContent =
            gato.nombre + " - " +
            gato.color + " - " +
            gato.descripcion;

        resultado.appendChild(parrafo);
    });
});
