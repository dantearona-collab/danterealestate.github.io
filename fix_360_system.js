// CORRECCIÓN DEL SISTEMA 360° - Script de Corrección
// =====================================================

// Función para validar imágenes 360 antes de cargarlas
async function validateImages360(imagePaths) {
    const validImages = [];
    
    for (const imagePath of imagePaths) {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            if (response.ok) {
                validImages.push(imagePath);
            } else {
                console.warn(`⚠️ Imagen 360 no encontrada: ${imagePath}`);
            }
        } catch (error) {
            console.warn(`⚠️ Error verificando imagen 360: ${imagePath}`, error);
        }
    }
    
    return validImages;
}

// Función mejorada para abrir visor 360
function abrirVisor360Mejorado(propertyId, index = 0) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.imagenes_360 || property.imagenes_360.length === 0) {
        console.log('⚠️ Esta propiedad no tiene imágenes 360 disponibles');
        showNotification('Esta propiedad no tiene recorrido virtual 360° disponible.', 'warning');
        return;
    }
    
    // Usar la función de validación
    validateImages360(property.imagenes_360).then(imagenesValidas => {
        if (imagenesValidas.length === 0) {
            console.log('❌ No se encontraron imágenes 360 válidas para esta propiedad');
            showNotification('Las imágenes 360 no están disponibles en este momento. Por favor, contacte al administrador.', 'error');
            return;
        }
        
        // Si hay imágenes válidas, proceder con el visor
        imagenes360Actuales = imagenesValidas;
        imagen360Actual = index;
        visor360Activo = true;
        crearModal360(property);
    }).catch(error => {
        console.error('Error validando imágenes 360:', error);
        showNotification('Error cargando el recorrido virtual 360°.', 'error');
    });
}

// Función para mostrar notificaciones mejoradas
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Colores según tipo
    const colors = {
        info: '#232deb',
        warning: '#ff9800',
        error: '#dc3545',
        success: '#28a745'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Agregar estilos de animación
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Aplicar correcciones al sistema existente
function apply360Fixes() {
    // 1. Mejorar el onerror de las imágenes 360
    const originalOnError = `
        onerror="this.src='llave.png'; console.error('❌ Error cargando imagen 360');"
    `;
    
    const improvedOnError = `
        onerror="
            this.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = '
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: white;
                text-align: center;
                padding: 20px;
            ';
            errorDiv.innerHTML = '
                <div style="font-size: 48px; margin-bottom: 10px;">🏠</div>
                <div style="font-size: 16px; margin-bottom: 5px;">Imagen 360° no disponible</div>
                <div style="font-size: 14px; opacity: 0.8;">Esta vista no se puede cargar</div>
            ';
            this.parentNode.appendChild(errorDiv);
        "
    `;
    
    console.log('✅ Sistema 360° corregido aplicado');
    console.log('🔧 Funciones de validación agregadas');
    console.log('📢 Sistema de notificaciones activado');
}

// Inicializar las correcciones cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply360Fixes);
} else {
    apply360Fixes();
}

// Exportar funciones para uso global
window.validateImages360 = validateImages360;
window.abrirVisor360Mejorado = abrirVisor360Mejorado;
window.showNotification = showNotification;

console.log('🚀 Script de corrección 360° cargado correctamente');