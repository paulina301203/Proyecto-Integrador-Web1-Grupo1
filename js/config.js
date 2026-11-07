/* API y fotografías reemplazables. No contiene credenciales privadas. */
window.GatoGoConfig = Object.freeze({
  api: {
    locations: 'https://6ae60fce877d34ccafc2a578.mockapi.io/Ubicacion',
    sightings: 'https://6adcddc4fa5e73d4ab2dc4c2.mockapi.io/api/v1/avistamiento',
    users: 'https://6ae601ec877d34ccafc29a11.mockapi.io/gatogousers/user',
    cats: 'https://6ae601ec877d34ccafc29a11.mockapi.io/gatogousers/Gatos'
  },
  // IMAGEN DE EJEMPLO GENERADA: reemplazar este archivo o esta ruta.
  examplePhoto: 'img/gato-ejemplo.jpg',
  cityDepartments: { 'Medellín': 'Antioquia', 'Bogotá': 'Bogotá D. C.', 'Cali': 'Valle del Cauca', 'Barranquilla': 'Atlántico' },
  // CATÁLOGO COLOMBIANO DE EJEMPLO: direcciones ilustrativas, reemplazables.
  // No sobrescribe registros ajenos. Una ubicación elegida se crea en Ubicacion
  // al guardar el avistamiento y se usa el identificador real devuelto por la API.
  colombianLocations: [
    {Departamento:'Antioquia',Ciudad:'Medellín',Barrio:'El Poblado',Direccion:'Calle 50 # 45-20'},
    {Departamento:'Antioquia',Ciudad:'Medellín',Barrio:'Laureles',Direccion:'Carrera 70 # 32-15'},
    {Departamento:'Antioquia',Ciudad:'Medellín',Barrio:'Manila',Direccion:'Carrera 43A # 1 Sur-50'},
    {Departamento:'Antioquia',Ciudad:'Medellín',Barrio:'Calasanz',Direccion:'Carrera 80 # 48-30'},
    {Departamento:'Antioquia',Ciudad:'Medellín',Barrio:'Prado Centro',Direccion:'Carrera 51 # 52-10'},
    {Departamento:'Bogotá D. C.',Ciudad:'Bogotá',Barrio:'Chicó',Direccion:'Calle 93 # 15-28'},
    {Departamento:'Bogotá D. C.',Ciudad:'Bogotá',Barrio:'La Candelaria',Direccion:'Carrera 7 # 12-20'},
    {Departamento:'Bogotá D. C.',Ciudad:'Bogotá',Barrio:'Quinta Camacho',Direccion:'Calle 72 # 10-34'},
    {Departamento:'Bogotá D. C.',Ciudad:'Bogotá',Barrio:'Santa Bárbara',Direccion:'Calle 116 # 19-50'},
    {Departamento:'Bogotá D. C.',Ciudad:'Bogotá',Barrio:'Cedritos',Direccion:'Calle 140 # 11-45'},
    {Departamento:'Valle del Cauca',Ciudad:'Cali',Barrio:'Centenario',Direccion:'Avenida 6N # 23-40'},
    {Departamento:'Valle del Cauca',Ciudad:'Cali',Barrio:'San Fernando',Direccion:'Calle 9 # 38-15'},
    {Departamento:'Valle del Cauca',Ciudad:'Cali',Barrio:'Ciudad Jardín',Direccion:'Carrera 100 # 11-60'},
    {Departamento:'Atlántico',Ciudad:'Barranquilla',Barrio:'El Prado',Direccion:'Carrera 43 # 70-50'},
    {Departamento:'Atlántico',Ciudad:'Barranquilla',Barrio:'Alto Prado',Direccion:'Calle 84 # 52-24'}
  ]
});
