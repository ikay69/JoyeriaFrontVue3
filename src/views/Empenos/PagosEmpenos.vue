<template>
  <v-container fluid class="pa-6">
    <div class="mb-4">
      <h1 class="text-h5">Pagos de empeños</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Registre el pago de un contrato activo o en mora. El historial de cada contrato está en su detalle.
      </p>
    </div>

    <v-card class="pa-4">
      <v-row dense align="center" class="mb-2">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="textoFiltro"
            label="Buscar por código de contrato"
            maxlength="300"
            clearable
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="consultar"
          />
        </v-col>
        <v-col cols="6" sm="4">
          <v-select
            v-model="estadoEmpeno"
            :items="opcionesEstado"
            item-title="texto"
            item-value="valor"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="4">
          <v-btn color="primary" variant="tonal" block @click="consultar">Consultar</v-btn>
        </v-col>
      </v-row>

      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Último pago</th>
              <th class="text-end">Saldo capital</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="6" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!empenos.length">
              <td colspan="6" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="empeno in empenos" :key="empeno.empId">
              <td>{{ empeno.empCodigoContrato || '-' }}</td>
              <td>
                {{ empeno.empTerceroNombre || '-' }}
                <div class="text-caption text-medium-emphasis">
                  {{ empeno.empTerceroTipoDoc || '' }} {{ empeno.empTerceroNumeroDoc || '' }}
                </div>
              </td>
              <td>{{ formatearFecha(empeno.empFechaUltimoPago) }}</td>
              <td class="text-end">{{ formatearMoneda(empeno.empSaldoCapital) }}</td>
              <td class="text-center">
                <span v-if="empeno.empEstado === 'ACTIVO'">ACTIVO</span>
                <v-chip v-else size="small" color="error" variant="tonal">{{ empeno.empEstado }}</v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-cash"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Registrar pago"
                  @click="abrirPago(empeno)"
                />
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  title="Ver detalle y historial de pagos"
                  @click="irDetalle(empeno)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="buscar(pagina - 1)">Anterior</v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="buscar(pagina + 1)">Siguiente</v-btn>
      </div>
    </v-card>

    <EmpenoPagoDialog
      v-model="dialogPago"
      :id-empresa="idEmpresa"
      :empeno="empenoActivo"
      @guardado="buscar(pagina)"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import empenoService from '@/services/empenoService'
import { useAuthStore } from '@/stores/auth'
import EmpenoPagoDialog from '@/views/Empenos/EmpenoPagoDialog.vue'

export default {
  name: 'PagosEmpenos',

  components: { EmpenoPagoDialog },

  data() {
    return {
      cargando: false,
      empenos: [],
      cantData: 0,
      pagina: 1,
      textoFiltro: '',
      estadoEmpeno: 'ACTIVO',
      dialogPago: false,
      empenoActivo: null,
      opcionesEstado: [
        { valor: 'ACTIVO', texto: 'Activos' },
        { valor: 'EN_MORA', texto: 'En mora' }
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
    async idEmpresa() {
      await this.actualizarPeriodos()
      this.consultar()
    }
  },

  async created() {
    await this.actualizarPeriodos()
    this.consultar()
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    // Pone al día los periodos para que ACTIVO / EN_MORA reflejen la fecha de hoy.
    async actualizarPeriodos() {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) return
      try {
        await empenoService.actualizarPeriodos({ idEmpresa })
      } catch (error) {
        console.error('No se pudieron actualizar los periodos', error)
      }
    },

    async buscar(pagina) {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await empenoService.getAll({
          idEmpresa,
          campoOrdenar: 1,
          orden: 'ASC',
          pagina,
          textoFiltro: String(this.textoFiltro || '').slice(0, 300),
          fechaInicio: null,
          fechaFin: null,
          idTercero: 0,
          estadoEmpeno: this.estadoEmpeno
        })
        this.empenos = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron consultar los empeños'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    abrirPago(empeno) {
      this.empenoActivo = empeno
      this.dialogPago = true
    },

    irDetalle(empeno) {
      this.$router.push({
        name: 'EmpenosDetalle',
        params: {
          EmpId: Number(this.idEmpresa),
          EmpenoId: empeno.empId
        }
      })
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number)
      if (!anio || !mes || !dia) return '-'
      return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO')
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
