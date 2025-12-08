/**
 * SCRIPT PARA ACTUALIZAR PROPIEDADES CON SISTEMA 360°
 * Este script:
 * 1. Marca las propiedades que tienen imágenes 360 reales
 * 2. Crea una versión limpia del JSON sin imágenes 360 faltantes
 * 3. Agrega metadatos para identificar el estado de cada propiedad
 */

class ActualizadorPropiedades360 {
    constructor() {
        this.propiedadesData = null;
        this.propiedadesActualizadas = [];
        this.imagenesReales360 = [
            // Aquí puedes agregar las rutas de imágenes 360 reales cuando las tengas
            // Ejemplo: "imgs/360/UF000-1.jpg"
        ];
    }

    /**
     * Carga y procesa las propiedades existentes
     */
    async cargarPropiedades() {
        try {
            // Simular carga de propiedades (esto debería venir del archivo JSON real)
            const response = await fetch('propiedades.json');
            this.propiedadesData = await response.json();
            console.log(`📋 Cargadas ${this.propiedadesData.length} propiedades`);
            return true;
        } catch (error) {
            console.error('❌ Error cargando propiedades:', error);
            return false;
        }
    }

    /**
     * Analiza cada propiedad y determina su estado de imágenes 360
     */
    async analizarPropiedades() {
        if (!this.propiedadesData) {
            console.error('❌ No hay datos de propiedades cargados');
            return;
        }

        console.log('🔍 Analizando propiedades para imágenes 360...');

        for (const propiedad of this.propiedadesData) {
            const analisis = await this.analizarPropiedad(propiedad);
            this.propiedadesActualizadas.push(analisis);
        }

        console.log('✅ Análisis completado');
    }

    /**
     * Analiza una propiedad específica
     */
    async analizarPropiedad(propiedad) {
        const tieneImagenes360 = propiedad.imagenes_360 && propiedad.imagenes_360.length > 0;
        let estadoImagenes360 = 'no_disponible';
        let imagenes360Validas = [];
        let imagenes360Faltantes = [];

        if (tieneImagenes360) {
            for (const imagenPath of propiedad.imagenes_360) {
                const esValida = await this.verificarImagen(imagenPath);
                if (esValida) {
                    imagenes360Validas.push(imagenPath);
                } else {
                    imagenes360Faltantes.push(imagenPath);
                }
            }

            if (imagenes360Validas.length > 0) {
                estadoImagenes360 = 'disponible';
            } else {
                estadoImagenes360 = 'faltante';
            }
        }

        // Crear propiedad actualizada
        const propiedadActualizada = {
            ...propiedad,
            metadatos_360: {
                estado: estadoImagenes360,
                total_configuradas: propiedad.imagenes_360 ? propiedad.imagenes_360.length : 0,
                validas: imagenes360Validas.length,
                faltantes: imagenes360Faltantes.length,
                rutas_validas: imagenes360Validas,
                rutas_faltantes: imagenes360Faltantes,
                fecha_analisis: new Date().toISOString()
            }
        };

        // Si no hay imágenes 360 válidas, limpiar el array
        if (imagenes360Validas.length === 0) {
            propiedadActualizada.imagenes_360 = [];
        }

        return propiedadActualizada;
    }

