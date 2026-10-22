<template>
  <v-dialog v-model="dialogVisible" max-width="900" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar producto</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="filtros.textoFiltro"
              label="Buscar"
              maxlength="150"
              clearable
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="consultar"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-select
              v-model="filtros.campoOrden"
              :items="opcionesCampoOrden"
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
              Consultar
            </v-btn>
          </v-col>
        </v-row>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th>Nombre</th>
                <th>Tipo de producto</th>
                <th>Categoría</th>
                <th>Unidad de medida</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="5" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!productos.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  No hay productos para mostrar
                </td>
              </tr>
              <tr v-for="producto in productos" :key="producto.proId">
                <td class="text-center">
                  <v-btn
                    icon="mdi-check-circle-outline"
                    color="primary"
                    size="small"
                    variant="text"
                    title="Seleccionar este producto"
                    @click="seleccionar(producto)"
                  />
                </td>
                <td>{{ producto.proNombre }}</td>
                <td>{{ producto.TipoProductoNombre || '-' }}</td>
                <td>{{ producto.CategoriaNombre || '-' }}</td>
                <td>{{ producto.UnidadMedidaNombre || '-' }}</td>
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
import productoService from '@/services/productoService'

export default {
  name: 'ProductosSeleccionar',

  props: {
    // v-model: controla si el dialogo esta visible
    modelValue: {
      type: Boolean,
      default: false
    },
    // la pantalla que lo invoca SIEMPRE debe pasar la empresa
    idEmpresa: {
      type: [Number, String],
      required: true
    }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    return {
      cargando: false,
      productos: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        campoOrden: 1, // 1:Nombre
        orden: 'ASC'
      },
      opcionesCampoOrden: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'Fecha de creación' }
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
    // cada vez que se abre el dialogo, consulta (por si cambio la empresa o es la primera vez)
    modelValue(visible) {
      if (visible) {
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
        Swal.fire('Atención', 'No se indicó la empresa para buscar productos', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await productoService.getActivas({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrden,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro || ''
        })
        this.productos = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los productos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    seleccionar(producto) {
      this.$emit('seleccionar', {
        proId: producto.proId,
        proNombre: producto.proNombre,
        TipoProductoNombre: producto.TipoProductoNombre,
        CategoriaNombre: producto.CategoriaNombre,
        UnidadMedidaNombre: producto.UnidadMedidaNombre
      })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    }
  }
}
</script>
