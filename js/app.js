/* GatoGo: JavaScript puro, sin frameworks. CÓMO FUNCIONA ESTE ARCHIVO
   ------------------------------------------------------------------
   app.js controla todas las páginas. Al final se lee data-page (que cada HTML
   pone en <body data-page="...">) y se ejecuta la función correspondiente:
   home -> home.html | capturas -> capturas.html | captura -> captura.html
   registrar -> registrar.html | login -> login.html | registro -> registro.html
   Reglas de datos:
   - Todo dato viene de la API vía api.js y se adapta con domain.js; la lista
     data = {cats, sightings, locations} se comparte entre funciones.
   - Sólo la sesión de demostración se guarda en sessionStorage; nunca se
     guardan contraseñas ni capturas en el navegador.
   - Las fotos se redimensionan a Data URLs en el navegador (resize) porque la
     API pública de pruebas no permite subir archivos.
   Los comentarios de cada función explican su papel en el flujo. */
(function () {
  const D = window.GatoGoDomain, API = window.GatoGoAPI, C = window.GatoGoConfig;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const sessionKey = 'gatogo_api_demo_session';
  const session = () => { try { return JSON.parse(sessionStorage.getItem(sessionKey)) || null; } catch { return null; } };
  const dateText = value => value ? value.toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' }) : 'Fecha no válida';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  let data = { cats: [], sightings: [], locations: [] };
  const catLink = id => `captura.html?id=${encodeURIComponent(id)}`;
  function nav() {
    const s = session(), page = document.body.dataset.page;
    const link = (href, label, active) => `<a href="${href}" class="link ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''}>${label}</a>`;
    document.body.insertAdjacentHTML('afterbegin', `<header><div class="container nav"><a class="logo" href="home.html"><span class="mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l4 4h8l4-4v10a8 8 0 0 1-16 0Z"/><path d="M8 13h1m6 0h1m-5 4h2"/></svg></span>GatoGo</a><button class="menu-btn" type="button" aria-label="Menú" aria-expanded="false">☰</button><nav class="links" aria-label="Navegación principal">${link('home.html','Inicio',page==='home')}${link('capturas.html','Capturas',page==='capturas'||page==='captura')}${link('registrar.html','Registrar gato',page==='registrar')}<div class="auth">${s ? `<span class="small">Hola, ${esc(s.name)}</span><button class="btn btn-outline" id="logout">Salir</button>` : '<a class="btn btn-outline" href="login.html">Iniciar sesión</a><a class="btn btn-primary" href="registro.html">Registrarse</a>'}</div></nav></div></header>`);
    document.body.insertAdjacentHTML('beforeend','<footer><div class="container"><span>GatoGo · Registro de avistamientos felinos</span><span>Explorar. Observar. Recordar.</span></div></footer>');
    $('.menu-btn').onclick = () => { const open = $('.links').classList.toggle('open'); $('.menu-btn').setAttribute('aria-expanded', String(open)); };
    if ($('#logout')) $('#logout').onclick = () => { sessionStorage.removeItem(sessionKey); location.href='home.html'; };
  }
  function status(message, error = false) {
    const el = $('#status'); if (!el) return;
    el.textContent = message; el.classList.toggle('error', error);
  }
  /* load(): baja los tres recursos (gatos, avistamientos, ubicaciones), guarda
     la lista de ubicaciones normalizada y devuelve los gatos ya "cosidos" con
     sus avistamientos (normalizeCats relaciona id_gato e id_ubicacion). */
  async function load() {
    const [cats, sightings, locations] = await Promise.all([API.request('cats'), API.request('sightings'), API.request('locations')]);
    data = { cats, sightings, locations: D.locations(locations) };
    return D.normalizeCats(cats, sightings, data.locations);
  }
  function locationText(l, id) { return l ? `${l.neighborhood}, ${l.city}` : id ? `Ubicación #${id} no disponible` : 'Sin avistamientos'; }
  /* card(): plantilla de una tarjeta de captura. Usa el avistamiento más
     reciente (cat.sightings[0]) para la última ubicación conocida y la fecha;
     si el gato no tiene fotos, muestra la imagen de ejemplo de config.js. */
  function card(cat) {
    const latest = cat.sightings[0], image = cat.images[0] || latest?.images[0] || C.examplePhoto;
    return `<article class="card cat"><a class="image-wrap" href="${catLink(cat.id)}" aria-label="Ver captura de ${esc(cat.name)}" style="display:block"><img src="${esc(image)}" alt="${esc(image===C.examplePhoto ? 'Foto de ejemplo de un gato atigrado' : cat.name)}" width="1024" height="768" loading="lazy">${image===C.examplePhoto ? '<span class="example">Foto de ejemplo</span>' : ''}</a><div class="body"><div class="top"><h2>${esc(cat.name)}</h2><span class="chip">${esc(cat.color)}</span></div><p class="desc">${esc(cat.description)}</p><p class="loc">${esc(locationText(latest?.location, latest?.locationId))}</p><p class="meta">${cat.sightings.length} ${cat.sightings.length === 1 ? 'avistamiento' : 'avistamientos'}${latest ? ' · '+esc(dateText(latest.date)) : ''}</p><a class="btn btn-outline" href="${catLink(cat.id)}">Ver captura <span aria-hidden="true">↗</span></a></div></article>`;
  }
  /* bindLocations(container): monta los cuatro selects en cascada
     (Departamento -> Ciudad -> Barrio -> Dirección). Cada cambio rellena el
     select siguiente con sólo las opciones que existen en ese nivel,
     usando los helpers de domain.js sobre las ubicaciones disponibles. */
  function bindLocations(container) {
    const choices = D.selectableLocations(data.locations);
    container.innerHTML = `<div class="location-grid"><label><span>Departamento</span><select class="input" name="department" required><option value="">Selecciona un departamento</option></select></label><label><span>Ciudad</span><select class="input" name="city" required disabled><option value="">Selecciona una ciudad</option></select></label><label><span>Barrio</span><select class="input" name="neighborhood" required disabled><option value="">Selecciona un barrio</option></select></label><label><span>Dirección disponible</span><select class="input" name="locationId" required disabled><option value="">Selecciona una dirección</option></select></label></div>`;
    const dept = container.querySelector('[name=department]'), city = container.querySelector('[name=city]'), barrio = container.querySelector('[name=neighborhood]'), address = container.querySelector('[name=locationId]');
    const fill = (el, values, placeholder) => { el.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${esc(v.value ?? v)}">${esc(v.label ?? v)}</option>`).join(''); el.disabled = !values.length; };
    fill(dept, D.departments(choices), 'Selecciona un departamento');
    dept.onchange = () => { fill(city, D.cities(choices, dept.value), 'Selecciona una ciudad'); fill(barrio, [], 'Selecciona un barrio'); fill(address, [], 'Selecciona una dirección'); };
    city.onchange = () => { fill(barrio, D.neighborhoods(choices, dept.value, city.value), 'Selecciona un barrio'); fill(address, [], 'Selecciona una dirección'); };
    barrio.onchange = () => {
      const rows = choices.filter(l => l.department===dept.value && l.city===city.value && l.neighborhood===barrio.value);
      fill(address, rows.map(l => ({ value:l.id, label:l.address || `Ubicación ${l.id}` })), 'Selecciona una dirección');
      if (rows.length===1) address.value=rows[0].id;
    };
  }
  /* resolveLocation(id): si el usuario eligió una dirección del catálogo
     colombiano (ids "colombia-N") que aún no existe en la API, la crea con
     POST a Ubicacion y devuelve su identificador real. Si la API ya la tiene,
     se reutiliza para no duplicar registros. */
  async function resolveLocation(id) {
    if (!String(id).startsWith('colombia-')) return id;
    const row = D.selectableLocations(data.locations).find(l=>l.id===id);
    if (!row) throw new Error('Selecciona una ubicación disponible.');
    const existing=data.locations.find(l=>D.key(l.city)===D.key(row.city) && D.key(l.neighborhood)===D.key(row.neighborhood) && D.key(l.address)===D.key(row.address));
    if(existing) return existing.id;
    const saved=await API.request('locations',{method:'POST',data:{Departamento:row.department,Ciudad:row.city,Barrio:row.neighborhood,Direccion:row.address}});
    const normalized=D.locations([saved])[0];
    if(!normalized) throw new Error('La API no devolvió un identificador válido para la ubicación.');
    data.locations.push(normalized);return normalized.id;
  }
  function bindPhotos(container) {
    let images = [], pending = false;
    function render() {
      container.innerHTML = images.map((src, i) => `<div class="photo"><img src="${src}" alt="Foto ${i+1} seleccionada"><button type="button" class="remove-photo" data-index="${i}" aria-label="Eliminar foto ${i+1}">×</button></div>`).join('') + (images.length < 4 ? '<label class="upload"><span aria-hidden="true">＋</span><small>Añadir foto</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Subir fotos"></label>' : '');
      container.querySelectorAll('.remove-photo').forEach(b => b.onclick = () => { images.splice(Number(b.dataset.index),1); render(); });
      const input=container.querySelector('input');
      if (input) input.onchange=async () => {
        pending=true;
        try {
          const selected=[...input.files].slice(0,4-images.length);
          for (const file of selected) {
            if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Selecciona imágenes JPG, PNG o WebP.');
            if (file.size>10*1024*1024) throw new Error('Cada imagen debe pesar menos de 10 MB.');
            images.push(await resize(file));
          }
          render(); status('');
        } catch(err) { status(err.message,true); }
        finally { pending=false; }
      };
    }
    render(); return { get:()=>images.slice(), pending:()=>pending };
  }
  function resize(file) {
    return new Promise((resolve,reject) => {
      const image=new Image(), url=URL.createObjectURL(file);
      image.onload=()=> { try { const scale=Math.min(1,800/Math.max(image.width,image.height)), canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const ctx=canvas.getContext('2d');if(!ctx) throw new Error('No se pudo procesar la foto.');ctx.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.72));}catch(err){reject(err);}finally{URL.revokeObjectURL(url);} };
      image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo abrir la imagen.'));};image.src=url;
    });
  }
  async function auth(isRegister) {
    const form=$('#auth-form');
    form.onsubmit=async e=> {
      e.preventDefault(); const f=new FormData(form), button=form.querySelector('button[type=submit]'); button.disabled=true;status('');
      try {
        const email=String(f.get('email')).trim().toLowerCase(), password=String(f.get('password'));
        const users=await API.request('users'); let user;
        if (isRegister) {
          if (password.length<6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
          if (users.some(u=>String(u.email).trim().toLowerCase()===email)) throw new Error('Ese correo ya está registrado.');
          user=await API.request('users',{method:'POST',data:{ name:String(f.get('name')).trim(), last_name:String(f.get('last_name')).trim(), email, cel_phone:String(f.get('cel_phone') || '').trim(), password, date:new Date().toISOString() }});
        } else {
          user=users.find(u=>String(u.email).trim().toLowerCase()===email && String(u.password)===password);
          if (!user) throw new Error('Correo o contraseña incorrectos.');
        }
        const id=D.text(user.id_User || user.id);
        if (!id) throw new Error('La API de usuarios no devolvió un identificador.');
        sessionStorage.setItem(sessionKey,JSON.stringify({id,name:D.text(user.name),email}));
        location.href='capturas.html';
      } catch(err) { status(err.message,true); button.disabled=false; }
    };
  }
  /* captures(): página de Capturas. refresh() trae los datos; render() aplica
     el texto buscado y el filtro de color sobre el índice searchDocument
     (nombre, color, descripción, ciudad, barrio y dirección de cada
     avistamiento) y vuelve a pintar la lista de tarjetas. */
  async function captures() {
    let cats=[];
    async function refresh() {
      status('Cargando capturas…'); $('#list').innerHTML='';
      try {
        cats=await load(); $('#count').textContent=`${cats.length} gatos · ${data.sightings.length} avistamientos`;
        $('#color').innerHTML='<option value="">Todos los colores</option>'+[...new Set(cats.map(c=>c.color))].sort().map(c=>`<option>${esc(c)}</option>`).join('');
        status(''); render();
      } catch(err) { status(err.message,true); $('#list').innerHTML='<div class="empty"><button class="btn btn-outline" id="retry">Reintentar</button></div>';$('#retry').onclick=refresh; }
    }
    function render() {
      // Búsqueda: se compara contra el índice del gato (nombre, color,
      // descripción y, por cada avistamiento, departamento, ciudad, barrio y
      // dirección). El filtro de color es exacto; el texto lo es por
      // subcadena sin acentos ni mayúsculas (ver searchDocument en domain.js).
      const term=D.key($('#q').value), color=$('#color').value;
      const list=cats.filter(c=>(!color||c.color===color) && D.searchDocument(c).includes(term));
      $('#list').innerHTML=list.length ? list.map(card).join('') : `<div class="empty"><h2>${cats.length ? 'Sin resultados' : 'Aún no hay capturas'}</h2><p class="muted">${cats.length ? 'No hay gatos que coincidan con tu búsqueda.' : 'Registra tu primer avistamiento.'}</p></div>`;
      $('#result-count').textContent=`${list.length} ${list.length===1 ? 'resultado' : 'resultados'}`;
    }
    $('#q').oninput=render; $('#color').onchange=render; await refresh();
  }
  async function home() {
    try { const cats=await load(); $('#s-cats').textContent=cats.length; $('#s-sightings').textContent=data.sightings.length; if(cats.length){$('#ultimas').classList.remove('hidden');$('#ultimas-grid').innerHTML=cats.slice(0,3).map(card).join('');} }
    catch(err){status(err.message,true);}
  }
  function lock(container) {
    container.innerHTML='<div class="empty"><h2>Inicia sesión para capturar</h2><p class="muted">Necesitas una cuenta para registrar avistamientos.</p><div class="actions" style="justify-content:center;margin-top:24px"><a class="btn btn-outline" href="login.html">Iniciar sesión</a><a class="btn btn-primary" href="registro.html">Registrarse</a></div></div>';
  }
  async function registrar() {
    if (!session()) {lock($('#registration'));return;}
    status('Cargando ubicaciones…');
    try { await load(); } catch(err){ status(err.message,true); $('#retry').classList.remove('hidden'); $('#retry').onclick=()=>location.reload();return; }
    status('');$('#cat-form').classList.remove('hidden'); bindLocations($('#location-fields')); const photos=bindPhotos($('#photos'));
    const date=$('[name=date]');date.value=today();date.max=today(); let savedCat=null;
    $('#cat-form').onsubmit=async e=> {
      e.preventDefault();const form=e.currentTarget, f=new FormData(form), b=form.querySelector('button[type=submit]');status('');
      if (photos.pending()){status('Espera a que terminen de cargar las fotos.',true);return;}
      b.disabled=true;
      try {
        if (!savedCat) {
          savedCat=await API.request('cats',{method:'POST',data:{Nombre_Gato:String(f.get('name')).trim(),Color:String(f.get('color')),Descripcion:String(f.get('description')).trim(),Fecha:new Date().toISOString(),imagenes:photos.get()}});
          // Mantener la ficha guardada si falla el avistamiento, para no duplicarla al reintentar.
          form.querySelectorAll('[name=name],[name=color],[name=description]').forEach(el=>el.disabled=true);
          $('#photos').classList.add('hidden');
        }
        const id=D.text(savedCat.id_gato || savedCat.id_Gato || savedCat.id);
        if (!id) throw new Error('La API no devolvió el identificador del gato.');
        const locationId=await resolveLocation(f.get('locationId'));
        await API.request('sightings',{method:'POST',data:D.sightingPayload(id,session().id,locationId,f.get('date'),photos.get())});
        location.href=catLink(id)+'&saved=1';
      } catch(err) {status((savedCat ? 'La ficha del gato está guardada; reintenta guardar el avistamiento. ' : '')+err.message,true);b.disabled=false;b.textContent=savedCat ? 'Reintentar avistamiento' : 'Guardar captura';}
    };
  }
  /* detail(): página de una captura (captura.html?id=X). Muestra la ficha y el
     historial de avistamientos, y monta el formulario de "Nuevo avistamiento"
     para registrar más encuentros sin recargar la página. */
  async function detail() {
    const params=new URLSearchParams(location.search), id=params.get('id');
    if (!id) {status('Selecciona una captura para consultar su información.',true);return;}
    status('Cargando captura…');
    let cat;
    try {cat=(await load()).find(c=>c.id===id);}catch(err){status(err.message,true);$('#capture').innerHTML='<button class="btn btn-outline" id="retry">Reintentar</button>';$('#retry').onclick=()=>location.reload();return;}
    if(!cat){status('La captura no existe o ya no está disponible.',true);return;}
    status(params.get('saved')==='1' ? 'Avistamiento guardado correctamente.' : '');
    const latest=cat.sightings[0], image=cat.images[0]||latest?.images[0]||C.examplePhoto;
    $('#capture').innerHTML=`<div class="detail"><div><div class="detail-photo"><img src="${esc(image)}" alt="${esc(image===C.examplePhoto ? 'Foto de ejemplo de un gato atigrado' : cat.name)}" width="1024" height="768">${image===C.examplePhoto ? '<span class="example">Foto de ejemplo</span>' : ''}</div><div class="gallery">${cat.images.concat(cat.sightings.flatMap(s=>s.images)).filter((v,i,a)=>a.indexOf(v)===i).map(src=>`<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="Foto de ${esc(cat.name)}" loading="lazy"></a>`).join('')}</div></div><div><p class="eyebrow">Captura / ${esc(cat.id)}</p><h1>${esc(cat.name)}</h1><span class="chip">${esc(cat.color)}</span><p style="margin-top:24px">${esc(cat.description)}</p><dl><div><dt>Última ubicación</dt><dd id="latest-location">${esc(locationText(latest?.location,latest?.locationId))}</dd></div><div><dt>Último avistamiento</dt><dd>${latest ? dateText(latest.date) : 'Sin avistamientos'}</dd></div><div><dt>Avistamientos registrados</dt><dd id="detail-count">${cat.sightings.length}</dd></div></dl>${cat.missing ? '<p class="notice">La ficha del gato no está disponible. Los nuevos avistamientos conservarán su identificador original.</p>' : ''}<a class="btn btn-primary" href="#nuevo-avistamiento">＋ Nuevo avistamiento</a></div></div>`;
    renderHistory(cat);
    $('#new-sighting').classList.remove('hidden');
    if (!session()) {lock($('#sighting-content'));return;}
    $('#sighting-content').innerHTML=`<form id="sighting-form" class="form"><div id="location-fields"></div><label><span>Fecha del avistamiento</span><input type="date" class="input" name="date" required value="${today()}" max="${today()}"></label><label><span>Observaciones</span><textarea class="input" name="notes" rows="3" placeholder="¿Cómo estaba el gato?"></textarea></label><div><span class="label">Fotos (hasta 4)</span><div class="photos" id="photos"></div></div><p id="sighting-status" class="status" role="status" aria-live="polite"></p><button type="submit" class="btn btn-primary">Guardar avistamiento</button></form>`;
    bindLocations($('#location-fields'));let photos=bindPhotos($('#photos'));
    $('#sighting-form').onsubmit=async e=> {
      e.preventDefault();const form=e.currentTarget, f=new FormData(form), b=form.querySelector('button[type=submit]'), feedback=$('#sighting-status');
      if(photos.pending()){feedback.textContent='Espera a que terminen de cargar las fotos.';return;}
      b.disabled=true;feedback.classList.remove('error');feedback.textContent='Guardando avistamiento…';
      let saved=false;
      try {
        const locationId=await resolveLocation(f.get('locationId'));
        await API.request('sightings',{method:'POST',data:D.sightingPayload(cat.id,session().id,locationId,f.get('date'),photos.get(),String(f.get('notes')).trim())});saved=true;
        data.sightings=await API.request('sightings');cat=D.normalizeCats(data.cats,data.sightings,data.locations).find(c=>c.id===id);
        if(cat) { renderHistory(cat); $('#detail-count').textContent=cat.sightings.length; $('#latest-location').textContent=locationText(cat.sightings[0]?.location,cat.sightings[0]?.locationId); }
        feedback.textContent='Avistamiento guardado correctamente.';form.reset();bindLocations($('#location-fields'));photos=bindPhotos($('#photos'));b.textContent='Guardar avistamiento';b.disabled=false;
      }catch(err){feedback.classList.add('error');feedback.textContent=saved ? 'El avistamiento se guardó, pero no se pudo actualizar el historial. Recarga la captura; no lo envíes de nuevo.' : err.message;b.disabled=saved;}
    };
  }
  function renderHistory(cat) {
    $('#history-section').classList.remove('hidden');$('#history-count').textContent=cat.sightings.length;
    $('#history').innerHTML=cat.sightings.length ? cat.sightings.map(s=>`<li><time>${esc(dateText(s.date))}</time><div><strong>${esc(locationText(s.location,s.locationId))}</strong>${s.location ? `<p class="muted">${esc(s.location.address)} · ${esc(s.location.department)}</p>` : ''}<p class="muted">Explorador #${esc(s.userId)} · Avistamiento #${esc(s.id)}</p>${s.notes ? `<p>${esc(s.notes)}</p>` : ''}${s.images.length ? `<div class="gallery">${s.images.map(src=>`<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="Foto del avistamiento" loading="lazy"></a>`).join('')}</div>` : ''}</div></li>`).join('') : '<li><p class="muted">Todavía no hay avistamientos.</p></li>';
  }
  // Puente exclusivo para la vista previa. El ZIP funciona sin el contenedor.
  if(window.parent!==window) {
    const paths={'index.html':'/','home.html':'/','capturas.html':'/capturas','registrar.html':'/registrar-gato','login.html':'/login','registro.html':'/registro','captura.html':'/captura'};
    document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.target||e.ctrlKey||e.metaKey)return;const u=new URL(a.href);const file=u.pathname.split('/').pop();if(u.origin===location.origin&&paths[file]&&!u.hash){e.preventDefault();window.parent.postMessage({type:'gatogo-navigate',path:paths[file]+u.search},location.origin);}});
    const notify=()=>window.parent.postMessage({type:'gatogo-height',height:document.documentElement.scrollHeight},location.origin);
    new ResizeObserver(notify).observe(document.body);window.addEventListener('load',notify);
  }
  nav();
  const pages={home, capturas:captures, captura:detail, registrar, login:()=>auth(false), registro:()=>auth(true)};
  Promise.resolve(pages[document.body.dataset.page]?.()).catch(err=>status(err.message,true));
})();
