/**
 * Analisis-Barrio.js - Lógica del CMS para Gestión de Barrios
 * Maneja toda la funcionalidad del frontend para buscar, editar y guardar datos de barrios
 */

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const API_BASE_URL = 'http://localhost:8001';
const API_TIMEOUT = 30000;

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

const AppState = {
    currentBarrio: null,
    isEditing: false,
    isLoading: false,
    searchResults: [],
    formData: {},
    originalData: null,
    apiError: null,
    metadata: null,
    categoriesOrder: []
};

// ============================================
// CLIENTE API - Funciones de Comunicación con el Backend
// ============================================

const ApiClient = {
    /**
     * Realiza una petición al API con manejo de errores
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        console.log(`📡 Request a: ${url}`);

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: API_TIMEOUT
        };

        const config = { ...defaultOptions, ...options };

        try {
            const controller = new AbortController();
            config.signal = controller.signal;

            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La solicitud excedió el tiempo máximo de espera');
            }
            throw error;
        }
    },


    async getAllBarrios(q = null) {
        if (q) {
            return this.request(`/api/barrios?q=${encodeURIComponent(q)}`);
        }
        return this.request('/api/barrios');
    },

    /**
     * Busca barrios por nombre
     */
    async searchBarrios(query) {
        return this.request(`/api/barrios?q=${encodeURIComponent(query)}`);
    },

    /**
     * Obtiene un barrio específico por nombre
     */
    async getBarrio(nombre) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}`);
    },

    /**
     * Crea un nuevo barrio
     */
    async createBarrio(data) {
        return this.request('/api/barrios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Actualiza un barrio existente
     */
    async updateBarrio(nombre, data) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Elimina un barrio
     */
    async deleteBarrio(nombre) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}`, {
            method: 'DELETE'
        });
    },

    /**
     * Regenera los datos de un barrio usando IA
     */
    async regenerateBarrio(nombre) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}/regenerate`, {
            method: 'POST'
        });
    },

    /**
     * Genera análisis de entorno usando IA
     */
    async generateAIContanalysis(zone, forceRefresh = false) {
        const params = new URLSearchParams({
            zone: zone,
            force_refresh: forceRefresh
        });
        // ✅ CORREGIDO: Usar el nuevo endpoint que acepta GET/POST
        return this.request(`/ai/regenerate-analysis?${params.toString()}`, {
            method: 'POST'
        });
    },

    /**
     * Obtiene los metadatos de campos por rubro desde el backend
     * Este método es usado por el CMS para generar formularios dinámicos
     * 
     * Returns:
     * - rubros: definición completa de cada rubro con sus campos
     * - categorias_ordenadas: lista de rubros ordenados por importancia
     */
    async getEntornoMetadata() {
        return this.request('/api/entorno/metadata');
    },

    /**
     * Genera el archivo completo entorno.json con metadatos y datos
     * Este endpoint es usado para integración con dantepropiedades.com.ar
     * 
     * Returns objeto con:
     * - metadata: versión, rubros definidos, configuración
     * - data: datos de cada barrio
     */
    async generateEntornoJSON() {
        return this.request('/api/entorno/generate-json');
    }
};

// ============================================
// UTILIDADES
// ============================================

const Utils = {
    /**
     * Capitaliza la primera letra de cada palabra
     */
    capitalize(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    },

    /**
     * Formatea un valor para mostrar en la UI
     */
    formatValue(value) {
        if (value === null || value === undefined || value === '--') {
            return '';
        }
        return String(value);
    },

    /**
     * Valida que un campo no esté vacío
     */
    validateRequired(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    },

    /**
     * Muestra un toast de notificación
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Formatea la fecha para mostrar
     */
    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Convierte un array a string separado por comas
     */
    arrayToString(arr) {
        if (!arr) return '';

        // Si ya es un string, verificar que no esté corrupto
        if (typeof arr === 'string') {
            // Si el string contiene el patrón "L, i, n, e, a" es porque está corrupto
            // Esto pasa cuando se itera sobre un string como si fuera array
            if (arr.includes(', ') && arr.length < 100 && /^[A-Za-z](, [A-Za-z])+$/.test(arr)) {
                console.warn('⚠️ Valor corrupto detectado en arrayToString, intentando reparar:', arr);
                // Intentar reparar: dividir por ", " y volver a unir
                return arr.split(', ').filter((v, i, a) => a.indexOf(v) === i).join(', ');
            }
            return arr;
        }

        // Si es array, convertir a string
        if (Array.isArray(arr)) {
            return arr.join(', ');
        }

        // Cualquier otro tipo, convertir a string
        return String(arr);
    },

    /**
     * Repara un valor corrupto que viene como string separado por comas de caracteres
     * Detecta el patrón "C, o, l, e, g, i, o, s" y lo convierte a array válido
     */
    repairCorruptedValue(value) {
        if (!value) return value;

        if (typeof value === 'string') {
            // Patrón de string corrupto: caracteres separados por ", "
            // Ejemplo: "C, o, l, e, g, i, o, s" o "Consultorios médicos"
            const corruptedPattern = /^([A-Za-zÀ-ÿ], )+[A-Za-zÀ-ÿ]$/;
            if (corruptedPattern.test(value)) {
                console.warn('🔧 Utils.repairCorruptedValue - Reparando valor corrupto:', value);
                const repaired = value.split(', ').join('');
                console.warn('🔧 Valor reparado:', repaired);
                return repaired;
            }

            // También verificar si ya viene medio reparado (con espacios extra)
            // Ejemplo: "C, o, l, e, g, i, o, s" (caracteres sueltos con comas)
            if (value.includes(', ')) {
                const parts = value.split(', ');
                // Si la mayoría de partes son letras individuales, es corrupto
                const singleChars = parts.filter(p => p.length === 1 && /[A-Za-zÀ-ÿ]/.test(p));
                if (singleChars.length >= 3 && parts.length <= 15) {
                    console.warn('🔧 Utils.repairCorruptedValue - Detectado patrón de caracteres sueltos:', value);
                    const repaired = parts.join('');
                    console.warn('🔧 Valor reparado:', repaired);
                    return repaired;
                }
            }
        }

        return value;
    },

    /**
     * Convierte un valor a array de strings, reparando si está corrupto
     */
    toStringArray(value) {
        if (!value) return [];

        if (Array.isArray(value)) {
            return value.map(v => this.repairCorruptedValue(v));
        }

        if (typeof value === 'string') {
            // Si viene corrupto como "C, o, l, e, g, i, o, s", intentar reparar
            const repaired = this.repairCorruptedValue(value);
            if (repaired !== value) {
                // Si se reparó, puede ser un string largo o un array con un elemento
                return [repaired];
            }
            // Si es un string normal con comas, dividirlo
            return value.split(',').map(s => s.trim()).filter(s => s);
        }

        return [String(value)];
    }
};

// ============================================
// RENDERIZADO DE UI
// ============================================

// ============================================
// RENDERIZADO DE UI
// ============================================

const UIRenderer = {
    /**
     * Limpia todos los campos del formulario
     */
    clearForm() {
        console.log('🧹 Limpiando formulario...');

        const formFields = [
            'barrio-nombre', 'barrio-puntuacion', 'edit-resumen', 'edit-conclusion',
            'transporte-puntuacion', 'transporte-descripcion', 'transporte-estaciones', 'transporte-colectivos',
            'comercio-puntuacion', 'comercio-descripcion', 'comercio-supermercados', 'comercio-centros',
            'seguridad-puntuacion', 'seguridad-descripcion', 'seguridad-comisaria',
            'educacion-puntuacion', 'educacion-descripcion', 'educacion-escuelas', 'educacion-universidades',
            'salud-puntuacion', 'salud-descripcion', 'salud-hospitales', 'salud-centros',
            'espacios_verdes-puntuacion', 'espacios_verdes-descripcion', 'espacios_verdes-parques',
            'contaminacion-puntuacion', 'contaminacion-descripcion', 'contaminacion-ruido', 'contaminacion-fuente',
            'vida_barrio-puntuacion', 'vida_barrio-descripcion', 'vida_barrio-bares', 'vida_barrio-cultura',
            'gastronomia-puntuacion', 'gastronomia-descripcion', 'gastronomia-restaurantes', 'gastronomia-zonas',
            'servicios_financieros-puntuacion', 'servicios_financieros-descripcion', 'servicios_financieros-bancos', 'servicios_financieros-cajeros'
        ];

        formFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = '';
            }
        });

        const scores = document.querySelectorAll('[id^="score-"]');
        scores.forEach(score => {
            score.textContent = '--';
            score.style.color = '#6B7280';
            score.style.fontWeight = 'normal';
            score.classList.remove('score-high', 'score-medium', 'score-low');
        });

        const currentBarrio = document.getElementById('current-barrio-name');
        if (currentBarrio) currentBarrio.textContent = '--';

        const badge = document.getElementById('edit-badge');
        if (badge) {
            badge.textContent = 'Sin datos';
            badge.classList.remove('editing');
        }

        const aiStatus = document.getElementById('ai-status');
        if (aiStatus) aiStatus.innerHTML = '';

        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) lastUpdated.textContent = '';

        const hiddenInput = document.getElementById('barrio-nombre');
        if (hiddenInput) hiddenInput.remove();

        console.log('✅ Formulario completamente limpiado');
    },

    /**
     * Llena el formulario con los datos de un barrio
     */
    populateForm(barrio) {
        if (!barrio) {
            console.log('⚠️ populateForm: barrio es null o undefined');
            return;
        }

        const barrioData = barrio.data ? barrio.data : barrio;
        const nombreBarrio = barrioData.nombre || barrio.nombre || '';

        if (!barrioData.categorias) {
            console.warn('⚠️ barrioData no tiene categorías, creando objeto vacío');
            barrioData.categorias = {};
        }


        const currentBarrio = document.getElementById('current-barrio-name');
        if (currentBarrio) currentBarrio.textContent = nombreBarrio;

        const nombreInput = document.getElementById('barrio-nombre');

        if (nombreBarrio) {
            if (nombreInput) {
                nombreInput.value = nombreBarrio;
                console.log('📌 Campo barrio-nombre actualizado:', nombreInput.value);
            } else {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.id = 'barrio-nombre';
                input.value = nombreBarrio;
                document.body.appendChild(input);
                console.log('✅ Campo barrio-nombre creado con valor:', input.value);
            }
        } else if (nombreInput) {
            nombreInput.remove();
            console.log('🧹 Input oculto eliminado (no hay barrio)');
        }

        const puntuacionGeneral = barrioData.puntuacion_general || barrio.puntuacion_general || 50;
        this.setFieldValue('barrio-puntuacion', puntuacionGeneral);

        this.setFieldValue('edit-resumen', barrioData.resumen_general || barrioData.resumen || '');
        this.setFieldValue('edit-conclusion', barrioData.conclusion || '');

        const categorias = barrioData.categorias || {};

        // Transporte
        const transporte = categorias.transporte || barrioData.transporte || {};
        this.setScoreField('transporte', transporte.puntuacion);
        this.setFieldValue('transporte-puntuacion', transporte.puntuacion);
        this.setFieldValue('transporte-descripcion', transporte.descripcion);
        this.setFieldValue('transporte-estaciones', Utils.arrayToString(transporte.estaciones || transporte.estaciones_cercanas || []));
        this.setFieldValue('transporte-colectivos', Utils.arrayToString(transporte.colectivos || transporte.lineas_colectivo || []));

        // Comercio
        const comercio = categorias.comercio || barrioData.comercio || {};
        this.setScoreField('comercio', comercio.puntuacion);
        this.setFieldValue('comercio-puntuacion', comercio.puntuacion);
        this.setFieldValue('comercio-descripcion', comercio.descripcion);
        const comercioSupermercados = Utils.toStringArray(comercio.supermercados);
        const comercioCentros = Utils.toStringArray(comercio.centros_comerciales || comercio.centros);
        this.setFieldValue('comercio-supermercados', comercioSupermercados.join(', '));
        this.setFieldValue('comercio-centros', comercioCentros.join(', '));

        // Seguridad
        const seguridad = categorias.seguridad || barrioData.seguridad || {};
        this.setScoreField('seguridad', seguridad.puntuacion);
        this.setFieldValue('seguridad-puntuacion', seguridad.puntuacion);
        this.setFieldValue('seguridad-descripcion', seguridad.descripcion);
        this.setFieldValue('seguridad-comisaria', seguridad.comisaria || seguridad.comisaria_cercana || '');

        // Educación
        const educacion = categorias.educacion || barrioData.educacion || {};
        this.setScoreField('educacion', educacion.puntuacion);
        this.setFieldValue('educacion-puntuacion', educacion.puntuacion);
        this.setFieldValue('educacion-descripcion', educacion.descripcion);
        const educacionEscuelas = Utils.toStringArray(educacion.escuelas);
        const educacionUniversidades = Utils.toStringArray(educacion.universidades);
        this.setFieldValue('educacion-escuelas', educacionEscuelas.join(', '));
        this.setFieldValue('educacion-universidades', educacionUniversidades.join(', '));

        // Salud
        const salud = categorias.salud || barrioData.salud || {};
        this.setScoreField('salud', salud.puntuacion);
        this.setFieldValue('salud-puntuacion', salud.puntuacion);
        this.setFieldValue('salud-descripcion', salud.descripcion);
        const saludHospitales = Utils.toStringArray(salud.hospitales);
        const saludCentros = Utils.toStringArray(salud.centros_salud || salud.centros);
        this.setFieldValue('salud-hospitales', saludHospitales.join(', '));
        this.setFieldValue('salud-centros', saludCentros.join(', '));

        // Espacios Verdes
        const espaciosVerdes = categorias.espacios_verdes || barrioData.espacios_verdes || {};
        this.setScoreField('espacios_verdes', espaciosVerdes.puntuacion);
        this.setFieldValue('espacios_verdes-puntuacion', espaciosVerdes.puntuacion);
        this.setFieldValue('espacios_verdes-descripcion', espaciosVerdes.descripcion);
        const espaciosVerdesParques = Utils.toStringArray(espaciosVerdes.parques);
        this.setFieldValue('espacios_verdes-parques', espaciosVerdesParques.join(', '));

        // Contaminación
        const contaminacion = categorias.contaminacion || barrioData.contaminacion || {};
        this.setScoreField('contaminacion', contaminacion.puntuacion);
        this.setFieldValue('contaminacion-puntuacion', contaminacion.puntuacion);
        this.setFieldValue('contaminacion-descripcion', contaminacion.descripcion);
        this.setFieldValue('contaminacion-ruido', contaminacion.nivel_ruido || '');
        this.setFieldValue('contaminacion-fuente', contaminacion.fuente || contaminacion.principal_fuente || '');

        // Vida del Barrio
        const vidaBarrio = categorias.vida_barrio || barrioData.vida_barrio || {};
        this.setScoreField('vida_barrio', vidaBarrio.puntuacion);
        this.setFieldValue('vida_barrio-puntuacion', vidaBarrio.puntuacion);
        this.setFieldValue('vida_barrio-descripcion', vidaBarrio.descripcion);
        const vidaBarrioBares = Utils.toStringArray(vidaBarrio.bares || vidaBarrio.bares_restaurantes);
        const vidaBarrioCultura = Utils.toStringArray(vidaBarrio.cultura);
        this.setFieldValue('vida_barrio-bares', vidaBarrioBares.join(', '));
        this.setFieldValue('vida_barrio-cultura', vidaBarrioCultura.join(', '));

        // Gastronomía
        const gastronomia = categorias.gastronomia || barrioData.gastronomia || {};
        this.setScoreField('gastronomia', gastronomia.puntuacion);
        this.setFieldValue('gastronomia-puntuacion', gastronomia.puntuacion);
        this.setFieldValue('gastronomia-descripcion', gastronomia.descripcion);
        const gastronomiaRestaurantes = Utils.toStringArray(gastronomia.restaurantes || gastronomia.restaurantes_destacados);
        const gastronomiaZonas = Utils.toStringArray(gastronomia.zonas || gastronomia.zonas_gastronomicas);
        this.setFieldValue('gastronomia-restaurantes', gastronomiaRestaurantes.join(', '));
        this.setFieldValue('gastronomia-zonas', gastronomiaZonas.join(', '));

        // Servicios Financieros
        const serviciosFinancieros = categorias.servicios_financieros || barrioData.servicios_financieros || {};
        this.setScoreField('servicios_financieros', serviciosFinancieros.puntuacion);
        this.setFieldValue('servicios_financieros-puntuacion', serviciosFinancieros.puntuacion);
        this.setFieldValue('servicios_financieros-descripcion', serviciosFinancieros.descripcion);
        const sfBancos = Utils.toStringArray(serviciosFinancieros.bancos);
        const sfCajeros = Utils.toStringArray(serviciosFinancieros.cajeros || serviciosFinancieros.cajeros_automaticos);
        this.setFieldValue('servicios_financieros-bancos', sfBancos.join(', '));
        this.setFieldValue('servicios_financieros-cajeros', sfCajeros.join(', '));

        this.updateAIStatus(barrio);
        this.updateLastUpdated(barrio);
        this.updatePreview(barrio);

        ['transporte', 'comercio', 'seguridad', 'educacion', 'salud',
            'espacios_verdes', 'contaminacion', 'vida_barrio', 'gastronomia', 'servicios_financieros'].forEach(cat => {
                if (window.updateScore) {
                    window.updateScore(cat);
                }
            });

        console.log('✅ Formulario populado correctamente');
    },

    /**
     * Establece el valor de un campo
     */
    setFieldValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const wasDisabled = element.disabled;
            element.disabled = false;

            let stringValue = '';
            if (Array.isArray(value)) {
                stringValue = value.join(', ');
            } else if (typeof value === 'string') {
                stringValue = value;
            } else if (value === null || value === undefined) {
                stringValue = '';
            } else {
                stringValue = String(value);
            }

            element.value = stringValue;
            element.disabled = wasDisabled;
        }
    },

    /**
     * Establece el valor de un campo de puntuación
     */
    setScoreField(category, scoreData) {
        const scoreElement = document.getElementById(`score-${category}`);

        let score = 0;
        if (scoreData !== null && scoreData !== undefined) {
            if (typeof scoreData === 'object') {
                score = scoreData.puntuacion || 0;
            } else {
                score = scoreData;
            }
        }

        if (scoreElement) {
            scoreElement.textContent = score > 0 ? score : '--';

            scoreElement.removeAttribute('data-score');
            if (score >= 70) {
                scoreElement.setAttribute('data-score', 'high');
            } else if (score >= 40) {
                scoreElement.setAttribute('data-score', 'medium');
            } else if (score > 0) {
                scoreElement.setAttribute('data-score', 'low');
            }
        }
    },

    /**
     * Actualiza el indicador de estado de IA
     */
    updateAIStatus(barrio) {
        const aiStatus = document.getElementById('ai-status');
        if (!aiStatus) return;

        if (barrio.generado_por_ia) {
            aiStatus.innerHTML = '<span class="badge badge-ai">🤖 Datos generados por IA</span>';
        } else {
            aiStatus.innerHTML = '<span class="badge badge-manual">✏️ Datos ingresados manualmente</span>';
        }
    },

    /**
     * Actualiza la fecha de última actualización
     */
    updateLastUpdated(barrio) {
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated && barrio.fecha_actualizacion) {
            lastUpdated.textContent = `Última actualización: ${Utils.formatDate(barrio.fecha_actualizacion)}`;
        }
    },

    /**
     * Actualiza la columna de vista previa con los datos del barrio
     */
    updatePreview(barrio) {
        if (!barrio) {
            console.log('⚠️ updatePreview: barrio es null');
            return;
        }

        console.log('🎨 updatePreview llamado con:', barrio);

        // Actualizar resumen/perfil
        const previewResumen = document.getElementById('preview-resumen');
        if (previewResumen) {
            if (barrio.resumen) {
                previewResumen.innerHTML = `<p>${Utils.escapeHtml(barrio.resumen)}</p>`;
            } else {
                previewResumen.innerHTML = '<p class="empty-text">Sin resumen disponible</p>';
            }
        }

        // Actualizar conclusión
        const previewConclusion = document.getElementById('preview-conclusion');
        if (previewConclusion) {
            if (barrio.conclusion) {
                previewConclusion.innerHTML = `<p>${Utils.escapeHtml(barrio.conclusion)}</p>`;
            } else {
                previewConclusion.innerHTML = '<p class="empty-text">Sin conclusión disponible</p>';
            }
        }

        // Obtener categorías
        const categorias = barrio.categorias || {};

        // Mapeo de categorías del editor a la vista previa
        const categoryMap = {
            'transporte': 'preview-transporte',
            'comercio': 'preview-comercio',
            'seguridad': 'preview-seguridad',
            'educacion': 'preview-educacion',
            'salud': 'preview-salud',
            'espacios_verdes': 'preview-recreacion',
            'contaminacion': 'preview-contaminacion',
            'vida_barrio': 'preview-vida_barrio',
            'gastronomia': 'preview-gastronomia',
            'servicios_financieros': 'preview-finanzas'
        };

        // Actualizar cada categoría en la vista previa
        Object.keys(categoryMap).forEach(catKey => {
            const previewId = categoryMap[catKey];
            const catData = categorias[catKey];
            const previewElement = document.getElementById(previewId);

            if (previewElement && catData) {
                const puntuacion = catData.puntuacion || 0;
                const descripcion = catData.descripcion || '';

                // Generar contenido de la tarjeta
                let contentHtml = `
                    <div class="category-score" style="margin-bottom: 8px;">
                        <strong>Puntuación:</strong> 
                        <span style="
                            background: ${puntuacion >= 70 ? 'var(--success-color)' : puntuacion >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'};
                            color: white;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 12px;
                        ">${puntuacion}/100</span>
                    </div>
                    <p style="margin-bottom: 8px;">${Utils.escapeHtml(descripcion)}</p>
                `;

                // Agregar detalles específicos
                const details = this.getPreviewDetails(catKey, catData);
                if (details) {
                    contentHtml += `<p style="font-size: 12px; color: var(--text-secondary);"><strong>Destacado:</strong> ${details}</p>`;
                }

                previewElement.innerHTML = contentHtml;
            } else if (previewElement) {
                previewElement.innerHTML = '<p class="empty-text">Sin datos disponibles</p>';
            }
        });

        console.log('✅ Vista previa actualizada');
    },

    /**
     * Obtiene los detalles destacados para la vista previa
     */
    getPreviewDetails(category, data) {
        if (!data) return '';

        const getFirst = (value) => {
            if (!value) return '';
            if (Array.isArray(value)) {
                const repaired = value.map(v => Utils.repairCorruptedValue(v));
                return repaired.length > 0 ? repaired[0] : '';
            }
            return Utils.repairCorruptedValue(String(value));
        };

        switch (category) {
            case 'transporte':
                if (data.estaciones) return `Estaciones: ${getFirst(data.estaciones)}`;
                if (data.colectivos) return `Líneas: ${getFirst(data.colectivos)}`;
                break;
            case 'comercio':
                if (data.supermercados) return getFirst(data.supermercados);
                if (data.centros_comerciales) return getFirst(data.centros_comerciales);
                break;
            case 'seguridad':
                if (data.comisaria) return `Comisaría: ${Utils.repairCorruptedValue(data.comisaria)}`;
                break;
            case 'educacion':
                if (data.escuelas) return getFirst(data.escuelas);
                if (data.universidades) return getFirst(data.universidades);
                break;
            case 'salud':
                if (data.hospitales) return getFirst(data.hospitales);
                if (data.centros_salud) return getFirst(data.centros_salud);
                break;
            case 'espacios_verdes':
                if (data.parques) return getFirst(data.parques);
                break;
            case 'vida_barrio':
                if (data.bares) return getFirst(data.bares);
                if (data.cultura) return getFirst(data.cultura);
                break;
            case 'servicios_financieros':
                if (data.bancos) return getFirst(data.bancos);
                if (data.cajeros) return `Cajeros: ${getFirst(data.cajeros)}`;
                break;
        }

        return '';
    },

    /**
     * Actualiza el estado visual del formulario
     */
    updateFormState(isEditing) {
        const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
        inputs.forEach(input => {
            input.disabled = !isEditing;
            if (isEditing) {
                input.classList.add('editing');
            } else {
                input.classList.remove('editing');
            }
        });

        const editBtn = document.getElementById('btn-edit-toggle');
        if (editBtn) {
            editBtn.innerHTML = isEditing ?
                '<i class="fas fa-times"></i> ❌ Cancelar' :
                '<i class="fas fa-edit"></i> ✏️ Editar';
            editBtn.classList.toggle('cancel-btn', isEditing);
        }

        const toolbar = document.getElementById('admin-toolbar');
        if (toolbar) {
            toolbar.classList.toggle('hidden', !isEditing);
        }

        const badge = document.getElementById('edit-badge');
        if (badge) {
            badge.textContent = isEditing ? 'Editando' : 'Solo lectura';
            badge.classList.toggle('editing', isEditing);
        }
    },

    /**
     * Muestra los resultados de búsqueda
     */
    showSearchResults(barrios) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        if (!barrios || barrios.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No se encontraron barrios</div>';
            return;
        }

        barrios.forEach(barrio => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="result-name">${Utils.capitalize(barrio.nombre)}</div>
                <div class="result-score">Puntuación: ${barrio.puntuacion_general || '--'} /100</div>
            `;
            resultItem.addEventListener('click', () => {
                AppState.currentBarrio = barrio;
                this.populateForm(barrio);
                AppState.isEditing = false;
                EventHandlers.updateEditMode();
                this.hideSearchResults();
            });
            resultsContainer.appendChild(resultItem);
        });
    },

    /**
     * Oculta los resultados de búsqueda
     */
    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    },

    /**
     * Muestra el indicador de carga
     */
    showLoading(message = 'Cargando...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');

        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            if (loadingText) loadingText.textContent = message;
        }
    },

    /**
     * Oculta el indicador de carga
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    },


};

// ============================================
// MANEJO DE EVENTOS
// ============================================

// ============================================
// MANEJO DE EVENTOS - ESTRUCTURA CORREGIDA
// ============================================

const EventHandlers = {
    /**
     * Inicializa todos los event listeners
     */
    init() {
        this.setupSearchHandlers();
        this.setupFormHandlers();
        this.setupButtonHandlers();
        this.setupNavigationHandlers();
    },

    updateEditMode() {
        UIRenderer.updateFormState(AppState.isEditing);
    },  // ← ESTA COMA ES LA QUE FALTABA

    /**
     * Establece el valor de un campo (maneja arrays)
     */
    setFieldValue(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (!element) return;

        let stringValue = '';

        if (Array.isArray(value)) {
            stringValue = value.join(', ');
            console.log(`  - ${fieldId} (array): ${stringValue}`);
        } else if (typeof value === 'string') {
            stringValue = value;
            console.log(`  - ${fieldId} (string): ${stringValue}`);
        } else if (value === null || value === undefined) {
            stringValue = '';
        } else {
            stringValue = String(value);
        }

        element.value = stringValue;
    },


    /**
     * Configura los manejadores de búsqueda
     */
    setupSearchHandlers() {
        const searchInput = document.getElementById('neighborhood-input');
        if (!searchInput) return;

        console.log('🔧 Configurando manejadores de búsqueda...');
        
        // Cargar todos los barrios inicialmente
        this.loadBarriosToDatalist();
        
        searchInput.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            const options = document.querySelectorAll('#barrios-list option');
            
            let matched = false;
            options.forEach(opt => {
                if (opt.value.toLowerCase() === selectedValue.toLowerCase()) {
                    e.target.value = opt.value;
                    matched = true;
                }
            });
            
            if (!matched) {
                console.log('📝 Usuario escribió un barrio que no está en el datalist:', selectedValue);
            }
        });
        
        // ✅ NUEVO: Búsqueda en tiempo real mientras el usuario escribe
        let timeoutId = null;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Cancelar timeout anterior
            if (timeoutId) clearTimeout(timeoutId);
            
            if (query !== AppState.lastQuery) {
                AppState.currentBarrio = null;
                this.clearFormDisplay();
            }
            
            console.log('🔍 Input actual:', query);
            
            // Debounce: esperar 300ms después de dejar de escribir
            timeoutId = setTimeout(() => {
                if (query.length >= 2) {
                    // Búsqueda con filtro si tiene al menos 2 caracteres
                    this.loadBarriosToDatalist(query);
                } else if (query.length === 0) {
                    // Sin texto, cargar sugerencias completas
                    this.loadBarriosToDatalist();
                }
            }, 300);
        });
    },
    /**
     * Carga los barrios existentes en el datalist para sugerencias
     */
    /**
 * Carga los barrios existentes en el datalist para sugerencias
 * Si se pasa un query, filtra resultados
 */
