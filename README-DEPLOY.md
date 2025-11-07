# Dante Propiedades - Deploy en Render

## 📋 Archivos Incluidos
- `index.html` - Página principal del sitio
- `app.js` - JavaScript con funcionalidades de búsqueda
- `propiedades.json` - Base de datos de propiedades
- `propiedades_simple.json` - Datos de respaldo

## 🚀 Deploy en Render - Pasos

### Opción 1: Usando GitHub (RECOMENDADO)

1. **Crear cuenta en Render:**
   - Ve a [render.com](https://render.com)
   - Regístrate con GitHub, GitLab o email

2. **Subir archivos a GitHub:**
   - Crea un repositorio nuevo en GitHub
   - Extrae el ZIP y sube los 4 archivos a la raíz
   - Asegúrate que `index.html` esté en la raíz del repositorio

3. **Configurar en Render:**
   - Click en "New" → "Static Site"
   - Conecta tu repositorio de GitHub
   - Build Command: *(deja vacío)*
   - Publish Directory: `./`
   - Click "Create"

4. **Obtener URL:**
   - Render asignará automáticamente una URL como: `https://dante-propiedades.onrender.com`

### Opción 2: Deploy Directo (Alternative)

1. **Crear Web Service:**
   - New → "Web Service"
   - Environment: "Node"
   - Build Command: `npm install`
   - Start Command: `python -m http.server 3000`

## ✅ Verificaciones Post-Deploy

- [ ] Sitio carga correctamente
- [ ] Buscador de propiedades funciona
- [ ] Slider institucional rota
- [ ] Sección "LABORATORIO DANTE" se muestra
- [ ] Filtros por precio, tipo, operación funcionan
- [ ] Imágenes placeholder cargan correctamente

## 🔧 Solución de Problemas

### Error: No carga el sitio
- Verifica que `index.html` esté en la raíz del repositorio
- Asegúrate que Publish Directory sea `./`

### Error: Búsqueda no funciona
- Verifica que `propiedades.json` y `app.js` estén en la raíz
- Revisa la consola del navegador para errores JavaScript

### Error: Imágenes no cargan
- Las imágenes placeholder ya están configuradas correctamente
- El error `net::ERR_NAME_NOT_RESOLVED` ya está solucionado

## 📞 Soporte
Si tienes problemas, revisa la consola del navegador (F12) para errores específicos.

---
**Sitio preparado por MiniMax Agent**  
Fecha: 2025-11-08