<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div><h1 class="text-h5">Nueva venta</h1></div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form @submit.prevent="confirmar">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select
              v-model="tipoVenta"
              :items="tiposVenta"
              item-title="texto"
              item-value="valor"
              label="Tipo de venta"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model.number="idVendedor"
              :items="vendedores"
              item-title="vdrNombre"
              item-value="vdrId"
              label="Vendedor"
              :loading="cargandoVendedores"
              clearable
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <div class="mt-4 mb-1 text-subtitle-2">Cliente</div>
        <div class="d-flex align-center ga-2">
          <v-btn
            icon="mdi-plus"
            variant="tonal"
            title="Crear cliente"
            @click="mostrarAltaCliente"
          />
          <v-btn
            icon="mdi-magnify"
            variant="tonal"
            title="Buscar cliente"
            @click="abrirSelectorTercero"
          />
          <v-text-field
            :model-value="clienteTexto"
            readonly
            placeholder="Seleccione un cliente"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-divider class="my-4" />

        <v-row dense align="center">
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              label="Subtotal"
              :model-value="formatearMoneda(subtotal)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-number-input
              v-model.number="descuento"
              control-variant="hidden"
              label="Descuento"
              prefix="$"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-number-input
              v-model.number="efectivo"
              control-variant="hidden"
              label="Pago en efectivo"
              prefix="$"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-number-input
              v-model.number="transaccion"
              control-variant="hidden"
              label="Pago por transacción"
              prefix="$"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              label="Saldo"
              :model-value="formatearMoneda(saldo)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos</span>
          <span class="text-caption text-medium-emphasis">{{ lineas.length }} / 200</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 110px">Cantidad</th>
                <th style="min-width: 140px">Precio Und</th>
                <th class="text-end" style="min-width: 140px">Precio total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos una línea
                </td>
              </tr>
              <tr v-for="(fila, indice) in lineas" :key="fila.clave">
                <td>
                  <v-select
                    v-model.number="fila.idBodega"
                    :items="bodegas"
                    item-title="Nombre"
                    item-value="Id"
                    placeholder="Bodega"
                    :loading="cargandoBodegas"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @update:model-value="limpiarArticulo(fila)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Seleccionar artículo"
                    @click="abrirSelectorArticulo(indice)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta línea"
                    @click="quitarLinea(indice)"
                  />
                </td>
                <td>
                  <span v-if="fila.artNombre">{{ fila.artNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <div v-if="fila.artPropiedades" class="text-caption text-medium-emphasis">
                    {{ fila.artPropiedades }}
                  </div>
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.Cantidad"
                    control-variant="hidden"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.PrecioVentaUnidad"
                    control-variant="hidden"
                    prefix="$"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-end">{{ formatearMoneda(totalLinea(fila)) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="lineas.length >= 200"
          class="mb-4"
          @click="agregarLinea"
        >
          Agregar línea
        </v-btn>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="guardando"
            :disabled="guardando"
            type="submit"
          >
            Guardar
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />

    <ArticulosVender
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      :id-bodega="bodegaArticuloActiva"
      @seleccionar="onArticuloSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'
import ventasService from '@/services/ventasService'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'
import ArticulosVender from '@/views/Inventario/Articulos/ArticulosVender.vue'

const MAX_LINEAS = 200
const MAX_DECIMAL_12_2 = 9999999999.99

export default {
  name: 'VentasForm',

  components: { TercerosSeleccionar, ArticulosVender },

  data() {
    return {
      dialogTercero: false,
      dialogArticulo: false,
      filaActiva: null,
      siguienteClaveLinea: 1,

      tipoVenta: 'CONTADO',
      idVendedor: null,
      terceroSeleccionado: null,
      descuento: 0,
      efectivo: 0,
      transaccion: 0,

      tiposVenta: [
        { valor: 'CONTADO', texto: 'Contado' },
        { valor: 'CREDITO', texto: 'Crédito' },
        { valor: 'POR_ABONO', texto: 'Por abono' }
      ],
      bodegas: [],
      vendedores: [],
      lineas: [],
      cargandoBodegas: false,
      cargandoVendedores: false,
      guardando: false
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    catalogosStore() {
      return useCatalogosStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
    clienteTexto() {
      if (!this.terceroSeleccionado) return ''
      return [
        this.terceroSeleccionado.identificacion,
        this.terceroSeleccionado.Nombre
      ].filter(Boolean).join(' ')
    },
    subtotal() {
      const total = this.lineas.reduce(
        (acumulado, fila) =>
          acumulado +
          (Number(fila.Cantidad) || 0) * (Number(fila.PrecioVentaUnidad) || 0),
        0
      )
      return this.redondear(total)
    },
    saldo() {
      return this.redondear(
        this.subtotal -
          (Number(this.descuento) || 0) -
          (Number(this.efectivo) || 0) -
          (Number(this.transaccion) || 0)
      )
    },
    bodegaArticuloActiva() {
      if (this.filaActiva === null) return null
      return this.lineas[this.filaActiva]?.idBodega ?? null
    }
  },

  watch: {
    idEmpresa() {
      this.reiniciarFormulario()
      this.cargarCatalogos()
    }
  },

  created() {
    this.agregarLinea()
    this.cargarCatalogos()
  },

  methods: {
    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return '$ ' + numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    totalLinea(fila) {
      return this.redondear(
        (Number(fila.Cantidad) || 0) * (Number(fila.PrecioVentaUnidad) || 0)
      )
    },

    async cargarCatalogos() {
      if (!this.idEmpresa) {
        this.bodegas = []
        this.vendedores = []
        return
      }
      await Promise.all([this.cargarBodegas(), this.cargarVendedores()])
    },

    async cargarBodegas() {
      this.cargandoBodegas = true
      try {
        this.bodegas = await this.catalogosStore.getBodegas(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoBodegas = false
      }
    },

    async cargarVendedores() {
      this.cargandoVendedores = true
      try {
        this.vendedores = await this.catalogosStore.getVendedores(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de vendedores'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoVendedores = false
      }
    },

    reiniciarFormulario() {
      this.tipoVenta = 'CONTADO'
      this.idVendedor = null
      this.terceroSeleccionado = null
      this.descuento = 0
      this.efectivo = 0
      this.transaccion = 0
      this.lineas = []
      this.siguienteClaveLinea = 1
      this.filaActiva = null
      this.dialogTercero = false
      this.dialogArticulo = false
      this.agregarLinea()
    },

    abrirSelectorTercero() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      this.dialogTercero = true
    },

    mostrarAltaCliente() {
      Swal.fire('Atención', 'La creación de clientes aún está en desarrollo', 'info')
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
    },

    agregarLinea() {
      if (this.lineas.length >= MAX_LINEAS) return
      this.lineas.push({
        clave: this.siguienteClaveLinea++,
        idBodega: null,
        idArticulo: null,
        artNombre: '',
        artPropiedades: '',
        Cantidad: 1,
        PrecioVentaUnidad: 0
      })
    },

    limpiarArticulo(fila) {
      fila.idArticulo = null
      fila.artNombre = ''
      fila.artPropiedades = ''
      fila.PrecioVentaUnidad = 0
    },

    abrirSelectorArticulo(indice) {
      const fila = this.lineas[indice]
      if (!fila?.idBodega) {
        Swal.fire('Atención', 'Seleccione una bodega para la línea', 'warning')
        return
      }
      this.filaActiva = indice
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(articulo) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      if (!fila) {
        this.filaActiva = null
        return
      }
      fila.idArticulo = Number(articulo.artId)
      fila.artNombre = articulo.artNombre
      fila.artPropiedades = articulo.artPropiedades || ''
      fila.PrecioVentaUnidad = Number(articulo.artPrecio)
      this.filaActiva = null
    },

    quitarLinea(indice) {
      this.lineas.splice(indice, 1)
      this.filaActiva = null
    },

    esDecimal12_2(valor) {
      const numero = Number(valor)
      return Number.isFinite(numero) &&
        numero >= 0 &&
        numero <= MAX_DECIMAL_12_2 &&
        Number(numero.toFixed(2)) === numero
    },

    validarLineas() {
      if (this.lineas.length < 1) return 'Debe agregar al menos un artículo'
      if (this.lineas.length > MAX_LINEAS) return 'La venta no puede tener más de 200 artículos'

      for (let indice = 0; indice < this.lineas.length; indice++) {
        const fila = this.lineas[indice]
        const numero = indice + 1
        if (!Number.isInteger(Number(fila.idBodega)) || Number(fila.idBodega) <= 0) {
          return 'Seleccione la bodega de la línea ' + numero
        }
        if (!Number.isInteger(Number(fila.idArticulo)) || Number(fila.idArticulo) <= 0) {
          return 'Seleccione el artículo de la línea ' + numero
        }
        if (!(Number(fila.Cantidad) > 0) || !this.esDecimal12_2(fila.Cantidad)) {
          return 'La cantidad de la línea ' + numero +
            ' debe ser mayor a cero y tener máximo dos decimales'
        }
        if (!(Number(fila.PrecioVentaUnidad) > 0) || !this.esDecimal12_2(fila.PrecioVentaUnidad)) {
          return 'El precio de la línea ' + numero +
            ' debe ser mayor a cero y tener máximo dos decimales'
        }
      }
      return null
    },

    validarCabecera() {
      if (!Number.isInteger(Number(this.idEmpresa)) || Number(this.idEmpresa) <= 0) {
        return 'Seleccione una empresa en la barra superior'
      }
      if (!this.terceroSeleccionado ||
          !Number.isInteger(Number(this.terceroSeleccionado.Id)) ||
          Number(this.terceroSeleccionado.Id) <= 0) {
        return 'Seleccione un cliente'
      }
      if (this.idVendedor !== null && this.idVendedor !== undefined &&
          (!Number.isInteger(Number(this.idVendedor)) || Number(this.idVendedor) <= 0)) {
        return 'Seleccione un vendedor válido'
      }
      if (!this.esDecimal12_2(this.descuento)) {
        return 'El descuento debe ser un valor no negativo con máximo dos decimales'
      }
      if (Number(this.descuento) > this.subtotal) {
        return 'El descuento no puede superar el subtotal'
      }
      if (!this.esDecimal12_2(this.efectivo)) {
        return 'El pago en efectivo debe ser un valor no negativo con máximo dos decimales'
      }
      if (!this.esDecimal12_2(this.transaccion)) {
        return 'El pago por transacción debe ser un valor no negativo con máximo dos decimales'
      }
      if (this.saldo !== 0) {
        return 'La venta de contado debe quedar con saldo cero'
      }
      return null
    },

    armarArticulos() {
      return this.lineas.map((fila) => ({
        idBodega: Number(fila.idBodega),
        idArticulo: Number(fila.idArticulo),
        Cantidad: Number(fila.Cantidad),
        PrecioVentaUnidad: Number(fila.PrecioVentaUnidad)
      }))
    },

    async confirmar() {
      if (this.guardando) return

      if (this.tipoVenta !== 'CONTADO') {
        await Swal.fire(
          'Atención',
          'Las ventas a crédito y por abono aún están en desarrollo',
          'info'
        )
        return
      }

      const errorLineas = this.validarLineas()
      if (errorLineas) {
        await Swal.fire('Atención', errorLineas, 'warning')
        return
      }

      const errorCabecera = this.validarCabecera()
      if (errorCabecera) {
        await Swal.fire('Atención', errorCabecera, 'warning')
        return
      }

      const payload = {
        idEmpresa: Number(this.idEmpresa),
        idTercero: Number(this.terceroSeleccionado.Id),
        idVendedor: this.idVendedor ? Number(this.idVendedor) : null,
        TipoVenta: this.tipoVenta,
        ValorDescuento: Number(this.descuento),
        ValorEfectivo: Number(this.efectivo),
        ValorTransaccion: Number(this.transaccion),
        Articulos: this.armarArticulos()
      }

      this.guardando = true
      try {
        const { data } = await ventasService.create(payload)
        await Swal.fire('Éxito', data.msg || 'Venta registrada', 'success')
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar la venta'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
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

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