async loadBarriosToDatalist(query = null) {
    const datalist = document.getElementById('barrios-list');
    if (!datalist) return;
    
    try {
        let barrios = [];
        
        if (query && query.trim().length > 0) {
            // Búsqueda filtrada con el endpoint mejorado
            const response = await ApiClient.getAllBarrios(query);
            barrios = response?.barrios || [];
            console.log(`🔍 Búsqueda "${query}" → ${barrios.length} resultados`);
        } else {
            // Sin filtro, cargar todos (pero limitar para no saturar)
            const response = await ApiClient.getAllBarrios();
            barrios = response?.barrios || [];
            console.log(`📋 ${barrios.length} barrios totales`);
        }
        
        datalist.innerHTML = '';
        
        // Limitar a 20 resultados para el datalist (evita saturar)
        const barriosMostrar = query ? barrios : barrios.slice(0, 20);
        
        barriosMostrar.forEach(barrio => {
            let nombre = barrio;
            if (typeof barrio === 'object' && barrio !== null) {
                nombre = barrio.nombre || barrio.name || '';
            }
            
            if (nombre && typeof nombre === 'string') {
                const option = document.createElement('option');
                option.value = Utils.capitalize(nombre);
                datalist.appendChild(option);
            }
        });
        
        if (barriosMostrar.length === 0 && query) {
            const option = document.createElement('option');
            option.value = `No hay resultados para "${query}"`;
            option.disabled = true;
            datalist.appendChild(option);
        }
        
        console.log(`✅ ${barriosMostrar.length} barrios cargados como SUGERENCIAS`);
    } catch (error) {
        console.warn('No se pudieron cargar las sugerencias:', error.message);
    }
},

    /**
     * Limpia la visualización del formulario sin afectar el estado
     */
    clearFormDisplay() {
        const currentBarrioEl = document.getElementById('current-barrio-name');
        if (currentBarrioEl) currentBarrioEl.textContent = '--';

        const scoreElements = document.querySelectorAll('[id^="score-"]');
        scoreElements.forEach(el => el.textContent = '--');

        const badge = document.getElementById('edit-badge');
        if (badge) {
            badge.textContent = 'Sin datos';
            badge.classList.remove('editing');
        }

        console.log('🧹 Formulario limpiado');
    },

    /**
     * Configura los manejadores del formulario
     */
    setupFormHandlers() {
        // 1. Manejo de puntuaciones visuales (sliders/inputs numéricos)
        const scoreInputs = [
            'barrio-transporte', 'barrio-educacion', 'barrio-salud',
            'barrio-comercio', 'barrio-gastronomia', 'barrio-recreacion',
            'barrio-seguridad', 'barrio-servicios-financieros'
        ];

        scoreInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    const category = inputId.replace('barrio-', '');
                    const scoreElement = document.getElementById(`score-${category}`);
                    const value = parseInt(e.target.value);

                    if (scoreElement) {
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                            scoreElement.textContent = `${value} /100`;
                        } else {
                            scoreElement.textContent = '--';
                        }
                    }
                    // También marcar como modificado
                    markAsChanged();
                });
            }
        });

        // 2. Manejo general de cambios para habilitar el botón Guardar
        const allInputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
        allInputs.forEach(input => {
            input.addEventListener('input', markAsChanged);
            input.addEventListener('change', markAsChanged);
        });
    },

    /**
     * Configura los manejadores de botones principales
     */
    setupButtonHandlers() {
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.handleAnalyze());
        }

        const searchInput = document.getElementById('neighborhood-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAnalyze();
                }
            });
        }

        const newBtn = document.getElementById('btn-new');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.handleNewBarrio());
        }

        const editBtn = document.getElementById('btn-edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEdit());
        }

        const saveBtn = document.getElementById('btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        const cancelBtn = document.getElementById('btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        const regenerateBtn = document.getElementById('btn-regenerate-ai');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.handleRegenerateAI());
        }

        const deleteBtn = document.getElementById('btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        document.addEventListener('click', (e) => {
            const searchInput = document.getElementById('neighborhood-input');
            const resultsContainer = document.getElementById('search-results');

            if (searchInput && resultsContainer &&
                !searchInput.contains(e.target) &&
                !resultsContainer.contains(e.target)) {
                UIRenderer.hideSearchResults();
            }
        });
    },

    /**
     * Configura los manejadores de navegación entre secciones
     */
    setupNavigationHandlers() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    },

    /**
     * Cambia de sección en el dashboard
     */
    switchSection(sectionId) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    },

    /**
     * Maneja la acción de buscar/analizar un barrio
     */
    async handleAnalyze() {
        console.log('🔍🚀 handleAnalyze - Ingreso libre de barrios');
        
        const searchInput = document.getElementById('neighborhood-input');
        const query = searchInput ? searchInput.value.trim() : '';
        
        console.log('🔍 handleAnalyze llamado con query:', query);
        
        if (!query) {
            Utils.showToast('Ingresa el nombre de un barrio', 'warning');
            return;
        }

        const btnText = document.getElementById('btn-text');
        if (btnText) btnText.textContent = 'Procesando...';
        
        AppState.lastQuery = query;
        UIRenderer.showLoading('Buscando barrio...');

        try {
            console.log('📡 Intentando obtener barrio del API...');
            console.log('🌐 URL:', `${API_BASE_URL}/api/barrios/${encodeURIComponent(query)}`);
            
            const response = await ApiClient.getBarrio(query);
            
            console.log('✅ Respuesta del API:', response);
            
            if (response.success) {
                const data = response.data;
                AppState.currentBarrio = {
                    nombre: response.nombre || data?.nombre || '',
                    resumen: data?.resumen || '',
                    conclusion: data?.conclusion || '',
                    categorias: data?.categorias || {},
                    puntuacion_general: data?.puntuacion_general || 50,
                    generado_por_ia: response.generado_por_ia,
                    fecha_actualizacion: response.fecha_actualizacion,
                    existe: true
                };
                
                UIRenderer.populateForm(AppState.currentBarrio);
                AppState.isEditing = false;
                this.updateEditMode();
                UIRenderer.hideSearchResults();
                
                const regenerateBtn = document.getElementById('regenerate-btn');
                if (regenerateBtn) {
                    regenerateBtn.disabled = false;
                }
                
                Utils.showToast(`Barrio "${Utils.capitalize(query)}" cargado correctamente`, 'success');
            }
        } catch (error) {
            console.log('❌ Error capturado:', error.message);
            
            const errorMsg = error.message.toLowerCase();
            const isNotFound = 
                errorMsg.includes('404') || 
                errorMsg.includes('no encontrado') || 
                errorMsg.includes('not found') ||
                errorMsg.includes('no existe') ||
                error.name === 'TypeError';
            
            console.log('📋 ¿Barrio no encontrado?:', isNotFound);
            
            if (isNotFound) {
                // ✅ NUEVO: Antes de crear, verificar si hay sugerencias similares
                const sugerencias = await this.buscarSugerencias(query);
                if (sugerencias && sugerencias.length > 0) {
                    const mensaje = `El barrio "${query}" no existe. ¿Quisiste decir: ${sugerencias.map(s => `"${s}"`).join(', ')}?`;
                    if (confirm(mensaje)) {
                        // Si el usuario acepta, buscar el primer sugerido
                        const nuevoQuery = sugerencias[0];
                        searchInput.value = nuevoQuery;
                        this.handleAnalyze();
                        return;
                    }
                }
                
                console.log('📋 El barrio no existe, mostrando opciones de creación...');
                await new Promise(r => setTimeout(r, 300));
                this.showCreateBarrioModal(query);
            } else {
                console.error('Error al buscar barrio:', error);
                Utils.showToast(`Error: ${error.message}`, 'error');
            }
        } finally {
            UIRenderer.hideLoading();
            const btnText = document.getElementById('btn-text');
            if (btnText) btnText.textContent = 'Buscar / Crear';
        }
    },

    /**
     * Busca sugerencias de barrios similares usando el endpoint con q
     */
    async buscarSugerencias(query) {
        try {
            const response = await ApiClient.getAllBarrios(query);
            if (response && response.barrios && response.barrios.length > 0) {
                return response.barrios.map(b => typeof b === 'string' ? b : b.nombre);
            }
            return [];
        } catch (error) {
            console.warn('Error buscando sugerencias:', error);
            return [];
        }
    },

    /**
     * Muestra el modal de confirmación para crear un nuevo barrio
     */
    showCreateBarrioModal(barrioName) {
        const modal = document.getElementById('create-barrio-modal');
        const nameEl = document.getElementById('modal-barrio-name');
        const btnAI = document.getElementById('modal-btn-ai');
        const btnManual = document.getElementById('modal-btn-manual');
        const btnCancel = document.getElementById('modal-btn-cancel');

        if (!modal || !nameEl || !btnAI || !btnManual || !btnCancel) {
            console.error('❌ Elementos del modal no encontrados');
            const choice = confirm(
                `El barrio "${Utils.capitalize(barrioName)}" no existe en la base de datos.\n\n` +
                '¿Qué deseas hacer?\n\n' +
                '✅ Aceptar: Crear nuevo barrio con IA\n' +
                '❌ Cancelar: Crear manualmente (en blanco)'
            );
            if (choice) {
                this.handleCreateWithAI(barrioName);
            } else {
                this.handleNewBarrioManual(barrioName);
            }
            return;
        }

        nameEl.textContent = Utils.capitalize(barrioName);
        modal.classList.remove('hidden');

        const newBtnAI = btnAI.cloneNode(true);
        btnAI.parentNode.replaceChild(newBtnAI, btnAI);

        const newBtnManual = btnManual.cloneNode(true);
        btnManual.parentNode.replaceChild(newBtnManual, btnManual);

        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

        newBtnAI.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.handleCreateWithAI(barrioName);
        });

        newBtnManual.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.handleNewBarrioManual(barrioName);
        });

        newBtnCancel.addEventListener('click', () => {
            modal.classList.add('hidden');
            Utils.showToast('Operación cancelada', 'info');
        });

        console.log('✅ Modal de creación mostrado para:', barrioName);
    },

    /**
     * Crea un nuevo barrio usando IA
     */
    /**
 * Crea un nuevo barrio usando IA
 */
    async handleCreateWithAI(nombre) {
        UIRenderer.showLoading('Generando análisis...');

        try {
            const response = await ApiClient.createBarrio({
                nombre: nombre,
                generar_ia: true
            });

            if (response.success) {
                AppState.currentBarrio = {
                    nombre: response.data.nombre || nombre,
                    ...response.data,
                    generado_por_ia: response.generado_por_ia,
                    fecha_actualizacion: response.fecha_actualizacion
                };

                UIRenderer.populateForm(AppState.currentBarrio);
                AppState.isEditing = true;
                // 🔴 CORREGIDO: Usar EventHandlers.updateEditMode() en lugar de this.updateEditMode()
                EventHandlers.updateEditMode();

                Utils.showToast(`Barrio "${nombre}" creado exitosamente con IA`, 'success');
            } else {
                throw new Error(response.detail || 'Error al crear el barrio');
            }
        } catch (error) {
            console.error('Error al crear barrio:', error);

            if (error.message.includes('ya existe') || error.message.includes('already exists')) {
                console.log('📋 El barrio ya existe, ofreciendo regenerar...');
                UIRenderer.hideLoading();

                const regenerate = confirm(
                    `El barrio "${nombre}" ya existe en la base de datos.\n\n` +
                    '¿Deseas regenerar los datos con IA?'
                );

                if (regenerate) {
                    UIRenderer.showLoading('Regenerando análisis...');
                    try {
                        const regenResponse = await ApiClient.regenerateBarrio(nombre);
                        console.log('🤖 Respuesta regeneración:', regenResponse);

                        if (regenResponse.success) {
                            // Usar convertLegacyAnalysis para asegurar formato correcto
                            const convertedData = EventHandlers.convertLegacyAnalysis(regenResponse.data, nombre);

                            AppState.currentBarrio = {
                                nombre: nombre,
                                ...convertedData,
                                generado_por_ia: true,
                                fecha_actualizacion: regenResponse.fecha_actualizacion
                            };

                            UIRenderer.populateForm(AppState.currentBarrio);
                            AppState.isEditing = true;
                            // 🔴 CORREGIDO: Usar EventHandlers.updateEditMode()
                            EventHandlers.updateEditMode();

                            Utils.showToast(`Barrio "${nombre}" regenerado exitosamente`, 'success');
                        }
                    } catch (regenError) {
                        console.error('Error al regenerar:', regenError);
                        Utils.showToast(`Error al regenerar: ${regenError.message}`, 'error');
                        EventHandlers.handleNewBarrioManual(nombre);
                    }
                } else {
                    EventHandlers.handleNewBarrioManual(nombre);
                }
                return;
            }

            if (error.message.includes('500') || error.message.includes('leaked') ||
                error.message.includes('Forbidden') || error.message.includes('API')) {
                const tryManual = confirm(
                    `La generación con IA falló.\n\n` +
                    `¿Deseas crear el barrio "${nombre}" manualmente?`
                );

                if (tryManual) {
                    EventHandlers.handleNewBarrioManual(nombre);
                }
            } else {
                Utils.showToast(`Error: ${error.message}`, 'error');
            }
        } finally {
            UIRenderer.hideLoading();
        }
    },
    /**
     * Crea un nuevo barrio manualmente
     */
    handleNewBarrioManual(nombre) {
        AppState.currentBarrio = null;
        AppState.isEditing = true;
        AppState.originalData = null;

        UIRenderer.clearForm();

        const nombreInput = document.getElementById('barrio-nombre');
        if (nombreInput) {
            nombreInput.value = nombre;
        }

        UIRenderer.updateFormState(true);

        Utils.showToast(`Modo de creación manual activado para "${nombre}". Complete los campos.`, 'info');
    },

    /**
     * Maneja la creación de un nuevo barrio
     */
    async handleNewBarrio() {
        AppState.currentBarrio = null;
        AppState.isEditing = true;
        AppState.originalData = null;

        UIRenderer.clearForm();
        UIRenderer.updateFormState(true);

        const nombreInput = document.getElementById('barrio-nombre');
        if (nombreInput) {
            nombreInput.focus();
        }

        Utils.showToast('Modo de creación activado. Ingrese los datos del nuevo barrio.');
    },

    /**
     * Maneja la edición del barrio actual
     */
    handleEdit() {
        if (!AppState.currentBarrio) {
            Utils.showToast('Seleccione un barrio para editar', 'warning');
            return;
        }

        AppState.isEditing = true;
        AppState.originalData = collectFormData();
        UIRenderer.updateFormState(true);
        Utils.showToast('Modo de edición activado. Modifique los campos necesarios.');
    },

    /**
     * Maneja el guardado del barrio
     */
    async handleSave() {
        console.log('💾 Iniciando guardado...');

        // ========================================
        // PASO 1: Obtener el nombre del barrio de TODAS las fuentes posibles
        // ========================================
        let nombreBarrio = null;

        // Fuente 1: AppState
        if (AppState.currentBarrio && AppState.currentBarrio.nombre) {
            nombreBarrio = AppState.currentBarrio.nombre;
            console.log('📌 Nombre desde AppState:', nombreBarrio);
        }

        // Fuente 2: Input oculto
        if (!nombreBarrio) {
            const hiddenInput = document.getElementById('barrio-nombre');
            if (hiddenInput && hiddenInput.value) {
                nombreBarrio = hiddenInput.value;
                console.log('📌 Nombre desde hidden input:', nombreBarrio);
            }
        }

        // Fuente 3: Input de búsqueda
        if (!nombreBarrio) {
            const searchInput = document.getElementById('neighborhood-input');
            if (searchInput && searchInput.value) {
                nombreBarrio = searchInput.value.trim().toLowerCase();
                console.log('📌 Nombre desde search input:', nombreBarrio);
            }
        }

        if (!nombreBarrio) {
            Utils.showToast('No se pudo determinar el nombre del barrio', 'error');
            return;
        }

        // ========================================
        // PASO 2: Recopilar datos del formulario
        // ========================================
        const formData = collectFormData();
        console.log('📋 Datos del formulario:', formData);

        // ========================================
        // PASO 3: Validar datos mínimos
        // ========================================
        if (!formData.nombre || formData.nombre.trim() === '') {
            Utils.showToast('El nombre del barrio es obligatorio', 'error');
            return;
        }

        UIRenderer.showLoading('Guardando barrio...');

        try {
            let response;

            // ========================================
            // PASO 4: Verificar si el barrio existe
            // ========================================
            let existe = false;
            try {
                const checkResponse = await ApiClient.getBarrio(nombreBarrio);
                existe = checkResponse.success;
                console.log(`🔍 ¿El barrio "${nombreBarrio}" existe?`, existe);
            } catch (e) {
                existe = false;
                console.log('ℹ️ Barrio no existe, se creará nuevo');
            }

            // ========================================
            // PASO 5: Convertir datos al formato del backend
            // ========================================
            const backendData = this.convertToBackendFormat(formData);
            console.log('📤 Datos para backend:', backendData);

            // ========================================
            // PASO 6: Guardar (actualizar o crear)
            // ========================================
            if (existe) {
                console.log(`🔄 Actualizando barrio existente: ${nombreBarrio}`);
                const backendPayload = {
                    data: backendData,
                    actualizado_por: 'admin'
                };
                response = await ApiClient.updateBarrio(nombreBarrio, backendPayload);
                Utils.showToast('Barrio actualizado correctamente', 'success');
            } else {
                console.log(`✨ Creando nuevo barrio: ${nombreBarrio}`);
                response = await ApiClient.createBarrio({
                    nombre: nombreBarrio,
                    ...backendData
                });
                Utils.showToast('Barrio creado correctamente', 'success');
            }

            // ========================================
            // PASO 7: Actualizar estado local
            // ========================================
            if (response && response.data) {
                AppState.currentBarrio = {
                    nombre: nombreBarrio,
                    ...response.data,
                    existe: true
                };
            } else {
                AppState.currentBarrio = {
                    nombre: nombreBarrio,
                    ...backendData,
                    existe: true
                };
            }

            // ========================================
            // PASO 8: Salir del modo edición
            // ========================================
            AppState.isEditing = false;
            UIRenderer.updateFormState(false);

            // ========================================
            // PASO 9: Recargar datos para confirmar
            // ========================================
            console.log(`🔄 Recargando datos de ${nombreBarrio}...`);
            const refreshedData = await ApiClient.getBarrio(nombreBarrio);
            if (refreshedData.success) {
                UIRenderer.populateForm({
                    ...refreshedData.data,
                    nombre: refreshedData.nombre,
                    existe: true
                });
            }

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            Utils.showToast(`Error al guardar: ${error.message}`, 'error');
        } finally {
            UIRenderer.hideLoading();
        }
    },



    /**
     * Convierte los datos del formulario al formato esperado por el backend
     */
    convertToBackendFormat(formData) {
        // Función auxiliar para procesar campos de lista (separados por coma)
        const processList = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            return value.split(',').map(s => s.trim()).filter(s => s);
        };

        // Función auxiliar para puntuaciones
        const processScore = (value, defaultValue = 50) => {
            if (value === null || value === undefined || value === '') return defaultValue;
            const num = parseInt(value);
            return isNaN(num) ? defaultValue : num;
        };

        // Función para campos de texto simple
        const processText = (value) => value || '';

        const categorias = {
            transporte: {
                puntuacion: processScore(formData.transporte_publico),
                descripcion: processText(formData.transporte_descripcion),
                estaciones: processList(formData.transporte_estaciones),
                colectivos: processList(formData.transporte_colectivos)
            },
            comercio: {
                puntuacion: processScore(formData.comercio_servicios),
                descripcion: processText(formData.comercio_descripcion),
                supermercados: processList(formData.comercio_supermercados),
                centros_comerciales: processList(formData.comercio_centros)
            },
            seguridad: {
                puntuacion: processScore(formData.seguridad),
                descripcion: processText(formData.seguridad_descripcion),
                comisaria: processText(formData.seguridad_comisaria)
            },
            educacion: {
                puntuacion: processScore(formData.educacion),
                descripcion: processText(formData.educacion_descripcion),
                escuelas: processList(formData.educacion_escuelas),
                universidades: processList(formData.educacion_universidades)
            },
            salud: {
                puntuacion: processScore(formData.salud),
                descripcion: processText(formData.salud_descripcion),
                hospitales: processList(formData.salud_hospitales),
                centros_salud: processList(formData.salud_centros)
            },
            espacios_verdes: {
                puntuacion: processScore(formData.espacios_verdes),
                descripcion: processText(formData.espacios_verdes_descripcion),
                parques: processList(formData.espacios_verdes_parques)
            },
            contaminacion: {
                puntuacion: processScore(formData.contaminacion),
                descripcion: processText(formData.contaminacion_descripcion),
                nivel_ruido: processText(formData.contaminacion_ruido) || 'Medio',
                fuente: processText(formData.contaminacion_fuente)
            },
            vida_barrio: {
                puntuacion: processScore(formData.vida_barrio),
                descripcion: processText(formData.vida_barrio_descripcion),
                bares: processList(formData.vida_barrio_bares),
                cultura: processList(formData.vida_barrio_cultura)
            },
            gastronomia: {
                puntuacion: processScore(formData.gastronomia),
                descripcion: processText(formData.gastronomia_descripcion),
                restaurantes_destacados: processList(formData.gastronomia_restaurantes),
                zonas_gastronomicas: processList(formData.gastronomia_zonas)
            },
            servicios_financieros: {
                puntuacion: processScore(formData.servicios_financieros),
                descripcion: processText(formData.servicios_financieros_descripcion),
                bancos: processList(formData.servicios_financieros_bancos),
                cajeros_automaticos: processList(formData.servicios_financieros_cajeros)
            }
        };

        return {
            categorias: categorias,
            resumen_general: processText(formData.perfil_barrio),
            conclusion: processText(formData.conclusion),
            puntuacion_general: processScore(formData.puntuacion_general)
        };
    },
    /**
     * Maneja la cancelación de edición
     */
    handleCancel() {
        if (AppState.originalData) {
            UIRenderer.populateForm(AppState.originalData);
            AppState.currentBarrio = AppState.originalData;
        } else if (AppState.currentBarrio) {
            UIRenderer.clearForm();
        }

        AppState.isEditing = false;
        AppState.originalData = null;
        UIRenderer.updateFormState(false);
        Utils.showToast('Edición cancelada', 'info');
    },

    /**
     * Maneja la regeneración de análisis con IA
     */
    /**
 * Maneja la regeneración de análisis con IA
 */
    /**
 * Maneja la regeneración de análisis con IA
 */
    async handleRegenerateAI() {
        console.log('🤖 Iniciando regeneración con IA...');

        const nombreInput = document.getElementById('barrio-nombre');
        const zoneName = nombreInput ? nombreInput.value.trim() : '';

        if (!zoneName) {
            Utils.showToast('Ingrese el nombre del barrio', 'warning');
            return;
        }

        if (!confirm('¿Regenerar análisis con IA? Se perderán los cambios.')) return;

        UIRenderer.showLoading('Generando análisis...');

        try {
            const response = await ApiClient.generateAIContanalysis(zoneName, true);
            console.log('🤖 Respuesta IA (CRUDA):', response);

            // ========================================
            // PASO 1: Extraer los datos
            // ========================================
            // La respuesta tiene la estructura { success, data, ... }
            // ========================================
            // PASO 1: Extraer los datos
            // ========================================
            console.log('🤖 Respuesta IA (CRUDA):', response);

            // La respuesta puede venir en diferentes formatos
            let dataFromAI = null;

            // Formato 1: { success: true, data: { ... } }
            if (response.data) {
                dataFromAI = response.data;
                console.log('📦 Formato 1: response.data');
            }
            // Formato 2: { ... } directamente (sin data)
            else if (response.categorias || response.resumen_general) {
                dataFromAI = response;
                console.log('📦 Formato 2: response directo');
            }
            // Formato 3: Error
            else {
                console.error("❌ Formato de respuesta no reconocido:", response);
                Utils.showToast('Error: Formato de respuesta inválido', 'error');
                return;
            }

            console.log('📦 Datos extraídos:', dataFromAI);
            console.log('📊 Keys disponibles:', Object.keys(dataFromAI));

            // ========================================
            // PASO 2: Verificar que tenga categorías
            // ========================================
            if (!dataFromAI.categorias) {
                console.error('❌ La respuesta no tiene categorías. Keys:', Object.keys(dataFromAI));

                // Si no tiene categorías pero tiene datos, intentar construir categorías
                if (dataFromAI.transporte || dataFromAI.comercio) {
                    console.log('⚠️ Detectado formato legacy, construyendo categorías...');

                    // Construir objeto categorías a partir de los campos sueltos
                    const categorias = {};
                    const categoriasList = ['transporte', 'comercio', 'seguridad', 'educacion', 'salud',
                        'espacios_verdes', 'contaminacion', 'vida_barrio', 'gastronomia', 'servicios_financieros'];

                    categoriasList.forEach(cat => {
                        if (dataFromAI[cat]) {
                            categorias[cat] = {
                                puntuacion: dataFromAI[cat].puntuacion || dataFromAI[cat] || 50,
                                descripcion: dataFromAI[cat].descripcion || `Información de ${cat}`,
                                ...(dataFromAI[cat] && typeof dataFromAI[cat] === 'object' ? dataFromAI[cat] : {})
                            };
                        } else {
                            categorias[cat] = {
                                puntuacion: 50,
                                descripcion: `Información de ${cat}`,
                                ...(cat === 'transporte' ? { estaciones: [], colectivos: [] } : {}),
                                ...(cat === 'comercio' ? { supermercados: [], centros_comerciales: [] } : {}),
                                ...(cat === 'seguridad' ? { comisaria: "" } : {}),
                                ...(cat === 'educacion' ? { escuelas: [], universidades: [] } : {}),
                                ...(cat === 'salud' ? { hospitales: [], centros_salud: [] } : {}),
                                ...(cat === 'espacios_verdes' ? { parques: [] } : {}),
                                ...(cat === 'contaminacion' ? { nivel_ruido: "Medio", fuente: "" } : {}),
                                ...(cat === 'vida_barrio' ? { bares: [], cultura: [] } : {}),
                                ...(cat === 'gastronomia' ? { restaurantes: [], zonas: [] } : {}),
                                ...(cat === 'servicios_financieros' ? { bancos: [], cajeros: [] } : {})
                            };
                        }
                    });

                    dataFromAI.categorias = categorias;
                    console.log('✅ Categorías construidas:', Object.keys(categorias));
                } else {
                    Utils.showToast('Error: La IA no generó categorías', 'error');
                    return;
                }
            }

            console.log('📊 Categorías recibidas:', Object.keys(dataFromAI.categorias));





            console.log('📦 Datos extraídos:', dataFromAI);

            // ========================================
            // PASO 2: VERIFICAR QUE TENGA CATEGORÍAS
            // ========================================
            if (!dataFromAI.categorias) {
                console.error('❌ La respuesta no tiene categorías:', dataFromAI);
                Utils.showToast('Error: La IA no generó categorías', 'error');
                return;
            }

            console.log('📊 Categorías recibidas:', Object.keys(dataFromAI.categorias));

            // ========================================
            // PASO 3: ACTUALIZAR FORMULARIO DIRECTAMENTE
            // ========================================

            // 3.1 Actualizar resumen general
            const resumenEl = document.getElementById('edit-resumen');
            if (resumenEl) {
                resumenEl.value = dataFromAI.resumen_general || '';
                console.log('✅ Resumen actualizado:', resumenEl.value);
            }

            // 3.2 Actualizar conclusión
            const conclusionEl = document.getElementById('edit-conclusion');
            if (conclusionEl) {
                conclusionEl.value = dataFromAI.conclusion || '';
                console.log('✅ Conclusión actualizada:', conclusionEl.value);
            }

            // 3.3 Actualizar puntuación general
            const puntuacionEl = document.getElementById('barrio-puntuacion');
            if (puntuacionEl) {
                puntuacionEl.value = dataFromAI.puntuacion_general || 50;
                console.log('✅ Puntuación general:', puntuacionEl.value);
            }

            // ========================================
            // PASO 4: ACTUALIZAR CADA CATEGORÍA
            // ========================================
            const categorias = dataFromAI.categorias;

            // Lista de todas las categorías
            const categoriasList = [
                'transporte', 'comercio', 'seguridad', 'educacion', 'salud',
                'espacios_verdes', 'contaminacion', 'vida_barrio', 'gastronomia', 'servicios_financieros'
            ];

            categoriasList.forEach(cat => {
                const catData = categorias[cat] || {};

                console.log(`📝 Procesando ${cat}:`, catData);

                // 4.1 Actualizar puntuación
                const puntInput = document.getElementById(`${cat}-puntuacion`);
                if (puntInput) {
                    puntInput.value = catData.puntuacion || 50;
                    console.log(`  - ${cat} puntuación: ${puntInput.value}`);
                }

                // 4.2 Actualizar descripción
                const descInput = document.getElementById(`${cat}-descripcion`);
                if (descInput) {
                    descInput.value = catData.descripcion || '';
                    console.log(`  - ${cat} descripción: ${descInput.value.substring(0, 30)}...`);
                }

                // 4.3 Actualizar campos específicos según categoría
                switch (cat) {
                    case 'transporte':
                        this.setFieldValue('transporte-estaciones', catData.estaciones);
                        this.setFieldValue('transporte-colectivos', catData.colectivos);
                        break;
                    case 'comercio':
                        this.setFieldValue('comercio-supermercados', catData.supermercados);
                        this.setFieldValue('comercio-centros', catData.centros_comerciales);
                        break;
                    case 'seguridad':
                        this.setFieldValue('seguridad-comisaria', catData.comisaria);
                        break;
                    case 'educacion':
                        this.setFieldValue('educacion-escuelas', catData.escuelas);
                        this.setFieldValue('educacion-universidades', catData.universidades);
                        break;
                    case 'salud':
                        this.setFieldValue('salud-hospitales', catData.hospitales);
                        this.setFieldValue('salud-centros', catData.centros_salud);
                        break;
                    case 'espacios_verdes':
                        this.setFieldValue('espacios_verdes-parques', catData.parques);
                        break;
                    case 'contaminacion':
                        this.setFieldValue('contaminacion-ruido', catData.nivel_ruido);
                        this.setFieldValue('contaminacion-fuente', catData.fuente);
                        break;
                    case 'vida_barrio':
                        this.setFieldValue('vida_barrio-bares', catData.bares);
                        this.setFieldValue('vida_barrio-cultura', catData.cultura);
                        break;
                    case 'gastronomia':
                        this.setFieldValue('gastronomia-restaurantes', catData.restaurantes);
                        this.setFieldValue('gastronomia-zonas', catData.zonas);
                        break;
                    case 'servicios_financieros':
                        this.setFieldValue('servicios_financieros-bancos', catData.bancos);
                        this.setFieldValue('servicios_financieros-cajeros', catData.cajeros);
                        break;
                }

                // 4.4 Actualizar score visual
                if (window.updateScore) {
                    window.updateScore(cat);
                }
            });

            // ========================================
            // PASO 5: ACTUALIZAR VISTA PREVIA
            // ========================================
            if (UIRenderer.updatePreview) {
                UIRenderer.updatePreview({
                    nombre: zoneName,
                    resumen: dataFromAI.resumen_general,
                    conclusion: dataFromAI.conclusion,
                    categorias: dataFromAI.categorias,
                    puntuacion_general: dataFromAI.puntuacion_general
                });
            }

            // ========================================
            // PASO 6: ACTUALIZAR ESTADO
            // ========================================
            AppState.currentBarrio = {
                nombre: zoneName.toLowerCase(),
                resumen_general: dataFromAI.resumen_general,
                puntuacion_general: dataFromAI.puntuacion_general,
                categorias: dataFromAI.categorias,
                conclusion: dataFromAI.conclusion,
                generado_por_ia: true,
                fecha_actualizacion: response.fecha_actualizacion || new Date().toISOString(),
                existe: true
            };

            // Salir del modo edición
            AppState.isEditing = false;
            EventHandlers.updateEditMode();

            // Actualizar badge de IA
            const aiStatus = document.getElementById('ai-status');
            if (aiStatus) {
                aiStatus.innerHTML = '<span class="badge badge-ai">🤖 Datos generados por IA</span>';
            }

            Utils.showToast('✅ Análisis generado correctamente', 'success');
            console.log('✅ Regeneración completada');

        } catch (error) {
            console.error('❌ Error en regeneración:', error);
            Utils.showToast(`Error: ${error.message}`, 'error');
        } finally {
            UIRenderer.hideLoading();
        }
    },
    /**
     * Convierte una puntuación de string a número
     */
    parseScore(value) {
        if (!value || value.trim() === '') return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
    },





    /**
     * Convierte el formato legacy del análisis de IA al nuevo formato
     */
    /**
* Convierte el formato legacy del análisis de IA al nuevo formato
*/
    /**
     * Convierte el formato del análisis de IA al formato del CMS
     * Ahora maneja correctamente tanto respuestas completas como parciales
     */
    convertLegacyAnalysis(analysis, nombre) {
        console.log('🔄 Convirtiendo análisis IA:', analysis);
        console.log('🔍 Tipo de análisis:', typeof analysis);

        // ========================================
        // CASO 1: La respuesta ya tiene la estructura completa
        // ========================================
        if (analysis && typeof analysis === 'object') {
            // Si tiene categorías, es el formato correcto
            if (analysis.categorias && typeof analysis.categorias === 'object') {
                console.log('✅ Análisis tiene categorías - usando directamente');
                return {
                    nombre: Utils.capitalize(nombre),
                    resumen_general: analysis.resumen_general || '',
                    puntuacion_general: analysis.puntuacion_general || 50,
                    categorias: analysis.categorias || {},
                    conclusion: analysis.conclusion || ''
                };
            }

            // Si la respuesta viene en data.data (estructura de Postman)
            if (analysis.data && analysis.data.categorias) {
                console.log('✅ Análisis tiene data.categorias - usando data');
                return {
                    nombre: Utils.capitalize(nombre),
                    resumen_general: analysis.data.resumen_general || '',
                    puntuacion_general: analysis.data.puntuacion_general || 50,
                    categorias: analysis.data.categorias || {},
                    conclusion: analysis.data.conclusion || ''
                };
            }

            // ========================================
            // CASO 2: La respuesta es SOLO una categoría (ej: transporte)
            // ========================================
            if (analysis.puntuacion !== undefined || analysis.descripcion !== undefined) {
                console.log('⚠️ Detectado formato de categoría suelta - construyendo estructura completa');

                // Determinar qué categoría es basado en los campos presentes
                let categoriaDetectada = 'transporte'; // Por defecto

                if (analysis.estaciones !== undefined) categoriaDetectada = 'transporte';
                else if (analysis.supermercados !== undefined) categoriaDetectada = 'comercio';
                else if (analysis.centros_comerciales !== undefined) categoriaDetectada = 'comercio';
                else if (analysis.comisaria !== undefined) categoriaDetectada = 'seguridad';
                else if (analysis.escuelas !== undefined) categoriaDetectada = 'educacion';
                else if (analysis.universidades !== undefined) categoriaDetectada = 'educacion';
                else if (analysis.hospitales !== undefined) categoriaDetectada = 'salud';
                else if (analysis.centros_salud !== undefined) categoriaDetectada = 'salud';
                else if (analysis.parques !== undefined) categoriaDetectada = 'espacios_verdes';
                else if (analysis.nivel_ruido !== undefined) categoriaDetectada = 'contaminacion';
                else if (analysis.fuente !== undefined) categoriaDetectada = 'contaminacion';
                else if (analysis.bares !== undefined) categoriaDetectada = 'vida_barrio';
                else if (analysis.cultura !== undefined) categoriaDetectada = 'vida_barrio';
                else if (analysis.restaurantes !== undefined) categoriaDetectada = 'gastronomia';
                else if (analysis.zonas !== undefined) categoriaDetectada = 'gastronomia';
                else if (analysis.bancos !== undefined) categoriaDetectada = 'servicios_financieros';
                else if (analysis.cajeros !== undefined) categoriaDetectada = 'servicios_financieros';

                console.log(`🔍 Categoría detectada: ${categoriaDetectada}`);

                // Crear estructura completa con datos de ejemplo para las demás categorías
                const categorias = {};

                // Lista de todas las categorías que debe tener
                const todasLasCategorias = [
                    'transporte', 'comercio', 'seguridad', 'educacion', 'salud',
                    'espacios_verdes', 'contaminacion', 'vida_barrio', 'gastronomia', 'servicios_financieros'
                ];

                // Inicializar todas las categorías con datos vacíos
                todasLasCategorias.forEach(cat => {
                    categorias[cat] = {
                        puntuacion: 50,
                        descripcion: `Información de ${cat} en ${nombre}`,
                        ...(cat === 'transporte' && { estaciones: [], colectivos: [] }),
                        ...(cat === 'comercio' && { supermercados: [], centros_comerciales: [] }),
                        ...(cat === 'seguridad' && { comisaria: '' }),
                        ...(cat === 'educacion' && { escuelas: [], universidades: [] }),
                        ...(cat === 'salud' && { hospitales: [], centros_salud: [] }),
                        ...(cat === 'espacios_verdes' && { parques: [] }),
                        ...(cat === 'contaminacion' && { nivel_ruido: 'Medio', fuente: '' }),
                        ...(cat === 'vida_barrio' && { bares: [], cultura: [] }),
                        ...(cat === 'gastronomia' && { restaurantes: [], zonas: [] }),
                        ...(cat === 'servicios_financieros' && { bancos: [], cajeros: [] })
                    };
                });

                // Poblar la categoría detectada con los datos reales
                if (categoriaDetectada && categorias[categoriaDetectada]) {
                    categorias[categoriaDetectada] = {
                        ...categorias[categoriaDetectada],
                        puntuacion: analysis.puntuacion || 50,
                        descripcion: analysis.descripcion || `Información de ${categoriaDetectada} en ${nombre}`,
                        ...analysis
                    };
                    console.log(`✅ Categoría ${categoriaDetectada} poblada con datos reales`);
                    console.log(`📊 Datos de ${categoriaDetectada}:`, categorias[categoriaDetectada]);
                }

                return {
                    nombre: Utils.capitalize(nombre),
                    resumen_general: `Análisis de ${nombre}`,
                    puntuacion_general: 50,
                    categorias: categorias,
                    conclusion: `Información basada en datos de ${categoriaDetectada}.`
                };
            }

            // ========================================
            // CASO 3: Intentar extraer puntuaciones sueltas (formato legacy original)
            // ========================================
            console.warn('⚠️ Intentando extraer puntuaciones sueltas para:', nombre);

            // Verificar si hay datos de categorías en el objeto
            const categoriasDetectadas = {};
            let tieneDatos = false;

            todasLasCategorias.forEach(cat => {
                const score = this.extractScore(analysis, cat);
                if (score !== null) {
                    tieneDatos = true;
                    categoriasDetectadas[cat] = {
                        puntuacion: score,
                        descripcion: `Información de ${cat} en ${nombre}`,
                        ...(cat === 'transporte' && { estaciones: [], colectivos: [] }),
                        ...(cat === 'comercio' && { supermercados: [], centros_comerciales: [] }),
                        ...(cat === 'seguridad' && { comisaria: '' }),
                        ...(cat === 'educacion' && { escuelas: [], universidades: [] }),
                        ...(cat === 'salud' && { hospitales: [], centros_salud: [] }),
                        ...(cat === 'espacios_verdes' && { parques: [] }),
                        ...(cat === 'contaminacion' && { nivel_ruido: 'Medio', fuente: '' }),
                        ...(cat === 'vida_barrio' && { bares: [], cultura: [] }),
                        ...(cat === 'gastronomia' && { restaurantes: [], zonas: [] }),
                        ...(cat === 'servicios_financieros' && { bancos: [], cajeros: [] })
                    };
                }
            });

            if (tieneDatos) {
                console.log('✅ Puntuaciones extraídas:', categoriasDetectadas);

                // Completar las categorías que faltan con datos vacíos
                todasLasCategorias.forEach(cat => {
                    if (!categoriasDetectadas[cat]) {
                        categoriasDetectadas[cat] = {
                            puntuacion: 50,
                            descripcion: `Información de ${cat} en ${nombre}`,
                            ...(cat === 'transporte' && { estaciones: [], colectivos: [] }),
                            ...(cat === 'comercio' && { supermercados: [], centros_comerciales: [] }),
                            ...(cat === 'seguridad' && { comisaria: '' }),
                            ...(cat === 'educacion' && { escuelas: [], universidades: [] }),
                            ...(cat === 'salud' && { hospitales: [], centros_salud: [] }),
                            ...(cat === 'espacios_verdes' && { parques: [] }),
                            ...(cat === 'contaminacion' && { nivel_ruido: 'Medio', fuente: '' }),
                            ...(cat === 'vida_barrio' && { bares: [], cultura: [] }),
                            ...(cat === 'gastronomia' && { restaurantes: [], zonas: [] }),
                            ...(cat === 'servicios_financieros' && { bancos: [], cajeros: [] })
                        };
                    }
                });

                return {
                    nombre: Utils.capitalize(nombre),
                    resumen_general: analysis.perfil_barrio || analysis.descripcion_general || `Análisis de ${nombre}`,
                    puntuacion_general: this.parseScore(analysis.puntuacion_general) ||
                        this.parseScore(analysis.puntuacion) || 50,
                    categorias: categoriasDetectadas,
                    conclusion: analysis.conclusion || `Información basada en datos disponibles.`
                };
            }
        }

        // ========================================
        // CASO 4: Fallback - generar datos de ejemplo completos
        // ========================================
        console.warn('⚠️ Usando fallback - generando datos de ejemplo para:', nombre);

        // Generar datos de ejemplo para todas las categorías
        const categorias = {};
        const todasLasCategorias = [
            'transporte', 'comercio', 'seguridad', 'educacion', 'salud',
            'espacios_verdes', 'contaminacion', 'vida_barrio', 'gastronomia', 'servicios_financieros'
        ];

        todasLasCategorias.forEach(cat => {
            categorias[cat] = {
                puntuacion: 50,
                descripcion: `Información de ${cat} en ${nombre}`,
                ...(cat === 'transporte' && { estaciones: ['Estación central'], colectivos: ['Línea 1', 'Línea 2'] }),
                ...(cat === 'comercio' && { supermercados: ['Supermercado local'], centros_comerciales: ['Shopping'] }),
                ...(cat === 'seguridad' && { comisaria: 'Comisaría de la zona' }),
                ...(cat === 'educacion' && { escuelas: ['Escuela primaria'], universidades: [] }),
                ...(cat === 'salud' && { hospitales: ['Hospital público'], centros_salud: ['Centro de salud'] }),
                ...(cat === 'espacios_verdes' && { parques: ['Plaza principal'] }),
                ...(cat === 'contaminacion' && { nivel_ruido: 'Medio', fuente: 'Tráfico vehicular' }),
                ...(cat === 'vida_barrio' && { bares: ['Bar local'], cultura: ['Centro cultural'] }),
                ...(cat === 'gastronomia' && { restaurantes: ['Restaurante típico'], zonas: ['Zona gastronómica'] }),
                ...(cat === 'servicios_financieros' && { bancos: ['Banco Nación'], cajeros: ['Red Link'] })
            };
        });

        return {
            nombre: Utils.capitalize(nombre),
            resumen_general: `${nombre} es un barrio de Buenos Aires con diversas características.`,
            puntuacion_general: 50,
            categorias: categorias,
            conclusion: `${nombre} presenta opciones para vivir e invertir.`
        };
    }
    /**
     * Actualiza el estado del modo de edición
     */
    /**
     * Actualiza el estado del modo de edición
     */


}; // ← SOLO UN CIERRE AQUÍ, AL FINAL DE TODOS LOS MÉTODOS



