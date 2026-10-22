<template>
  <v-dialog v-model="dialogVisible" max-width="1100" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar artículo a consumir</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <div class="text-caption text-medium-emphasis mb-3">
          {{ Number(idTercero) > 0 ? 'Bolsa: Recibido de taller' : 'Bolsa: Disponible' }}
        </div>

        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filtros.textoFiltro"
              label="Buscar"
              maxlength="150"
              :disabled="filtros.campoOrdenar === 4"
              :hint="filtros.campoOrdenar === 4 ? 'No aplica al ordenar por fecha de creación' : ''"
              persistent-hint
              clearable
              density="compact"
              variant="outlined"
              hide-details="auto"
              @keyup.enter="consultar"
            />
          </v-col>
          <v-col cols="6" sm="4">
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
          <v-col cols="6" sm="2">
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
          <v-col cols="12" sm="2">
            <v-btn color="primary" variant="tonal" block @click="consultar">
              Buscar
            </v-btn>
          </v-col>
        </v-row>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Tipo producto</th>
                <th class="text-end">Disponible</th>
                <th class="text-end">Costo unitario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="7" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!articulos.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  No hay registros para mostrar
                </td>
              </tr>
              <tr v-for="art in articulos" :key="art.artId">
                <td class="text-center">
                  <v-btn
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="small"
                    variant="text"
                    title="Seleccionar este artículo"
                    @click="seleccionar(art)"
                  />
                </td>
                <td>{{ art.artSKU }}</td>
                <td>
                  {{ art.artNombre || '-' }}
                  <div v-if="art.artPropiedades" class="text-caption text-medium-emphasis">
                    {{ art.artPropiedades }}
                  </div>
                </td>
                <td>{{ art.artCategoria || '-' }}</td>
                <td>{{ art.artTipoProducto || '-' }}</td>
                <td class="text-end">{{ formatearCantidad(art.artCantidadDisponible) }}</td>
                <td class="text-end">
                  <!-- null a proposito desde el backend: la bolsa no tiene costo y hay que costearla -->
                  <span v-if="art.artCostoUnitario === null" class="text-warning">Sin costo</span>
                  <span v-else>{{ formatearMoneda(art.artCostoUnitario) }}</span>
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import articuloService from '@/services/articuloService'

export default {
  name: 'ArticulosProduccion',

  props: {
    // v-model: controla si el dialogo esta visible
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], required: true },
    // obligatorio para consultar: la ruta lee la bolsa de UNA bodega
    idBodega: { type: [Number, String], default: null },
    // null/0 -> bolsa DISPONIBLE; > 0 -> bolsa RECIBIDO_DE_TALLER de ese tercero
    idTercero: { type: [Number, String], default: null }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    return {
      cargando: false,
      articulos: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 1, // 1:Nombre
        orden: 'ASC'
      },
      // Sin el 3 (Descripcion): /getproduccionarticulo lo rechaza con "Campo de orden invalido"
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'SKU' },
        { valor: 4, texto: 'Fecha de creación' }
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
    // cada vez que se abre consulta: la bodega y el tercero cambian segun la fila que lo abre
    modelValue(visible) {
      if (visible) {
        this.articulos = []
        this.cantData = 0
        this.consultar()
      }
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
        Swal.fire('Atención', 'No se indicó la empresa para buscar artículos', 'warning')
        return
      }

      const idBodega = Number(this.idBodega)
      if (!Number.isInteger(idBodega) || idBodega <= 0) {
        Swal.fire('Atención', 'Seleccione una bodega antes de buscar artículos', 'warning')
        return
      }

      const tercero = Number(this.idTercero)
      const idTercero = Number.isInteger(tercero) && tercero > 0 ? tercero : null

      this.cargando = true
      try {
        const { data } = await articuloService.getParaProduccion({
          idEmpresa: Number(this.idEmpresa),
          idBodega,
          idTercero,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: (this.filtros.textoFiltro || '').trim() || null
        })
        this.articulos = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los artículos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    seleccionar(art) {
      // se devuelve el registro completo de la fila (incluye costo y cantidad disponible)
      this.$emit('seleccionar', { ...art })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    formatearCantidad(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })
    }
  }
}
</script>
