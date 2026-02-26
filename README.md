
# Countries API Backend

## ¿Cómo correr el proyecto?

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   # Edita .env según tu configuración
   ```
3. Inicia el servidor:
   - Modo desarrollo (hot reload):
     ```bash
     npm run dev
     ```
   - Modo producción:
     ```bash
     npm start
     ```
4. Verifica la instalación:
   - REST API: http://localhost:4000/api/health
   - GraphQL Playground: http://localhost:4000/graphql

## Ejemplos de código

### Usando cURL

```bash
# Health check
curl http://localhost:4000/api/health

# Obtener país por código (REST)
curl http://localhost:4000/api/countries/US

# Obtener país usando GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { country(code: \"US\") { code name capital } }"}'
```

### Usando JavaScript (Axios)

```javascript
const axios = require('axios');

// REST API
async function getCountry(code) {
  const response = await axios.get(`http://localhost:4000/api/countries/${code}`);
  return response.data;
}

// GraphQL API
async function getCountryGraphQL(code) {
  const query = `
    query GetCountry($code: ID!) {
      country(code: $code) {
        code
        name
        capital
        continent
      }
    }
  `;
  
  const response = await axios.post('http://localhost:4000/graphql', {
    query,
    variables: { code }
  });
  
  return response.data.data.country;
}

// Uso
getCountry('US').then(console.log);
getCountryGraphQL('MX').then(console.log);
```
## Mejoras que pueden integrarse

- **Gestión de usuarios**: Autenticación y autorización.
- **Cache de respuestas**: Mejorar el rendimiento con caching avanzado.
- **Internacionalización**: Soporte multilenguaje en respuestas.
- **Pruebas automatizadas**: Implementar tests unitarios y de integración.
- **Monitorización avanzada**: Integrar métricas y alertas.
- **Optimización de consultas**: Mejorar la eficiencia en agregación de datos.
- **Gestión de errores personalizada**: Mensajes de error más detallados.