// ============================================
// GENERACIÓN DINÁMICA DE FORMULARIOS BASADA EN METADATA
// ============================================

/**
 * Carga los metadatos de campos desde el backend
 * Esta función es llamada durante la inicialización de la aplicación
 */
async function loadMetadata() {
    console.log('📋 Cargando metadatos de campos desde el backend...');

    try {
        const response = await ApiClient.getEntornoMetadata();

        if (response.success) {
            AppState.metadata = response.rubros;
            AppState.categoriesOrder = response.categorias_ordenadas || [];

            console.log(`✅ Metadatos cargados: ${Object.keys(AppState.metadata).length} rubros`);
            console.log('📋 Orden de categorías:', AppState.categoriesOrder);

            // Opcional: generar formularios dinámicamente si es necesario
            // generateDynamicForms();
        } else {
            console.warn('⚠️ No se pudieron cargar los metadatos:', response.message);
        }
    } catch (error) {
        console.warn('⚠️ Error cargando metadatos:', error.message);
        console.log('ℹ️ La aplicación continuará con formularios hardcodeados');
    }
}

/**
 * Genera campos de formulario dinámicamente basados en los metadatos
 * Esta función puede ser usada para regenerar formularios si el HTML cambia
 * 
 * @param {string} categoryKey - Clave del rubro (ej: 'transporte', 'comercio')
 * @param {HTMLElement} container - Contenedor donde insertar los campos
 */
