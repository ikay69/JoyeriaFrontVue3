<template>
  <v-dialog v-model="dialogVisible" max-width="960" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar artículo para vender</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="3">
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
            />
          </v-col>
          <v-col cols="12" sm="3">
            <!-- Si quien invoca manda la bodega, el combo queda bloqueado en ese valor -->
            <v-select
              v-model="filtros.idBodega"
              :items="opcionesBodega"
              item-title="Nombre"
              item-value="Id"
              label="Bodega"
              :loading="cargandoBodegas"
              :disabled="bodegaFija !== null"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="2">
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
                <th>Bodega</th>
                <th class="text-right" title="Cantidad en gramos">Gr</th>
                <th class="text-right">Disponible</th>
                <th class="text-right">Precio</th>
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
              <tr v-for="art in articulos" :key="`${art.artId}-${art.artBodegaId}`">
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
                  {{ art.artNombre }}
                  <div v-if="art.artPropiedades" class="text-caption text-medium-emphasis">
                    {{ art.artPropiedades }}
                  </div>
                </td>
                <td>{{ art.artBodegaNombre }}</td>
                <td class="text-right">{{ formatearCantidad(art.artCantidadGramos) }}</td>
                <td class="text-right">{{ formatearCantidad(art.artCantidadDisponible) }}</td>
                <td class="text-right">{{ formatearMoneda(art.artPrecio) }}</td>
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
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'ArticulosVender',

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
    },
    // null/0 = el usuario elige la bodega en el combo (por defecto "Todas").
    // numero > 0 = el combo queda bloqueado en esa bodega.
    idBodega: {
      type: [Number, String],
      default: null
    }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    return {
      cargando: false,
      articulos: [],
      cantData: 0,
      pagina: 1,
      bodegas: [],
      cargandoBodegas: false,
      filtros: {
        idBodega: 0, // 0 = Todas
        textoFiltro: '',
        campoOrdenar: 2, // 2:SKU
        orden: 'ASC'
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'SKU' },
        { valor: 3, texto: 'Descripción' },
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
    },
    catalogosStore() {
      return useCatalogosStore()
    },
    // Bodega recibida por parametro, como entero (> 0), o null si no se recibio
    bodegaFija() {
      const bodega = Number(this.idBodega)
      return Number.isInteger(bodega) && bodega > 0 ? bodega : null
    },
    opcionesBodega() {
      const opciones = [{ Id: 0, Nombre: 'Todas' }, ...this.bodegas]
      // /getvendiblesarticulo acepta bodegas inactivas: si la fija no esta en la lista de
      // activas, se agrega para que el combo no quede mostrando solo el numero.
      if (this.bodegaFija !== null && !opciones.some(b => Number(b.Id) === this.bodegaFija)) {
        opciones.push({ Id: this.bodegaFija, Nombre: `Bodega ${this.bodegaFija}` })
      }
      return opciones
    }
  },

  watch: {
    // cada vez que se abre el dialogo, consulta (por si cambio la empresa o es la primera vez)
    modelValue(visible) {
      if (visible) {
        this.abrir()
      }
    }
  },

  methods: {
    async abrir() {
      // Con bodega por parametro se bloquea en ese valor; sin ella se conserva la ultima elegida
      if (this.bodegaFija !== null) {
        this.filtros.idBodega = this.bodegaFija
      }
      await this.cargarBodegas()
      this.consultar()
    },

    async cargarBodegas() {
      if (!this.idEmpresa) return
      this.cargandoBodegas = true
      try {
        this.bodegas = await this.catalogosStore.getBodegas(Number(this.idEmpresa))
      } catch (error) {
        this.bodegas = []
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoBodegas = false
      }
      // si la bodega elegida ya no esta (p. ej. cambio la empresa), vuelve a "Todas"
      if (this.bodegaFija === null &&
          !this.bodegas.some(b => Number(b.Id) === Number(this.filtros.idBodega))) {
        this.filtros.idBodega = 0
      }
    },

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

      // idBodega tiene que ir como entero: un "2" en texto lo rechaza el backend. null = todas.
      // La del parametro manda sobre la del combo.
      const bodega = this.bodegaFija !== null ? this.bodegaFija : Number(this.filtros.idBodega)
      const idBodega = Number.isInteger(bodega) && bodega > 0 ? bodega : null

      this.cargando = true
      try {
        const { data } = await articuloService.getParaVenta({
          idEmpresa: Number(this.idEmpresa),
          idBodega,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: (this.filtros.textoFiltro || '').trim() || null
        })
        // Una fila por articulo + bodega: cantData cuenta FILAS, no articulos.
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
      // se devuelve el registro completo de la fila
      this.$emit('seleccionar', { ...art })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    // artPrecio llega como CADENA ("350000.00") o null si el articulo no tiene precio
    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    // artCantidadDisponible llega como CADENA con 4 decimales ("5.2370", puede ser gramos)
    formatearCantidad(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })
    }
  }
}
</script>