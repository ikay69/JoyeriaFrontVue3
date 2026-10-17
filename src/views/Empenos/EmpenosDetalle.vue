<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="tonal"
        size="small"
        title="Volver a empeños"
        @click="volver"
      />
      <div class="flex-grow-1">
        <h1 class="text-h5">Detalle del empeño</h1>
        <div v-if="empeno" class="d-flex align-center ga-2 mt-1">
          <span class="text-body-2 text-medium-emphasis">
            Contrato {{ empeno.empCodigoContrato || '-' }}
          </span>
          <span v-if="empeno.empEstado === 'ACTIVO'" class="text-caption">ACTIVO</span>
          <v-chip
            v-else-if="empeno.empEstado"
            :color="colorEstado(empeno.empEstado)"
            size="small"
            variant="tonal"
          >
            {{ empeno.empEstado }}
          </v-chip>
        </div>
      </div>
    </div>

    <v-card v-if="cargando" class="pa-8 d-flex justify-center" elevation="1">
      <v-progress-circular indeterminate color="primary" />
    </v-card>

    <v-alert v-else-if="!empeno" type="info" variant="tonal">
      No se encontró la información del empeño.
    </v-alert>

    <template v-else>
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="pa-5 h-100" elevation="1">
            <div class="text-subtitle-1 font-weight-medium mb-4">Resumen financiero</div>
            <div class="dato-financiero mb-4">
              <div class="text-caption text-medium-emphasis">Monto inicial</div>
              <div class="text-h5 font-weight-bold">{{ formatearMoneda(empeno.empMontoInicial) }}</div>
            </div>
            <div class="dato-financiero mb-4">
              <div class="text-caption text-medium-emphasis">Saldo capital</div>
              <div class="text-h5 font-weight-bold">{{ formatearMoneda(empeno.empSaldoCapital) }}</div>
            </div>
            <div class="dato-financiero">
              <div class="text-caption text-medium-emphasis">Tasa de interés</div>
              <div class="text-h5 font-weight-bold">{{ formatearTasa(empeno.empTasa) }}</div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card class="pa-5 h-100" elevation="1">
            <div class="text-subtitle-1 font-weight-medium mb-3">Datos del contrato</div>
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Código de contrato</div>
                <div>{{ empeno.empCodigoContrato || '-' }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Método de pago</div>
                <div>{{ empeno.empMetodoPago || '-' }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Fecha de inicio</div>
                <div>{{ formatearFecha(empeno.empFechaInicio) }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Último pago</div>
                <div>{{ formatearFecha(empeno.empFechaUltimoPago) }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Cliente</div>
                <div>{{ empeno.empTerceroNombre || '-' }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ empeno.empTerceroTipoDoc || '' }} {{ empeno.empTerceroNumeroDoc || '' }}
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Ciudad del documento</div>
                <div>{{ empeno.empTerceroCiudadDoc || '-' }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Fecha de creación</div>
                <div>{{ formatearFechaHora(empeno.empFecha) }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-etiqueta">Usuario</div>
                <div>{{ empeno.empUsuario || '-' }}</div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="mt-5" elevation="1">
        <div class="pa-4 pb-2 text-subtitle-1 font-weight-medium">Artículos en garantía</div>
        <div class="tabla-contenedor">
          <v-table class="tabla-detalle" density="comfortable">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Bodega</th>
                <th class="text-end">Cantidad</th>
                <th class="text-end">Valor avalúo</th>
                <th>Observación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!articulos.length">
                <td colspan="6" class="text-center text-medium-emphasis py-5">
                  No hay artículos registrados.
                </td>
              </tr>
              <tr v-for="articulo in articulos" :key="articulo.empartId">
                <td>
                  {{ articulo.empartArticuloNombre || '-' }}
                  <div v-if="articulo.empartPropiedades" class="text-caption text-medium-emphasis">
                    {{ articulo.empartPropiedades }}
                  </div>
                </td>
                <td>{{ articulo.empartBodega || '-' }}</td>
                <td class="text-end">{{ formatearNumero(articulo.empartCantidad) }}</td>
                <td class="text-end">{{ formatearMoneda(articulo.empartValorAvaluo) }}</td>
                <td>{{ articulo.empartObservacion || '-' }}</td>
                <td>{{ articulo.empartEstado || '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>

      <v-card class="mt-5" elevation="1">
        <div class="pa-4 pb-2 text-subtitle-1 font-weight-medium">Períodos</div>
        <div class="tabla-contenedor">
          <v-table class="tabla-detalle" density="comfortable">
            <thead>
              <tr>
                <th class="text-end">N.º</th>
                <th>Fecha inicio</th>
                <th>Vencimiento</th>
                <th class="text-end">Interés esperado</th>
                <th class="text-end">Interés cobrado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!periodos.length">
                <td colspan="6" class="text-center text-medium-emphasis py-5">
                  No hay períodos registrados.
                </td>
              </tr>
              <tr v-for="periodo in periodos" :key="periodo.empperId">
                <td class="text-end">{{ periodo.empperNumero }}</td>
                <td>{{ formatearFecha(periodo.empperFechaInicio) }}</td>
                <td>{{ formatearFecha(periodo.empperFechaVencimiento) }}</td>
                <td class="text-end">{{ formatearMoneda(periodo.empperInteresEsperado) }}</td>
                <td class="text-end">{{ formatearMoneda(periodo.empperInteresCobrado) }}</td>
                <td>{{ periodo.empperEstado || '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>

      <v-card class="mt-5" elevation="1">
        <div class="pa-4 pb-2 text-subtitle-1 font-weight-medium">Pagos</div>
        <div class="tabla-contenedor">
          <v-table class="tabla-detalle" density="comfortable">
            <thead>
              <tr>
                <th>Fecha de pago</th>
                <th>Fecha de registro</th>
                <th>Método</th>
                <th class="text-end">Total</th>
                <th class="text-end">Interés</th>
                <th class="text-end">Capital</th>
                <th class="text-end">Saldo posterior</th>
                <th>Descuento</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pagos.length">
                <td colspan="9" class="text-center text-medium-emphasis py-5">
                  No hay pagos registrados.
                </td>
              </tr>
              <tr v-for="pago in pagos" :key="pago.emppagoId">
                <td>{{ formatearFecha(pago.emppagoFechaPago) }}</td>
                <td>{{ formatearFechaHora(pago.emppagoFechaRegistro) }}</td>
                <td>{{ pago.emppagoMetodoPago || '-' }}</td>
                <td class="text-end">{{ formatearMoneda(pago.emppagoMontoTotal) }}</td>
                <td class="text-end">{{ formatearMoneda(pago.emppagoInteres) }}</td>
                <td class="text-end">{{ formatearMoneda(pago.emppagoCapital) }}</td>
                <td class="text-end">{{ formatearMoneda(pago.emppagoSaldoPosterior) }}</td>
                <td>{{ Number(pago.emppagoConDescuento) ? 'Sí' : 'No' }}</td>
                <td>{{ pago.emppagoUsuario || '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import empenoService from '@/services/empenoService'

export default {
  name: 'EmpenosDetalle',

  data() {
    return {
      cargando: false,
      empeno: null
    }
  },

  computed: {
    articulos() {
      return Array.isArray(this.empeno?.articulos) ? this.empeno.articulos : []
    },
    periodos() {
      return Array.isArray(this.empeno?.periodos) ? this.empeno.periodos : []
    },
    pagos() {
      return Array.isArray(this.empeno?.pagos) ? this.empeno.pagos : []
    }
  },

  created() {
    this.consultarDetalle()
  },

  methods: {
    async consultarDetalle() {
      const idEmpresa = Number(this.$route.params.EmpId)
      const idEmpeno = Number(this.$route.params.EmpenoId)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(idEmpeno) || idEmpeno <= 0) {
        await Swal.fire('Atención', 'La empresa o el empeño indicado no es válido.', 'warning')
        this.volver()
        return
      }

      this.cargando = true
      try {
        const { data } = await empenoService.getById({ idEmpresa, idEmpeno })
        this.empeno = data?.data || null
        if (!this.empeno) {
          const mensaje = data?.msg || 'No se encontró la información del empeño.'
          await Swal.fire('Atención', mensaje, 'warning')
        }
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar el detalle del empeño.'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    volver() {
      this.$router.push({ name: 'Empenos' })
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      const partes = String(valor).slice(0, 10).split('-')
      if (partes.length !== 3) return '-'
      const [anio, mes, dia] = partes.map(Number)
      if (!anio || !mes || !dia) return '-'
      return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO')
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      const fecha = new Date(valor)
      if (Number.isNaN(fecha.getTime())) return '-'
      return fecha.toLocaleString('es-CO')
    },

    formatearNumero(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return String(valor)
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })
    },

    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return String(valor)
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearTasa(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return String(valor)
      return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })} %`
    },

    colorEstado(estado) {
      return {
        FINALIZADO: 'success',
        ADJUDICADO: 'warning',
        EN_MORA: 'error'
      }[estado]
    }
  }
}
</script>

<style scoped>
.dato-financiero {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 0.75rem;
}

.dato-financiero:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dato-etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
  margin-bottom: 0.15rem;
}

.tabla-contenedor {
  overflow-x: auto;
}

.tabla-detalle :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-detalle :deep(.v-table__wrapper > table > tbody > tr > td) {
  white-space: nowrap;
}
</style>
