<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div><h1 class="text-h5">Nueva venta</h1></div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form @submit.prevent="confirmar">
        <v-row dense>
          <v-col cols="12" md="4" class="d-flex ga-2">
            <v-select
              v-model="tipoImpresion"
              :items="opcionesTipoImpresion"
              item-title="texto"
              item-value="valor"
              label="Tipo de impresión"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <v-select
              v-if="tipoImpresion === 'tirilla'"
              v-model.number="anchoTirilla"
              :items="opcionesAnchoTirilla"
              item-title="texto"
              item-value="valor"
              label="Ancho"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
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
          <v-col v-if="tipoVenta !== 'CONTADO'" cols="12" md="4">
            <v-checkbox
              v-model="retiraInventario"
              label="Retirar del inventario"
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
            :hint="terceroSeleccionado ? `Celular: ${terceroSeleccionado.Celular || '-'}` : ''"
            :persistent-hint="Boolean(terceroSeleccionado)"
            readonly
            placeholder="Seleccione un cliente"
            variant="outlined"
            density="comfortable"
            :hide-details="!terceroSeleccionado"
            class="flex-grow-1"
          />
          <v-btn
            v-if="terceroSeleccionado"
            icon="mdi-pencil"
            variant="tonal"
            title="Editar cliente seleccionado"
            @click="editarClienteSeleccionado"
          />
        </div>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos</span>
          <span class="text-caption text-medium-emphasis">{{ lineas.length }} / 200</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th class="text-center" style="width: 72px">Bolsa</th>
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
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos una línea
                </td>
              </tr>
              <tr v-for="(fila, indice) in lineas" :key="fila.clave">
                <td class="text-center">
                  <v-checkbox
                    v-model="fila.EsBolsa"
                    density="compact"
                    hide-details
                    aria-label="Es bolsa"
                  />
                </td>
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
                    step="0.0001"
                    :precision="4"
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

        <div class="d-flex justify-end mt-2">
          <div class="totales-venta" aria-label="Resumen de pagos">
            <div class="totales-venta__fila">
              <span>Subtotal</span>
              <span class="totales-venta__valor">{{ formatearMoneda(subtotal) }}</span>
            </div>
            <div class="totales-venta__fila">
              <label for="venta-descuento">Descuento</label>
              <v-number-input
                id="venta-descuento"
                v-model.number="descuento"
                class="totales-venta__campo"
                control-variant="hidden"
                aria-label="Descuento"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <div class="totales-venta__fila">
              <label for="venta-efectivo">Pago efectivo</label>
              <v-number-input
                id="venta-efectivo"
                v-model.number="efectivo"
                class="totales-venta__campo"
                control-variant="hidden"
                aria-label="Pago efectivo"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <div class="totales-venta__fila">
              <label for="venta-transaccion">Pago por transacción</label>
              <v-number-input
                id="venta-transaccion"
                v-model.number="transaccion"
                class="totales-venta__campo"
                control-variant="hidden"
                aria-label="Pago por transacción"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <div class="totales-venta__fila">
              <span>Saldo</span>
              <span class="totales-venta__valor">{{ formatearMoneda(saldo) }}</span>
            </div>
          </div>
        </div>
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

    <ClientesSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />

    <ClientesFormDialog
      v-model="dialogClienteForm"
      :id-empresa="idEmpresa"
      :cliente="clienteParaEditar"
      @guardado="onClienteGuardado"
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
import empresaService from '@/services/empresaService'
import { generarPdfVenta } from '@/utils/ventaPdf'
import { generarTirillaPDF } from '@/utils/tirillaPDF'
import { generarTirilla } from '@/utils/tirilla'
import ClientesSeleccionar from '@/views/Clientes/ClientesSeleccionar.vue'
import ClientesFormDialog from '@/views/Clientes/ClientesFormDialog.vue'
import ArticulosVender from '@/views/Inventario/Articulos/ArticulosVender.vue'

const MAX_LINEAS = 200
const MAX_DECIMAL_12_2 = 9999999999.99