function generateFormFieldsForCategory(categoryKey, container) {
    if (!AppState.metadata || !AppState.metadata[categoryKey]) {
        console.warn(`⚠️ No hay metadatos para la categoría: ${categoryKey}`);
        return;
    }

    const metadata = AppState.metadata[categoryKey];
    const fields = metadata.campos || {};

    // Ordenar campos por su propiedad 'orden'
    const sortedFields = Object.entries(fields).sort((a, b) => {
        return (a[1].orden || 99) - (b[1].orden || 99);
    });

    sortedFields.forEach(([fieldKey, fieldConfig]) => {
        const fieldHtml = createFormField(categoryKey, fieldKey, fieldConfig);
        container.insertAdjacentHTML('beforeend', fieldHtml);
    });
}

/**
 * Crea el HTML para un campo de formulario individual
 * 
 * @param {string} categoryKey - Clave del rubro (ej: 'transporte')
 * @param {string} fieldKey - Clave del campo (ej: 'estaciones')
 * @param {object} fieldConfig - Configuración del campo desde los metadatos
 * @returns {string} HTML del campo
 */
function createFormField(categoryKey, fieldKey, fieldConfig) {
    const fieldId = `${categoryKey}-${fieldKey}`;
    const label = fieldConfig.label || fieldKey;
    const placeholder = fieldConfig.placeholder || '';
    const type = fieldConfig.tipo || 'input';

    let fieldHtml = '';

    switch (type) {
        case 'textarea':
            fieldHtml = `
                <div class="form-field">
                    <label for="${fieldId}">${label}:</label>
                    <textarea 
                        id="${fieldId}" 
                        class="editor-input" 
                        placeholder="${placeholder}"
                        disabled
                        rows="3"
                    ></textarea>
                </div>
            `;
            break;

        case 'select':
            const options = fieldConfig.options || [];
            const optionsHtml = options.map(opt =>
                `<option value="${opt}">${opt}</option>`
            ).join('');
            fieldHtml = `
                <div class="form-field">
                    <label for="${fieldId}">${label}:</label>
                    <select 
                        id="${fieldId}" 
                        class="editor-input" 
                        disabled
                    >
                        <option value="">Seleccionar...</option>
                        ${optionsHtml}
                    </select>
                </div>
            `;
            break;

        case 'input':
        default:
            fieldHtml = `
                <div class="form-field">
                    <label for="${fieldId}">${label}:</label>
                    <input 
                        type="text" 
                        id="${fieldId}" 
                        class="editor-input" 
                        placeholder="${placeholder}"
                        disabled
                    />
                </div>
            `;
            break;
    }

    return fieldHtml;
}

