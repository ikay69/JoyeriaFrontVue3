<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Compra {{ compra ? '#' + compra.compraId : '' }}
          <v-chip
            v-if="compra"
            :color="esActiva ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActiva ? 'Activa' : 'Anulada' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Una compra no se edita: la única operación correctiva es anularla.
        </p>
      </div>
      <v-btn
        v-if="compra && esActiva"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular compra
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="compra">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cabecera</div>
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Fecha</div>
            <div>{{ formatearFecha(compra.compraFecha) }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Documento soporte</div>
            <div>{{ compra.compraDocumentoSoporte || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Tipo de compra</div>
            <div>{{ compra.compraTipoCompra }}</div>
          </v-col>
          <v-col cols="12" sm="8">
            <div class="text-caption text-medium-emphasis">Tercero</div>
            <div>
              {{ compra.compraTercero }}
              <span class="text-medium-emphasis">
                ({{ compra.compraTerceroTipoDoc || '' }} {{ compra.compraTerceroNumeroDoc || '' }})
              </span>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Subtotal</div>
            <div>{{ formatearMoneda(compra.compraSubtotal) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Descuento</div>
            <div>{{ formatearMoneda(compra.compraDescuento) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Cancelado</div>
            <div>{{ formatearMoneda(compra.compraCancelado) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Saldo</div>
            <div class="font-weight-medium">{{ formatearMoneda(compra.compraSaldo) }}</div>
          </v-col>
        </v-row>

        <template v-if="esCredito">
          <v-divider class="my-4" />
          <v-row dense>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Número de cuotas</div>
              <div>{{ compra.compraNumeroCuotas ?? '-' }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Valor de la cuota</div>
              <div>
                {{ compra.compraValorCuota === null || compra.compraValorCuota === undefined
                  ? 'Valores distintos (ver detalle)'
                  : formatearMoneda(compra.compraValorCuota) }}
              </div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Fecha de compromiso</div>
              <div>{{ compra.compraFechaCompromiso ? formatearFecha(compra.compraFechaCompromiso) : '-' }}</div>
            </v-col>
          </v-row>
        </template>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Artículos comprados</div>
        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Bodega</th>
                <th class="text-end">Cantidad</th>
                <th class="text-end">Costo unidad</th>
                <th class="text-end">Costo total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  Esta compra no tiene líneas
                </td>
              </tr>
              <tr v-for="(linea, i) in lineas" :key="i">
                <td>{{ linea.detArticuloNombre }}</td>
                <td>{{ linea.detBodegaNombre }}</td>
                <td class="text-end">{{ linea.detCantidad }}</td>
                <td class="text-end">{{ formatearMoneda(linea.detCostoUnidad) }}</td>
                <td class="text-end">{{ formatearMoneda(totalLinea(linea)) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>

      <v-card v-if="esCredito" class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cuotas</div>
        <v-table density="compact">
          <thead>
            <tr>
              <th style="width: 80px">N°</th>
              <th class="text-end">Valor</th>
              <th>Fecha de pago</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!cuotas.length">
              <td colspan="4" class="text-center py-6 text-medium-emphasis">
                No hay cuotas registradas
              </td>
            </tr>
            <tr v-for="cuota in cuotas" :key="cuota.cuoId">
              <td>{{ cuota.cuoNumCuota }}</td>
              <td class="text-end">{{ formatearMoneda(cuota.cuoValorCuota) }}</td>
              <td>{{ cuota.cuoFechaPago ? formatearFecha(cuota.cuoFechaPago) : '-' }}</td>
              <td class="text-center">
                <v-chip
                  :color="cuota.cuoEstado === 'CANCELADA' ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ etiquetaEstadoCuota(cuota.cuoEstado) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
        <p class="text-caption text-medium-emphasis mt-3 mb-0">
          Marcar una cuota como pagada no mueve caja ni recalcula el saldo de la compra: es un
          registro informativo. El movimiento de caja llegará con el módulo de Abonos.
        </p>
      </v-card>

      <v-card v-if="!esActiva" class="pa-6 mb-4" elevation="1" color="error" variant="tonal">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="text-caption">Motivo</div>
            <div>{{ compra.compraMotivoAnulacion || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Fecha</div>
            <div>{{ compra.compraFechaAnulacion ? formatearFecha(compra.compraFechaAnulacion) : '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Anulada por</div>
            <div>{{ compra.compraUsuarioAnulador || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'

export default {
  name: 'CompraDetalle',

  data() {
    return {
      cargando: false,
      anulando: false,
      compra: null,
      lineas: [],
      cuotas: []
    }
  },

  computed: {
    // La empresa sale de la URL, NO del store. Si el usuario cambia de empresa en la barra
    // superior con el detalle abierto, anularcompra y las cuotas tienen que seguir apuntando a
    // la compra correcta. Por eso el :EmpId de la ruta no es decorativo.
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    idCompra() {
      return Number(this.$route.params.ComId)
    },
    esActiva() {
      // compraEstado es 1 activa / 0 anulada. No es "pagada/pendiente".
      return this.compra?.compraEstado === 1
    },
    esCredito() {
      return this.compra?.compraTipoCompra === 'CREDITO'
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data } = await compraService.getById({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra
        })
        this.compra = data.data
        this.lineas = data.data.lineas || []
        this.cuotas = data.data.cuotas || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la compra'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    async anular() {
      const { value: motivo } = await Swal.fire({
        title: '¿Anular esta compra?',
        // Decirlo aqui no es cortesia: sin esto el usuario supone que el inventario se corrige
        // solo, y no se corrige.
        html:
          '<p style="text-align:left">Anular <b>no revierte el inventario ni la caja</b>. Sólo marca la compra ' +
          'y guarda el motivo, quién anuló y cuándo. El ajuste de existencias es manual, por el ' +
          'módulo de Ajustes.</p>' +
          '<p style="text-align:left">Escriba el motivo (entre 5 y 300 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 300 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        // Se valida aqui para no gastar un viaje en un 400 evitable: el backend exige lo mismo.
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 5) return 'El motivo debe tener al menos 5 caracteres'
          if (texto.length > 300) return 'El motivo no puede superar los 300 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulando = true
      try {
        const { data } = await compraService.anular({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Compra anulada', 'success')
        // Se recarga en vez de parchear el estado local: una llamada, y la pantalla se
        // reconfigura sola (chip rojo, boton fuera, tarjeta de anulacion).
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    // cuoEstado 'CANCELADA' significa PAGADA (sentido coloquial de "cancelar una cuota"), mientras
    // compraEstado 0 significa ANULADA. Son opuestos con nombres parecidos y en la misma
    // pantalla, asi que el front traduce: al backend siguen viajando PENDIENTE y CANCELADA.
    etiquetaEstadoCuota(estado) {
      return estado === 'CANCELADA' ? 'Pagada' : 'Pendiente'
    },

    totalLinea(linea) {
      const total = (Number(linea.detCantidad) || 0) * (Number(linea.detCostoUnidad) || 0)
      return Math.round(total * 100) / 100
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
