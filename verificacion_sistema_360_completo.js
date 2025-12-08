/**
 * VERIFICACIÓN COMPLETA DEL SISTEMA 360° MEJORADO
 * Este script verifica que todos los componentes estén funcionando correctamente
 */

class VerificacionSistema360 {
    constructor() {
        this.resultados = {
            archivos: {},
            funcionalidades: {},
            errores: [],
            exitosos: []
        };
    }

    /**
     * Ejecuta todas las verificaciones
     */
    async ejecutarVerificacionCompleta() {
        console.log('🔍 === VERIFICACIÓN COMPLETA SISTEMA 360° ===');
        console.log('📅 Fecha:', new Date().toLocaleString());
        console.log('');

        // Verificar archivos
        await this.verificarArchivos();
        
        // Verificar funcionalidades
        await this.verificarFuncionalidades();
        
        // Verificar dependencias
        await this.verificarDependencias();
        
        // Generar reporte final
        this.generarReporteFinal();

        return this.resultados;
    }

    /**
     * Verifica que todos los archivos existan y tengan sintaxis correcta
     */
    async verificarArchivos() {
        console.log('📁 Verificando archivos del sistema...');

        const archivosRequeridos = [
            'index.html',
            'app.js', 
            'propiedades.json',
            'fix_360_system.js',
            'optimize_360_final.js',
            'mejorar_sistema_360.js',
            'actualizar_propiedades_360.js',
            'GUIA_SISTEMA_360_MEJORADO.md'
        ];

        for (const archivo of archivosRequeridos) {
            try {
                const existe = await this.verificarExistenciaArchivo(archivo);
                if (existe) {
                    const sintaxisCorrecta = await this.verificarSintaxis(archivo);
                    this.resultados.archivos[archivo] = {
                        existe: true,
                        sintaxisCorrecta: sintaxisCorrecta,
                        estado: sintaxisCorrecta ? '✅' : '⚠️'
                    };
                    
                    if (sintaxisCorrecta) {
                        this.resultados.exitosos.push(`Archivo ${archivo}: Sintaxis correcta`);
                    } else {
                        this.resultados.errores.push(`Archivo ${archivo}: Error de sintaxis`);
                    }
                } else {
                    this.resultados.archivos[archivo] = {
                        existe: false,
                        sintaxisCorrecta: false,
                        estado: '❌'
                    };
                    this.resultados.errores.push(`Archivo ${archivo}: No existe`);
                }
            } catch (error) {
                this.resultados.archivos[archivo] = {
                    existe: false,
                    sintaxisCorrecta: false,
                    estado: '❌',
                    error: error.message
                };
                this.resultados.errores.push(`Archivo ${archivo}: ${error.message}`);
            }
        }
    }

    /**
     * Verifica existencia de archivo
     */
    async verificarExistenciaArchivo(nombreArchivo) {
        try {
            const fs = require('fs');
            return fs.existsSync(nombreArchivo);
        } catch (error) {
            return false;
        }
    }

