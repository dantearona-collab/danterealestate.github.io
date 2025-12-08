/**
 * SISTEMA MEJORADO PARA MANEJO DE IMÁGENES 360°
 * Maneja casos donde las imágenes 360 no están disponibles
 * 
 * Funcionalidades:
 * 1. Detecta imágenes 360 faltantes
 * 2. Proporciona fallbacks usando imágenes regulares
 * 3. Muestra mensajes informativos al usuario
 * 4. Permite usar imágenes regulares como "modo panorámico"
 */

class Sistema360Mejorado {
    constructor() {
        this.sistemaIniciado = false;
        this.propiedadesCon360 = new Map();
        this.fallbacksDisponibles = new Map();
        this.mensajeInicialMostrado = false;
    }

    /**
     * Inicializa el sistema mejorado
     */
    async inicializar() {
        if (this.sistemaIniciado) return;
        
        console.log('🔄 Iniciando Sistema 360° Mejorado...');
        
        // Interceptar funciones de carga 360 existentes
        this.interceptarFunciones360();
        
        // Cargar propiedades con imágenes 360
        await this.cargarPropiedades360();
        
        // Configurar sistema de fallbacks
        this.configurarFallbacks();
        
        // Agregar estilos CSS mejorados
        this.agregarEstilosMejorados();
        
        this.sistemaIniciado = true;
        console.log('✅ Sistema 360° Mejorado iniciado correctamente');
        console.log('💡 Características disponibles:');
        console.log('   - Detección automática de imágenes 360 faltantes');
        console.log('   - Sistema de fallback con imágenes regulares');
        console.log('   - Modo panorámico alternativo');
        console.log('   - Mensajes informativos mejorados');
    }

    /**
     * Intercepta las funciones existentes de carga 360
     */
    interceptarFunciones360() {
        // Interceptar la función original de abrir visor 360
        const originalOpenVisor = window.abrirVisor360Mejorado;
        
        if (typeof originalOpenVisor === 'function') {
            window.abrirVisor360Mejorado = async (titulo, imagenes360) => {
                console.log(`🔄 Interceptando apertura de visor 360: ${titulo}`);
                return await this.abrirVisorConFallback(titulo, imagenes360);
            };
            console.log('✅ Función abrirVisor360Mejorado interceptada');
        }

        // Interceptar función de validación de imágenes
        const originalValidateImages = window.validateImages360;
        
        if (typeof originalValidateImages === 'function') {
            window.validateImages360 = async (imagePaths) => {
                return await this.validarConFallback(imagePaths, titulo);
            };
            console.log('✅ Función validateImages360 interceptada');
        }
    }