    /**
     * Verifica si una imagen existe
     */
    async verificarImagen(rutaImagen) {
        try {
            const response = await fetch(rutaImagen, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Genera un reporte de estado
     */
    generarReporte() {
        const reporte = {
            fecha_analisis: new Date().toISOString(),
            total_propiedades: this.propiedadesActualizadas.length,
            resumen: {
                con_360_disponible: 0,
                con_360_faltante: 0,
                sin_360_configurado: 0
            },
            detalles_por_propiedad: []
        };

        for (const propiedad of this.propiedadesActualizadas) {
            const estado = propiedad.metadatos_360.estado;
            reporte.resumen[`con_360_${estado}`]++;

            reporte.detalles_por_propiedad.push({
                id: propiedad.id_temporal,
                titulo: propiedad.titulo,
                estado_360: estado,
                imagenes_configuradas: propiedad.metadatos_360.total_configuradas,
                imagenes_validas: propiedad.metadatos_360.validas,
                imagenes_faltantes: propiedad.metadatos_360.faltantes
            });
        }

        return reporte;
    }

    /**
     * Guarda las propiedades actualizadas
     */
    async guardarPropiedadesActualizadas() {
        const propiedadesLimpias = this.propiedadesActualizadas.map(prop => {
            // Remover metadatos_360 del JSON final (solo para reporte interno)
            const { metadatos_360, ...propiedadLimpia } = prop;
            return propiedadLimpia;
        });

        console.log('💾 Propiedades actualizadas listas para guardar');
        return propiedadesLimpias;
    }

    /**
     * Ejecuta el proceso completo
     */
    async ejecutarProcesoCompleto() {
        console.log('🚀 Iniciando proceso de actualización de propiedades 360°...');

        // Paso 1: Cargar propiedades
        const cargado = await this.cargarPropiedades();
        if (!cargado) {
            console.error('❌ No se pudieron cargar las propiedades');
            return false;
        }

        // Paso 2: Analizar propiedades
        await this.analizarPropiedades();

        // Paso 3: Generar reporte
        const reporte = this.generarReporte();
        console.log('📊 Reporte de análisis:', reporte);

        // Paso 4: Mostrar resumen
        this.mostrarResumen(reporte);

        // Paso 5: Crear propiedades actualizadas
        const propiedadesLimpias = await this.guardarPropiedadesActualizadas();

        return {
            reporte,
            propiedadesActualizadas: propiedadesLimpias,
            exito: true
        };
    }

    /**
     * Muestra un resumen del análisis
     */
    mostrarResumen(reporte) {
        console.log('\n📊 === RESUMEN DE ANÁLISIS 360° ===');
        console.log(`📅 Fecha: ${reporte.fecha_analisis}`);
        console.log(`🏠 Total propiedades: ${reporte.total_propiedades}`);
        console.log(`✅ Con 360° disponible: ${reporte.resumen.con_360_disponible}`);
        console.log(`⚠️ Con 360° faltante: ${reporte.resumen.con_360_faltante}`);
        console.log(`❌ Sin 360° configurado: ${reporte.resumen.sin_360_configurado}`);

        console.log('\n📋 DETALLE POR PROPIEDAD:');
        reporte.detalles_por_propiedad.forEach(prop => {
            const icono = prop.estado_360 === 'disponible' ? '✅' : 
                         prop.estado_360 === 'faltante' ? '⚠️' : '❌';
            console.log(`${icono} ${prop.id}: ${prop.titulo}`);
            console.log(`   📸 Imágenes 360°: ${prop.imagenes_validas}/${prop.imagenes_configuradas} válidas`);
        });
    }
}

// Función para ejecutar desde consola del navegador
async function analizarPropiedades360() {
    const actualizador = new ActualizadorPropiedades360();
    const resultado = await actualizador.ejecutarProcesoCompleto();
    
    if (resultado && resultado.exito) {
        console.log('✅ Proceso completado exitosamente');
        console.log('💡 Para aplicar los cambios, copia las propiedades actualizadas');
        
        // Mostrar código para actualizar JSON
        console.log('\n📝 PROPIEDADES ACTUALIZADAS (copiar al JSON):');
        console.log(JSON.stringify(resultado.propiedadesActualizadas, null, 2));
        
        return resultado;
    } else {
        console.error('❌ Error en el proceso de actualización');
        return null;
    }
}

// Función para crear versión simplificada sin imágenes 360 faltantes
function crearVersionSimplificada() {
    console.log('🔧 Creando versión simplificada sin imágenes 360 faltantes...');
    
    // Esta función se puede llamar desde la consola para obtener una versión limpia
    const propiedadesSimplificadas = [];
    
    // Simulando el análisis (en producción vendría del archivo real)
    const estadosSimulados = {
        'UF000': 'disponible', // Casa en Parque Avellaneda
        'UF001': 'faltante',   // Terreno en Boedo
        'UF002': 'faltante',   // Monoambiente microcentro
        'UF003': 'faltante',   // Oficina en Microcentro
        'UF004': 'faltante'    // Barrio Privado Pilar
    };
    
    console.log('📋 Propiedades que mantendrán imágenes 360°:');
    Object.entries(estadosSimulados).forEach(([id, estado]) => {
        const mantiene360 = estado === 'disponible';
        const icono = mantiene360 ? '✅' : '❌';
        console.log(`${icono} ${id}: ${mantiene360 ? 'Mantiene 360°' : 'Remueve 360° (usará fallback)'}`);
    });
    
    return estadosSimulados;
}

// Exportar funciones globales
window.analizarPropiedades360 = analizarPropiedades360;
window.crearVersionSimplificada = crearVersionSimplificada;
window.ActualizadorPropiedades360 = ActualizadorPropiedades360;

console.log('📋 Script de actualización de propiedades 360° cargado');
console.log('💡 Funciones disponibles:');
console.log('   - analizarPropiedades360() - Analiza y actualiza todas las propiedades');
console.log('   - crearVersionSimplificada() - Muestra qué propiedades mantendrán 360°');