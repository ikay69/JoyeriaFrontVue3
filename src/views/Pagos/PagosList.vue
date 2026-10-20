<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <h1 class="text-h5">Pagos</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Abonos y cuotas recibidas para ventas a crédito o por abono.
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" :disabled="!idEmpresa" @click="irANuevo">
        Registrar pago
      </v-btn>
    </div>

    <v-row dense class="mb-2">
      <v-col cols="12" sm="6">
        <v-card class="pa-4" elevation="1">
          <div class="text-caption text-medium-emphasis">Suma de pagos activos en el filtro</div>
          <div class="text-h6 font-weight-bold">{{ formatearMoneda(sumaActivos) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card class="pa-4" elevation="1">
          <div class="text-caption text-medium-emphasis">Suma de pagos anulados en el filtro</div>
          <div class="text-h6 font-weight-bold">{{ formatearMoneda(sumaAnulados) }}</div>
        </v-card>
      </v-col>
    </v-row>

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
            label="Fecha inicial"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filtros.fechaFin"
            label="Fecha final"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filtros.estadoFiltro"
            :items="opcionesEstado"
            item-title="texto"
            item-value="valor"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filtros.tipoOrigenFiltro"
            :items="opcionesTipoOrigenFiltro"
            item-title="texto"
            item-value="valor"
            label="Tipo de pago"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-btn color="primary" variant="tonal" block :loading="cargando" @click="consultar">
            Consultar
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filtros.campoOrdenar"
            :items="opcionesCampoOrdenar"
            item-title="texto"
            item-value="valor"
            label="Ordenar por"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filtros.orden"
            :items="opcionesOrden"
            item-title="texto"
            item-value="valor"
            label="Orden"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="6" class="text-body-2 text-medium-emphasis">
          El rango debe ser de máximo 94 días. El servidor pagina de 50 registros.
        </v-col>
      </v-row>
    </v-card>

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Pago</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Venta</th>
              <th>Método</th>
              <th class="text-end">Monto</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="9" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!pagos.length">
              <td colspan="9" class="text-center py-6 text-medium-emphasis">
                No hay pagos para mostrar
              </td>
            </tr>
            <tr v-for="pago in pagos" :key="pago.pagoId">
              <td>
                {{ formatearFecha(pago.pagoFecha) }}
                <div class="text-caption text-medium-emphasis">{{ formatearHora(pago.pagoFecha) }}</div>
              </td>
              <td>#{{ pago.pagoId }}</td>
              <td>
                {{ pago.terceroNombreCompleto || 'Cliente' }}
                <div class="text-caption text-medium-emphasis">ID {{ pago.pagoTerceroId }}</div>
              </td>
              <td>{{ nombreTipoOrigen(pago.pagoTipoOrigen) }}</td>
              <td>#{{ pago.pagoOrigenId }}</td>
              <td>{{ nombreMetodo(pago.pagoMetodoPago) }}</td>
              <td class="text-end">{{ formatearMoneda(pago.pagoMonto) }}</td>
              <td class="text-center">
                <v-chip :color="Number(pago.pagoEstado) === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ Number(pago.pagoEstado) === 1 ? 'Activo' : 'Anulado' }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  title="Ver detalle del pago"
                  @click="verDetalle(pago)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" :disabled="cargando" @click="irPagina(pagina - 1)">
          Anterior
        </v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }} · {{ cantData }} registros</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" :disabled="cargando" @click="irPagina(pagina + 1)">
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
import pagoService from '@/services/pagoService'
import { useAuthStore } from '@/stores/auth'
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
  name: 'PagosList',

  components: { ClientesSeleccionar },

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      pagos: [],
      cantData: 0,
      sumaActivos: 0,
      sumaAnulados: 0,
      pagina: 1,
      dialogCliente: false,
      clienteSeleccionado: null,
      filtros: {
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy),
        estadoFiltro: 0,
        idTerceroFiltro: 0,
        tipoOrigenFiltro: '',
        campoOrdenar: 1,
        orden: 'DESC'
      },
      opcionesEstado: [
        { valor: 0, texto: 'Todos' },
        { valor: 1, texto: 'Activos' },
        { valor: 2, texto: 'Anulados' }
      ],
      opcionesTipoOrigenFiltro: [
        { valor: '', texto: 'Todos los tipos' },
        { valor: 'ABONO_VENTA', texto: 'Abono de venta' },
        { valor: 'CUOTA_VENTA', texto: 'Cuota de venta' }
      ],
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Fecha' },
        { valor: 2, texto: 'Monto' },
        { valor: 3, texto: 'Tipo de origen' },
        { valor: 4, texto: 'Método de pago' }
      ],
      opcionesOrden: [
        { valor: 'DESC', texto: 'Descendente' },
        { valor: 'ASC', texto: 'Ascendente' }
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
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    idEmpresa() {
      this.clienteSeleccionado = null
      this.filtros.idTerceroFiltro = 0
      this.consultar()
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
        await Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
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

      const idTerceroFiltro = Number(this.filtros.idTerceroFiltro)
      if (!Number.isInteger(idTerceroFiltro) || idTerceroFiltro < 0) {
        await Swal.fire('Atención', 'El ID del cliente debe ser un entero mayor o igual a cero', 'warning')
        return
      }

      this.cargando = true
      try {
        const payload = {
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          fechaInicio: this.filtros.fechaInicio,
          fechaFin: this.filtros.fechaFin,
          estadoFiltro: Number(this.filtros.estadoFiltro),
          idTerceroFiltro,
          tipoOrigenFiltro: this.filtros.tipoOrigenFiltro || null
        }

        const { data } = await pagoService.getAll(payload)
        this.pagos = data.data || []
        this.cantData = Number(data.cantData) || 0
        this.sumaActivos = Number(data.sumaActivos) || 0
        this.sumaAnulados = Number(data.sumaAnulados) || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron consultar los pagos'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    onClienteSeleccionado(cliente) {
      this.clienteSeleccionado = cliente
      this.filtros.idTerceroFiltro = Number(cliente.Id)
      this.consultar()
    },

    limpiarCliente() {
      this.clienteSeleccionado = null
      this.filtros.idTerceroFiltro = 0
      this.consultar()
    },

    irANuevo() {
      this.$router.push({ name: 'PagosNuevo' })
    },

    verDetalle(pago) {
      this.$router.push({
        name: 'PagosDetalle',
        params: { EmpId: pago.pagoEmp || this.idEmpresa, PagoId: pago.pagoId }
      })
    },

    nombreTipoOrigen(tipo) {
      return tipo === 'ABONO_VENTA' ? 'Abono de venta' : tipo === 'CUOTA_VENTA' ? 'Cuota de venta' : tipo || '-'
    },

    nombreMetodo(metodo) {
      return metodo === 'TRANSACCION' ? 'Transacción' : metodo === 'EFECTIVO' ? 'Efectivo' : metodo || '-'
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    },

    formatearHora(valor) {
      if (!valor) return ''
      return new Date(valor).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