/**
 * Obtiene el valor de un campo del formulario basado en su ID
 * Soporta los tres tipos de campos: input, textarea, select
 * 
 * @param {string} fieldId - ID del campo (ej: 'transporte-estaciones')
 * @returns {string} Valor del campo
 */
function getFieldValue(fieldId) {
    const element = document.getElementById(fieldId);
    if (!element) return '';

    return element.value?.trim() || '';
}

/**
 * Establece el valor de un campo del formulario
 * 
 * @param {string} fieldId - ID del campo
 * @param {string} value - Valor a establecer
 */
function setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (!element) return;

    // Habilitar temporalmente para poder establecer el valor
    const wasDisabled = element.disabled;
    element.disabled = false;
    element.value = value || '';
    element.disabled = wasDisabled;
}

/**
 * Recoge los datos de todos los campos de una categoría usando metadatos
 * 
 * @param {string} categoryKey - Clave del rubro (ej: 'transporte')
 * @returns {object} Objeto con los datos de la categoría
 */
function collectCategoryData(categoryKey) {
    if (!AppState.metadata || !AppState.metadata[categoryKey]) {
        return {};
    }

    const metadata = AppState.metadata[categoryKey];
    const fields = metadata.campos || {};
    const categoryData = {};

    Object.keys(fields).forEach(fieldKey => {
        const fieldId = `${categoryKey}-${fieldKey}`;
        categoryData[fieldKey] = getFieldValue(fieldId);
    });

    return categoryData;
}

