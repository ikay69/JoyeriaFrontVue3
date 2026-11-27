<template>
  <v-dialog v-model="visible" max-width="760" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center ga-2 pt-4 px-6">
        <v-icon color="primary">mdi-diamond-stone</v-icon>
        Apartar joya
      </v-card-title>
      <v-card-subtitle class="px-6 text-wrap">
        Registra una entrada de inventario en la bolsa RESERVADO a nombre del tercero.
        No se puede editar después de confirmarla.
      </v-card-subtitle>

      <v-card-text class="px-6 pt-4">
        <v-form ref="form" @submit.prevent="confirmar">
          <div class="mb-1 text-subtitle-2">Tercero</div>
          <div class="d-flex ga-2 mb-4">
            <v-btn
              icon="mdi-magnify"
              variant="tonal"
              title="Buscar tercero"
              @click="dialogTercero = true"
            />
            <v-text-field
              :model-value="terceroTexto"
              readonly
              placeholder="Seleccione un tercero"
              :rules="[() => Boolean(terceroSeleccionado) || 'Seleccione un tercero']"
              variant="outlined"
              density="comfortable"
              class="flex-grow-1"
            />
          </div>

          <v-select
            v-model="idBodega"
            :items="bodegas"
            item-title="Nombre"
            item-value="Id"
            label="Bodega"
            :loading="cargandoBodegas"
            :rules="[reglaRequerido]"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />

          <div class="mb-1 text-subtitle-2">Artículo</div>
          <div class="d-flex ga-2 mb-4">
            <v-btn
              icon="mdi-magnify"
              variant="tonal"
              title="Seleccionar un artículo existente"
              @click="dialogArticulo = true"
            />
            <v-btn
              icon="mdi-plus"
              variant="tonal"
              color="primary"
              title="Crear un artículo nuevo"
              :loading="buscandoArticuloNuevo"
              @click="dialogArticuloNuevo = true"
            />
            <v-text-field
              :model-value="articuloTexto"
              readonly
              placeholder="Seleccione o cree un artículo"
              :rules="[() => Boolean(articuloSeleccionado) || 'Seleccione un artículo']"
              variant="outlined"
              density="comfortable"
              class="flex-grow-1"
            />
          </div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cantidad"
                label="Cantidad"
                type="number"
                min="0.0001"
                step="0.0001"
                :rules="[reglaRequerido, reglaMayorQueCero]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="costoUnitario"
                label="Costo unitario (opcional)"
                type="number"
                min="0"
                step="0.01"
                prefix="$"
                :rules="[reglaNoNegativo]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="observaciones"
            label="Observaciones (opcional)"
            maxlength="300"
            counter="300"
            rows="2"
            auto-grow
            variant="outlined"
            density="comfortable"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="outlined" :disabled="guardando" @click="cerrar">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-check"
          :loading="guardando"
          :disabled="guardando"
          @click="confirmar"
        >
          Apartar
        </v-btn>
      </v-card-actions>
    </v-card>

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="terceroSeleccionado = $event"
    />

    <ArticulosSeleccionar
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      @seleccionar="articuloSeleccionado = $event"
    />

    <!-- Crear un articulo sin cerrar el apartado. El v-if remonta el formulario en cada apertura
         para que empiece vacio (mismo patron que AjusteForm). -->
    <v-dialog v-model="dialogArticuloNuevo" max-width="900" scrollable persistent>
      <v-card>
        <ArticulosForm
          v-if="dialogArticuloNuevo"
          en-dialogo
          @creado="onArticuloCreado"
          @cancelar="dialogArticuloNuevo = false"
        />
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
// Apartar joya: un ajuste de ENTRADA a la bolsa RESERVADO con el tercero como propietario
// (/movimiento/newajuste). Uso: <ApartarJoyaDialog v-model="dialog" :id-empresa="idEmpresa" />
// newajuste y newarticulo son SOLO ADMINISTRADOR: la pantalla que lo abre debe restringirlo.
import Swal from 'sweetalert2'
import movimientoService from '@/services/movimientoService'
import articuloService from '@/services/articuloService'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'
import ArticulosSeleccionar from '@/components/common/ArticulosSeleccionar.vue'
import ArticulosForm from '@/views/Inventario/Articulos/ArticulosForm.vue'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'ApartarJoyaDialog',

  components: { TercerosSeleccionar, ArticulosSeleccionar, ArticulosForm },

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], default: null }
  },

  emits: ['update:modelValue', 'guardado'],

  data() {
    return {
      dialogTercero: false,
      dialogArticulo: false,
      dialogArticuloNuevo: false,
      buscandoArticuloNuevo: false,
      guardando: false,
      bodegas: [],
      cargandoBodegas: false,

      terceroSeleccionado: null,
      articuloSeleccionado: null,
      idBodega: null,
      cantidad: 1,
      costoUnitario: '',
      observaciones: ''
    }
  },

  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(valor) {
        this.$emit('update:modelValue', valor)
      }
    },
    catalogosStore() {
      return useCatalogosStore()
    },
    terceroTexto() {
      const tercero = this.terceroSeleccionado
      if (!tercero) return ''
      return [tercero.identificacion, tercero.Nombre].filter(Boolean).join(' ')
    },
    articuloTexto() {
      const articulo = this.articuloSeleccionado
      if (!articulo) return ''
      return articulo.artSKU ? `${articulo.artNombre} (${articulo.artSKU})` : articulo.artNombre
    }
  },

  watch: {
    // Cada apertura empieza limpia y con las bodegas de la empresa actual.
    modelValue(abierto) {
      if (!abierto) return
      this.limpiar()
      this.cargarBodegas()
    }
  },

  methods: {
    reglaRequerido(valor) {
      // 0 es un costo valido: no sirve comprobar la veracidad del valor.
      if (valor === null || valor === undefined || String(valor).trim() === '') return 'Campo obligatorio'
      return true
    },

    reglaMayorQueCero(valor) {
      const numero = Number(valor)
      return (Number.isFinite(numero) && numero > 0) || 'Debe ser mayor que cero'
    },

    reglaNoNegativo(valor) {
      if (valor === null || valor === undefined || String(valor).trim() === '') return true
      const numero = Number(valor)
      return (Number.isFinite(numero) && numero >= 0) || 'No puede ser negativo'
    },

    limpiar() {
      this.terceroSeleccionado = null
      this.articuloSeleccionado = null
      this.idBodega = null
      this.cantidad = 1
      this.costoUnitario = ''
      this.observaciones = ''
      this.$refs.form?.resetValidation()
    },

    async cargarBodegas() {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        this.bodegas = []
        return
      }
      this.cargandoBodegas = true
      try {
        this.bodegas = await this.catalogosStore.getBodegas(idEmpresa)
        // Con una sola bodega se deja elegida
        if (this.bodegas.length === 1) this.idBodega = this.bodegas[0].Id
      } catch (error) {
        Swal.fire('Error', error.response?.data?.msg || 'No se pudo cargar la lista de bodegas', 'error')
      } finally {
        this.cargandoBodegas = false
      }
    },

    // /newarticulo no devuelve el Id ni el SKU: se buscan los activos mas nuevos (campoOrdenar 4,
    // DESC) y se toma el primero con el mismo nombre. Si no aparece, se abre el selector.
    async onArticuloCreado({ Nombre }) {
      this.dialogArticuloNuevo = false
      const buscado = String(Nombre || '').trim().toUpperCase()
      this.buscandoArticuloNuevo = true
      try {
        const { data } = await articuloService.getActivas({
          idEmpresa: Number(this.idEmpresa),
          campoOrdenar: 4,
          orden: 'DESC',
          pagina: 1,
          textoFiltro: null
        })
        const encontrado = (data.data || []).find(
          (art) => String(art.artNombre || '').trim().toUpperCase() === buscado
        )
        if (encontrado) {
          this.articuloSeleccionado = { ...encontrado }
          return
        }
      } catch {
        // si falla la busqueda se cae al selector manual
      } finally {
        this.buscandoArticuloNuevo = false
      }
      this.dialogArticulo = true
    },

    async confirmar() {
      // Un ajuste no se puede editar ni deshacer: un doble envio aparta dos veces.
      if (this.guardando) return

      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      const payload = {
        idEmpresa,
        idBodega: Number(this.idBodega),
        idArticulo: Number(this.articuloSeleccionado.artId),
        TipoMovimiento: 'ENTRADA',
        Motivo: 'AJUSTE',
        idOrigen: null,
        // RESERVADO exige propietario: el tercero para quien se aparta
        BolsaEstado: 'RESERVADO',
        idPropietario: Number(this.terceroSeleccionado.Id),
        Cantidad: Number(this.cantidad),
        // Opcional en RESERVADO: vacio va null ("" lo rechaza el backend); 0 es un costo valido.
        CostoUnitario: String(this.costoUnitario ?? '').trim() === '' ? null : Number(this.costoUnitario),
        Observaciones: String(this.observaciones || '').trim() || null
      }

      this.guardando = true
      try {
        const { data } = await movimientoService.newAjuste(payload)
        await Swal.fire('Éxito', data?.msg || 'Joya apartada', 'success')
        this.$emit('guardado')
        this.visible = false
      } catch (error) {
        const respuesta = error.response?.data
        const mensaje = respuesta?.msg || respuesta?.errors?.[0]?.msg || 'Ocurrió un error al apartar la joya'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cerrar() {
      this.visible = false
    }
  }
}
</script>
