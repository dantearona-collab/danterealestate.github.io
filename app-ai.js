// ========================================
// ===== CÓDIGO DEL ASISTENTE DE IA =====
// ========================================

const AI_API_BASE_URL = ""; // API calls will be relative to the current domain
const AI_CHAT_URL = `${AI_API_BASE_URL}/api/chat`;
const AI_FILTERS_URL = `${AI_API_BASE_URL}/api/properties/filter-options`; // Point to existing endpoint
const AI_STATUS_URL = `${AI_API_BASE_URL}/api/properties/stats`; // Re-use existing endpoint

let ai_chatBox, ai_input, ai_button, ai_typingIndicator, ai_statusText;

let ai_conversacionActual = [];
let ai_filtrosDinamicos = { operaciones: [], tipos: [], barrios: [] };
let ai_contextoActual = { tipo: null, resultados: [], propiedad_focus: null, filtros_usados: {}, timestamp: null };

function toggleChatWidget() {
    const chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow) {
        chatWindow.classList.toggle('open');
    }
}

// Lógica del modal de imágenes del Chat (para evitar conflictos)
function ai_mostrarImagenesByIndex(index) {
    const fotos = ai_contextoActual.resultados[index]?.fotos;
    // Esta función puede ser expandida para mostrar un modal si se desea
    alert(`Imágenes para la propiedad: \n${fotos ? fotos.join('\n') : 'No hay imágenes.'}`);
}


function ai_addMessage(text, from = "bot") {
    if (!ai_chatBox) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${from === 'user' ? 'msg-user' : 'msg-bot'}`;
    // Usar textContent para el usuario para evitar inyección de HTML
    if (from === 'user') {
        messageDiv.textContent = text;
    } else {
        // Para el bot, podemos confiar en el HTML que generamos
        const md = window.markdownit();
        messageDiv.innerHTML = `<b>ASISTENTE VIRTUAL</b><br>${md.render(text)}`;
    }
    ai_chatBox.appendChild(messageDiv);
    ai_chatBox.scrollTop = ai_chatBox.scrollHeight;
}

function ai_formatPrecio(precio, moneda) {
    if (!precio || isNaN(precio)) return 'Consultar';
    return `${moneda || 'USD'} ${Number(precio).toLocaleString('es-AR')}`;
}

function ai_mostrarPropiedadesEnInterfaz(propiedades) {
    const container = document.createElement('div');
    container.className = 'propiedades-container';

    propiedades.forEach((prop, index) => {
        const card = document.createElement('div');
        card.className = 'propiedad-card';
        card.innerHTML = `
            <div class="propiedad-header">
                <h4>${prop.titulo}</h4>
                <span class="precio">${ai_formatPrecio(prop.precio, prop.moneda_precio)}</span>
            </div>
            <div class="propiedad-info">
                <span>📍 ${prop.barrio}</span>
                <span>🏠 ${prop.ambientes} amb</span>
                <span>📏 ${prop.metros_cuadrados} m²</span>
            </div>
            <button class="btn-imagenes" onclick='ai_mostrarImagenesByIndex(${index})'>Ver Fotos</button>
        `;
        container.appendChild(card);
    });

    ai_chatBox.appendChild(container);
    ai_chatBox.scrollTop = ai_chatBox.scrollHeight;
}

function ai_showTypingIndicator(show) {
    if(ai_typingIndicator) ai_typingIndicator.style.display = show ? 'flex' : 'none';
    if(show && ai_chatBox) ai_chatBox.scrollTop = ai_chatBox.scrollHeight;
}

function resetearChat() {
    if (confirm('¿Estás seguro de que querés empezar una nueva conversación?')) {
        if(ai_chatBox) ai_chatBox.innerHTML = '';
        ai_conversacionActual = [];
        ai_contextoActual = { tipo: null, resultados: [], propiedad_focus: null, filtros_usados: {}, timestamp: null };
        ai_addMessage('¡Perfecto! Empecemos de nuevo. ¿Qué propiedad estás buscando?', 'bot');
    }
}

async function ai_send() {
    if(!ai_input || !ai_button) return;
    
    let msg = ai_input.value.trim();
    if (!msg) return;

    ai_addMessage(msg, 'user');
    ai_input.value = '';
    ai_button.disabled = true;
    ai_showTypingIndicator(true);

    try {
        const payload = { 
            message: msg, 
            channel: 'web', 
            filters: {}, // Los filtros del panel izquierdo no se usan en el chat por ahora
            contexto_anterior: ai_contextoActual 
        };
        const response = await fetch(AI_CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        const data = await response.json();

        if (data.response) {
            ai_addMessage(data.response);
            if (data.propiedades && data.propiedades.length > 0) {
                ai_contextoActual = {
                    tipo: 'busqueda',
                    resultados: data.propiedades,
                    propiedad_focus: null,
                    filtros_usados: data.filters_used || {},
                    timestamp: new Date().toISOString()
                };
                ai_mostrarPropiedadesEnInterfaz(data.propiedades);
            } else {
                ai_contextoActual.resultados = [];
            }
        } else if (data.error) {
            ai_addMessage(`⚠️ Error: ${data.error}`);
        } else {
            ai_addMessage('❌ Respuesta inesperada del servidor');
        }
        if(ai_statusText) ai_statusText.textContent = 'Conectado';
    } catch (error) {
        console.error('Error en el chat de IA:', error);
        ai_addMessage('⚠️ No se pudo conectar con el servidor de IA. Por favor, intentá nuevamente más tarde.');
        if(ai_statusText) ai_statusText.textContent = 'Error de conexión';
    } finally {
        ai_showTypingIndicator(false);
        ai_button.disabled = false;
        ai_input.focus();
    }
}

async function ai_checkServerStatus() {
    if(!ai_statusText) return;
    try {
        const response = await fetch(AI_STATUS_URL);
        ai_statusText.textContent = response.ok ? 'Conectado' : 'Servidor inactivo';
    } catch (error) {
        ai_statusText.textContent = 'Sin conexión';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de variables del ChatBot
    ai_chatBox = document.querySelector("#ai-chat-container .chat-box");
    ai_input = document.querySelector("#ai-chat-container #userInput");
    ai_button = document.querySelector("#ai-chat-container #sendBtn");
    ai_typingIndicator = document.querySelector("#ai-chat-container .typing-indicator");
    ai_statusText = document.querySelector("#ai-chat-container #statusText");
    
    if(ai_button) ai_button.addEventListener('click', ai_send);
    if(ai_input) ai_input.addEventListener('keypress', (e) => { if (e.key === 'Enter') ai_send(); });
    
    if(ai_chatBox){
        ai_checkServerStatus();
        setInterval(ai_checkServerStatus, 60000);
        
        setTimeout(() => {
            ai_addMessage('¡Hola! 👋 Soy tu asistente virtual. Pregúntame lo que necesites.', 'bot');
        }, 2500);
    }
});

// Cargar Markdown-it dinámicamente
const mdScript = document.createElement('script');
mdScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/markdown-it/12.3.2/markdown-it.min.js';
document.head.appendChild(mdScript);
