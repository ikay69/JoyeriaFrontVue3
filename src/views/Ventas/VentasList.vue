<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Ventas</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANueva">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtros.idVendedor"
            :items="opcionesVendedor"
            item-title="texto"
            item-value="valor"
            label="Vendedor"
            :loading="cargandoVendedores"
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

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table class="tabla-listado">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tercero</th>
              <th>Tipo venta</th>
              <th class="text-right">Subtotal</th>
              <th class="text-right">Descuento</th>
              <th class="text-right">Cancelado</th>
              <th class="text-right">Saldo</th>
              <th>Vendedor</th>
              <th>Estado</th>
              <th class="text-center">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!ventas.length">
              <td colspan="10" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="ven in ventas" :key="ven.ventaId">
              <td>{{ formatearFecha(ven.ventaFecha) }}</td>
              <td>{{ ven.ventaTercero }}</td>
              <td>{{ ven.ventaTipoVenta }}</td>
              <td class="text-right">{{ formatearMoneda(ven.ventaSubtotal) }}</td>
              <td class="text-right">{{ formatearMoneda(ven.ventaDescuento) }}</td>
              <td class="text-right">{{ formatearMoneda(ven.ventaCancelado) }}</td>
              <td class="text-right">{{ formatearMoneda(ven.ventaSaldo) }}</td>
              <td>{{ ven.ventaVendedor }}</td>
              <td>
                <v-chip :color="ven.ventaEstado === 1 ? 'success' : 'error'" size="small">
                  {{ ven.ventaEstado === 1 ? 'Activa' : 'Inactiva' }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn icon="mdi-pencil" size="small" variant="text" @click="irADetalle(ven.ventaId)" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">
          Anterior
        </v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">
          Siguiente
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import ventasService from '@/services/ventasService'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'VentasList',

  data() {
    return {
      cargando: false,
      cargandoVendedores: false,
      ventas: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        idVendedor: 0 // 0: Todos
      },
      vendedoresActivos: []
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
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    },
    opcionesVendedor() {
      return [
        { valor: 0, texto: 'Todos' },
        { valor: -1, texto: 'Sin vendedor' },
        ...this.vendedoresActivos.map((v) => ({ valor: v.vdrId, texto: v.vdrNombre }))
      ]
    }
  },

  created() {
    this.cargarVendedores()
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
        const { data } = await ventasService.getAll({
          idEmpresa: this.idEmpresa,
          pagina,
          idVendedor: this.filtros.idVendedor
        })
        this.ventas = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las ventas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    async cargarVendedores() {
      if (!this.idEmpresa) return
      this.cargandoVendedores = true
      try {
        this.vendedoresActivos = await this.catalogosStore.getVendedores(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los vendedores'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoVendedores = false
      }
    },

    irANueva() {
      this.$router.push({ name: 'VentasNuevo' })
    },

    irADetalle(ventaId) {
      this.$router.push({
        name: 'VentasDetalle',
        params: { EmpId: this.idEmpresa, VentaId: ventaId }
      })
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
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
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
