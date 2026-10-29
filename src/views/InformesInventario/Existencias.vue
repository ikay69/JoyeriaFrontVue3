<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Existencias</h1>
      <div class="d-flex ga-2">
        <input ref="archivoCsv" class="d-none" type="file" accept=".csv,text/csv" @change="manejarArchivoCsv">
        <v-btn
          v-if="esAdministrador"
          color="primary"
          variant="outlined"
          prepend-icon="mdi-download"
          @click="descargarPlantilla"
        >
          Plantilla
        </v-btn>
        <v-btn
          v-if="esAdministrador"
          color="primary"
          prepend-icon="mdi-upload"
          :loading="subiendo"
          :disabled="subiendo"
          @click="abrirSelectorCsv"
        >
          Subir
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="$router.push({ name: 'AjusteNuevo' })"
        >
          Nuevo ajuste
        </v-btn>
      </div>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar (nombre o SKU)"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.idBodega"
            :items="bodegas"
            item-title="Nombre"
            item-value="Id"
            label="Bodega"
            :loading="cargandoBodegas"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.BolsaEstado"
            :items="opcionesBolsaEstado"
            item-title="texto"
            item-value="valor"
            label="Existencia"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="2">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- El listado es paginado (50 por pagina): estos totales cubren solo las filas de la pagina. -->
    <v-card v-if="existencias.length" class="pa-4 mb-4" elevation="1">
      <div class="text-caption text-medium-emphasis mb-2">Totales de las filas de esta página</div>
      <v-row dense class="mb-1">
        <v-col v-for="total in totalesExistencia.slice(0, 3)" :key="`costo-${total.estado}`" cols="12" sm="6" md="4">
          <div class="resumen-linea">
            <span>Costo {{ total.texto }}:</span>
            <span class="font-weight-medium text-no-wrap">{{ formatearMoneda(total.costo) }}</span>
          </div>
        </v-col>
      </v-row>
      <v-row dense class="mb-1">
        <v-col v-for="total in totalesExistencia.slice(0, 3)" :key="`precio-${total.estado}`" cols="12" sm="6" md="4">
          <div class="resumen-linea">
            <span>Precio {{ total.texto }}:</span>
            <span class="font-weight-medium text-no-wrap">{{ formatearMoneda(total.precio) }}</span>
          </div>
        </v-col>
      </v-row>
      <v-row dense class="mb-1">
        <v-col v-for="total in totalesExistencia.slice(3)" :key="`costo-${total.estado}`" cols="12" sm="6" md="4">
          <div class="resumen-linea">
            <span>Costo {{ total.texto }}:</span>
            <span class="font-weight-medium text-no-wrap">{{ formatearMoneda(total.costo) }}</span>
          </div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col v-for="total in totalesExistencia.slice(3)" :key="`precio-${total.estado}`" cols="12" sm="6" md="4">
          <div class="resumen-linea">
            <span>Precio {{ total.texto }}:</span>
            <span class="font-weight-medium text-no-wrap">{{ formatearMoneda(total.precio) }}</span>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>SKU</th>
              <th style="min-width: 24ch;">Artículo</th>
              <th>Vender</th>
              <th>Estado</th>
              <th>Bodega</th>
              <th>Existencia</th>
              <th>Propietario</th>
              <th>Cantidad</th>
              <th class="columna-gramos">Gramos und</th>
              <th class="columna-monto">Costo und</th>
              <th class="columna-monto">Costo total</th>
              <th class="columna-monto">Precio</th>
              <th class="columna-monto">Precio total</th>
              <th class="columna-monto">Utilidad</th>
              <th>Propiedades</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="16" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!existencias.length">
              <td colspan="16" class="text-center py-6 text-medium-emphasis">
                No hay existencias para mostrar
              </td>
            </tr>
            <tr
              v-for="ex in existencias"
              :key="ex.existId"
              :class="{ 'fila-perdida': utilidad(ex) < 0 }"
            >
              <td>{{ ex.existSKU || '-' }}</td>
              <td>{{ ex.existArticuloNombre || '-' }}</td>
              <td>{{ textoSiNo(ex.existVender) }}</td>
              <td>{{ textoEstadoArticulo(ex.existArticuloEstado) }}</td>
              <td>{{ ex.existBodegaNombre || '-' }}</td>
              <td>{{ formatearBolsa(ex.existBolsa) }}</td>
              <td>
                {{ ex.existPropietarioNombre || 'Propio' }}
                <div v-if="ex.existPropietarioId != null" class="text-caption text-medium-emphasis">
                  ID: {{ ex.existPropietarioId }}
                </div>
              </td>
              <td>{{ ex.existCantidad }}</td>
              <td class="columna-gramos">{{ formatearGramos(ex.existCantGramos) }}</td>
              <td class="columna-monto">{{ formatearMoneda(ex.existCosto) }}</td>
              <td class="columna-monto">{{ formatearMoneda(ex.existCosto * ex.existCantidad) }}</td>
              <td class="columna-monto">{{ formatearMoneda(ex.existPrecio) }}</td>
              <td class="columna-monto">{{ formatearMoneda(ex.existPrecio * ex.existCantidad) }}</td>
              <td class="columna-monto">{{ formatearMoneda(utilidad(ex)) }}</td>
              <td>{{ ex.existPropiedades || '-' }}</td>
              <td>{{ formatearFecha(ex.existFecha) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="buscar(pagina - 1)">
          Anterior
        </v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="buscar(pagina + 1)">
          Siguiente
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import existenciaService from '@/services/existenciaService'
import bodegaService from '@/services/bodegaService'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'
import { descargarCsv } from '@/utils/descargarCsv'
import { parsearInventarioCsv, plantillaInventarioCsv, MAX_ARTICULOS_IMPORTAR } from '@/utils/inventarioCsv'

// Etiquetas cortas del resumen de arriba, las mismas de ExistenciaProducto y ExistenciaArticulo.
const RESUMEN_BOLSAS = [
  { valor: 'DISPONIBLE', texto: 'Disponible' },
  { valor: 'RESERVADO', texto: 'Reservado' },
  { valor: 'EN_GARANTIA_EMPENO', texto: 'En empeño' },
  { valor: 'PRESTADO_A_TALLER', texto: 'Prestado' },
  { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido' },
  { valor: 'EN_REPARACION', texto: 'En reparación' }
]

export default {
  name: 'Existencias',
  data() {
    return {
      cargando: false,
      subiendo: false,
      existencias: [],
      cantData: 0,
      pagina: 1,

      bodegas: [{ Id: 0, Nombre: 'Todas' }],
      cargandoBodegas: false,

      filtros: {
        textoFiltro: '',
        idBodega: 0,
        BolsaEstado: ''
      },
      opcionesBolsaEstado: [
        { valor: '', texto: 'Todas' },
        { valor: 'DISPONIBLE', texto: 'Disponible' },
        { valor: 'RESERVADO', texto: 'Reservado' },
        { valor: 'PRESTADO_A_TALLER', texto: 'Prestado a taller' },
        { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller' },
        { valor: 'EN_GARANTIA_EMPENO', texto: 'En garantía/empeño' },
        { valor: 'EN_REPARACION', texto: 'En reparación' }
      ]
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
    esAdministrador() {
      return this.authStore.rol === 'ADMINISTRADOR'
    },
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    },
    // Una linea por bolsa, en el mismo orden que ExistenciaProducto y ExistenciaArticulo.
    totalesExistencia() {
      return RESUMEN_BOLSAS.map((opcion) => {
        const existenciasEstado = this.existencias.filter((ex) =>
          String(ex.existBolsa || '').trim().toUpperCase() === opcion.valor
        )

        return {
          estado: opcion.valor,
          texto: opcion.texto,
          costo: existenciasEstado.reduce((total, ex) =>
            total + this.numeroSeguro(ex.existCosto) * this.numeroSeguro(ex.existCantidad), 0
          ),
          precio: existenciasEstado.reduce((total, ex) =>
            total + this.numeroSeguro(ex.existPrecio) * this.numeroSeguro(ex.existCantidad), 0
          )
        }
      })
    }
  },
  created() {
    this.cargarBodegas()
    this.consultar()
  },
  methods: {
    async cargarBodegas() {
      this.cargandoBodegas = true
      try {
        const { data } = await bodegaService.getActivas({ idEmpresa: this.idEmpresa })
        this.bodegas = [{ Id: 0, Nombre: 'Todas' }, ...(data.data || [])]
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoBodegas = false
      }
    },

    consultar() {
      this.buscar(1)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await existenciaService.getExistencias({
          idEmpresa: this.idEmpresa,
          pagina,
          textoFiltro: this.filtros.textoFiltro || '',
          BolsaEstado: this.filtros.BolsaEstado || '',
          idBodega: this.filtros.idBodega
        })
        this.existencias = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudo consultar las existencias'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    // La importacion crea bodegas/productos por nombre: el combo local y la cache compartida quedan viejos
    refrescarCatalogos() {
      useCatalogosStore().invalidar(this.idEmpresa)
      this.cargarBodegas()
    },

    descargarPlantilla() {
      descargarCsv('plantilla_inventario.csv', plantillaInventarioCsv())
    },

    abrirSelectorCsv() {
      this.$refs.archivoCsv?.click()
    },

    async manejarArchivoCsv(event) {
      const archivo = event.target.files?.[0]
      event.target.value = ''
      if (!archivo) return

      if (!archivo.name.toLowerCase().endsWith('.csv')) {
        Swal.fire('Archivo no válido', 'Seleccione un archivo CSV', 'warning')
        return
      }

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const articulos = parsearInventarioCsv(await archivo.text())
      if (!articulos.length) {
        Swal.fire('Archivo vacío', 'El archivo no tiene artículos para importar', 'warning')
        return
      }
      if (articulos.length > MAX_ARTICULOS_IMPORTAR) {
        Swal.fire('Archivo muy grande', `El archivo tiene ${articulos.length} filas; el máximo es ${MAX_ARTICULOS_IMPORTAR}. Divídalo en varios archivos`, 'warning')
        return
      }

      // Cada fila crea un artículo nuevo: reenviar un archivo ya importado lo duplica
      const confirmacion = await Swal.fire({
        title: 'Importar inventario',
        text: `Se crearán ${articulos.length} artículos con su existencia. ¿Desea continuar?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Importar',
        cancelButtonText: 'Cancelar'
      })
      if (!confirmacion.isConfirmed) return

      this.subiendo = true
      try {
        const { data } = await existenciaService.importarInventario({ idEmpresa: this.idEmpresa, articulos })
        const detalle = [
          `Artículos creados: ${data.articulosCreados}`,
          `Bodegas creadas: ${data.bodegasCreadas}`,
          `Categorías creadas: ${data.categoriasCreadas}`,
          `Tipos de producto creados: ${data.tiposProductoCreados}`,
          `Productos creados: ${data.productosCreados}`,
          `Roles asignados: ${data.rolesAsignados}`
        ].join('<br>')
        Swal.fire({ title: data.msg || 'Importación finalizada', html: detalle, icon: 'success' })
        this.refrescarCatalogos()
        this.consultar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo importar el archivo'
        // Las etapas se guardan una a una: un fallo al escribir puede dejar catálogos ya creados
        Swal.fire('Error', `${mensaje}. Corrija el archivo y vuelva a subirlo`, 'error')
        this.refrescarCatalogos()
      } finally {
        this.subiendo = false
      }
    },

    formatearBolsa(valor) {
      const encontrada = this.opcionesBolsaEstado.find((o) => o.valor === valor)
      return encontrada ? encontrada.texto : (valor || '-')
    },

    textoSiNo(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const normalizado = String(valor).trim().toUpperCase()
      if (['1', 'TRUE', 'S', 'SI', 'SÍ'].includes(normalizado)) return 'Sí'
      if (['0', 'FALSE', 'N', 'NO'].includes(normalizado)) return 'No'
      return String(valor)
    },

    textoEstadoArticulo(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const normalizado = String(valor).trim().toUpperCase()
      if (['1', 'TRUE', 'ACTIVO'].includes(normalizado)) return 'Activo'
      if (['0', 'FALSE', 'INACTIVO'].includes(normalizado)) return 'Inactivo'
      return String(valor)
    },

    // existCantGramos son los gramos de UNA unidad del articulo; null si no tiene registrados.
    formatearGramos(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '-'
      return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })} g`
    },

    // Precio total menos costo total de la bolsa. Una fila con utilidad negativa se pinta de rojo.
    utilidad(ex) {
      return (ex.existPrecio * ex.existCantidad) - (ex.existCosto * ex.existCantidad)
    },

    numeroSeguro(valor) {
      const numero = Number(valor)
      return Number.isFinite(numero) ? numero : 0
    },

    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (Number.isNaN(numero)) return String(valor)
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearFecha(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.resumen-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tabla-listado :deep(.columna-gramos) {
  white-space: nowrap;
  text-align: right;
}

.tabla-listado :deep(.columna-monto) {
  min-width: 160px;
  white-space: nowrap;
  text-align: right;
}

/* El encabezado toma el mismo primary del tema definido en src/plugins/vuetify.js */
.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th:first-child) {
  border-top-left-radius: 4px;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th:last-child) {
  border-top-right-radius: 4px;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-perdida > td) {
  background-color: #ffebee;
  border-top: 1px solid #ef9a9a;
  border-bottom: 1px solid #ef9a9a;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-perdida > td:first-child) {
  border-left: 4px solid #d32f2f;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-perdida:hover > td) {
  background-color: #ffebee;
}
</style>
