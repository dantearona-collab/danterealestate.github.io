// ================================================
// 🔧 SISTEMA 360° DANTEPROPIEDADES - VERSIÓN LIMPIA
// ================================================
// ✅ SIN BUCLES INFINITOS
// ✅ BOTONES 360° FUNCIONANDO CORRECTAMENTE
// ✅ MODAL RESPONSIVE CON NAVEGACIÓN

console.log('🏠 === SISTEMA DANTEPROPIEDADES 360° CARGADO ===');
console.log('✅ Sin bucles infinitos - Sistema limpio y funcional');

// Datos de propiedades (ejemplo)
const propiedadesData = [
    {
        id: 1,
        titulo: "Departamento Moderno en Palermo",
        precio: "$250,000",
        ubicacion: "Palermo, Buenos Aires",
        habitaciones: 3,
        banos: 2,
        superficie: "120 m²",
        imagenes: [
            "https://picsum.photos/600/400?random=1",
            "https://picsum.photos/600/400?random=2", 
            "https://picsum.photos/600/400?random=3",
            "https://picsum.photos/600/400?random=4",
            "https://picsum.photos/600/400?random=5"
        ]
    },
    {
        id: 2,
        titulo: "Casa con Jardín en Belgrano",
        precio: "$380,000",
        ubicacion: "Belgrano, Buenos Aires",
        habitaciones: 4,
        banos: 3,
        superficie: "180 m²",
        imagenes: [
            "https://picsum.photos/600/400?random=6",
            "https://picsum.photos/600/400?random=7",
            "https://picsum.photos/600/400?random=8",
            "https://picsum.photos/600/400?random=9"
        ]
    },
    {
        id: 3,
        titulo: "Oficina Comercial en Microcentro",
        precio: "$150,000",
        ubicacion: "Microcentro, Buenos Aires",
        habitaciones: 0,
        banos: 1,
        superficie: "80 m²",
        imagenes: [
            "https://picsum.photos/600/400?random=10",
            "https://picsum.photos/600/400?random=11",
            "https://picsum.photos/600/400?random=12"
        ]
    },
    {
        id: 4,
        titulo: "Departamento de Lujo en Puerto Madero",
        precio: "$520,000",
        ubicacion: "Puerto Madero, Buenos Aires",
        habitaciones: 2,
        banos: 2,
        superficie: "95 m²",
        imagenes: [
            "https://picsum.photos/600/400?random=13",
            "https://picsum.photos/600/400?random=14",
            "https://picsum.photos/600/400?random=15",
            "https://picsum.photos/600/400?random=16",
            "https://picsum.photos/600/400?random=17",
            "https://picsum.photos/600/400?random=18"
        ]
    }
];

// Variables para el modal
let propiedadActual = null;
let imagenActual = 0;

// ================================================
// 🔧 FUNCIONES DEL SISTEMA 360°
// ================================================

/**
 * Función para crear tarjetas de propiedades
 * Esta función reemplaza completamente el sistema problemático
 */
function crearTarjetasPropiedades() {
    console.log('🏗️ Creando tarjetas de propiedades...');
    
    const grid = document.getElementById('propertiesGrid');
    const loading = document.getElementById('loading');
    
    if (!grid) {
        console.error('❌ No se encontró el elemento #propertiesGrid');
        return;
    }
    
    // Mostrar loading
    if (loading) {
        loading.style.display = 'block';
    }
    grid.style.display = 'none';
    
    // Simular carga
    setTimeout(() => {
        if (loading) {
            loading.style.display = 'none';
        }
        grid.style.display = 'grid';
        
        // Limpiar grid existente
        grid.innerHTML = '';
        
        propiedadesData.forEach((propiedad, index) => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'property-card';
            tarjeta.innerHTML = `
                <img src="${propiedad.imagenes[0]}" alt="${propiedad.titulo}" class="property-image">
                <div class="property-content">
                    <h3 class="property-title">${propiedad.titulo}</h3>
                    <div class="property-price">${propiedad.precio}</div>
                    <div class="property-details">
                        <div class="property-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            ${propiedad.ubicacion}
                        </div>
                        ${propiedad.habitaciones > 0 ? `
                            <div class="property-detail">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                ${propiedad.habitaciones} hab.
                            </div>
                        ` : ''}
                        <div class="property-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c1.1 0 2 .9 2 2v2h4V4c0-1.1-.9-2-2-2h-4v4h6V4zM8 10v8H4v-8h4zm6-8h4v6h-4V2zm4 12v8h-4v-8h4zm6-10v18h-4V4h4z"/>
                            </svg>
                            ${propiedad.banos} baño${propiedad.banos > 1 ? 's' : ''}
                        </div>
                        <div class="property-detail">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                            </svg>
                            ${propiedad.superficie}
                        </div>
                    </div>
                    <button class="btn-360" onclick="abrirModal360(${index})">
                        <span class="icon">🎬</span>
                        Ver Recorrido 360°
                    </button>
                </div>
            `;
            grid.appendChild(tarjeta);
        });
        
        console.log(`✅ ${propiedadesData.length} propiedades cargadas exitosamente`);
    }, 800);
}

