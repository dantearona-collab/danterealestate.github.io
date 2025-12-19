        console.log('🏠 Sistema Dante Propiedades - Versión Completa cargando...');
        console.log('✅ Todas las funcionalidades disponibles');
        console.log('🎠 Slider de múltiples fotos incluido');
        console.log('🔧 Sistema de emojis para iconos');
        console.log('📄 Sistema de PDFs integrado');
        console.log('🎥 Sistema de videos integrado');
        console.log('🏗️ Galería Masonry activada');
        console.log('🔄 Visor 360° configurado');
        
        // Función para buscar propiedades
        function searchProperties() {
            const operacion = document.getElementById('operacion-select-styled').value;
            const barrio = document.getElementById('barrio-select-styled').value;
            const tipo = document.getElementById('tipo-select-styled').value;
            
            console.log('🔍 Buscando propiedades con filtros:', { operacion, barrio, tipo });
            
            // Llamar a la función de búsqueda del app.js si existe
            if (typeof window.loadProperties === 'function') {
                window.loadProperties();
            }
        }
        
        // Función para resetear filtros
        function resetFilters() {
            document.getElementById('operacion-select-styled').value = '';
            document.getElementById('barrio-select-styled').value = '';
            document.getElementById('tipo-select-styled').value = '';
            
            console.log('🏠 Filtros reseteados - Mostrando todas las propiedades');
            
            // Llamar a la función de mostrar todas las propiedades
            if (typeof window.loadProperties === 'function') {
                window.loadProperties();
            }
        }
        
        // Función para volver a propiedades desde mapa
        function backToProperties() {
            console.log('↩️ Volviendo a vista de propiedades');
            const mapBackButton = document.getElementById('mapBackButton');
            if (mapBackButton) {
                mapBackButton.style.display = 'none';
            }
            document.body.classList.remove('map-view-active');
            
            // Si existe una función específica para volver, llamarla
            if (typeof window.showPropertiesView === 'function') {
                window.showPropertiesView();
            }
        }
        
        // Funciones para modal de galería de imágenes
        let modalCurrentImageIndex = 0;
        let modalCurrentImages = [];
        
        function openImageModal(images, index = 0) {
            modalCurrentImages = images;
            modalCurrentImageIndex = index;
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');
            const modalCounter = document.getElementById('modalCounter');
            const modalInfo = document.getElementById('modalInfo');
            
            if (images.length > 0 && index < images.length) {
                modalImage.src = images[index];
                modalCounter.textContent = `${index + 1} / ${images.length}`;
                modalInfo.textContent = `Imagen ${index + 1} de ${images.length}`;
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
        
        function closeImageModal() {
            const modal = document.getElementById('imageModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        function previousImage() {
            if (modalcurrentImages.length > 0) {
                modalCurrentImageIndex = (modalCurrentImageIndex - 1 + modalCurrentImages.length) % modalCurrentImages.length;
                const modalImage = document.getElementById('modalImage');
                const modalCounter = document.getElementById('modalCounter');
                const modalInfo = document.getElementById('modalInfo');
                
                modalImage.src = modalcurrentImages[modalcurrentImageIndex];
                modalCounter.textContent = `${modalcurrentImageIndex + 1} / ${modalcurrentImages.length}`;
                modalInfo.textContent = `Imagen ${modalcurrentImageIndex + 1} de ${modalcurrentImages.length}`;
            }
        }
        
        function nextImage() {
            if (modalcurrentImages.length > 0) {
                modalCurrentImageIndex = (modalCurrentImageIndex + 1) % modalCurrentImages.length;
                const modalImage = document.getElementById('modalImage');
                const modalCounter = document.getElementById('modalCounter');
                const modalInfo = document.getElementById('modalInfo');
                
                modalImage.src = modalcurrentImages[modalcurrentImageIndex];
                modalCounter.textContent = `${modalcurrentImageIndex + 1} / ${modalcurrentImages.length}`;
                modalInfo.textContent = `Imagen ${modalcurrentImageIndex + 1} de ${modalcurrentImages.length}`;
            }
        }
        
        // Funciones para modal de imágenes alternativo
        let imagenesActuales = [];
        let indiceImagenActual = 0;
        
        function abrirModalImagenes(imagenes, indice = 0) {
            imagenesActuales = imagenes;
            indiceImagenActual = indice;
            const modal = document.getElementById('modal-imagenes');
            const imagenPrincipal = document.getElementById('imagen-principal');
            const contador = document.getElementById('imagen-contador');
            const tituloDisplay = document.getElementById('imagen-titulo-display');
            
            if (imagenes.length > 0 && indice < imagenes.length) {
                imagenPrincipal.style.backgroundImage = `url('${imagenes[indice]}')`;
                contador.textContent = `${indice + 1} / ${imagenes.length}`;
                tituloDisplay.textContent = `Imagen ${indice + 1} de ${imagenes.length}`;
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
        
        function cerrarModalImagenes() {
            const modal = document.getElementById('modal-imagenes');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        function imagenAnterior() {
            if (imagenesActuales.length > 0) {
                indiceImagenActual = (indiceImagenActual - 1 + imagenesActuales.length) % imagenesActuales.length;
                const imagenPrincipal = document.getElementById('imagen-principal');
                const contador = document.getElementById('imagen-contador');
                const tituloDisplay = document.getElementById('imagen-titulo-display');
                
                imagenPrincipal.style.backgroundImage = `url('${imagenesActuales[indiceImagenActual]}')`;
                contador.textContent = `${indiceImagenActual + 1} / ${imagenesActuales.length}`;
                tituloDisplay.textContent = `Imagen ${indiceImagenActual + 1} de ${imagenesActuales.length}`;
            }
        }
        
        function imagenSiguiente() {
            if (imagenesActuales.length > 0) {
                indiceImagenActual = (indiceImagenActual + 1) % imagenesActuales.length;
                const imagenPrincipal = document.getElementById('imagen-principal');
                const contador = document.getElementById('imagen-contador');
                const tituloDisplay = document.getElementById('imagen-titulo-display');
                
                imagenPrincipal.style.backgroundImage = `url('${imagenesActuales[indiceImagenActual]}')`;
                contador.textContent = `${indiceImagenActual + 1} / ${imagenesActuales.length}`;
                tituloDisplay.textContent = `Imagen ${indiceImagenActual + 1} de ${imagenesActuales.length}`;
            }
        }
        
        // Funciones para términos y condiciones
        function mostrarTerminos() {
            document.getElementById('modal-terminos').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        function cerrarModal() {
            document.getElementById('modal-terminos').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Cerrar modal al hacer clic fuera de él
        window.onclick = function(event) {
            const modal = document.getElementById('modal-terminos');
            if (event.target == modal) {
                cerrarModal();
            }
            
            const modalImagenes = document.getElementById('modal-imagenes');
            if (event.target == modalImagenes) {
                cerrarModalImagenes();
            }
            
            const imageModal = document.getElementById('imageModal');
            if (event.target == imageModal) {
                closeImageModal();
            }
        }
        
        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                cerrarModal();
                cerrarModalImagenes();
                closeImageModal();
            }
        });
        
        // Función para WhatsApp flotante
        function setupWhatsAppFloat() {
            const whatsappBtn = document.querySelector('.whatsapp-float');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                    
                    console.log('💬 WhatsApp: Redirigiendo a chat...');
                });
            }
        }
        
        // Función global para cerrar modales multimedia
        function closeMultimediaModal() {
            const modals = document.querySelectorAll('#pdf-modal, #video-modal');
            modals.forEach(modal => {
                const videos = modal.querySelectorAll('video');
                videos.forEach(video => {
                    video.pause();
                    video.currentTime = 0;
                });
                modal.remove();
            });
            document.body.style.overflow = 'auto';
        }
        
        // Inicializar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', function() {
            setupWhatsAppFloat();
            console.log('💬 Botón WhatsApp flotante configurado');
            console.log('🎬 Sistema de multimedia inicializado');
            console.log('📄 Soporte para PDFs activado');
            console.log('🎥 Soporte para videos activado');
            
            // Configurar eventos para cerrar modales multimedia
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    closeMultimediaModal();
                }
            });
            
            document.addEventListener('click', function(event) {
                const pdfModal = document.getElementById('pdf-modal');
                const videoModal = document.getElementById('video-modal');
                
                if (pdfModal && event.target === pdfModal) {
                    closeMultimediaModal();
                }
                if (videoModal && event.target === videoModal) {
                    closeMultimediaModal();
                }
            });
        });
        
        // Verificación de carga de recursos
        window.addEventListener('load', function() {
            console.log('✅ Todos los recursos cargados correctamente');
            console.log('🎯 Sistema completamente funcional');
        });
        
        // DEBUG: Verificar errores de sintaxis
        window.addEventListener('error', function(e) {
            console.error('❌ Error global detectado:', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error
            });
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.error('❌ Promesa rechazada:', e.reason);
        });
