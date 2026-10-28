<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Ventas</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANueva">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
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

      <v-row dense align="center">
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filtros.fechaInicio"
            label="Desde"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filtros.fechaFin"
            label="Hasta"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
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
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filtros.TipoVenta"
            :items="opcionesTipoVenta"
            item-title="texto"
            item-value="valor"
            label="Tipo de venta"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filtros.EstadoPago"
            :items="opcionesEstadoPago"
            item-title="texto"
            item-value="valor"
            label="Estado de pago"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filtros.EstadoInventario"
            :items="opcionesEstadoInventario"
            item-title="texto"
            item-value="valor"
            label="Estado de inventario"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>
      <div class="text-caption text-medium-emphasis mt-2">El rango de fechas es obligatorio y no puede superar los 94 días.</div>
    </v-card>

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table class="tabla-listado">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Tipo venta</th>
              <th class="text-right">Subtotal</th>
              <th class="text-right">Saldo</th>
              <th>Vendedor</th>
              <th>Estado de pago</th>
              <th>Último pago</th>
              <th>Estado de inventario</th>
              <th>Venta</th>
              <th class="text-center">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="12" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!ventas.length">
              <td colspan="12" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="ven in ventas" :key="ven.ventaId">
              <td>{{ formatearFecha(ven.ventaFecha) }}</td>
              <td>{{ ven.ventaTercero }}</td>
              <td>{{ ven.ventaTipoVenta }}</td>
              <td class="text-right">{{ formatearMoneda(ven.ventaSubtotal) }}</td>
              <td class="text-right">{{ formatearMoneda(ven.ventaSaldo) }}</td>
              <td>{{ ven.ventaVendedor }}</td>
              <td>{{ ven.ventaEstadoPago || '-' }}</td>
              <!-- null si la venta no tiene pagos (o es anterior al 2026-10-27) -->
              <td>{{ ven.ventaFechaUltimoPago ? formatearFecha(ven.ventaFechaUltimoPago) : '-' }}</td>
              <td>{{ ven.ventaEstadoInventario || '-' }}</td>
              <td>
                <v-chip :color="Number(ven.ventaEstado) === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ Number(ven.ventaEstado) === 1 ? 'Activa' : 'Anulada' }}
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

    <ClientesSeleccionar
      v-model="dialogCliente"
      :id-empresa="idEmpresa"
      @seleccionar="onClienteSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import ventasService from '@/services/ventasService'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'
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
  name: 'VentasList',

  components: { ClientesSeleccionar },

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      cargandoVendedores: false,
      ventas: [],
      cantData: 0,
      pagina: 1,
      dialogCliente: false,
      clienteSeleccionado: null,
      filtros: {
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy),
        idVendedor: 0,
        TipoVenta: '',
        EstadoPago: '',
        EstadoInventario: ''
      },
      vendedoresActivos: [],
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

  watch: {
    idEmpresa() {
      this.clienteSeleccionado = null
      this.filtros.idVendedor = 0
      this.cargarVendedores()
      this.consultar()
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

      const idEmpresa = Number(this.idEmpresa)
      const idVendedor = Number(this.filtros.idVendedor)
      const idTercero = this.clienteSeleccionado ? Number(this.clienteSeleccionado.Id) : 0
      if (
        !Number.isInteger(idEmpresa) || idEmpresa <= 0 ||
        !Number.isInteger(idVendedor) ||
        !Number.isInteger(idTercero) || idTercero < 0
      ) {
        await Swal.fire('Atención', 'La empresa o el vendedor seleccionado no es válido', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await ventasService.getAll({
          idEmpresa,
          pagina,
          fechaInicio: this.filtros.fechaInicio,
          fechaFin: this.filtros.fechaFin,
          idVendedor,
          idTercero,
          TipoVenta: this.filtros.TipoVenta || null,
          EstadoPago: this.filtros.EstadoPago || null,
          EstadoInventario: this.filtros.EstadoInventario || null
        })
        this.ventas = data.data || []
        this.cantData = Number(data.cantData) || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las ventas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    async cargarVendedores() {
      if (!this.idEmpresa) {
        this.vendedoresActivos = []
        return
      }
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

    onClienteSeleccionado(cliente) {
      this.clienteSeleccionado = cliente
      this.consultar()
    },

    limpiarCliente() {
      this.clienteSeleccionado = null
      this.consultar()
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
      // Solo la fecha: la hora se ve en el detalle de la venta.
      return new Date(fecha).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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