/**
 * Rellena los campos de una categoría con datos usando metadatos
 * 
 * @param {string} categoryKey - Clave del rubro
 * @param {object} categoryData - Datos de la categoría
 */
function populateCategoryFields(categoryKey, categoryData) {
    if (!categoryData || typeof categoryData !== 'object') {
        return;
    }

    Object.entries(categoryData).forEach(([fieldKey, value]) => {
        const fieldId = `${categoryKey}-${fieldKey}`;
        setFieldValue(fieldId, value);
    });
}

// ============================================
// MANEJO DE PARÁMETROS DE URL
// ============================================

/**
 * Lee los parámetros de la URL y los procesa
 * Se usa cuando se llega a esta página desde estadisticas.html
 */
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const barrio = urlParams.get('barrio');
    const crear = urlParams.get('crear'); // 'ai' o 'manual'

    if (barrio) {
        console.log('📥 URL params recibidos:', { barrio, crear });

        // Pre-fill el campo de búsqueda
        const searchInput = document.getElementById('neighborhood-input');
        if (searchInput) {
            searchInput.value = decodeURIComponent(barrio);
        }

        // Si hay un parámetro de creación, ejecutar la acción correspondiente
        if (crear === 'ai') {
            // Ejecutar creación con IA después de un pequeño delay para que la UI esté lista
            setTimeout(() => {
                console.log('🤖 Auto-iniciando creación con IA para:', barrio);
                EventHandlers.handleCreateWithAI(decodeURIComponent(barrio));
            }, 500);
        } else if (crear === 'manual') {
            // Ejecutar creación manual después de un pequeño delay
            setTimeout(() => {
                console.log('✏️ Auto-iniciando creación manual para:', barrio);
                EventHandlers.handleNewBarrioManual(decodeURIComponent(barrio));
            }, 500);
        } else {
            // Si solo viene el barrio pero no la acción, hacer búsqueda normal
            setTimeout(() => {
                console.log('🔍 Auto-ejecutando búsqueda para:', barrio);
                EventHandlers.handleAnalyze();
            }, 500);
        }

        // Limpiar los parámetros de la URL para una experiencia más limpia
        // (opcional - mantener esto comentando si se quiere que el usuario pueda recargar)
        // window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

async function initApp() {
    console.log('🚀 Inicializando CMS de Barrios...');

    // ========================================
    // ✅ PASO 1: LIMPIAR LA URL INMEDIATAMENTE
    // ========================================
    const urlParams = new URLSearchParams(window.location.search);
    const tieneParametros = urlParams.toString().length > 0;

    if (tieneParametros) {
        console.log('🧹 Limpiando parámetros de URL...');
        const nuevaUrl = window.location.pathname;
        window.history.replaceState({}, document.title, nuevaUrl);
    }

    // Configurar modo
    const mode = 'LOCAL';
    console.log(`🌐 Modo: ${mode}`);

    // ✅ LIMPIAR FORMULARIO AL INICIAR
    if (UIRenderer.clearForm) {
        UIRenderer.clearForm();
    }

    // Inicializar manejadores de eventos
    EventHandlers.init();

    // Deshabilitar campos inicialmente
    UIRenderer.updateFormState(false);

    // ✅ HABILITAR BOTÓN REGENERAR CON IA AL INICIO
    const regenerateBtn = document.getElementById('regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.disabled = false;
        console.log('✅ Botón Regenerar con IA habilitado');
    }

    // Cargar lista de barrios si existe el endpoint
    try {
        const response = await ApiClient.getAllBarrios();
        if (response && response.barrios) {
            AppState.searchResults = response.barrios;
            console.log(`✅ Barrios cargados: ${response.barrios.length} registros`);
        } else {
            console.log('✅ Barrios cargados (formato diferente)');
        }
    } catch (error) {
        console.warn('No se pudieron cargar los barrios:', error.message);
    }

    // Cargar metadatos de campos para formularios dinámicos
    await loadMetadata();

    // ========================================
    // ✅ PASO 2: AHORA SÍ, PROCESAR PARÁMETROS (PERO YA NO HAY)
    // ========================================
    if (tieneParametros) {
        console.log('📥 Procesando barrio desde URL (aunque ya la limpiamos)...');
        // Guardamos el parámetro antes de limpiarlo
        const barrioOriginal = urlParams.get('barrio');
        if (barrioOriginal && barrioOriginal !== 'undefined' && barrioOriginal !== 'null') {
            // Forzar la carga del barrio desde el parámetro original
            setTimeout(() => {
                const input = document.getElementById('neighborhood-input');
                if (input) {
                    input.value = barrioOriginal;
                    // Disparar la búsqueda
                    EventHandlers.handleAnalyze();
                }
            }, 500);
        }
    } else {
        console.log('ℹ️ No hay barrio en URL, mostrando formulario vacío');
        // Asegurar que el formulario está vacío
        const currentBarrioEl = document.getElementById('current-barrio-name');
        if (currentBarrioEl) currentBarrioEl.textContent = '--';

        // Limpiar cualquier dato residual
        const scoreElements = document.querySelectorAll('[id^="score-"]');
        scoreElements.forEach(el => {
            el.textContent = '--';
            el.style.color = '#6B7280';
        });
    }

    console.log('✅ CMS de Barrios inicializado correctamente');
}

// ============================================
// FUNCIONES GLOBALES PARA HTML ONCLICK
// ============================================

// ============================================
// FUNCIONES GLOBALES PARA HTML ONCLICK
// ============================================

window.toggleAdminMode = function () {
    AppState.isEditing = !AppState.isEditing;
    const badge = document.getElementById('edit-badge');
    const toolbar = document.getElementById('admin-toolbar');
    const editBtn = document.getElementById('btn-edit-toggle');
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');

    if (AppState.isEditing) {
        if (badge) {
            badge.textContent = 'Editando';
            badge.classList.add('editing');
        }
        if (toolbar) toolbar.classList.remove('hidden');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-times"></i> ❌ Cancelar';
            editBtn.classList.add('cancel-btn');
        }
        inputs.forEach(input => input.disabled = false);
    } else {
        if (badge) {
            badge.textContent = 'Solo lectura';
            badge.classList.remove('editing');
        }
        if (toolbar) toolbar.classList.add('hidden');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> ✏️ Editar';
            editBtn.classList.remove('cancel-btn');
        }
        inputs.forEach(input => input.disabled = true);
    }

    console.log('🔄 Modo admin toggled:', AppState.isEditing);
};

