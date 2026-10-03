<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">Nuevo ajuste</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Un ajuste mueve existencias de inmediato y no se puede editar después de confirmarlo.
        </p>
      </div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.TipoMovimiento"
              :items="opcionesTipoMovimiento"
              item-title="texto"
              item-value="valor"
              label="Tipo de movimiento"
              :rules="[reglaRequerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.BolsaEstado"
              :items="opcionesBolsaEstado"
              item-title="texto"
              item-value="valor"
              label="Estado"
              :rules="[reglaRequerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.idBodega"
              :items="bodegas"
              item-title="Nombre"
              item-value="Id"
              label="Bodega"
              :loading="cargandoBodegas"
              :rules="[reglaRequerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <div class="mb-1 text-subtitle-2">Propietario</div>
        <div class="d-flex ga-2 mb-4">
          <v-btn
            icon="mdi-arrow-right"
            variant="tonal"
            title="Seleccionar un tercero"
            @click="dialogTercero = true"
          />
          <v-text-field
            :model-value="textoPropietario"
            readonly
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
          <!-- Sin propietario el ajuste queda como "Propio" (idPropietario null): este boton es la
               unica forma de volver a ese estado despues de elegir un tercero. -->
          <v-btn
            variant="outlined"
            :disabled="!terceroSeleccionado"
            @click="marcarPropio"
          >
            Propio
          </v-btn>
        </div>

        <div class="mb-1 text-subtitle-2">Artículo</div>
        <div class="d-flex ga-2 mb-2">
          <v-btn
            icon="mdi-arrow-right"
            variant="tonal"
            title="Seleccionar un artículo"
            @click="dialogArticulo = true"
          />
          <v-text-field
            :model-value="articuloSeleccionado ? articuloSeleccionado.artNombre : ''"
            readonly
            placeholder="Seleccione un artículo"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              label="SKU"
              :model-value="articuloSeleccionado ? articuloSeleccionado.artSKU : ''"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.Cantidad"
              label="Cantidad"
              type="number"
              min="0"
              step="0.01"
              :rules="[reglaRequerido, reglaMayorQueCero]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.CostoUnitario"
              label="Costo unitario"
              type="number"
              min="0"
              step="0.01"
              :rules="[reglaRequerido, reglaNoNegativo]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-textarea
          v-model="form.Observaciones"
          label="Observaciones"
          maxlength="300"
          counter="300"
          rows="3"
          auto-grow
          variant="outlined"
          density="comfortable"
        />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-check"
            :loading="guardando"
            :disabled="guardando"
            type="submit"
          >
            Confirmar
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />

    <ArticulosSeleccionar
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      @seleccionar="onArticuloSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import movimientoService from '@/services/movimientoService'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'
import ArticulosSeleccionar from '@/components/common/ArticulosSeleccionar.vue'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'AjusteForm',

  components: { TercerosSeleccionar, ArticulosSeleccionar },

  data() {
    return {
      guardando: false,
      dialogTercero: false,
      dialogArticulo: false,

      bodegas: [],
      cargandoBodegas: false,

      terceroSeleccionado: null,
      articuloSeleccionado: null,

      form: {
        TipoMovimiento: 'ENTRADA',
        BolsaEstado: 'DISPONIBLE',
        idBodega: null,
        Cantidad: 1,
        CostoUnitario: 0,
        Observaciones: ''
      },

      opcionesTipoMovimiento: [
        { valor: 'ENTRADA', texto: 'Entrada' },
        { valor: 'SALIDA', texto: 'Salida' }
      ],
      // Mismas etiquetas legibles que Existencias.vue, pero sin la opcion "Todas": aqui el estado
      // es un dato del movimiento, no un filtro.
      opcionesBolsaEstado: [
        { valor: 'DISPONIBLE', texto: 'Disponible' },
        { valor: 'RESERVADO', texto: 'Reservado' },
        { valor: 'PRESTADO_A_TALLER', texto: 'Prestado a taller' },
        { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller' },
        { valor: 'EN_GARANTIA_EMPENO', texto: 'En garantía/empeño' },
        { valor: 'EN_REPARACION', texto: 'En reparación' }
      ]
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    catalogosStore() {
      return useCatalogosStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
    textoPropietario() {
      return this.terceroSeleccionado ? this.terceroSeleccionado.Nombre : 'Propio'
    }
  },

  created() {
    this.cargarBodegas()
  },

  methods: {
    reglaRequerido(valor) {
      // 0 es un costo unitario valido, asi que no sirve comprobar la veracidad del valor.
      if (valor === null || valor === undefined || valor === '') return 'Campo obligatorio'
      return true
    },

    reglaMayorQueCero(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero) || numero <= 0) return 'Debe ser mayor que cero'
      return true
    },

    reglaNoNegativo(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero) || numero < 0) return 'No puede ser negativo'
      return true
    },

    async cargarBodegas() {
      if (!this.idEmpresa) return

      this.cargandoBodegas = true
      try {
        this.bodegas = await this.catalogosStore.getBodegas(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoBodegas = false
      }
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
    },

    marcarPropio() {
      this.terceroSeleccionado = null
    },

    onArticuloSeleccionado(art) {
      this.articuloSeleccionado = art
    },

    async confirmar() {
      // Guarda de reentrada, lo primero de todo: el boton es type="submit" sobre un <form> real,
      // asi que Enter en cualquier campo llega aqui sin pasar por el estado de carga del boton.
      // Un ajuste no se puede editar ni deshacer: un doble envio mueve las existencias dos veces.
      if (this.guardando) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      // El articulo no vive en un campo del v-form (es un readonly alimentado por el dialogo), asi
      // que validate() no lo cubre.
      if (!this.articuloSeleccionado) {
        Swal.fire('Atención', 'Debe seleccionar un artículo', 'warning')
        return
      }

      const payload = {
        idEmpresa: this.idEmpresa,
        idBodega: this.form.idBodega,
        idArticulo: this.articuloSeleccionado.artId,
        TipoMovimiento: this.form.TipoMovimiento,
        BolsaEstado: this.form.BolsaEstado,
        idPropietario: this.terceroSeleccionado ? this.terceroSeleccionado.Id : null,
        Cantidad: Number(this.form.Cantidad),
        CostoUnitario: Number(this.form.CostoUnitario),
        Observaciones: this.form.Observaciones.trim() || null
      }

      this.guardando = true
      try {
        const { data } = await movimientoService.newAjuste(payload)
        await Swal.fire('Éxito', data.msg || 'Movimiento registrado', 'success')
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al registrar el ajuste'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
