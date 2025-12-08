// 🎯 SOLUCIÓN DEFINITIVA BOTONES 360° - SIN BUCLES INFINITOS
console.log("🎯 SOLUCIÓN DEFINITIVA BOTONES 360° INICIADA");

// Función para crear modal fallback
function crearModalFallback() {
    // Verificar si ya existe
    if (document.getElementById('modal-fallback-360')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'modal-fallback-360';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 15px; padding: 20px; max-width: 90%; max-height: 90%; width: 800px; max-height: 600px; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #333;">📸 Galería de Fotos</h2>
                    <button id="cerrar-modal-fallback" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px;">×</button>
                </div>
                <div id="contenido-fallback" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <!-- Las fotos se cargarán aquí -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Agregar event listener para cerrar
    document.getElementById('cerrar-modal-fallback').addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    console.log("✅ Modal fallback creado");
}

// Función para mostrar galería de fotos
function mostrarGaleriaFotos(titulo) {
    // Buscar propiedad en las variables del sistema principal
    let propiedad = null;
    
    // Buscar en diferentes variables posibles
    if (typeof propiedades !== 'undefined' && Array.isArray(propiedades)) {
        propiedad = propiedades.find(p => p.titulo === titulo || p.id === titulo);
    }
    
    if (!propiedad && typeof propiedadesData !== 'undefined' && Array.isArray(propiedadesData)) {
        propiedad = propiedadesData.find(p => p.titulo === titulo || p.id === titulo);
    }

    if (!propiedad) {
        console.log("❌ No se encontró la propiedad:", titulo);
        return;
    }

    console.log("📸 Mostrando galería para:", propiedad.titulo);

    // Crear modal si no existe
    crearModalFallback();

    const modal = document.getElementById('modal-fallback-360');
    const contenido = document.getElementById('contenido-fallback');

    // Limpiar contenido anterior
    contenido.innerHTML = '';

    // Mostrar fotos de la propiedad
    if (propiedad.fotos && propiedad.fotos.length > 0) {
        propiedad.fotos.forEach((foto, index) => {
            const imgDiv = document.createElement('div');
            imgDiv.style.border = '1px solid #ddd';
            imgDiv.style.borderRadius = '8px';
            imgDiv.style.padding = '10px';
            imgDiv.style.textAlign = 'center';
            
            const img = document.createElement('img');
            img.src = foto;
            img.style.width = '100%';
            img.style.height = '150px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '5px';
            img.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
            };
            
            imgDiv.appendChild(img);
            contenido.appendChild(imgDiv);
        });
    } else {
        contenido.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666;">📷 No hay fotos disponibles para esta propiedad</p>';
    }

    // Mostrar modal
    modal.style.display = 'flex';
}

// Función para activar un botón específico
function activarBoton360(boton) {
    const titulo = boton.getAttribute('data-titulo') || 
                   boton.getAttribute('data-property-id') || 
                   'Propiedad';
    
    console.log("🎬 Activando botón 360° para:", titulo);
    mostrarGaleriaFotos(titulo);
}

// Función principal para activar TODOS los botones
function activarTodosLosBotones360() {
    console.log("🎯 ACTIVANDO TODOS LOS BOTONES 360°");
    
    // Crear modal
    crearModalFallback();
    
    // Buscar todos los botones 360°
    const botones = document.querySelectorAll('.btn-360, .ver-360, [data-360], button[class*="360"], button[onclick*="360"]');
    
    console.log("📊 Botones encontrados:", botones.length);
    
    botones.forEach((boton, index) => {
        // Guardar onclick original si existe
        const onclickOriginal = boton.onclick;
        
        // Reemplazar onclick
        boton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔄 Click interceptado en botón", index + 1);
            activarBoton360(this);
        };
        
        console.log(`✅ Botón ${index + 1} activado`);
    });
    
    console.log("🎯 TODOS LOS BOTONES ACTIVADOS");
}

// Función para cerrar modal
function cerrarModal360() {
    const modal = document.getElementById('modal-fallback-360');
    if (modal) {
        modal.style.display = 'none';
        console.log("✅ Modal cerrado");
    }
}

// Ejecutar cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Ejecutando solución definitiva...");
    
    // Esperar un poco para que las propiedades se carguen
    setTimeout(function() {
        activarTodosLosBotones360();
    }, 1000);
});

// Ejecutar inmediatamente si ya está cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(activarTodosLosBotones360, 1000);
    });
} else {
    setTimeout(activarTodosLosBotones360, 1000);
}

// Exponer funciones globales
window.activarTodosLosBotones360 = activarTodosLosBotones360;
window.mostrarGaleriaFotos = mostrarGaleriaFotos;
window.cerrarModal360 = cerrarModal360;

console.log("✅ SOLUCIÓN DEFINITIVA CARGADA");
console.log("💡 Usa activarTodosLosBotones360() para activar todos los botones");
console.log("💡 Usa mostrarGaleriaFotos('Título Propiedad') para mostrar una propiedad específica");
console.log("💡 Usa cerrarModal360() para cerrar el modal");
