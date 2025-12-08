// SISTEMA DE OPTIMIZACIÓN FINAL 360°
// ======================================

(function() {
    'use strict';
    
    // Configuración del sistema 360°
    const CONFIG_360 = {
        maxImages: 10,
        preloadNext: true,
        errorTimeout: 5000,
        showNotifications: true
    };
    
    // Función para mejorar el manejo de errores en imágenes 360
    function improve360ErrorHandling() {
        // Interceptar errores de carga de imágenes
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'img') {
                const originalOnError = element.onerror;
                element.onerror = function(e) {
                    // Ocultar imagen con error
                    this.style.display = 'none';
                    
                    // Crear placeholder informativo
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        color: #6c757d;
                        text-align: center;
                        padding: 20px;
                        border-radius: 8px;
                        font-size: 14px;
                    `;
                    
                    placeholder.innerHTML = `
                        <div style="font-size: 32px; margin-bottom: 8px;">🏠</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Vista 360° no disponible</div>
                        <div style="font-size: 12px; opacity: 0.8;">Esta imagen no se puede cargar</div>
                    `;
                    
                    // Insertar placeholder
                    if (this.parentNode) {
                        this.parentNode.appendChild(placeholder);
                    }
                    
                    // Log para debugging
                    console.warn('⚠️ Imagen 360° no cargada:', this.src);
                    
                    // Llamar handler original si existe
                    if (originalOnError) {
                        originalOnError.call(this, e);
                    }
                };
            }
            
            return element;
        };
    }
    
    // Función para optimizar el visor 360
    function optimize360Viewer() {
        // Mejorar el rendimiento del visor
        const originalAbrirVisor360 = window.abrirVisor360;
        
        if (originalAbrirVisor360) {
            window.abrirVisor360 = function(propertyId, index = 0) {
                console.log('🔄 Iniciando visor 360° optimizado...');
                
                // Validar parámetros
                if (!propertyId) {
                    console.error('❌ ID de propiedad requerido para visor 360°');
                    return;
                }
                
                // Ejecutar función original con manejo de errores mejorado
                try {
                    originalAbrirVisor360(propertyId, index);
                } catch (error) {
                    console.error('❌ Error en visor 360°:', error);
                    if (typeof showNotification === 'function') {
                        showNotification('Error cargando el recorrido virtual 360°', 'error');
                    }
                }
            };
        }
    }
    
    // Función para mejorar las notificaciones
    function improveNotifications() {
        // Asegurar que la función showNotification existe
        if (typeof window.showNotification !== 'function') {
            window.showNotification = function(message, type = 'info') {
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
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                `;
                
                const colors = {
                    info: '#232deb',
                    warning: '#ff9800',
                    error: '#dc3545',
                    success: '#28a745'
                };
                
                notification.style.backgroundColor = colors[type] || colors.info;
                notification.textContent = message;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 4000);
            };
        }
    }
    
    // Función para agregar estilos CSS necesarios
    function addRequiredStyles() {
        if (!document.getElementById('360-optimization-styles')) {
            const style = document.createElement('style');
            style.id = '360-optimization-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                
                /* Mejoras para el visor 360 */
                .visor-360-container img {
                    transition: opacity 0.3s ease;
                }
                
                .visor-360-placeholder {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #6c757d;
                    text-align: center;
                    padding: 20px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Función principal de inicialización
    function initialize360Optimization() {
        console.log('🚀 Iniciando optimización del sistema 360°...');
        
        // Aplicar mejoras
        improve360ErrorHandling();
        optimize360Viewer();
        improveNotifications();
        addRequiredStyles();
        
        console.log('✅ Optimización del sistema 360° completada');
        console.log('🔧 Funciones mejoradas:');
        console.log('   - Manejo de errores en imágenes 360°');
        console.log('   - Notificaciones mejoradas');
        console.log('   - Optimización del visor');
        console.log('   - Estilos CSS agregados');
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize360Optimization);
    } else {
        initialize360Optimization();
    }
    
    // También inicializar después de un breve delay para asegurar que otros scripts se hayan cargado
    setTimeout(initialize360Optimization, 100);
    
})();

// Mensaje de confirmación
console.log('🎯 Script de optimización 360° cargado correctamente');