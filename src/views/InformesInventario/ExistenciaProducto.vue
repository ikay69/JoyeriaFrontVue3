<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Existencia producto</h1>

    <v-card class="pa-4 mb-4" elevation="1">
      <div class="mb-1 text-subtitle-2">Producto</div>
      <div class="d-flex ga-2 mb-4">
        <v-btn icon="mdi-arrow-right" variant="tonal" title="Seleccionar producto" @click="abrirDialogProducto" />
        <v-text-field
          :model-value="productoSeleccionado ? productoSeleccionado.proNombre : ''"
          readonly
          placeholder="Seleccione un producto"
          variant="outlined"
          density="comfortable"
          hide-details
          class="flex-grow-1"
        />
      </div>

      <v-row dense>
        <v-col cols="12" sm="4">
          <v-text-field
            label="Tipo de producto"
            :model-value="productoSeleccionado ? productoSeleccionado.TipoProductoNombre : ''"
            readonly
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            label="Categoría"
            :model-value="productoSeleccionado ? productoSeleccionado.CategoriaNombre : ''"
            readonly
            variant="outlined"
            density="comfortable"
          />
        </v-col>
      </v-row>
    </v-card>

    <v-card v-if="productoSeleccionado" class="pa-4 mb-4" elevation="1">
      <div v-if="cargando" class="d-flex justify-center py-2">
        <v-progress-circular indeterminate color="primary" size="24" />
      </div>
      <div v-else>
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
      </div>
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
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="15" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!productoSeleccionado">
              <td colspan="15" class="text-center py-6 text-medium-emphasis">
                Seleccione un producto para ver sus existencias
              </td>
            </tr>
            <tr v-else-if="!existencias.length">
              <td colspan="15" class="text-center py-6 text-medium-emphasis">
                Este producto no tiene existencias
              </td>
            </tr>
            <tr
              v-for="(ex, i) in existencias"
              :key="i"
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
              <td class="columna-monto">{{ formatearMoneda(ex.existPrecio *  ex.existCantidad) }}</td>
              <td class="columna-monto">{{ formatearMoneda(utilidad(ex)) }}</td>
              <td>{{ ex.existPropiedades || '-' }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>

    <ProductosSeleccionar
      v-model="dialogProducto"
      :id-empresa="idEmpresa"
      @seleccionar="seleccionarProducto"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import existenciaService from '@/services/existenciaService'
import ProductosSeleccionar from '@/views/Inventario/Productos/ProductosSeleccionar.vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ExistenciaProducto',

  components: { ProductosSeleccionar },

  data() {
    return {
      productoSeleccionado: null,
      dialogProducto: false,
      existencias: [],
      cargando: false,
      opcionesBolsaEstado: [
        { valor: 'DISPONIBLE', texto: 'Disponible', textoResumen: 'Disponible' },
        { valor: 'RESERVADO', texto: 'Reservado', textoResumen: 'Reservado' },
        { valor: 'EN_GARANTIA_EMPENO', texto: 'En garantía/empeño', textoResumen: 'En empeño' },
        { valor: 'PRESTADO_A_TALLER', texto: 'Prestado a taller', textoResumen: 'Prestado' },
        { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller', textoResumen: 'Recibido' },
        { valor: 'EN_REPARACION', texto: 'En reparación', textoResumen: 'En reparación' }
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
    totalesExistencia() {
      return this.opcionesBolsaEstado.map((opcion) => {
        const existenciasEstado = this.existencias.filter((ex) =>
          String(ex.existBolsa || '').trim().toUpperCase() === opcion.valor
        )

        return {
          estado: opcion.valor,
          texto: opcion.textoResumen || opcion.texto,
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

  methods: {
    abrirDialogProducto() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      this.dialogProducto = true
    },

    seleccionarProducto(producto) {
      this.productoSeleccionado = producto
      this.existencias = []
      this.consultar()
    },

    async consultar() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      if (!this.productoSeleccionado) return

      this.cargando = true
      try {
        const { data } = await existenciaService.getExistenciasProducto({
          idEmpresa: this.idEmpresa,
          idProducto: this.productoSeleccionado.proId
        })
        this.existencias = data.data || []
      } catch (error) {
        // idProducto mal formado llega con la forma de express-validator: errors[0].msg
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudieron consultar las existencias del producto'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    formatearBolsa(valor) {
      const encontrada = this.opcionesBolsaEstado.find((opcion) => opcion.valor === valor)
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

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
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
