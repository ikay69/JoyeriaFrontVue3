<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Movimiento {{ movimiento ? '#' + movimiento.movcajId : '' }}
          <v-chip
            v-if="movimiento"
            :color="esActivo ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActivo ? 'Activo' : 'Anulado' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Un movimiento de caja no se edita: la única operación correctiva es anularlo.
        </p>
      </div>
      <v-btn
        v-if="movimiento && esActivo"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular movimiento
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="movimiento">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Datos del movimiento</div>
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Fecha</div>
            <div>{{ formatearFechaHora(movimiento.movcajFecha) }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Tipo de movimiento</div>
            <div>
              <v-chip
                :color="movimiento.movcajTipo === 'ENTRADA' ? 'success' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ movimiento.movcajTipo }}
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Motivo</div>
            <div>{{ textoMotivo(movimiento.movcajMotivo) }}</div>
          </v-col>

          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Método de pago</div>
            <div>{{ movimiento.movcajMetodoPago }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Valor</div>
            <div class="text-subtitle-1 font-weight-medium">
              {{ formatearMoneda(movimiento.movcajValor) }}
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Usuario</div>
            <div>{{ movimiento.movcajUsuario || '-' }}</div>
          </v-col>

          <v-col cols="12">
            <div class="text-caption text-medium-emphasis">Observaciones</div>
            <div>{{ movimiento.movcajObservaciones || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>

      <!--
        El documento que genero el movimiento. Hoy solo Compras tiene pantalla: para los otros
        siete origenes el boton sale deshabilitado y el title dice por que, en vez de desaparecer
        sin explicacion.
      -->
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Origen</div>
        <div class="d-flex align-center flex-wrap ga-4">
          <div>
            <div class="text-caption text-medium-emphasis">Documento</div>
            <div>{{ textoOrigen(movimiento) }}</div>
          </div>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-file-document-outline"
            :disabled="!origenDisponible"
            :title="origenDisponible ? '' : motivoOrigenNoDisponible(movimiento.movcajTipoOrigen)"
            @click="irAlOrigen"
          >
            {{ etiquetaBotonOrigen(movimiento.movcajTipoOrigen) }}
          </v-btn>
        </div>
      </v-card>

      <v-card v-if="!esActivo" class="pa-6" elevation="1">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Fecha de anulación</div>
            <div>{{ formatearFechaHora(movimiento.movcajFechaAnulacion) }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Usuario que anuló</div>
            <div>{{ movimiento.movcajUsuarioAnulador || '-' }}</div>
          </v-col>
          <v-col cols="12">
            <div class="text-caption text-medium-emphasis">Motivo de la anulación</div>
            <div>{{ movimiento.movcajMotivoAnulacion || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import movimientoCajaService from '@/services/movimientoCajaService'
import {
  textoMotivo,
  textoOrigen,
  origenDe,
  etiquetaBotonOrigen,
  motivoOrigenNoDisponible
} from '@/utils/movimientoCaja'

export default {
  name: 'MovimientoCajaDetalle',

  data() {
    return {
      movimiento: null,
      cargando: false,
      anulando: false
    }
  },

  computed: {
    // De la URL, NO del store: el selector de empresa vive en un v-app-bar persistente que no
    // navega, asi que si el usuario lo cambia con el detalle abierto, anularmovimientocaja y el
    // salto al documento de origen tienen que seguir apuntando a la empresa de ESTE registro.
    // Por eso esta pantalla tampoco lleva watch sobre la empresa.
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },

    idMovimientoCaja() {
      return Number(this.$route.params.MovId)
    },

    esActivo() {
      return this.movimiento ? this.movimiento.movcajEstado === 1 : false
    },

    origenDisponible() {
      if (!this.movimiento) return false
      const origen = origenDe(this.movimiento.movcajTipoOrigen)
      return Boolean(origen && origen.ruta && this.movimiento.movcajOrigenId)
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    // Se exponen como metodos para poder llamarlos desde la plantilla.
    textoMotivo,
    textoOrigen,
    etiquetaBotonOrigen,
    motivoOrigenNoDisponible,

    async cargar() {
      this.cargando = true
      try {
        const { data } = await movimientoCajaService.getById({
          idEmpresa: this.idEmpresa,
          idMovimientoCaja: this.idMovimientoCaja
        })
        this.movimiento = data.data || null
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el movimiento de caja'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    // El id del documento es movcajOrigenId, y el nombre del parametro lo dice el mapa de
    // ORIGENES: cada pantalla llama distinto al suyo (ComId en Compras).
    irAlOrigen() {
      const origen = origenDe(this.movimiento.movcajTipoOrigen)
      if (!origen || !origen.ruta) return
      this.$router.push({
        name: origen.ruta,
        params: {
          EmpId: this.idEmpresa,
          [origen.paramId]: this.movimiento.movcajOrigenId
        }
      })
    },

    async anular() {
      // Un movimiento nacido de una compra o una venta se anula igual que un ajuste, pero hay que
      // decir que esto solo marca el movimiento de caja: el documento que lo genero sigue vivo.
      const aviso = this.movimiento.movcajMotivo === 'AJUSTE'
        ? ''
        : `<p style="text-align:left">Este movimiento nació de un documento de tipo ` +
          `<b>${this.movimiento.movcajTipoOrigen || this.movimiento.movcajMotivo}</b>. Anularlo ` +
          `aquí <b>no anula ese documento</b>: eso se hace desde su propio módulo.</p>`

      const { value: motivo } = await Swal.fire({
        title: '¿Anular este movimiento de caja?',
        html: aviso + '<p style="text-align:left">Escriba el motivo (entre 6 y 255 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 255 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        // Se valida aqui para no gastar un viaje en un 400 evitable: el backend exige lo mismo.
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 6) return 'El motivo debe tener al menos 6 caracteres'
          if (texto.length > 255) return 'El motivo no puede superar los 255 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulando = true
      try {
        const { data } = await movimientoCajaService.anular({
          idEmpresa: this.idEmpresa,
          idMovimientoCaja: this.idMovimientoCaja,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Movimiento de caja anulado', 'success')
        // Se recarga en vez de parchear el estado local: una llamada, y la pantalla se
        // reconfigura sola (chip rojo, boton fuera, tarjeta de anulacion dentro).
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular el movimiento de caja'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    // Dos decimales forzados: en caja se sigue el centavo.
    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (Number.isNaN(numero)) return String(valor)
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>