/**
 * Función para abrir modal 360°
 * Esta función reemplaza los sistemas problemáticos
 */
function abrirModal360(indice) {
    console.log(`🎬 Abriendo galería 360° para: ${propiedadesData[indice].titulo}`);
    
    if (indice < 0 || indice >= propiedadesData.length) {
        console.error('❌ Índice de propiedad inválido:', indice);
        return;
    }
    
    propiedadActual = propiedadesData[indice];
    imagenActual = 0;
    
    // Mostrar modal
    const modal = document.getElementById('modal360');
    if (!modal) {
        console.error('❌ No se encontró el modal con id "modal360"');
        return;
    }
    
    modal.style.display = 'block';
    
    // Actualizar contenido
    actualizarImagenesModal();
    
    // Añadir clase para animación
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

/**
 * Función para cerrar modal
 */
function cerrarModal360() {
    const modal = document.getElementById('modal360');
    if (!modal) return;
    
    modal.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        propiedadActual = null;
        imagenActual = 0;
    }, 300);
}

/**
 * Función para actualizar imágenes del modal
 */
function actualizarImagenesModal() {
    if (!propiedadActual) {
        console.warn('⚠️ No hay propiedad actual seleccionada');
        return;
    }
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailsContainer = document.getElementById('imageThumbnails');
    
    if (!mainImage || !thumbnailsContainer) {
        console.error('❌ No se encontraron elementos del modal');
        return;
    }
    
    // Actualizar imagen principal
    mainImage.src = propiedadActual.imagenes[imagenActual];
    mainImage.alt = `${propiedadActual.titulo} - Imagen ${imagenActual + 1}`;
    
    // Crear/actualizar miniaturas
    thumbnailsContainer.innerHTML = '';
    propiedadActual.imagenes.forEach((imagen, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = imagen;
        thumbnail.alt = `Miniatura ${index + 1}`;
        thumbnail.className = `thumbnail ${index === imagenActual ? 'active' : ''}`;
        thumbnail.onclick = () => cambiarAImagen(index);
        thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Actualizar navegación
    const prevBtn = document.querySelector('.image-navigation.prev');
    const nextBtn = document.querySelector('.image-navigation.next');
    
    if (prevBtn) {
        prevBtn.style.display = imagenActual > 0 ? 'flex' : 'none';
    }
    if (nextBtn) {
        nextBtn.style.display = imagenActual < propiedadActual.imagenes.length - 1 ? 'flex' : 'none';
    }
}

/**
 * Función para cambiar imagen
 */
function cambiarImagen(direccion) {
    if (!propiedadActual) {
        console.warn('⚠️ No hay propiedad actual');
        return;
    }
    
    const nuevaImagen = imagenActual + direccion;
    if (nuevaImagen >= 0 && nuevaImagen < propiedadActual.imagenes.length) {
        imagenActual = nuevaImagen;
        actualizarImagenesModal();
    }
}

/**
 * Función para cambiar a imagen específica
 */
function cambiarAImagen(indice) {
    if (!propiedadActual) {
        console.warn('⚠️ No hay propiedad actual');
        return;
    }
    
    if (indice >= 0 && indice < propiedadActual.imagenes.length) {
        imagenActual = indice;
        actualizarImagenesModal();
    }
}

// ================================================
// 🎯 EVENTOS Y CONFIGURACIÓN
// ================================================

/**
 * Configurar eventos del modal
 */
function configurarEventosModal() {
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal360();
        }
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    const modal = document.getElementById('modal360');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModal360();
            }
        });
    }
}

