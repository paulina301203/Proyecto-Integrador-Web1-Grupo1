/* DOMINIO DE GATOGO (domain.js) — CÓMO FUNCIONA
   Este archivo es la única capa que conoce los nombres de campos de la API.
   Si MockAPI cambia su esquema, sólo se ajustan las listas de claves en
   field() y normalizeCats(); el resto de la aplicación no se entera.
   Flujo de datos: config.js (endpoints) -> api.js (fetch) -> domain.js
   (adapta y relaciona) -> app.js (pinta las páginas). */
(function () {
  const config = window.GatoGoConfig;
  const text = v => v == null ? '' : String(v);
  /* key(): normaliza un texto para comparar o buscar — quita mayúsculas y
     acentos ("Bogotá" -> "bogota") para que la búsqueda ignore la tilde. */
  const key = v => text(v).trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  /* field(row, claves, fallback): devuelve el primer campo del registro que
     exista entre las claves dadas. Permite leer tanto el esquema actual
     (Idubicacion, Nombre_Gato...) como variantes antiguas o alternativas. */
  const field = (row, keys, fallback = '') => {
    for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
    return fallback;
  };
  const safePhoto = v => typeof v === 'string' && (/^https:\/\//i.test(v) || /^data:image\/(jpeg|png|webp);base64,/i.test(v)) ? v : '';
  function photos(row) {
    const raw = field(row, ['imagenes', 'images', 'fotos', 'imagen', 'foto', 'image', 'avatar'], []);
    return (Array.isArray(raw) ? raw : [raw]).map(safePhoto).filter(Boolean);
  }
  function locations(rows) {
    return rows.map(r => {
      const city = text(field(r, ['Ciudad', 'ciudad', 'city']));
      const neighborhood = text(field(r, ['Barrio', 'barrio', 'neighborhood']));
      const known = Object.entries(config.cityDepartments).find(([c]) => key(c) === key(city));
      return { id: text(field(r, ['Idubicacion', 'id_ubicacion', 'id'])), city, neighborhood, address: text(field(r, ['Direccion', 'direccion', 'address'])), department: text(field(r, ['Departamento', 'departamento', 'department'], known?.[1] || 'Departamento por confirmar')) };
    }).filter(r => r.id && r.city && r.neighborhood);
  }
  const unique = values => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'es'));
  const departments = rows => unique(rows.map(r => r.department));
  const cities = (rows, d) => unique(rows.filter(r => r.department === d).map(r => r.city));
  const neighborhoods = (rows, d, c) => unique(rows.filter(r => r.department === d && r.city === c).map(r => r.neighborhood));
  function selectableLocations(rows) {
    const remote = rows.filter(r => Object.keys(config.cityDepartments).some(c => key(c) === key(r.city)) && /\p{L}/u.test(r.neighborhood));
    const catalog = locations(config.colombianLocations.map((r,i)=>({...r,id:`colombia-${i}`})));
    return [...remote, ...catalog.filter(r => !remote.some(l => key(l.city)===key(r.city) && key(l.neighborhood)===key(r.neighborhood) && key(l.address)===key(r.address)))];
  }
  function parseDate(raw) {
    const value = text(raw);
    if (/^\d{8}$/.test(value)) {
      const iso = `${value.slice(4)}-${value.slice(2, 4)}-${value.slice(0, 2)}`;
      const result = new Date(`${iso}T12:00:00`);
      return Number.isNaN(result.getTime()) || result.getDate() !== Number(value.slice(0, 2)) || result.getMonth() + 1 !== Number(value.slice(2, 4)) ? null : result;
    }
    const result = new Date(value);
    return Number.isNaN(result.getTime()) ? null : result;
  }
  function apiDate(iso) { const [y, m, d] = iso.split('-'); return `${d}${m}${y}`; }
  function normalizeCats(catRows, sightRows, locationRows) {
    const all = new Map();
    catRows.forEach(r => {
      const id = text(field(r, ['id_gato', 'id_Gato', 'id']));
      if (!id) return;
      all.set(id, { id, apiId: text(r.id || id), name: text(field(r, ['Nombre_Gato', 'nombre', 'Nombre', 'name', 'nombre_gato'], `Gato #${id}`)), color: text(field(r, ['Color', 'color'], 'Sin color registrado')), description: text(field(r, ['Descripcion', 'descripcion', 'description'], 'Sin descripción registrada.')), images: photos(r), missing: false, sightings: [] });
    });
    sightRows.forEach(r => {
      const id = text(r.id_gato);
      if (!id) return;
      if (!all.has(id)) all.set(id, { id, name: `Gato #${id}`, color: 'Sin color registrado', description: 'Ficha del gato no disponible en la API de gatos.', images: [], missing: true, sightings: [] });
      const cat = all.get(id);
      cat.sightings.push({ id: text(r.id), userId: text(r.id_usuario), locationId: text(r.id_ubicacion), location: locationRows.find(l => l.id === text(r.id_ubicacion)), date: parseDate(r.fecha), rawDate: text(r.fecha), images: photos(r), notes: text(field(r, ['observaciones', 'descripcion'], '')) });
    });
    return [...all.values()].map(c => ({ ...c, sightings: c.sightings.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0) || Number(b.id)-Number(a.id)) })).sort((a,b) => (b.sightings[0]?.date?.getTime() || 0) - (a.sightings[0]?.date?.getTime() || 0));
  }
  function sightingPayload(catId, userId, locationId, date, images = [], notes = '') {
    const identity = id => /^\d+$/.test(text(id)) ? Number(id) : text(id);
    return { id_gato: identity(catId), id_usuario: identity(userId), id_ubicacion: identity(locationId), id_foto: 0, fecha: apiDate(date), imagenes: images, observaciones: notes };
  }
  /* searchDocument(cat): construye el índice de texto con el que funciona la
     búsqueda de Capturas. Reúne nombre, color y descripción del gato y, de
     CADA avistamiento, su departamento, ciudad, barrio y dirección. Así,
     escribir "Medellín", "Laureles" o "Calle 50" en el buscador encuentra a
     los gatos vistos ahí. Todo pasa por key(), por lo que la coincidencia
     ignora mayúsculas y acentos. Si una ubicación no está en la API, se
     incluye su referencia (#id) para que siga siendo localizable. */
  function searchDocument(cat) {
    return key([cat.name, cat.color, cat.description,
      ...cat.sightings.map(s => [s.location?.department, s.location?.city, s.location?.neighborhood, s.location?.address, s.locationId ? `ubicación #${s.locationId}` : ''].filter(Boolean).join(' '))
    ].join(' '));
  }
  window.GatoGoDomain = { key, text, safePhoto, locations, selectableLocations, departments, cities, neighborhoods, parseDate, apiDate, normalizeCats, sightingPayload, searchDocument };
})();
