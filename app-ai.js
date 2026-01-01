// ========================================
// ===== CÓDIGO DEL ASISTENTE DE IA =====
// ========================================

const AI_API_BASE_URL = "https://danterealestate-github-io.onrender.com"; // API calls will be relative to the current domain
const AI_CHAT_URL = `${AI_API_BASE_URL}/api/chat`;
const AI_FILTERS_URL = `${AI_API_BASE_URL}/api/properties/filter-options`; // Point to existing endpoint
const AI_STATUS_URL = `${AI_API_BASE_URL}/api/properties/stats`; // Re-use existing endpoint

// Las variables globales y funciones principales ya están definidas en index-ai.html
// Este archivo puede contener utilidades adicionales o configuraciones compartidas si es necesario.
// Por ahora, para evitar conflictos con el script inline de index-ai.html que ya tiene toda la lógica,
// dejaremos esto como un archivo de configuración o funciones auxiliares si se extraen en el futuro.

console.log("app-ai.js cargado correctamente. API Base URL:", AI_API_BASE_URL);

// Si se desea mover toda la lógica aquí, se debe limpiar el script de index-ai.html.
// Actualmente index-ai.html contiene la lógica principal «send», «addMessage», etc.
// Mantendremos este archivo limpio para no interferir con las variables globales del HTML.
