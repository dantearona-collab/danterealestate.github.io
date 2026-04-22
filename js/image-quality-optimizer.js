/**
 * IMAGE QUALITY OPTIMIZER - Frontend Module
 * Lazy loading, responsive images, blur placeholders, progressive loading
 */

class ImageQualityOptimizer {
    constructor(options = {}) {
        this.options = {
            blurRadius: 15,
            fadeInDuration: 300,
            preloadNext: true,
            ...options
        };
        
        this.imageCache = new Map();
        this.preloadedImages = new Set();
        this.init();
    }

    /**
     * Inicializa el observador IntersectionObserver para lazy loading
     */
    init() {
        // Verificar soporte de IntersectionObserver
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // Fallback: cargar todas las imágenes si no hay soporte
            this.loadAllImages();
        }

        // Verificar soporte de formatos
        this.checkImageFormatSupport();
    }

    /**
     * Configura IntersectionObserver para lazy loading
     */
    setupIntersectionObserver() {
        const imageElements = document.querySelectorAll(
            'img[data-lazy], [data-bg-lazy]'
        );

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px' // Precargar 50px antes de entrar en viewport
            }
        );

        imageElements.forEach(img => {
            observer.observe(img);
        });
    }

    /**
     * Carga una imagen específica
     */
    loadImage(element) {
        if (element.tagName === 'IMG') {
            this.loadImageElement(element);
        } else {
            this.loadBackgroundImage(element);
        }
    }

    /**
     * Carga una imagen <img>
     */
    loadImageElement(img) {
        const src = img.dataset.lazy || img.src;
        const srcset = img.dataset.srcset;
        const webpSrcset = img.dataset.webp;

        // Aplicar blur placeholder
        if (img.dataset.blur) {
            img.style.backgroundImage = `url('${img.dataset.blur}')`;
            img.style.backgroundSize = 'cover';
            img.style.backgroundBlur = `${this.options.blurRadius}px`;
        }

        // Crear imagen temporal para precargar
        const tempImg = new Image();

        tempImg.onload = () => {
            this.transitionImage(img, src, srcset);
        };

        tempImg.onerror = () => {
            console.warn(`⚠️ Error cargando imagen: ${src}`);
            img.src = img.dataset.fallback || src;
        };

        // Cargar con WebP si está disponible
        if (this.supportsWebP && webpSrcset) {
            tempImg.srcset = webpSrcset;
        }

        tempImg.src = src;
    }

    /**
     * Aplica transición suave al cargar imagen
     */
    transitionImage(img, src, srcset) {
        // Aplicar fade-in
        img.style.opacity = '0';
        img.style.transition = `opacity ${this.options.fadeInDuration}ms ease-in-out`;

        // Actualizar src
        img.src = src;
        if (srcset) img.srcset = srcset;

        // Trigger reflow para activar transición
        setTimeout(() => {
            img.style.opacity = '1';
        }, 10);

        // Remover background blur
        setTimeout(() => {
            img.style.backgroundImage = 'none';
        }, this.options.fadeInDuration);
    }

    /**
     * Carga imagen de fondo
     */
    loadBackgroundImage(element) {
        const src = element.dataset.bgLazy;
        if (!src) return;

        const img = new Image();
        img.onload = () => {
            element.style.backgroundImage = `url('${src}')`;
            element.style.opacity = '1';
        };
        img.src = src;
    }

    /**
     * Verifica soporte de WebP
     */
    checkImageFormatSupport() {
        const webpCanvas = document.createElement('canvas');
        webpCanvas.width = 1;
        webpCanvas.height = 1;
        this.supportsWebP = webpCanvas.toDataURL('image/webp') !== webpCanvas.toDataURL('image/png');
    }

    /**
     * Precarga imagen siguiente en galería
     */
    preloadNextImage(imageSrc) {
        if (this.preloadedImages.has(imageSrc)) return;

        const img = new Image();
        img.src = imageSrc;
        this.preloadedImages.add(imageSrc);
    }

    /**
     * Fallback: carga todas las imágenes (navegadores sin IntersectionObserver)
     */
    loadAllImages() {
        document.querySelectorAll('img[data-lazy]').forEach(img => {
            this.loadImageElement(img);
        });
        document.querySelectorAll('[data-bg-lazy]').forEach(el => {
            this.loadBackgroundImage(el);
        });
    }

    /**
     * Genera HTML para imagen responsiva en slider
     */
    getSliderImageHTML(srcset, altText, propertyId, slideIndex) {
        const blurClass = `blur-${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="slider-image-container" data-property="${propertyId}" data-slide="${slideIndex}">
                <img 
                    class="slider-image ${blurClass}"
                    alt="${altText}"
                    data-lazy="${srcset.medium.jpeg}"
                    data-srcset="${srcset.small.jpeg} 400w, ${srcset.medium.jpeg} 800w, ${srcset.large.jpeg} 1200w"
                    data-webp="${srcset.small.webp} 400w, ${srcset.medium.webp} 800w, ${srcset.large.webp} 1200w"
                    data-blur="${srcset.blur || ''}"
                    data-fallback="INSTITUCIONAL 3.png"
                    loading="lazy"
                    decoding="async"
                    style="width: 100%; height: 200px; object-fit: cover; object-position: center;"
                />
            </div>
        `;
    }

    /**
     * Genera HTML para imagen en modal (máxima calidad)
     */
    getModalImageHTML(srcset, altText) {
        return `
            <picture>
                <!-- WebP para navegadores modernos -->
                <source type="image/webp" 
                        srcset="${srcset.small.webp} 400w, ${srcset.medium.webp} 800w, ${srcset.large.webp} 1200w, ${srcset.xlarge.webp} 1600w" 
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px" />
                
                <!-- JPEG fallback -->
                <source type="image/jpeg" 
                        srcset="${srcset.small.jpeg} 400w, ${srcset.medium.jpeg} 800w, ${srcset.large.jpeg} 1200w, ${srcset.xlarge.jpeg} 1600w" 
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px" />
                
                <!-- Imagen fallback -->
                <img src="${srcset.large.jpeg}"
                     alt="${altText}"
                     loading="lazy"
                     decoding="async"
                     style="width: 100%; height: auto; max-height: 80vh; object-fit: contain;">
            </picture>
        `;
    }

    /**
     * Optimiza datos de propiedad con información de imágenes
     */
    optimizePropertyImages(property) {
        const optimized = { ...property };

        // Si existen fotos optimizadas del backend, usarlas
        if (optimized.fotos_optimized) {
            optimized.fotos_optimized_info = optimized.fotos_optimized.map(srcset => ({
                ...srcset,
                html: this.getSliderImageHTML(srcset, optimized.titulo, optimized.id_temporal, 0)
            }));
        }

        // Precarga de imágenes siguientes
        if (this.options.preloadNext && optimized.fotos) {
            optimized.fotos.forEach((foto, idx) => {
                setTimeout(() => this.preloadNextImage(foto), idx * 200);
            });
        }

        return optimized;
    }
}

// Instancia global
let imageOptimizer = null;

/**
 * Inicializa el optimizador de imágenes global
 */
function initImageOptimizer(options = {}) {
    if (!imageOptimizer) {
        imageOptimizer = new ImageQualityOptimizer(options);
        console.log('✅ Image Quality Optimizer inicializado');
    }
    return imageOptimizer;
}

/**
 * Mejora las imágenes en slider existentes
 */
function enhanceSliderImages() {
    if (!imageOptimizer) initImageOptimizer();

    document.querySelectorAll('[data-lazy]').forEach(img => {
        // Agregar atributos de lazy loading si no están presentes
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
    });

    imageOptimizer.setupIntersectionObserver();
}

/**
 * Precarga imagen para modal (máxima calidad)
 */
function preloadModalImage(src) {
    if (!imageOptimizer) initImageOptimizer();
    imageOptimizer.preloadNextImage(src);
}

/**
 * Genera placeholder blur en CSS
 */
function generateBlurPlaceholder(base64) {
    if (!base64) return '';
    return `linear-gradient(45deg, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.2)), url('${base64}')`;
}

export { ImageQualityOptimizer, initImageOptimizer, enhanceSliderImages, preloadModalImage };