window.toggleAccordion = function (category) {
    const header = document.querySelector(`.accordion-header[onclick*="${category}"]`);
    const content = document.getElementById(`content-${category}`);
    const arrow = header ? header.querySelector('.accordion-arrow') : null;

    if (header) header.classList.toggle('active');
    if (content) content.classList.toggle('active');
    if (arrow) arrow.style.transform = header?.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
};

window.markAsChanged = function () {
    AppState.isChanged = true;
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    }
    console.log('📝 Formulario modificado');
};

// ============================================
// FUNCIÓN CORREGIDA PARA ACTUALIZAR COLORES DE PUNTUACIÓN
// ============================================
window.updateScore = function (category) {
    const scoreEl = document.getElementById(`score-${category}`);
    const inputEl = document.getElementById(`${category}-puntuacion`);

    if (scoreEl && inputEl) {
        const score = parseInt(inputEl.value) || 0;
        scoreEl.textContent = score;

        // Remover clases anteriores
        scoreEl.classList.remove('score-high', 'score-medium', 'score-low');

        // Agregar clase según puntuación
        if (score >= 70) {
            scoreEl.classList.add('score-high');
            scoreEl.style.color = '#10B981'; // Verde
        } else if (score >= 40) {
            scoreEl.classList.add('score-medium');
            scoreEl.style.color = '#F59E0B'; // Naranja
        } else if (score > 0) {
            scoreEl.classList.add('score-low');
            scoreEl.style.color = '#EF4444'; // Rojo
        } else {
            scoreEl.style.color = '#6B7280'; // Gris
        }

        console.log(`🎨 Score ${category} actualizado: ${score} (color: ${scoreEl.style.color})`);
    }
};


window.createNewBarrio = function () {
    const input = document.getElementById('neighborhood-input');
    const nombre = input ? input.value.trim() : '';

    if (!nombre) {
        alert('Por favor ingresa un nombre de barrio');
        return;
    }

    console.log('✨ Creando nuevo barrio:', nombre);
    EventHandlers.showCreateBarrioModal(nombre);
};

window.saveBarrio = async function () {
    await EventHandlers.handleSave();
};

window.regenerateWithAI = async function () {
    await EventHandlers.handleRegenerateAI();
};

window.deleteBarrio = async function () {
    await EventHandlers.handleDelete();
};

window.generateEntornoJSON = async function () {
    const exportBtn = document.querySelector('.toolbar-btn.export-btn');
    if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    }

    try {
        console.log('📦 Generando archivo entorno.json...');
        const response = await fetch(`${API_BASE_URL}/api/barrios/generate-json`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const jsonString = JSON.stringify(data.data || data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'entorno.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ archivo entorno.json descargado correctamente');
        alert('✅ archivo entorno.json descargado correctamente');

    } catch (error) {
        console.error('Error generando entorno.json:', error);
        alert('Error al generar entorno.json: ' + error.message);
    } finally {
        // Asegurar que el botón se habilita SIEMPRE, incluso si hubo error o si la descarga fue exitosa
        if (exportBtn) {
            setTimeout(() => {
                exportBtn.innerHTML = '<i class="fas fa-file-code"></i> Exportar JSON';
                exportBtn.disabled = false;
            }, 1000); // Pequeño delay para evitar doble clic accidental
        }
    }
};

window.clearEditorForm = function () {
    UIRenderer.clearForm();
};

window.loadBarrioData = function (response) {
    if (!response) return;
    const data = response.data || response;
    const nombre = response.nombre || data?.nombre;

    if (!nombre) return;

    AppState.currentBarrio = { nombre, existe: true };
    UIRenderer.populateForm(response);
};




// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Exportar funciones necesarias para uso global
window.AppState = AppState;
window.ApiClient = ApiClient;
window.UIRenderer = UIRenderer;
window.EventHandlers = EventHandlers;
window.Utils = Utils;

// ============================================
// FUNCIONES GLOBALES PARA HTML ONCLICK
// ============================================

/**
 * Alternar el modo administrador
 */
function toggleAdminMode() {
    AppState.isEditing = !AppState.isEditing;
    const badge = document.getElementById('edit-badge');
    const toolbar = document.getElementById('admin-toolbar');
    const editBtn = document.getElementById('btn-edit-toggle');
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');

    if (AppState.isEditing) {
        if (badge) badge.textContent = 'Editando';
        if (badge) badge.classList.add('editing');
        if (toolbar) toolbar.classList.remove('hidden');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-times"></i> ❌ Cancelar';
            editBtn.classList.add('cancel-btn');
        }
        inputs.forEach(input => input.disabled = false);
    } else {
        if (badge) badge.textContent = 'Solo lectura';
        if (badge) badge.classList.remove('editing');
        if (toolbar) toolbar.classList.add('hidden');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> ✏️ Editar';
            editBtn.classList.remove('cancel-btn');
        }
        inputs.forEach(input => input.disabled = true);
    }

    console.log('🔄 Modo admin toggled:', AppState.isEditing);
}

/**
 * Alternar acordeón de categoría
 */
