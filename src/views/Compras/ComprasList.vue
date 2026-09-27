<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5">Compras</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$router.push({ name: 'CompraNueva' })">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4">
      <div style="overflow-x: auto;">
        <v-table density="compact">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Documento</th>
              <th>Tercero</th>
              <th>Tipo</th>
              <th class="text-end">Subtotal</th>
              <th class="text-end">Descuento</th>
              <th class="text-end">Cancelado</th>
              <th class="text-end">Saldo</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!compras.length">
              <td colspan="10" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="com in compras" :key="com.compraId">
              <td>{{ formatearFecha(com.compraFecha) }}</td>
              <td>{{ com.compraDocumentoSoporte || '-' }}</td>
              <td>
                {{ com.compraTercero }}
                <div class="text-caption text-medium-emphasis">
                  {{ com.compraTerceroTipoDoc || '' }} {{ com.compraTerceroNumeroDoc || '' }}
                </div>
              </td>
              <td>{{ com.compraTipoCompra }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraSubtotal) }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraDescuento) }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraCancelado) }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraSaldo) }}</td>
              <td class="text-center">
                <v-chip :color="com.compraEstado === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ com.compraEstado === 1 ? 'Activa' : 'Anulada' }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Ver detalle"
                  @click="irDetalle(com)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">Anterior</v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">Siguiente</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ComprasList',

  data() {
    return {
      cargando: false,
      compras: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        // campoOrdenar es OBLIGATORIO: sin el, getallcompra responde 400. Arranca en 5
        // (FechaCreacion) con DESC para mostrar lo ultimo comprado primero.
        campoOrdenar: 5,
        orden: 'DESC'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  created() {
    this.consultar()
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await compraService.getAll({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina
        })
        this.compras = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las compras'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    irDetalle(com) {
      this.$router.push({
        name: 'CompraDetalle',
        params: { EmpId: this.idEmpresa, ComId: com.compraId }
      })
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    }
  }
}
</script>
