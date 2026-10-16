<template>
  <v-dialog v-model="dialogVisible" max-width="1100" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar compra</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
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
                title="Seleccionar proveedor"
                @click="dialogProveedor = true"
              />
              <v-text-field
                :model-value="terceroSeleccionado ? terceroSeleccionado.Nombre : ''"
                label="Proveedor"
                placeholder="Todos"
                readonly
                density="compact"
                variant="outlined"
                hide-details
              />
              <v-btn
                v-if="terceroSeleccionado"
                icon="mdi-close"
                variant="text"
                size="small"
                title="Quitar el filtro de proveedor"
                @click="limpiarTercero"
              />
            </div>
          </v-col>
        </v-row>

        <v-row dense align="center" class="mb-2">
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="filtros.fechaInicio"
              label="Desde"
              type="date"
              clearable
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="filtros.fechaFin"
              label="Hasta"
              type="date"
              clearable
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>

        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filtros.textoFiltro"
              label="Buscar"
              maxlength="100"
              :disabled="filtros.campoOrdenar === 5"
              :hint="filtros.campoOrdenar === 5 ? 'No aplica al ordenar por fecha de creación' : ''"
              persistent-hint
              clearable
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="6" sm="3">
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
          <v-col cols="6" sm="3">
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
          <v-col cols="12" sm="3">
            <v-btn color="primary" variant="tonal" block @click="consultar">
              Consultar
            </v-btn>
          </v-col>
        </v-row>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th>Fecha</th>
                <th>Documento</th>
                <th>Proveedor</th>
                <th>Pago</th>
                <th class="text-end">Pagos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="6" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!compras.length">
                <td colspan="6" class="text-center py-6 text-medium-emphasis">
                  No hay registros para mostrar
                </td>
              </tr>
              <tr v-for="compra in compras" :key="compra.compraId">
                <td class="text-center">
                  <v-btn
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="small"
                    variant="text"
                    title="Seleccionar esta compra"
                    @click="seleccionar(compra)"
                  />
                </td>
                <td>{{ formatearFecha(compra.compraFecha) }}</td>
                <td>{{ compra.compraDocumentoSoporte || '-' }}</td>
                <td>
                  {{ compra.compraTercero || '-' }}
                  <div class="text-caption text-medium-emphasis">
                    {{ compra.compraTerceroTipoDoc || '' }} {{ compra.compraTerceroNumeroDoc || '' }}
                  </div>
                </td>
                <td>{{ compra.compraEstadoPago || '-' }}</td>
                <td class="text-end">{{ formatearMoneda(compra.compraSumaPagos) }}</td>
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
      </v-card-text>
    </v-card>
  </v-dialog>

  <ProveedoresSeleccionar
    v-model="dialogProveedor"
    :id-empresa="idEmpresa"
    @seleccionar="onTerceroSeleccionado"
  />
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import ProveedoresSeleccionar from '@/views/Proveedores/ProveedoresSeleccionar.vue'

export default {
  name: 'ComprasSeleccionar',

  components: { ProveedoresSeleccionar },

  props: {
    // v-model: controla si el dialogo esta visible
    modelValue: {
      type: Boolean,
      default: false
    },
    idEmpresa: {
      type: [Number, String],
      required: true
    }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    return {
      cargando: false,
      compras: [],
      cantData: 0,
      pagina: 1,
      dialogProveedor: false,
      terceroSeleccionado: null,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 5,
        orden: 'DESC',
        idTercero: 0,
        fechaInicio: null,
        fechaFin: null
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Documento soporte' },
        { valor: 2, texto: 'Tipo doc. proveedor' },
        { valor: 3, texto: 'N° doc. proveedor' },
        { valor: 4, texto: 'Nombre del proveedor' },
        { valor: 5, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
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
      this.terceroSeleccionado = null
      this.filtros.idTercero = 0
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
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa para buscar compras', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await compraService.getComprasCredito({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro || '',
          idTercero: this.filtros.idTercero || 0,
          fechaInicio: this.filtros.fechaInicio || null,
          fechaFin: this.filtros.fechaFin || null
        })
        this.compras = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las compras a crédito'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
      this.filtros.idTercero = tercero.Id
      this.consultar()
    },

    limpiarTercero() {
      this.terceroSeleccionado = null
      this.filtros.idTercero = 0
      this.consultar()
    },

    seleccionar(compra) {
      this.$emit('seleccionar', { ...compra })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor || '-'
      return `$ ${numero.toLocaleString('es-CO')}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    }
  }
}
</script>
