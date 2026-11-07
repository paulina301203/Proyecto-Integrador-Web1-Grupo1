# GatoGo — Cómo funciona el código

GatoGo es un registro de avistamientos de gatos. **Todo el sitio es HTML, CSS y
JavaScript puro**, sin frameworks ni dependencias: se abre directamente en el
navegador o desde cualquier servidor estático (`index.html`).

## Archivos y qué hace cada uno

```
index.html / home.html   Inicio: banner, pasos para jugar y últimas capturas
capturas.html            Lista de capturas con buscador y filtro por color
captura.html?id=X        Detalle de un gato: ficha, historial y nuevo avistamiento
registrar.html           Formulario para registrar un gato y su primer avistamiento
login.html / registro.html  Inicio de sesión y registro de cuenta (demostración)
css/styles.css           Paleta sobria: fondo casi negro, acento ámbar, texto crema
js/config.js             Configuración: endpoints de la API y rutas reemplazables
js/api.js                Comunicación con la API
js/domain.js             Adaptación y relación de los datos de la API
js/app.js                Lógica de todas las páginas
img/                     Imágenes (el hero y la foto de ejemplo son reemplazables)
```

## Flujo de datos

```
config.js  →  api.js  →  domain.js  →  app.js  →  HTML/CSS
(endpoints)  (fetch)   (adapta y      (pinta y    (lo que ve
                        relaciona)     valida)     el usuario)
```

1. **config.js** guarda las URLs de la API (ubicaciones, avistamientos,
   usuarios y gatos) y la ruta de la foto de ejemplo. Cambiar la API sólo
   significa editar este archivo.
2. **api.js** expone `GatoGoAPI.request(recurso, opciones)`: hace el `fetch`,
   controla tiempos de espera (20 s), traduce errores HTTP a mensajes claros en
   español y valida que las listas sean arrays. No guarda nada por sí mismo.
3. **domain.js** es la capa que conoce el esquema de la API. Si MockAPI cambia
   los nombres de campos (por ejemplo `Nombre_Gato`), sólo se ajusta aquí:
   - `field()`: lee el primer campo que exista entre varias claves posibles.
   - `locations()`: convierte las filas de ubicación a
     `{id, department, city, neighborhood, address}`.
   - `selectableLocations()`: filtra los registros con datos ajenos (números o
     países extranjeros) y añade el catálogo colombiano de ejemplo de
     `config.js`, sin borrar ni renombrar datos existentes.
   - `departments/cities/neighborhoods()`: construyen las listas en cascada.
   - `normalizeCats()`: **relaciona** gatos, avistamientos y ubicaciones por
     `id_gato` e `id_ubicacion`; ordena los avistamientos del más reciente al
     más antiguo y marca como `missing` los gatos cuyo ficha no está en la API.
   - `sightingPayload()`: arma el objeto que se envía al crear un avistamiento
     (fecha en formato `DDMMAAAA`, fotos, observaciones).
   - `searchDocument()`: véase «Cómo funciona la búsqueda».
4. **app.js** controla cada página. Cada HTML declara `<body data-page="...">`
   y al final app.js ejecuta la función correspondiente (`home`, `capturas`,
   `captura`, `registrar`, `login`, `registro`). Comparte la lista
   `data = { cats, sightings, locations }` entre funciones.

## Cómo funciona la búsqueda de capturas

En `capturas.html` el buscador compara lo escrito contra el **índice de
búsqueda** de cada gato, que `searchDocument()` (en `domain.js`) construye
reuniendo:

- nombre, color y descripción del gato;
- de **cada avistamiento** registrado: departamento, **ciudad**, **barrio** y
  **dirección** de la ubicación donde fue visto.

Todo pasa por `key()`, que quita mayúsculas y acentos, así que escribir
`bogota`, `chico` o `calle 50` encuentra «Bogotá», «Chicó» o «Calle 50». La
búsqueda es por subcadena: escribir «lau» encuentra «Laureles». El filtro de
color funciona aparte y por coincidencia exacta.

```
Texto buscado "El Poblado"
  → key() → "el poblado"
  → ¿está dentro de searchDocument(gato)? → sí → la tarjeta aparece
```

Si una ubicación ya no está disponible en la API, el índice incluye su
referencia (`ubicación #id`) para que el gato siga siendo localizable.

## Cómo funciona la ubicación en cascada

Los formularios (registrar gato y nuevo avistamiento) muestran cuatro selects:
**Departamento → Ciudad → Barrio → Dirección disponible**. Cada cambio rellena
el siguiente con sólo las opciones que existen en ese nivel, usando los helpers
de `domain.js`. Las opciones salen de las ubicaciones ya registradas en la API
(filtrando las ajenas) más el catálogo colombiano de ejemplo. Si el usuario
elige una dirección que la API todavía no tiene, `resolveLocation()` la crea
con un POST a Ubicación y usa el identificador real que devuelve; si ya existe,
se reutiliza para no duplicarla.

## Avistamientos adicionales

En `captura.html?id=X` cada tarjeta lleva a la ficha del gato con su historial.
El formulario «Nuevo avistamiento» guarda otro registro para el **mismo**
gato: se reenvía su `id_gato` con la nueva ubicación y fecha, y el historial se
actualiza en pantalla sin recargar. Si el primer paso falla pero la ficha del
gato ya se creó, el formulario conserva la ficha para no duplicarla al
reintentar.

## Sesión y avisos de seguridad

- El login/registro es **de demostración** sobre la API pública de MockAPI:
  no es autenticación segura y nunca deben usarse contraseñas reales.
- Sólo la sesión de demostración (id, nombre, correo) se guarda en
  `sessionStorage` y desaparece al cerrar la pestaña. Las contraseñas y las
  capturas no se guardan localmente.
- Registrar gatos y avistamientos requiere sesión iniciada; consultar es libre.

## Personalizar

- **Foto de ejemplo**: reemplazar `img/gato-ejemplo.jpg` o cambiar
  `examplePhoto` en `config.js`.
- **Hero y demás imágenes**: son archivos sueltos en `img/`.
- **Catálogo de direcciones**: la lista `colombianLocations` en `config.js` es
  ilustrativa; puede reemplazarse por ubicaciones reales.
- **Colores/estilos**: variables y clases en `css/styles.css`.
