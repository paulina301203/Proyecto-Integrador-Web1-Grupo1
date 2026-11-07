/* Peticiones directas desde el navegador. MockAPI es un servicio público de pruebas,
   NO un sistema de autenticación seguro. Nunca usar contraseñas reales. */
(function () {
  async function request(resource, { method = 'GET', data, id } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(window.GatoGoConfig.api[resource] + (id ? `/${encodeURIComponent(id)}` : ''), {
        method, signal: controller.signal,
        headers: data ? { 'Content-Type': 'application/json' } : undefined,
        body: data ? JSON.stringify(data) : undefined
      });
      if (!response.ok) throw new Error(`No se pudo ${method === 'GET' ? 'consultar' : 'guardar'} ${resource === 'cats' ? 'el gato' : resource === 'sightings' ? 'el avistamiento' : resource === 'users' ? 'la cuenta' : 'la ubicación'} (${response.status}).`);
      const value = await response.json();
      if (method === 'GET' && !id && !Array.isArray(value)) throw new Error('La API no devolvió una lista válida.');
      return value;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('La API tardó demasiado. Inténtalo de nuevo.');
      if (err instanceof TypeError) throw new Error('No se pudo conectar a la API. Comprueba tu conexión e inténtalo de nuevo.');
      throw err;
    } finally { clearTimeout(timeout); }
  }
  window.GatoGoAPI = { request };
})();