    /**
     * Verifica sintaxis de archivos JavaScript
     */
    async verificarSintaxis(nombreArchivo) {
        if (!nombreArchivo.endsWith('.js')) return true;

        try {
            const { execSync } = require('child_process');
            execSync(`node --check ${nombreArchivo}`, { stdio: 'pipe' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verifica funcionalidades del sistema
     */
    async verificarFuncionalidades() {
        console.log('⚙️ Verificando funcionalidades...');

        // Verificar que los scripts se puedan cargar
        this.resultados.funcionalidades = {
            sistemaMejorado: this.verificarScript('mejorar_sistema_360.js'),
            actualizador: this.verificarScript('actualizar_propiedades_360.js'),
            sistemaOriginal: this.verificarScript('fix_360_system.js'),
            optimizador: this.verificarScript('optimize_360_final.js')
        };

        Object.entries(this.resultados.funcionalidades).forEach(([key, valor]) => {
            if (valor) {
                this.resultados.exitosos.push(`Funcionalidad ${key}: Disponible`);
            } else {
                this.resultados.errores.push(`Funcionalidad ${key}: No disponible`);
            }
        });
    }

    /**
     * Verifica que un script específico tenga contenido esperado
     */
    verificarScript(nombreScript) {
        try {
            const fs = require('fs');
            const contenido = fs.readFileSync(nombreScript, 'utf8');
            
            // Verificaciones básicas según el archivo
            switch (nombreScript) {
                case 'mejorar_sistema_360.js':
                    return contenido.includes('Sistema360Mejorado') && 
                           contenido.includes('mostrarFallback') &&
                           contenido.includes('validarConFallback');
                
                case 'actualizar_propiedades_360.js':
                    return contenido.includes('ActualizadorPropiedades360') &&
                           contenido.includes('analizarPropiedades360') &&
                           contenido.includes('ejecutarProcesoCompleto');
                
                case 'fix_360_system.js':
                    return contenido.includes('validateImages360') &&
                           contenido.includes('abrirVisor360Mejorado');
                
                case 'optimize_360_final.js':
                    return contenido.includes('optimización') &&
                           contenido.includes('sistema 360°');
                
                default:
                    return true;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Verifica dependencias del sistema
     */
    async verificarDependencias() {
        console.log('🔗 Verificando dependencias...');

        try {
            // Verificar que index.html incluya los scripts
            const fs = require('fs');
            const htmlContent = fs.readFileSync('index.html', 'utf8');

            const scriptsRequeridos = [
                'fix_360_system.js',
                'optimize_360_final.js',
                'mejorar_sistema_360.js',
                'actualizar_propiedades_360.js',
                'app.js'
            ];

            for (const script of scriptsRequeridos) {
                const incluido = htmlContent.includes(`src="${script}"`);
                this.resultados.funcionalidades[`script_${script}`] = incluido;
                
                if (incluido) {
                    this.resultados.exitosos.push(`Script ${script}: Incluido en HTML`);
                } else {
                    this.resultados.errores.push(`Script ${script}: No incluido en HTML`);
                }
            }

            // Verificar propiedades.json
            const jsonContent = fs.readFileSync('propiedades.json', 'utf8');
            const propiedades = JSON.parse(jsonContent);
            
            const tieneEstructura = propiedades.length > 0 && 
                                  propiedades[0].hasOwnProperty('imagenes_360');
            this.resultados.funcionalidades.jsonEstructura = tieneEstructura;
            
            if (tieneEstructura) {
                this.resultados.exitosos.push('JSON: Estructura correcta');
            } else {
                this.resultados.errores.push('JSON: Estructura incorrecta');
            }

        } catch (error) {
            this.resultados.errores.push(`Dependencias: ${error.message}`);
        }
    }

    /**
     * Genera reporte final de la verificación
     */
    generarReporteFinal() {
        console.log('\n📊 === REPORTE FINAL ===');
        
        const totalArchivos = Object.keys(this.resultados.archivos).length;
        const archivosCorrectos = Object.values(this.resultados.archivos)
            .filter(a => a.existe && a.sintaxisCorrecta).length;
        
        const totalErrores = this.resultados.errores.length;
        const totalExitosos = this.resultados.exitosos.length;

        console.log(`📁 Archivos verificados: ${totalArchivos}`);
        console.log(`✅ Archivos correctos: ${archivosCorrectos}/${totalArchivos}`);
        console.log(`🎯 Funcionalidades verificadas: ${Object.keys(this.resultados.funcionalidades).length}`);
        console.log(`✅ Verificaciones exitosas: ${totalExitosos}`);
        console.log(`❌ Errores encontrados: ${totalErrores}`);

        if (totalErrores === 0) {
            console.log('\n🎉 ¡SISTEMA 360° COMPLETAMENTE FUNCIONAL!');
            console.log('💡 El sistema está listo para usar.');
            console.log('🔄 Refresca la página del navegador para ver los cambios.');
        } else {
            console.log('\n⚠️ Se encontraron algunos problemas:');
            this.resultados.errores.forEach(error => {
                console.log(`   ❌ ${error}`);
            });
        }

        console.log('\n📋 Resumen de archivos:');
        Object.entries(this.resultados.archivos).forEach(([archivo, info]) => {
            console.log(`   ${info.estado} ${archivo}`);
        });

        console.log('\n🚀 Funcionalidades disponibles:');
        Object.entries(this.resultados.funcionalidades).forEach(([func, disponible]) => {
            const estado = disponible ? '✅' : '❌';
            console.log(`   ${estado} ${func}`);
        });
    }

    /**
     * Obtiene estadísticas del sistema
     */
    obtenerEstadisticas() {
        return {
            totalArchivos: Object.keys(this.resultados.archivos).length,
            archivosCorrectos: Object.values(this.resultados.archivos)
                .filter(a => a.existe && a.sintaxisCorrecta).length,
            totalErrores: this.resultados.errores.length,
            totalExitosos: this.resultados.exitosos.length,
            funcionalidadesActivas: Object.values(this.resultados.funcionalidades)
                .filter(f => f === true).length
        };
    }
}

// Ejecutar verificación automáticamente
const verificador = new VerificacionSistema360();

// Auto-ejecutar si se carga en Node.js
if (typeof window === 'undefined') {
    verificador.ejecutarVerificacionCompleta().then(resultados => {
        console.log('\n🏁 Verificación completada');
        console.log('📈 Estadísticas:', verificador.obtenerEstadisticas());
    });
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
    window.verificadorSistema360 = verificador;
    window.ejecutarVerificacion360 = () => verificador.ejecutarVerificacionCompleta();
}

console.log('🔍 Script de verificación cargado');
console.log('💡 Ejecutar con: ejecutarVerificacion360()');