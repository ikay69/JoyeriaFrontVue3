<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Informes</h1>

    <v-card class="pa-4" max-width="760" elevation="1">
      <v-select
        v-model="tipoInforme"
        :items="opcionesInforme"
        item-title="texto"
        item-value="valor"
        :item-props="propsOpcion"
        label="Informe"
        variant="outlined"
        density="compact"
        class="mb-2"
      />

      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="fechaInicio"
            label="Fecha desde"
            type="date"
            :disabled="!informeActual?.usaFechas"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="fechaFin"
            label="Fecha hasta"
            type="date"
            :disabled="!informeActual?.usaFechas"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <div class="d-flex align-center ga-2 mt-4">
        <v-btn
          icon="mdi-magnify"
          variant="tonal"
          color="primary"
          title="Buscar producto"
          aria-label="Buscar producto"
          :disabled="!informeActual?.usaProducto"
          @click="abrirDialogProducto"
        />
        <v-text-field
          :model-value="productoSeleccionado ? productoSeleccionado.proNombre : ''"
          label="Producto"
          placeholder="Seleccione un producto"
          readonly
          :disabled="!informeActual?.usaProducto"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-1"
        />
      </div>

      <v-row v-show="usaFiltrosExistencias" dense class="mt-2">
        <v-col cols="12">
          <v-text-field
            v-model="filtrosExistencias.textoFiltro"
            label="Buscar (nombre o SKU)"
            :disabled="!usaFiltrosExistencias"
            maxlength="150"
            clearable
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="filtrosExistencias.idBodega"
            :items="bodegas"
            item-title="Nombre"
            item-value="Id"
            label="Bodega"
            :loading="cargandoBodegas"
            :disabled="!usaFiltrosExistencias"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="filtrosExistencias.BolsaEstado"
            :items="opcionesBolsaEstado"
            item-title="texto"
            item-value="valor"
            label="Estado"
            :disabled="!usaFiltrosExistencias"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <div v-if="informeActual?.usaFechas" class="text-caption text-medium-emphasis mt-2">
        El rango de fechas es obligatorio y no puede superar los 94 días.
      </div>

      <v-alert v-if="!esAdministrador" type="info" variant="tonal" class="mt-4">
        Solo un administrador puede descargar informes.
      </v-alert>

      <div class="d-flex justify-end mt-4">
        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          :loading="descargando"
          :disabled="!esAdministrador || !informeActual?.descargar"
          @click="descargar"
        >
          Descargar CSV
        </v-btn>
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
import ventasService from '@/services/ventasService'
import pagoService from '@/services/pagoService'
import gastosService from '@/services/gastosService'
import compraService from '@/services/compraService'
import movimientoCajaService from '@/services/movimientoCajaService'
import movimientoService from '@/services/movimientoService'
import existenciaService from '@/services/existenciaService'
import bodegaService from '@/services/bodegaService'
import { useAuthStore } from '@/stores/auth'
import { descargarCsv } from '@/utils/descargarCsv'
import ProductosSeleccionar from '@/views/Inventario/Productos/ProductosSeleccionar.vue'

function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function diasInclusivos(fechaInicio, fechaFin) {
  const convertir = (valor) => {
    const [anio, mes, dia] = valor.split('-').map(Number)
    return Date.UTC(anio, mes - 1, dia)
  }
  return Math.floor((convertir(fechaFin) - convertir(fechaInicio)) / 86400000) + 1
}

// Cada informe llama a su propia ruta con sus propios datos.
// descargar: null mientras el backend no tenga la ruta; la opcion queda deshabilitada.
const INFORMES = [
  {
    valor: 'VENTA',
    texto: 'Ventas',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      ventasService.exportarCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `ventas_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'VENTAARTICULOS',
    texto: 'Ventas artículos',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      ventasService.exportarArticulosCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `ventas_articulos_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'COMPRAS',
    texto: 'Compras',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      compraService.exportarCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `compras_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'COMPRAS_ARTICULOS',
    texto: 'Compras artículos',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      compraService.exportarArticulosCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `compras_articulos_${fechaInicio}_${fechaFin}.csv`
  },
  { valor: 'EMPENOS', texto: 'Empeños', usaFechas: true, usaProducto: false, descargar: null },
  { valor: 'EMPENOSARTICULOS', texto: 'Empeños artículos', usaFechas: true, usaProducto: false, descargar: null },
  {
    valor: 'PAGOS',
    texto: 'Pagos',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      pagoService.exportarCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `pagos_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'GASTOS',
    texto: 'Gastos',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      gastosService.exportarCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `gastos_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'MOVIMIENTOSCAJA',
    texto: 'Movimientos de caja',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      movimientoCajaService.exportarCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `movimientos_caja_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'MOVIMIENTOSINVENTARIO',
    texto: 'Movimientos de inventario por periodo',
    usaFechas: true,
    usaProducto: false,
    descargar: ({ idEmpresa, fechaInicio, fechaFin }) =>
      movimientoService.exportarCsv({ idEmpresa, fechaInicio, fechaFin }),
    nombreArchivo: ({ fechaInicio, fechaFin }) => `movimientos_${fechaInicio}_${fechaFin}.csv`
  },
  {
    valor: 'EXISTENCIAS',
    texto: 'Existencias',
    usaFechas: false,
    usaProducto: false,
    usaFiltrosExistencias: true,
    descargar: (parametros) => existenciaService.exportarCsv(parametros),
    nombreArchivo: () => `existencias_${aFechaIso(new Date())}.csv`
  },
  { valor: 'KARDEXARTICULO', texto: 'Kardex por artículo', usaFechas: false, usaProducto: false, descargar: null },
  { valor: 'KARDESPRODUCTO', texto: 'Kardex por producto', usaFechas: false, usaProducto: true, descargar: null }
]