export default {
  name: 'VentasForm',

  components: { ClientesSeleccionar, ClientesFormDialog, ArticulosVender },

  data() {
    return {
      dialogTercero: false,
      dialogClienteForm: false,
      clienteParaEditar: null,
      dialogArticulo: false,
      filaActiva: null,
      siguienteClaveLinea: 1,

      tipoImpresion: 'pdf',
      anchoTirilla: 80,
      opcionesTipoImpresion: [
        { valor: 'pdf', texto: 'PDF' },
        { valor: 'tirillaPdf', texto: 'Tirilla PDF' },
        { valor: 'tirilla', texto: 'Tirilla' }
      ],
      opcionesAnchoTirilla: [
        { valor: 80, texto: '80 mm' },
        { valor: 50, texto: '50 mm' }
      ],
      tipoVenta: 'CONTADO',
      idVendedor: null,
      terceroSeleccionado: null,
      descuento: 0,
      efectivo: 0,
      transaccion: 0,
      retiraInventario: false,

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
    tipoVenta(valor) {
      if (valor === 'CONTADO') this.retiraInventario = false
    },
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
      this.retiraInventario = false
      this.lineas = []
      this.siguienteClaveLinea = 1
      this.filaActiva = null
      this.dialogTercero = false
      this.dialogClienteForm = false
      this.clienteParaEditar = null
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
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      this.clienteParaEditar = null
      this.dialogClienteForm = true
    },

    editarClienteSeleccionado() {
      if (!this.terceroSeleccionado) return
      this.clienteParaEditar = { ...this.terceroSeleccionado }
      this.dialogClienteForm = true
    },

    onClienteGuardado({ creado, cliente }) {
      if (cliente) {
        this.terceroSeleccionado = cliente
      } else if (creado) {
        this.terceroSeleccionado = null
      }
      this.clienteParaEditar = null
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
    },

    agregarLinea() {
      if (this.lineas.length >= MAX_LINEAS) return
      this.lineas.push({
        clave: this.siguienteClaveLinea++,
        EsBolsa: false,
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

    esCantidadHasta4Decimales(valor) {
      const numero = Number(valor)
      return Number.isFinite(numero) &&
        numero > 0 &&
        numero <= MAX_DECIMAL_12_2 &&
        Number(numero.toFixed(4)) === numero
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
        if (!this.esCantidadHasta4Decimales(fila.Cantidad)) {
          return 'La cantidad de la línea ' + numero +
            ' debe ser mayor a cero y tener máximo cuatro decimales'
        }
        // Una bolsa puede ir en cero (incluida sin cobrar); el resto exige precio mayor a cero
        if (fila.EsBolsa) {
          if (!this.esDecimal12_2(fila.PrecioVentaUnidad)) {
            return 'El precio de la bolsa de la línea ' + numero +
              ' debe ser cero o mayor y tener máximo dos decimales'
          }
        } else if (!(Number(fila.PrecioVentaUnidad) > 0) || !this.esDecimal12_2(fila.PrecioVentaUnidad)) {
          return 'El precio de la línea ' + numero +
            ' debe ser mayor a cero y tener máximo dos decimales'
        }
      }

      // El backend agrupa el mismo artículo en la misma bodega y rechaza si difieren precio o bolsa
      for (let i = 0; i < this.lineas.length; i++) {
        for (let j = i + 1; j < this.lineas.length; j++) {
          const a = this.lineas[i]
          const b = this.lineas[j]
          if (Number(a.idArticulo) !== Number(b.idArticulo) || Number(a.idBodega) !== Number(b.idBodega)) continue
          if (Number(a.PrecioVentaUnidad) !== Number(b.PrecioVentaUnidad)) {
            return `Las líneas ${i + 1} y ${j + 1} tienen el mismo artículo y bodega con precios distintos`
          }
          if (Boolean(a.EsBolsa) !== Boolean(b.EsBolsa)) {
            return `Las líneas ${i + 1} y ${j + 1} tienen el mismo artículo y bodega, pero solo una está marcada como bolsa`
          }
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
      if (this.tipoVenta === 'CONTADO') {
        if (this.saldo !== 0) {
          return 'La venta de contado debe quedar con saldo cero'
        }
      } else if (!(this.saldo > 0)) {
        return 'Una venta a crédito o por abono debe quedar con saldo pendiente'
      }
      return null
    },

    armarArticulos() {
      return this.lineas.map((fila) => ({
        EsBolsa: Boolean(fila.EsBolsa),
        idBodega: Number(fila.idBodega),
        idArticulo: Number(fila.idArticulo),
        Cantidad: Number(fila.Cantidad),
        PrecioVentaUnidad: Number(fila.PrecioVentaUnidad)
      }))
    },

    async confirmar() {
      if (this.guardando) return

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
        RetiraInventario: Boolean(this.retiraInventario),
        ValorDescuento: Number(this.descuento),
        ValorEfectivo: Number(this.efectivo),
        ValorTransaccion: Number(this.transaccion),
        Articulos: this.armarArticulos()
      }

      this.guardando = true
      try {
        const { data: respuestaVenta } = await ventasService.create(payload)
        const venta = respuestaVenta?.data

        if (!venta) {
          await Swal.fire(
            'Venta registrada',
            respuestaVenta?.msg || 'La venta se guardó, pero no se recibieron los datos para generar la factura.',
            'warning'
          )
          this.$router.back()
          return
        }

        let empresa = this.authStore.empresaActual || {}
        let mensajeEmpresa = ''
        try {
          const { data: respuestaEmpresa } = await empresaService.getById({
            idEmpresa: Number(this.idEmpresa)
          })
          empresa = respuestaEmpresa?.data || empresa
        } catch (errorEmpresa) {
          mensajeEmpresa = errorEmpresa.response?.data?.msg ||
            'No se pudieron cargar los datos completos de la empresa; se usaron los disponibles en la sesión.'
        }

        try {
          const parametros = { venta, empresa }
          if (this.tipoImpresion === 'tirillaPdf') {
            generarTirillaPDF(parametros)
          } else if (this.tipoImpresion === 'tirilla') {
            generarTirilla({ ...parametros, anchoMm: this.anchoTirilla })
          } else {
            generarPdfVenta(parametros)
          }
        } catch (errorPdf) {
          const mensaje = errorPdf.message || 'Error desconocido'
          await Swal.fire(
            'Venta registrada',
            `La venta se guardó, pero no se pudo generar la impresión: ${mensaje}`,
            'warning'
          )
          this.$router.back()
          return
        }

        if (mensajeEmpresa) {
          await Swal.fire('Venta registrada', `La factura se descargó. ${mensajeEmpresa}`, 'warning')
        } else {
          await Swal.fire('Éxito', 'Venta registrada y factura generada', 'success')
        }
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
.totales-venta {
  width: min(100%, 420px);
}

.totales-venta__fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  align-items: center;
  gap: 16px;
  min-height: 52px;
}

.totales-venta__valor {
  text-align: right;
  font-weight: 500;
}

.totales-venta__campo {
  width: 100%;
}
</style>
