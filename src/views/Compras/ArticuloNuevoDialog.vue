<template>
  <v-dialog v-model="dialogVisible" max-width="900" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Artículo nuevo</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <p class="text-caption text-medium-emphasis mb-4">
          El artículo nace sin precio de venta y marcado como no vendible: la compra sólo registra
          el costo. El precio se fija después, en la pantalla de Artículos, cuando la pieza ya fue
          avaluada.
        </p>

        <div class="mb-1 text-subtitle-2">Producto</div>
        <div class="d-flex ga-2 mb-4">
          <v-btn icon="mdi-arrow-right" variant="tonal" @click="abrirDialogProducto" />
          <v-text-field
            :model-value="productoSeleccionado ? productoSeleccionado.proNombre : ''"
            readonly
            placeholder="Seleccione un producto"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              label="Tipo de producto"
              :model-value="productoSeleccionado ? productoSeleccionado.TipoProductoNombre : ''"
              readonly variant="outlined" density="comfortable" hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Categoría"
              :model-value="productoSeleccionado ? productoSeleccionado.CategoriaNombre : ''"
              readonly variant="outlined" density="comfortable" hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Unidad medida"
              :model-value="productoSeleccionado ? productoSeleccionado.UnidadMedidaNombre : ''"
              readonly variant="outlined" density="comfortable" hide-details
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="nombre"
          label="Nombre del artículo"
          maxlength="150"
          counter="150"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea
          v-model="descripcion"
          label="Descripción"
          maxlength="300"
          counter="300"
          rows="3"
          variant="outlined"
          class="mb-2"
        />

        <div class="d-flex align-center justify-space-between mt-2 mb-2">
          <span class="text-subtitle-2">Propiedades</span>
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            title="Volver a pedir las propiedades (si acabas de crear una)"
            @click="refrescarPropiedades"
          />
        </div>

        <v-table density="compact" class="mb-2">
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Tipo valor</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!propiedades.length">
              <td colspan="4" class="text-center py-4 text-medium-emphasis">
                Sin propiedades
              </td>
            </tr>
            <tr v-for="(fila, i) in propiedades" :key="i">
              <td style="min-width: 180px">
                <v-select
                  v-model="fila.idPropiedad"
                  :items="propiedadesDisponibles"
                  item-title="Nombre"
                  item-value="Id"
                  placeholder="Seleccione una propiedad"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="onCambioPropiedad(fila)"
                />
              </td>
              <td style="min-width: 130px">
                <v-text-field
                  :model-value="fila.tipoDato"
                  readonly variant="outlined" density="compact" hide-details
                />
              </td>
              <td style="min-width: 140px">
                <v-text-field
                  v-model="fila.valor"
                  placeholder="Ingrese el valor"
                  maxlength="150"
                  variant="outlined" density="compact" hide-details
                />
              </td>
              <td class="text-center">
                <v-btn icon="mdi-delete" size="small" variant="text" @click="quitarPropiedad(i)" />
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-btn variant="outlined" prepend-icon="mdi-plus" @click="agregarPropiedad">
          Agregar propiedad
        </v-btn>

        <div class="d-flex justify-end ga-2 mt-6">
          <v-btn variant="outlined" @click="cerrar">Cancelar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-content-save" @click="guardar">Guardar</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogProducto" max-width="900">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Seleccionar producto</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogProducto = false" />
        </div>

        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="productosFiltros.textoFiltro"
              label="Buscar"
              maxlength="150"
              clearable density="compact" variant="outlined" hide-details
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-select
              v-model="productosFiltros.campoOrdenar"
              :items="productosOpcionesCampoOrdenar"
              item-title="texto" item-value="valor" label="Ordenar por"
              density="compact" variant="outlined" hide-details
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-btn color="primary" variant="tonal" block @click="buscarProductos(1)">
              Consultar
            </v-btn>
          </v-col>
        </v-row>

        <v-table density="compact">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Tipo de producto</th>
              <th>Categoría</th>
              <th>Unidad de medida</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargandoProductos">
              <td colspan="5" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!productos.length">
              <td colspan="5" class="text-center py-6 text-medium-emphasis">
                No hay productos para mostrar
              </td>
            </tr>
            <tr v-for="prod in productos" :key="prod.proId">
              <td class="text-center">
                <v-btn
                  icon="mdi-check-circle-outline" size="small" variant="text" color="primary"
                  @click="seleccionarProducto(prod)"
                />
              </td>
              <td>{{ prod.proNombre }}</td>
              <td>{{ prod.TipoProductoNombre }}</td>
              <td>{{ prod.CategoriaNombre }}</td>
              <td>{{ prod.UnidadMedidaNombre }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="productosPagina > 1" variant="outlined" @click="buscarProductos(productosPagina - 1)">
            Anterior
          </v-btn>
          <span>Página {{ productosPagina }} de {{ totalPaginasProductos }}</span>
          <v-btn v-if="productosPagina < totalPaginasProductos" variant="outlined" @click="buscarProductos(productosPagina + 1)">
            Siguiente
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import productoService from '@/services/productoService'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'ArticuloNuevoDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], required: true },
    // lo ya escrito para esta linea, para poder reabrir y corregir en vez de empezar de cero
    valorInicial: { type: Object, default: null }
  },

  emits: ['update:modelValue', 'guardar'],

  data() {
    return {
      productoSeleccionado: null,
      nombre: '',
      descripcion: '',
      propiedades: [],
      propiedadesDisponibles: [],

      dialogProducto: false,
      productos: [],
      cargandoProductos: false,
      productosCantData: 0,
      productosPagina: 1,
      productosFiltros: { textoFiltro: '', campoOrdenar: 1, orden: 'ASC' },
      productosOpcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'Fecha de creación' }
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
    totalPaginasProductos() {
      return Math.max(1, Math.ceil(this.productosCantData / 50))
    },
    catalogosStore() {
      return useCatalogosStore()
    }
  },

  watch: {
    async modelValue(visible) {
      if (!visible) return
      // `restaurar` busca el TipoDato de cada propiedad en propiedadesDisponibles, asi que
      // tiene que esperar a que la lista este cargada: sin el await, las propiedades
      // restauradas aparecen con el tipo de dato vacio.
      await this.cargarPropiedadesDisponibles()
      this.restaurar()
    }
  },

  methods: {
    // Al abrir se reconstruye el formulario con lo que la fila ya tenia. `valorInicial` guarda
    // idProducto pero no el nombre del producto: por eso se conserva aparte en _producto.
    restaurar() {
      const inicial = this.valorInicial
      if (!inicial) {
        this.productoSeleccionado = null
        this.nombre = ''
        this.descripcion = ''
        this.propiedades = []
        return
      }
      this.productoSeleccionado = inicial._producto || null
      this.nombre = inicial.Nombre || ''
      this.descripcion = inicial.Descripcion || ''
      this.propiedades = (inicial.Propiedades || []).map((p) => {
        const encontrada = this.propiedadesDisponibles.find((d) => d.Id === p.idPropiedad)
        return {
          idPropiedad: p.idPropiedad,
          tipoDato: encontrada ? encontrada.TipoDato : '',
          valor: p.Valor
        }
      })
    },

    async cargarPropiedadesDisponibles() {
      try {
        this.propiedadesDisponibles = await this.catalogosStore.getPropiedades(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de propiedades'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    async refrescarPropiedades() {
      this.catalogosStore.invalidar(this.idEmpresa)
      await this.cargarPropiedadesDisponibles()
    },

    abrirDialogProducto() {
      this.dialogProducto = true
      this.buscarProductos(1)
    },

    async buscarProductos(pagina) {
      this.cargandoProductos = true
      try {
        const { data } = await productoService.getActivas({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.productosFiltros.campoOrdenar,
          orden: this.productosFiltros.orden,
          pagina,
          textoFiltro: this.productosFiltros.textoFiltro || ''
        })
        this.productos = data.data || []
        this.productosCantData = data.cantData || 0
        this.productosPagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los productos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoProductos = false
      }
    },

    seleccionarProducto(prod) {
      this.productoSeleccionado = {
        proId: prod.proId,
        proNombre: prod.proNombre,
        TipoProductoNombre: prod.TipoProductoNombre,
        CategoriaNombre: prod.CategoriaNombre,
        UnidadMedidaNombre: prod.UnidadMedidaNombre
      }
      this.dialogProducto = false
    },

    agregarPropiedad() {
      this.propiedades.push({ idPropiedad: null, tipoDato: '', valor: '' })
    },

    quitarPropiedad(index) {
      this.propiedades.splice(index, 1)
    },

    onCambioPropiedad(fila) {
      const encontrada = this.propiedadesDisponibles.find((p) => p.Id === fila.idPropiedad)
      fila.tipoDato = encontrada ? encontrada.TipoDato : ''
    },

    guardar() {
      if (!this.productoSeleccionado) {
        Swal.fire('Atención', 'Seleccione el producto del artículo nuevo', 'warning')
        return
      }
      const vNombre = String(this.nombre || '').trim()
      if (!vNombre) {
        Swal.fire('Atención', 'El nombre del artículo no puede estar vacío', 'warning')
        return
      }

      const propiedadesEnviar = this.propiedades
        .filter((fila) => fila.idPropiedad && String(fila.valor || '').trim() !== '')
        .map((fila) => ({ idPropiedad: fila.idPropiedad, Valor: String(fila.valor).trim() }))

      this.$emit('guardar', {
        idProducto: this.productoSeleccionado.proId,
        // el backend lo pasa a mayusculas igual; mandarlo ya normalizado evita que la tabla del
        // formulario muestre algo distinto de lo que se va a guardar.
        Nombre: vNombre.toUpperCase(),
        Descripcion: String(this.descripcion || '').trim() || null,
        Propiedades: propiedadesEnviar,
        // no viaja al backend: es para poder reabrir el dialogo mostrando el producto elegido
        _producto: this.productoSeleccionado
      })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    }
  }
}
</script>
