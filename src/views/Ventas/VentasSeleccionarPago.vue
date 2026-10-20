<template>
  <v-dialog v-model="dialogVisible" max-width="1000" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div>Seleccionar venta a pagar</div>
          <div class="text-caption text-medium-emphasis font-weight-regular">
            Solo ventas activas a crédito o por abono con saldo pendiente.
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" title="Cerrar" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row dense class="mb-2">
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              :model-value="clienteNombre"
              label="Cliente (opcional)"
              placeholder="Todos los clientes"
              readonly
              clearable
              density="compact"
              variant="outlined"
              hide-details
              append-inner-icon="mdi-magnify"
              @click="dialogCliente = true"
              @click:append-inner="dialogCliente = true"
              @click:clear="limpiarCliente"
            />
          </v-col>
          <v-col cols="12" sm="6" md="8" class="d-flex align-center justify-end">
            <v-btn color="primary" variant="tonal" :loading="cargando" @click="consultar">
              Actualizar
            </v-btn>
          </v-col>
        </v-row>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th>Fecha</th>
                <th>Venta</th>
                <th>Cliente</th>
                <th>Tipo de venta</th>
                <th class="text-right">Subtotal</th>
                <th class="text-right">Cancelado</th>
                <th class="text-right">Saldo</th>
                <th>Estado de pago</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="9" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!ventas.length">
                <td colspan="9" class="text-center py-6 text-medium-emphasis">
                  No hay ventas pendientes de pago
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
                <td>{{ venta.ventaTercero || '-' }}</td>
                <td>{{ venta.ventaTipoVenta || '-' }}</td>
                <td class="text-right">{{ formatearMoneda(venta.ventaSubtotal) }}</td>
                <td class="text-right">{{ formatearMoneda(venta.ventaCancelado) }}</td>
                <td class="text-right">{{ formatearMoneda(venta.ventaSaldo) }}</td>
                <td>{{ venta.ventaEstadoPago || '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="pagina > 1" variant="outlined" :disabled="cargando" @click="buscar(pagina - 1)">
            Anterior
          </v-btn>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <v-btn v-if="pagina < totalPaginas" variant="outlined" :disabled="cargando" @click="buscar(pagina + 1)">
            Siguiente
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <ClientesSeleccionar
      v-model="dialogCliente"
      :id-empresa="idEmpresa"
      @seleccionar="onClienteSeleccionado"
    />
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import ventasService from '@/services/ventasService'
import ClientesSeleccionar from '@/views/Clientes/ClientesSeleccionar.vue'

export default {
  name: 'VentasSeleccionarPago',

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
    return {
      cargando: false,
      ventas: [],
      cantData: 0,
      pagina: 1,
      idTercero: null,
      clienteNombre: '',
      dialogCliente: false
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
      this.limpiarCliente(false)
      if (this.modelValue) this.consultar()
    }
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    async buscar(pagina) {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        await Swal.fire('Atención', 'Seleccione una empresa para buscar ventas', 'warning')
        return
      }

      const idTercero = this.idTercero ? Number(this.idTercero) : 0

      this.cargando = true
      try {
        const { data } = await ventasService.getActivasCreditoAbono({ idEmpresa, pagina, idTercero })
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
      this.idTercero = cliente.Id
      this.clienteNombre = cliente.Nombre || `Cliente #${cliente.Id}`
      this.consultar()
    },

    limpiarCliente(consultar = true) {
      this.idTercero = null
      this.clienteNombre = ''
      if (consultar && this.modelValue) this.consultar()
    },

    seleccionar(venta) {
      this.$emit('seleccionar', { ...venta })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