export default {
  name: 'Informes',

  components: { ProductosSeleccionar },

  data() {
    const hoy = new Date()
    return {
      tipoInforme: 'VENTA',
      fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      fechaFin: aFechaIso(hoy),
      productoSeleccionado: null,
      dialogProducto: false,
      descargando: false,
      opcionesInforme: INFORMES,

      bodegas: [{ Id: 0, Nombre: 'Todas' }],
      cargandoBodegas: false,
      bodegasCargadas: false,
      filtrosExistencias: {
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
    informeActual() {
      return INFORMES.find((informe) => informe.valor === this.tipoInforme) || null
    },
    usaFiltrosExistencias() {
      return !!this.informeActual?.usaFiltrosExistencias
    }
  },

  watch: {
    idEmpresa() {
      this.productoSeleccionado = null
      // Las bodegas son de la empresa: se vuelven a pedir la proxima vez que se usen
      this.bodegas = [{ Id: 0, Nombre: 'Todas' }]
      this.filtrosExistencias.idBodega = 0
      this.bodegasCargadas = false
      if (this.usaFiltrosExistencias) this.cargarBodegas()
    },
    usaFiltrosExistencias(usa) {
      if (usa && !this.bodegasCargadas) this.cargarBodegas()
    }
  },

  methods: {
    async cargarBodegas() {
      if (!this.idEmpresa) return
      this.cargandoBodegas = true
      try {
        const { data } = await bodegaService.getActivas({ idEmpresa: this.idEmpresa })
        this.bodegas = [{ Id: 0, Nombre: 'Todas' }, ...(data.data || [])]
        this.bodegasCargadas = true
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoBodegas = false
      }
    },

    propsOpcion(informe) {
      return { disabled: !informe.descargar }
    },

    abrirDialogProducto() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      this.dialogProducto = true
    },

    seleccionarProducto(producto) {
      this.productoSeleccionado = producto
    },

    async descargar() {
      const informe = this.informeActual
      if (!informe?.descargar) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const parametros = { idEmpresa: Number(this.idEmpresa) }

      if (informe.usaFechas) {
        if (!this.fechaInicio || !this.fechaFin) {
          await Swal.fire('Atención', 'Las dos fechas son obligatorias', 'warning')
          return
        }
        const cantidadDias = diasInclusivos(this.fechaInicio, this.fechaFin)
        if (cantidadDias < 1) {
          await Swal.fire('Atención', 'La fecha inicial no puede ser mayor que la fecha final', 'warning')
          return
        }
        if (cantidadDias > 94) {
          await Swal.fire('Atención', 'El rango de fechas no puede superar los 94 días', 'warning')
          return
        }
        parametros.fechaInicio = this.fechaInicio
        parametros.fechaFin = this.fechaFin
      }

      if (informe.usaProducto) {
        if (!this.productoSeleccionado) {
          await Swal.fire('Atención', 'Seleccione un producto', 'warning')
          return
        }
        parametros.idProducto = Number(this.productoSeleccionado.proId)
      }

      if (informe.usaFiltrosExistencias) {
        parametros.textoFiltro = this.filtrosExistencias.textoFiltro || ''
        parametros.BolsaEstado = this.filtrosExistencias.BolsaEstado || ''
        parametros.idBodega = this.filtrosExistencias.idBodega || 0
      }

      this.descargando = true
      try {
        const resp = await informe.descargar(parametros)
        // Los errores de validacion llegan como JSON aunque se pida un blob
        if (!(resp.headers['content-type'] || '').startsWith('text/csv')) {
          const error = JSON.parse(await resp.data.text())
          Swal.fire('Error', error.msg || 'No se pudo generar el informe', 'error')
          return
        }
        descargarCsv(informe.nombreArchivo(parametros), resp.data)
      } catch (error) {
        let mensaje = 'No se pudo generar el informe'
        try {
          mensaje = JSON.parse(await error.response.data.text()).msg || mensaje
        } catch {
          // la respuesta no era JSON; se deja el mensaje por defecto
        }
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.descargando = false
      }
    }
  }
}
</script>