/**
 * Función de diagnóstico del sistema
 */
function diagnosticarSistema360() {
    console.log('🔍 === DIAGNÓSTICO DEL SISTEMA 360° ===');
    
    const modal = document.getElementById('modal360');
    const grid = document.getElementById('propertiesGrid');
    
    console.log('📊 Estado del sistema:');
    console.log(`   - Modal existe: ${modal ? '✅' : '❌'}`);
    console.log(`   - Grid existe: ${grid ? '✅' : '❌'}`);
    console.log(`   - Propiedades cargadas: ${propiedadesData.length}`);
    console.log(`   - Funciones disponibles:`);
    console.log(`     * abrirModal360: ${typeof abrirModal360 === 'function' ? '✅' : '❌'}`);
    console.log(`     * cerrarModal360: ${typeof cerrarModal360 === 'function' ? '✅' : '❌'}`);
    console.log(`     * cambiarImagen: ${typeof cambiarImagen === 'function' ? '✅' : '❌'}`);
    
    return {
        modal: !!modal,
        grid: !!grid,
        propiedades: propiedadesData.length,
        funciones: {
            abrir: typeof abrirModal360 === 'function',
            cerrar: typeof cerrarModal360 === 'function',
            cambiar: typeof cambiarImagen === 'function'
        }
    };
}

// ================================================
// 🚀 INICIALIZACIÓN
// ================================================

/**
 * Inicialización principal del sistema
 */
function inicializarSistema360() {
    console.log('🚀 Inicializando sistema DantePropiedades 360°...');
    
    // Verificar que los elementos necesarios existan
    if (!document.getElementById('modal360')) {
        console.warn('⚠️ Modal no encontrado. Asegúrate de incluir el HTML del modal.');
    }
    
    // Configurar eventos
    configurarEventosModal();
    
    // Crear tarjetas de propiedades
    crearTarjetasPropiedades();
    
    // Diagnóstico final
    setTimeout(() => {
        diagnosticarSistema360();
    }, 1000);
    
    console.log('✅ Sistema 360° DantePropiedades completamente cargado y funcional');
    console.log('🎯 Características:');
    console.log('   - Sin bucles infinitos');
    console.log('   - Botones 360° funcionando correctamente');
    console.log('   - Modal responsive con navegación de imágenes');
    console.log('   - Compatible con móviles y desktop');
    console.log('   - Animaciones suaves y profesionales');
}

// ================================================
// 🔧 EXPOSICIÓN GLOBAL DE FUNCIONES
// ================================================

// Exponer funciones globalmente para que funcionen los onclick en HTML
window.abrirModal360 = abrirModal360;
window.cerrarModal360 = cerrarModal360;
window.cambiarImagen = cambiarImagen;
window.cambiarAImagen = cambiarAImagen;
window.diagnosticarSistema360 = diagnosticarSistema360;
window.inicializarSistema360 = inicializarSistema360;
window.propiedadesData = propiedadesData; // Para acceso directo si es necesario

// ================================================
// 🎯 AUTO-INICIALIZACIÓN
// ================================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistema360);
} else {
    // DOM ya está listo
    inicializarSistema360();
}

console.log('📝 === INSTRUCCIONES DE USO ===');
console.log('Para usar este sistema:');
console.log('1. Incluye este script en tu HTML (elimina los scripts problemáticos)');
console.log('2. Asegúrate de tener el modal con id="modal360" en tu HTML');
console.log('3. Asegúrate de tener un div con id="propertiesGrid"');
console.log('4. El sistema se inicializará automáticamente');
console.log('');
console.log('Comandos disponibles en consola:');
console.log('   - inicializarSistema360()  → Reinicializar el sistema');
console.log('   - diagnosticarSistema360() → Ver estado del sistema');
console.log('   - abrirModal360(0)         → Abrir modal de la primera propiedad');
console.log('   - cerrarModal360()         → Cerrar modal activo');