    /**
     * Carga información de propiedades con imágenes 360
     */
    async cargarPropiedades360() {
        try {
            // Esta función debería ser llamada desde app.js con los datos de propiedades
            if (typeof propiedadesData !== 'undefined') {
                propiedadesData.forEach(prop => {
                    if (prop.imagenes_360 && prop.imagenes_360.length > 0) {
                        this.propiedadesCon360.set(prop.id_temporal, {
                            titulo: prop.titulo,
                            imagenes360: prop.imagenes_360,
                            imagenesRegulares: prop.fotos || []
                        });
                        console.log(`📋 Propiedad ${prop.id_temporal}: ${prop.imagenes_360.length} imágenes 360 configuradas`);
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Error cargando datos de propiedades 360:', error);
        }
    }

    /**
     * Configura sistema de fallbacks
     */
    configurarFallbacks() {
        // Crear elementos de fallback en el DOM si no existen
        if (!document.getElementById('visor360-container')) {
            this.crearContenedorFallback();
        }
    }

    /**
     * Crea contenedor para modo fallback
     */
    crearContenedorFallback() {
        const container = document.createElement('div');
        container.id = 'visor360-container';
        container.innerHTML = `
            <div id="visor360-fallback" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 9999;
                color: white;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="
                    max-width: 800px;
                    margin: 50px auto;
                    background: rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 30px;
                    backdrop-filter: blur(10px);
                ">
                    <h2 style="margin: 0 0 20px 0; color: #fff;">
                        🏠 Vista Panorámica Alternativa
                    </h2>
                    <div id="visor360-fallback-content">
                        <p style="margin: 20px 0; font-size: 16px;">
                            Las imágenes 360° no están disponibles actualmente.
                        </p>
                        <p style="margin: 20px 0; font-size: 14px; opacity: 0.8;">
                            Mostrando vista panorámica alternativa con las fotos disponibles.
                        </p>
                        <div id="visor360-fallback-images" style="
                            display: flex;
                            flex-wrap: wrap;
                            gap: 10px;
                            justify-content: center;
                            margin: 30px 0;
                        "></div>
                    </div>
                    <button onclick="cerrarVisor360Fallback()" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 20px;
                    ">
                        ✕ Cerrar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        
        // Agregar función global para cerrar
        window.cerrarVisor360Fallback = () => {
            document.getElementById('visor360-fallback').style.display = 'none';
        };
    }

    /**
     * Abre visor con sistema de fallback
     */
    async abrirVisorConFallback(titulo, imagenes360) {
        console.log(`🔍 Intentando abrir visor 360° para: ${titulo}`);
        console.log(`📸 Imágenes 360° solicitadas:`, imagenes360);

        try {
            // Verificar si las imágenes 360 existen
            const imagenesValidas = await this.validarConFallback(imagenes360, titulo);
            
            if (imagenesValidas.length > 0) {
                console.log(`✅ ${imagenesValidas.length} imágenes 360° válidas encontradas`);
                // Si hay imágenes 360 válidas, usar el visor original
                if (typeof originalOpenVisor === 'function') {
                    return await originalOpenVisor(titulo, imagenesValidas);
                }
            } else {
                console.log(`⚠️ No se encontraron imágenes 360° válidas para: ${titulo}`);
                return await this.mostrarFallback(titulo);
            }
        } catch (error) {
            console.error('❌ Error en visor 360°:', error);
            return await this.mostrarFallback(titulo);
        }
    }

    /**
     * Valida imágenes con sistema de fallback
     */
    async validarConFallback(imagePaths, titulo) {
        if (!imagePaths || imagePaths.length === 0) {
            return [];
        }

        const imagenesValidas = [];
        
        for (const path of imagePaths) {
            try {
                const response = await fetch(path, { method: 'HEAD' });
                if (response.ok) {
                    imagenesValidas.push(path);
                }
            } catch (error) {
                console.warn(`⚠️ Imagen 360° no disponible: ${path}`);
            }
        }
        
        return imagenesValidas;
    }

    /**
     * Muestra vista de fallback con imágenes regulares
     */
    async mostrarFallback(titulo) {
        console.log(`🔄 Mostrando vista fallback para: ${titulo}`);
        
        // Buscar propiedad en datos
        let propiedad = null;
        if (typeof propiedadesData !== 'undefined') {
            propiedad = propiedadesData.find(p => p.titulo === titulo);
        }

        const container = document.getElementById('visor360-fallback');
        const content = document.getElementById('visor360-fallback-content');
        const imagesContainer = document.getElementById('visor360-fallback-images');
        
        if (!container || !content || !imagesContainer) {
            console.error('❌ Elementos del fallback no encontrados');
            return;
        }

        // Mostrar título
        content.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #fff;">
                🏠 Vista Panorámica: ${titulo}
            </h2>
            <div style="
                background: rgba(255,193,7,0.2);
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #fff;
            ">
                <p style="margin: 0; font-size: 14px;">
                    📸 <strong>Vista Panorámica Alternativa</strong>
                </p>
                <p style="margin: 10px 0 0 0; font-size: 13px; opacity: 0.9;">
                    Las imágenes 360° no están disponibles. Mostrando galería de fotos disponibles.
                </p>
            </div>
        `;

        // Agregar imágenes disponibles
        imagesContainer.innerHTML = '';
        
        if (propiedad && propiedad.fotos && propiedad.fotos.length > 0) {
            // Mostrar primeras 6 imágenes
            const imagenesAMostrar = propiedad.fotos.slice(0, 6);
            
            imagenesAMostrar.forEach((foto, index) => {
                const imgElement = document.createElement('div');
                imgElement.style.cssText = `
                    width: 200px;
                    height: 150px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    border: 2px solid transparent;
                `;
                
                imgElement.innerHTML = `
                    <img src="${foto}" alt="Foto ${index + 1}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                         onload="this.style.opacity='1';">
                    <div style="
                        display: none;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        font-size: 14px;
                    ">
                        <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
                        <div>Imagen ${index + 1}</div>
                    </div>
                `;
                
                // Agregar efecto hover
                imgElement.addEventListener('mouseenter', () => {
                    imgElement.style.transform = 'scale(1.05)';
                    imgElement.style.borderColor = '#007bff';
                });
                
                imgElement.addEventListener('mouseleave', () => {
                    imgElement.style.transform = 'scale(1)';
                    imgElement.style.borderColor = 'transparent';
                });
                
                imagesContainer.appendChild(imgElement);
            });
            
            // Agregar información adicional
            const infoElement = document.createElement('div');
            infoElement.style.cssText = `
                width: 100%;
                margin-top: 20px;
                padding: 15px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                text-align: left;
            `;
            
            infoElement.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: #fff;">ℹ️ Información de la Propiedad</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px;">
                    ${propiedad.barrio ? `<div><strong>Barrio:</strong> ${propiedad.barrio}</div>` : ''}
                    ${propiedad.ambientes ? `<div><strong>Ambientes:</strong> ${propiedad.ambientes}</div>` : ''}
                    ${propiedad.metros_cuadrados ? `<div><strong>Superficie:</strong> ${propiedad.metros_cuadrados}m²</div>` : ''}
                    ${propiedad.tipo ? `<div><strong>Tipo:</strong> ${propiedad.tipo}</div>` : ''}
                </div>
            `;
            
            imagesContainer.appendChild(infoElement);
            
        } else {
            imagesContainer.innerHTML = `
                <div style="
                    padding: 40px;
                    text-align: center;
                    color: rgba(255,255,255,0.7);
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">📷</div>
                    <p>No se encontraron imágenes disponibles para esta propiedad.</p>
                </div>
            `;
        }

        // Mostrar el contenedor
        container.style.display = 'flex';
        
        // Notificación al usuario
        this.mostrarNotificacion('ℹ️', 'Vista panorámica alternativa activada', 'info');
        
        return true;
    }

    /**
     * Muestra notificación mejorada
     */
    mostrarNotificacion(icono, mensaje, tipo = 'info') {
        const colores = {
            info: '#007bff',
            warning: '#ffc107',
            error: '#dc3545',
            success: '#28a745'
        };

        const notificacion = document.createElement('div');
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colores[tipo] || colores.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        notificacion.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${icono}</span>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(notificacion);
        
        // Animar entrada
        setTimeout(() => {
            notificacion.style.opacity = '1';
            notificacion.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remover
        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Agrega estilos CSS mejorados
     */
    agregarEstilosMejorados() {
        if (document.getElementById('estilos-360-mejorado')) return;

        const estilos = document.createElement('style');
        estilos.id = 'estilos-360-mejorado';
        estilos.textContent = `
            /* Estilos para sistema 360° mejorado */
            .visor-360-boton {
                position: relative;
                overflow: hidden;
            }
            
            .visor-360-boton::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            .visor-360-boton:hover::after {
                left: 100%;
            }
            
            .notificacion-360 {
                animation: slideInRight 0.3s ease-out;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            /* Mejoras para el modo fallback */
            #visor360-fallback {
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            
            #visor360-fallback img {
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            #visor360-fallback img:hover {
                transform: scale(1.02);
            }
        `;
        
        document.head.appendChild(estilos);
    }

    /**
     * Método público para activar manualmente el modo fallback
     */
    activarModoFallback(titulo) {
        console.log(`🔄 Activando modo fallback manualmente para: ${titulo}`);
        return this.mostrarFallback(titulo);
    }

    /**
     * Obtiene estadísticas del sistema
     */
    obtenerEstadisticas() {
        return {
            sistemaIniciado: this.sistemaIniciado,
            propiedadesCon360: this.propiedadesCon360.size,
            fallbacksConfigurados: this.fallbacksDisponibles.size
        };
    }
}

// Inicializar sistema automáticamente
const sistema360Mejorado = new Sistema360Mejorado();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sistema360Mejorado.inicializar();
    });
} else {
    sistema360Mejorado.inicializar();
}

// Exportar para uso global
window.sistema360Mejorado = sistema360Mejorado;

console.log('🚀 Sistema 360° Mejorado cargado y listo para usar');
console.log('💡 Métodos disponibles:');
console.log('   - sistema360Mejorado.activarModoFallback(titulo)');
console.log('   - sistema360Mejorado.obtenerEstadisticas()');
console.log('   - sistema360Mejorado.inicializar()');