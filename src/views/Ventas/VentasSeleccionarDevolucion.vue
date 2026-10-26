<template>
  <v-dialog v-model="dialogVisible" max-width="1100" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div>Seleccionar venta para devolución</div>
          <div class="text-caption text-medium-emphasis font-weight-regular">
            Incluye ventas activas y anuladas; filtre por fechas.
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" title="Cerrar" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row dense align="center" class="mb-2">
          <v-col cols="12">
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-account-search"
                size="small"
                variant="tonal"
                title="Buscar cliente"
                @click="dialogCliente = true"
              />
              <v-text-field
                :model-value="clienteSeleccionado ? clienteSeleccionado.Nombre : ''"
                label="Cliente"
                placeholder="Todos"
                readonly
                density="compact"
                variant="outlined"
                hide-details
              />
              <v-btn
                v-if="clienteSeleccionado"
                icon="mdi-close"
                variant="text"
                size="small"
                title="Quitar el filtro de cliente"
                @click="limpiarCliente"
              />
            </div>
          </v-col>
        </v-row>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="filtros.fechaInicio" label="Desde" type="date" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="filtros.fechaFin" label="Hasta" type="date" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select v-model="filtros.TipoVenta" :items="opcionesTipoVenta" item-title="texto" item-value="valor" label="Tipo de venta" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select v-model="filtros.EstadoPago" :items="opcionesEstadoPago" item-title="texto" item-value="valor" label="Estado de pago" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select v-model="filtros.EstadoInventario" :items="opcionesEstadoInventario" item-title="texto" item-value="valor" label="Estado inventario" density="compact" variant="outlined" hide-details />
          </v-col>
        </v-row>

        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-body-2 text-medium-emphasis">Seleccione la venta a devolver.</span>
          <v-btn color="primary" variant="tonal" :loading="cargando" @click="consultar">
            Actualizar
          </v-btn>
        </div>
        <div class="text-caption text-medium-emphasis mb-3">
          El rango de fechas es obligatorio y no puede superar los 94 días.
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th>Fecha</th>
                <th>Venta</th>
                <th>Cliente</th>
                <th>Tipo de venta</th>
                <th>Estado de pago</th>
                <th class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="7" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!ventas.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  No hay ventas para mostrar
                </td>
              </tr>
              <tr v-for="venta in ventas" :key="venta.ventaId">
                <td class="text-center">
                  <v-btn
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="small"
                    variant="text"
                    title="Seleccionar esta venta"
                    @click="seleccionar(venta)"
                  />
                </td>
                <td>{{ formatearFecha(venta.ventaFecha) }}</td>
                <td>#{{ venta.ventaId }}</td>
                <td>
                  {{ venta.ventaTercero || '-' }}
                  <div class="text-caption text-medium-emphasis">
                    {{ venta.ventaTerceroTipoDoc || '' }} {{ venta.ventaTerceroNumeroDoc || '' }}
                  </div>
                </td>
                <td>{{ venta.ventaTipoVenta || '-' }}</td>
                <td>{{ venta.ventaEstadoPago || '-' }}</td>
                <td class="text-center">
                  <v-chip
                    :color="Number(venta.ventaEstado) === 1 ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                  >
                    {{ Number(venta.ventaEstado) === 1 ? 'Activa' : 'Anulada' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="pagina > 1" variant="outlined" :disabled="cargando" @click="irPagina(pagina - 1)">
            Anterior
          </v-btn>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <v-btn v-if="pagina < totalPaginas" variant="outlined" :disabled="cargando" @click="irPagina(pagina + 1)">
            Siguiente
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <ClientesSeleccionar
    v-model="dialogCliente"
    :id-empresa="idEmpresa"
    @seleccionar="onClienteSeleccionado"
  />
</template>

<script>
import Swal from 'sweetalert2'
import ventasService from '@/services/ventasService'
import ClientesSeleccionar from '@/views/Clientes/ClientesSeleccionar.vue'

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

export default {
  name: 'VentasSeleccionarDevolucion',

  components: { ClientesSeleccionar },

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    idEmpresa: {
      type: [Number, String],
      default: null
    }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      ventas: [],
      cantData: 0,
      pagina: 1,
      dialogCliente: false,
      clienteSeleccionado: null,
      filtros: {
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy),
        TipoVenta: '',
        EstadoPago: '',
        EstadoInventario: ''
      },
      opcionesTipoVenta: [
        { valor: '', texto: 'Todos' },
        { valor: 'CONTADO', texto: 'Contado' },
        { valor: 'POR_ABONO', texto: 'Por abono' },
        { valor: 'CREDITO', texto: 'Crédito' }
      ],
      opcionesEstadoPago: [
        { valor: '', texto: 'Todos' },
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'PARCIAL', texto: 'Parcial' },
        { valor: 'COMPLETO', texto: 'Completo' }
      ],
      opcionesEstadoInventario: [
        { valor: '', texto: 'Todos' },
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'COMPLETO', texto: 'Completo' }
      ]
    }
  },

  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(valor) {
        this.$emit('update:modelValue', valor)
      }
    },
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    modelValue(visible) {
      if (visible) this.consultar()
    },
    idEmpresa() {
      // El cliente elegido es de la empresa anterior.
      this.clienteSeleccionado = null
      if (this.modelValue) this.consultar()
    }
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        await Swal.fire('Atención', 'Seleccione una empresa para buscar ventas', 'warning')
        return
      }

      if (!this.filtros.fechaInicio || !this.filtros.fechaFin) {
        await Swal.fire('Atención', 'Las dos fechas son obligatorias', 'warning')
        return
      }

      const cantidadDias = diasInclusivos(this.filtros.fechaInicio, this.filtros.fechaFin)
      if (cantidadDias < 1) {
        await Swal.fire('Atención', 'La fecha inicial no puede ser mayor que la fecha final', 'warning')
        return
      }
      if (cantidadDias > 94) {
        await Swal.fire('Atención', 'El rango de fechas no puede superar los 94 días', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await ventasService.getAll({
          idEmpresa,
          pagina,
          fechaInicio: this.filtros.fechaInicio,
          fechaFin: this.filtros.fechaFin,
          idVendedor: 0,
          idTercero: this.clienteSeleccionado ? Number(this.clienteSeleccionado.Id) : 0,
          TipoVenta: this.filtros.TipoVenta || null,
          EstadoPago: this.filtros.EstadoPago || null,
          EstadoInventario: this.filtros.EstadoInventario || null
        })
        this.ventas = data.data || []
        this.cantData = Number(data.cantData) || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron consultar las ventas'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    onClienteSeleccionado(cliente) {
      this.clienteSeleccionado = cliente
      this.consultar()
    },

    limpiarCliente() {
      this.clienteSeleccionado = null
      this.consultar()
    },

    seleccionar(venta) {
      this.$emit('seleccionar', { ...venta })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO', {
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