function toggleAccordion(category) {
    const header = document.querySelector(`.accordion-header[onclick*="${category}"]`);
    const content = document.getElementById(`content-${category}`);
    const arrow = header ? header.querySelector('.accordion-arrow') : null;

    if (header) {
        header.classList.toggle('active');
    }

    if (content) {
        content.classList.toggle('active');
    }

    if (arrow) {
        arrow.style.transform = header.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

/**
 * Marcar formulario como modificado
 */
function markAsChanged() {
    AppState.isChanged = true;
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    }
    console.log('📝 Formulario modificado');
}

/**
 * Actualizar puntuación visual en acordeón
 */
function updateScore(category) {
    const scoreEl = document.getElementById(`score-${category}`);
    const inputEl = document.getElementById(`${category}-puntuacion`);

    if (scoreEl && inputEl) {
        const score = parseInt(inputEl.value) || 0;
        scoreEl.textContent = score;

        // Actualizar color según puntuación
        scoreEl.removeAttribute('data-score');
        if (score >= 70) {
            scoreEl.setAttribute('data-score', 'high');
        } else if (score >= 40) {
            scoreEl.setAttribute('data-score', 'medium');
        } else {
            scoreEl.setAttribute('data-score', 'low');
        }
    }
}

/**
 * Crear nuevo barrio
 */
function createNewBarrio() {
    const input = document.getElementById('neighborhood-input');
    const nombre = input ? input.value.trim() : '';

    if (!nombre) {
        alert('Por favor ingresa un nombre de barrio');
        return;
    }

    console.log('✨ Creando nuevo barrio:', nombre);

    // Limpiar formulario
    clearEditorForm();

    // Mostrar toolbar
    const toolbar = document.getElementById('admin-toolbar');
    const currentBarrio = document.getElementById('current-barrio-name');
    const badge = document.getElementById('edit-badge');

    if (toolbar) toolbar.classList.remove('hidden');
    if (currentBarrio) currentBarrio.textContent = nombre;
    if (badge) {
        badge.textContent = 'Nuevo';
        badge.classList.add('editing');
    }

    // Habilitar edición
    AppState.isEditing = true;
    AppState.currentBarrio = { nombre: nombre };
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    inputs.forEach(input => input.disabled = false);

    // Scroll al editor
    document.getElementById('editor-column').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Guardar barrio actual
 */
// FUNCIONES AUXILIARES ELIMINADAS (DUPLICADAS)

/**
 * Regenerar datos con IA
 */
async function regenerateWithAI() {
    if (!AppState.currentBarrio) {
        alert('No hay barrio para regenerar');
        return;
    }

    const nombre = AppState.currentBarrio.nombre;
    const confirmRegen = confirm(`¿Estás seguro de regenerar los datos de "${nombre}" con IA?\n\nEsto sobrescribirá los datos actuales.`);

    if (!confirmRegen) return;

    const regenerateBtn = document.getElementById('regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    }

    try {
        // Mostrar overlay de carga
        UIRenderer.showLoading('Generando análisis con IA...');

        // Usar el endpoint de regeneración
        const response = await ApiClient.regenerateBarrio(nombre);

        console.log('✨ Datos regenerados con IA:', response);

        if (response.success) {
            // Actualizar el estado con los nuevos datos
            AppState.currentBarrio = {
                nombre: response.data.nombre || nombre,
                ...response.data,
                generado_por_ia: true,
                fecha_actualizacion: response.fecha_actualizacion
            };

            // Recargar el formulario con los nuevos datos
            UIRenderer.populateForm(AppState.currentBarrio);

            alert('Datos regenerados correctamente');
        } else {
            throw new Error(response.message || 'Error al regenerar');
        }

    } catch (error) {
        console.error('Error regenerando:', error);
        alert('Error al regenerar: ' + error.message);
    } finally {
        UIRenderer.hideLoading();
        if (regenerateBtn) {
            regenerateBtn.innerHTML = '<i class="fas fa-magic"></i> Regenerar con IA';
            regenerateBtn.disabled = false;
        }
    }
}

/**
 * Generar archivo entorno.json para el frontend
 */
// FUNCION ELIMINADA (DUPLICADA)

/**
 * Eliminar barrio actual
 */
async function deleteBarrio() {
    if (!AppState.currentBarrio) {
        alert('No hay barrio para eliminar');
        return;
    }

    const nombre = AppState.currentBarrio.nombre;
    const confirmDelete = confirm(`¿Estás seguro de eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`);

    if (!confirmDelete) return;

    try {
        await ApiClient.deleteBarrio(nombre);

        console.log('🗑️ Barrio eliminado:', nombre);

        // Limpiar formulario
        clearEditorForm();

        // Actualizar lista de barrios
        await initApp();

        alert('Barrio eliminado correctamente');

    } catch (error) {
        console.error('Error eliminando:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

/**
 * Limpiar formulario del editor
 */
function clearEditorForm() {
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    inputs.forEach(input => {
        input.value = '';
        input.disabled = true;
    });

    // Limpiar puntuaciones
    const scores = document.querySelectorAll('[id^="score-"]');
    scores.forEach(score => score.textContent = '--');

    // Reset estado
    AppState.currentBarrio = null;
    AppState.isEditing = false;
    AppState.isChanged = false;

    // Reset badge
    const badge = document.getElementById('edit-badge');
    if (badge) {
        badge.textContent = 'Sin datos';
        badge.classList.remove('editing');
    }
}

/**
 * Recopilar datos del formulario
 */
function collectFormData() {
    // ========================================
    // PASO 1: Obtener nombre de TODAS las fuentes posibles
    // ========================================
    let nombre = '';

    // Fuente 1: Input oculto (prioridad 1)
    const hiddenInput = document.getElementById('barrio-nombre');
    if (hiddenInput && hiddenInput.value) {
        nombre = hiddenInput.value;
        console.log('📌 Nombre desde hidden input:', nombre);
    }

    // Fuente 2: AppState (prioridad 2)
    if (!nombre && AppState.currentBarrio?.nombre) {
        nombre = AppState.currentBarrio.nombre;
        console.log('📌 Nombre desde AppState:', nombre);
    }

    // Fuente 3: Input de búsqueda (prioridad 3)
    if (!nombre) {
        const searchInput = document.getElementById('neighborhood-input');
        if (searchInput && searchInput.value) {
            nombre = searchInput.value.trim();
            console.log('📌 Nombre desde search input:', nombre);
        }
    }

    console.log('🔍 collectFormData - nombre final:', nombre);

    // Leer cada campo
    const resumen = document.getElementById('edit-resumen')?.value || '';
    const conclusion = document.getElementById('edit-conclusion')?.value || '';
    const puntuacion_general = parseInt(document.getElementById('barrio-puntuacion')?.value) || 50;

    // Transporte
    const transporte_puntuacion = parseInt(document.getElementById('transporte-puntuacion')?.value) || 50;
    const transporte_descripcion = document.getElementById('transporte-descripcion')?.value || '';
    const transporte_estaciones = document.getElementById('transporte-estaciones')?.value || '';
    const transporte_colectivos = document.getElementById('transporte-colectivos')?.value || '';

    // Comercio
    const comercio_puntuacion = parseInt(document.getElementById('comercio-puntuacion')?.value) || 50;
    const comercio_descripcion = document.getElementById('comercio-descripcion')?.value || '';
    const comercio_supermercados = document.getElementById('comercio-supermercados')?.value || '';
    const comercio_centros = document.getElementById('comercio-centros')?.value || '';

    // Seguridad
    const seguridad_puntuacion = parseInt(document.getElementById('seguridad-puntuacion')?.value) || 50;
    const seguridad_descripcion = document.getElementById('seguridad-descripcion')?.value || '';
    const seguridad_comisaria = document.getElementById('seguridad-comisaria')?.value || '';

    // Educación
    const educacion_puntuacion = parseInt(document.getElementById('educacion-puntuacion')?.value) || 50;
    const educacion_descripcion = document.getElementById('educacion-descripcion')?.value || '';
    const educacion_escuelas = document.getElementById('educacion-escuelas')?.value || '';
    const educacion_universidades = document.getElementById('educacion-universidades')?.value || '';

    // Salud
    const salud_puntuacion = parseInt(document.getElementById('salud-puntuacion')?.value) || 50;
    const salud_descripcion = document.getElementById('salud-descripcion')?.value || '';
    const salud_hospitales = document.getElementById('salud-hospitales')?.value || '';
    const salud_centros = document.getElementById('salud-centros')?.value || '';

    // Espacios Verdes
    const espacios_verdes_puntuacion = parseInt(document.getElementById('espacios_verdes-puntuacion')?.value) || 50;
    const espacios_verdes_descripcion = document.getElementById('espacios_verdes-descripcion')?.value || '';
    const espacios_verdes_parques = document.getElementById('espacios_verdes-parques')?.value || '';

    // Contaminación
    const contaminacion_puntuacion = parseInt(document.getElementById('contaminacion-puntuacion')?.value) || 50;
    const contaminacion_descripcion = document.getElementById('contaminacion-descripcion')?.value || '';
    const contaminacion_ruido = document.getElementById('contaminacion-ruido')?.value || '';
    const contaminacion_fuente = document.getElementById('contaminacion-fuente')?.value || '';

    // Vida del Barrio
    const vida_barrio_puntuacion = parseInt(document.getElementById('vida_barrio-puntuacion')?.value) || 50;
    const vida_barrio_descripcion = document.getElementById('vida_barrio-descripcion')?.value || '';
    const vida_barrio_bares = document.getElementById('vida_barrio-bares')?.value || '';
    const vida_barrio_cultura = document.getElementById('vida_barrio-cultura')?.value || '';

    // Gastronomía
    const gastronomia_puntuacion = parseInt(document.getElementById('gastronomia-puntuacion')?.value) || 50;
    const gastronomia_descripcion = document.getElementById('gastronomia-descripcion')?.value || '';
    const gastronomia_restaurantes = document.getElementById('gastronomia-restaurantes')?.value || '';
    const gastronomia_zonas = document.getElementById('gastronomia-zonas')?.value || '';

    // Servicios Financieros
    const servicios_financieros_puntuacion = parseInt(document.getElementById('servicios_financieros-puntuacion')?.value) || 50;
    const servicios_financieros_descripcion = document.getElementById('servicios_financieros-descripcion')?.value || '';
    const servicios_financieros_bancos = document.getElementById('servicios_financieros-bancos')?.value || '';
    const servicios_financieros_cajeros = document.getElementById('servicios_financieros-cajeros')?.value || '';

    // Retornar objeto con la estructura correcta
    const data = {
        nombre: nombre,
        perfil_barrio: resumen,
        conclusion: conclusion,
        puntuacion_general: puntuacion_general,
        transporte_publico: transporte_puntuacion,
        transporte_descripcion: transporte_descripcion,
        transporte_estaciones: transporte_estaciones,
        transporte_colectivos: transporte_colectivos,
        comercio_servicios: comercio_puntuacion,
        comercio_descripcion: comercio_descripcion,
        comercio_supermercados: comercio_supermercados,
        comercio_centros: comercio_centros,
        seguridad: seguridad_puntuacion,
        seguridad_descripcion: seguridad_descripcion,
        seguridad_comisaria: seguridad_comisaria,
        educacion: educacion_puntuacion,
        educacion_descripcion: educacion_descripcion,
        educacion_escuelas: educacion_escuelas,
        educacion_universidades: educacion_universidades,
        salud: salud_puntuacion,
        salud_descripcion: salud_descripcion,
        salud_hospitales: salud_hospitales,
        salud_centros: salud_centros,
        espacios_verdes: espacios_verdes_puntuacion,
        espacios_verdes_descripcion: espacios_verdes_descripcion,
        espacios_verdes_parques: espacios_verdes_parques,
        contaminacion: contaminacion_puntuacion,
        contaminacion_descripcion: contaminacion_descripcion,
        contaminacion_ruido: contaminacion_ruido,
        contaminacion_fuente: contaminacion_fuente,
        vida_barrio: vida_barrio_puntuacion,
        vida_barrio_descripcion: vida_barrio_descripcion,
        vida_barrio_bares: vida_barrio_bares,
        vida_barrio_cultura: vida_barrio_cultura,
        gastronomia: gastronomia_puntuacion,
        gastronomia_descripcion: gastronomia_descripcion,
        gastronomia_restaurantes: gastronomia_restaurantes,
        gastronomia_zonas: gastronomia_zonas,
        servicios_financieros: servicios_financieros_puntuacion,
        servicios_financieros_descripcion: servicios_financieros_descripcion,
        servicios_financieros_bancos: servicios_financieros_bancos,
        servicios_financieros_cajeros: servicios_financieros_cajeros
    };

    console.log('📋 collectFormData retornando:', data);
    return data;
}
/**
 * Cargar datos de barrio en el formulario
 */
function loadBarrioData(response) {
    console.log('📥 loadBarrioData recibe:', response);

    if (!response) {
        console.log('⚠️ loadBarrioData: response es null');
        return;
    }

    const data = response.data || response;
    const nombre = response.nombre || data?.nombre || data?.nombre;

    if (!nombre) {
        console.log('⚠️ loadBarrioData: no se encontró nombre en:', response);
        return;
    }

    AppState.currentBarrio = {
        nombre: nombre,
        existe: true
    };

    console.log('🔄 Cargando barrio:', nombre);
    console.log('📋 Datos a cargar:', data);

    // Actualizar toolbar
    const currentBarrio = document.getElementById('current-barrio-name');
    if (currentBarrio) currentBarrio.textContent = nombre;

    // Cargar resumen y conclusión
    const resumenEl = document.getElementById('edit-resumen');
    if (resumenEl) resumenEl.value = data.resumen_general || data.resumen || '';

    const conclusionEl = document.getElementById('edit-conclusion');
    if (conclusionEl) conclusionEl.value = data.conclusion || '';

    // Cargar puntuación general
    const puntuacionGeneral = document.getElementById('barrio-puntuacion');
    if (puntuacionGeneral) puntuacionGeneral.value = data.puntuacion_general || 50;

    // Cargar categorías
    const categorias = data.categorias || {};
    const categoryNames = ['transporte', 'comercio', 'seguridad', 'educacion', 'salud', 'espacios_verdes', 'contaminacion', 'vida_barrio', 'servicios_financieros'];

    categoryNames.forEach(cat => {
        const catData = categorias[cat] || {};

        const puntuacionEl = document.getElementById(`${cat}-puntuacion`);
        const descripcionEl = document.getElementById(`${cat}-descripcion`);
        const scoreEl = document.getElementById(`score-${cat}`);

        if (puntuacionEl) puntuacionEl.value = catData.puntuacion || '';
        if (descripcionEl) descripcionEl.value = catData.descripcion || '';

        if (scoreEl) {
            scoreEl.textContent = catData.puntuacion || '--';
            scoreEl.removeAttribute('data-score');
            if (catData.puntuacion >= 70) {
                scoreEl.setAttribute('data-score', 'high');
            } else if (catData.puntuacion >= 40) {
                scoreEl.setAttribute('data-score', 'medium');
            } else if (catData.puntuacion > 0) {
                scoreEl.setAttribute('data-score', 'low');
            }
        }

        // Cargar campos específicos
        const fieldMappings = {
            'transporte': ['estaciones', 'colectivos'],
            'comercio': ['supermercados', 'centros'],
            'seguridad': ['comisaria'],
            'educacion': ['escuelas', 'universidades'],
            'salud': ['hospitales', 'centros'],
            'espacios_verdes': ['parques'],
            'contaminacion': ['ruido', 'fuente'],
            'vida_barrio': ['bares', 'cultura'],
            'servicios_financieros': ['bancos', 'cajeros']
        };

        const fields = fieldMappings[cat] || [];
        fields.forEach(field => {
            const inputEl = document.getElementById(`${cat}-${field}`);
            const catKey = field === 'centros' ? 'centros_salud' :
                field === 'centros' ? 'centros_comerciales' :
                    field === 'colectivos' ? 'colectivos' : field;
            if (inputEl) {
                let value = catData[catKey];
                // APLICAR REPARACIÓN DE DATOS CORRUPTOS
                if (typeof value === 'string') {
                    value = Utils.repairCorruptedValue(value);
                } else if (Array.isArray(value)) {
                    value = value.map(v => Utils.repairCorruptedValue(v));
                }
                // SEGURIDAD: Asegurar que el valor sea un string
                if (Array.isArray(value)) {
                    inputEl.value = value.join(', ');
                } else if (typeof value === 'string') {
                    inputEl.value = value;
                } else {
                    inputEl.value = String(value || '');
                }
            }
        });
    });

    // Deshabilitar campos
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    inputs.forEach(input => input.disabled = true);

    console.log('✅ loadBarrioData completado para:', nombre);
}
