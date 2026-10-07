<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Nueva orden de producción</h1>

    <v-card class="pa-6" elevation="1">
      <!--
        Una orden no se edita: el backend solo tiene alta y consulta. El "editar" del patron
        habitual es aqui una pantalla de detalle de solo lectura.
      -->
      <v-form ref="form" @submit.prevent="confirmar">
        <v-textarea
          v-model="observaciones"
          label="Observaciones"
          maxlength="300"
          counter="300"
          rows="2"
          variant="outlined"
          class="mb-6"
        />

        <!-- ===================== CONSUMOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos consumidos</span>
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis">{{ consumos.length }} / 200</span>
            <v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              title="Volver a pedir las bodegas (si acabas de crear una)"
              @click="refrescarBodegas"
            />
          </div>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 200px">Bolsa</th>
                <th style="min-width: 220px">Propietario</th>
                <th style="min-width: 110px">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!consumos.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos un artículo consumido
                </td>
              </tr>
              <tr v-for="(fila, i) in consumos" :key="i">
                <td>
                  <v-select
                    v-model="fila.idBodega"
                    :items="bodegas"
                    item-title="Nombre"
                    item-value="Id"
                    placeholder="Bodega"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Elegir el artículo"
                    @click="abrirSelectorArticulo('consumos', i)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta fila"
                    @click="quitarFila('consumos', i)"
                  />
                </td>
                <td>
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <div v-if="fila.articuloSKU" class="text-caption text-medium-emphasis">
                    {{ fila.articuloSKU }}
                  </div>
                </td>
                <td>
                  <v-select
                    v-model="fila.BolsaEstado"
                    :items="opcionesBolsa"
                    item-title="texto"
                    item-value="valor"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @update:model-value="onBolsaCambiada(fila)"
                  />
                </td>
                <td>
                  <!--
                    El propietario SOLO aplica a RECIBIDO_DE_TALLER: es el dueño del oro que el
                    taller devolvio. Con DISPONIBLE el material ya es de la casa y el campo
                    viaja como null.
                  -->
                  <div v-if="fila.BolsaEstado === 'RECIBIDO_DE_TALLER'" class="d-flex ga-1 align-center">
                    <v-btn
                      icon="mdi-account-search"
                      variant="tonal"
                      size="small"
                      title="Elegir el propietario"
                      @click="abrirSelectorTercero(i)"
                    />
                    <span v-if="fila.propietarioNombre">{{ fila.propietarioNombre }}</span>
                    <span v-else class="text-medium-emphasis">Sin propietario</span>
                  </div>
                  <span v-else class="text-medium-emphasis">No aplica</span>
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.Cantidad"
                    control-variant="hidden"
                    :min="0"
                    :step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="consumos.length >= 200"
          class="mb-6"
          @click="agregarConsumo"
        >
          Agregar consumo
        </v-btn>

        <!-- ===================== PRODUCIDOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos producidos</span>
          <span class="text-caption text-medium-emphasis">{{ producidos.length }} / 200</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 110px">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!producidos.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos un artículo producido
                </td>
              </tr>
              <tr v-for="(fila, i) in producidos" :key="i">
                <td>
                  <v-select
                    v-model="fila.idBodega"
                    :items="bodegas"
                    item-title="Nombre"
                    item-value="Id"
                    placeholder="Bodega"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Elegir el artículo"
                    @click="abrirSelectorArticulo('producidos', i)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta fila"
                    @click="quitarFila('producidos', i)"
                  />
                </td>
                <td>
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <div v-if="fila.articuloSKU" class="text-caption text-medium-emphasis">
                    {{ fila.articuloSKU }}
                  </div>
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.Cantidad"
                    control-variant="hidden"
                    type="number"
                    min="1"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="producidos.length >= 200"
          class="mb-4"
          @click="agregarProducido"
        >
          Agregar producido
        </v-btn>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="guardando"
            :disabled="guardando"
            type="submit"
          >
            Guardar
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <!--
      Un solo selector de articulos y un solo selector de terceros para toda la pantalla: a donde
      devuelven la seleccion lo dice filaActiva. Con DOS tablas el indice solo no basta, hace
      falta tambien saber de cual es.
    -->
    <ArticulosSeleccionar
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      @seleccionar="onArticuloSeleccionado"
    />

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import produccionService from '@/services/produccionService'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'
import ArticulosSeleccionar from '@/components/common/ArticulosSeleccionar.vue'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'

export default {
  name: 'OrdenProduccionForm',

  components: { ArticulosSeleccionar, TercerosSeleccionar },

  data() {
    return {
      observaciones: '',
      consumos: [],
      producidos: [],
      bodegas: [],
      guardando: false,
      dialogArticulo: false,
      dialogTercero: false,
      // { tabla: 'consumos' | 'producidos', indice: n } o null. La tabla hace falta porque hay
      // dos y el indice por si solo es ambiguo.
      filaActiva: null,
      // Para el selector de terceros, que solo lo usan los consumos: guarda el indice.
      indicePropietario: null,
      opcionesBolsa: [
        { valor: 'DISPONIBLE', texto: 'Disponible' },
        { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller' }
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
    }
  },

  watch: {
    // Esta pantalla vive bajo un v-app-bar persistente cuyo selector de empresa NO navega, asi
    // que no se remonta al cambiar de empresa. Sin este reset, el combo de bodega seguiria
    // mostrando las de la empresa anterior y las filas ya elegidas llevarian un idBodega,
    // idArticulo e idPropietario ajenos, mientras que el idEmpresa del payload pasaria a ser la
    // empresa NUEVA: una escritura silenciosa contra la empresa equivocada.
    idEmpresa() {
      this.consumos = []
      this.producidos = []
      this.agregarConsumo()
      this.agregarProducido()
      this.cargarBodegas()
      // Si no se limpian, apuntarian a indices de los arreglos viejos y los callbacks de los
      // dialogos leerian una fila undefined.
      this.filaActiva = null
      this.indicePropietario = null
    }
  },

  created() {
    this.cargarBodegas()
    this.agregarConsumo()
    this.agregarProducido()
  },

  methods: {
    async cargarBodegas() {
      try {
        this.bodegas = await this.catalogosStore.getBodegas(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    async refrescarBodegas() {
      this.catalogosStore.invalidar(this.idEmpresa)
      await this.cargarBodegas()
    },

    agregarConsumo() {
      this.consumos.push({
        idBodega: null,
        idArticulo: null,
        articuloNombre: '',
        articuloSKU: '',
        BolsaEstado: 'DISPONIBLE',
        idPropietario: null,
        propietarioNombre: '',
        Cantidad: 1
      })
    },

    agregarProducido() {
      this.producidos.push({
        idBodega: null,
        idArticulo: null,
        articuloNombre: '',
        articuloSKU: '',
        Cantidad: 1
      })
    },

    quitarFila(tabla, indice) {
      this[tabla].splice(indice, 1)
      // Tras el splice el indice puede apuntar fuera del arreglo o a otra fila, y los callbacks
      // de los dialogos lo dereferencian: dejarlo puesto revienta el guardado o el render.
      this.filaActiva = null
      this.indicePropietario = null
    },

    // Pasar de RECIBIDO_DE_TALLER a DISPONIBLE tiene que borrar el propietario ya elegido, o
    // viajaria un idPropietario en una fila que, por contrato, no lo lleva.
    onBolsaCambiada(fila) {
      if (fila.BolsaEstado !== 'RECIBIDO_DE_TALLER') {
        fila.idPropietario = null
        fila.propietarioNombre = ''
      }
    },

    abrirSelectorArticulo(tabla, indice) {
      this.filaActiva = { tabla, indice }
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(art) {
      if (!this.filaActiva) return
      const fila = this[this.filaActiva.tabla][this.filaActiva.indice]
      if (!fila) return
      fila.idArticulo = art.artId
      fila.articuloNombre = art.artNombre
      fila.articuloSKU = art.artSKU
      this.filaActiva = null
    },

    abrirSelectorTercero(indice) {
      this.indicePropietario = indice
      this.dialogTercero = true
    },

    onTerceroSeleccionado(tercero) {
      if (this.indicePropietario === null) return
      const fila = this.consumos[this.indicePropietario]
      if (!fila) return
      fila.idPropietario = tercero.Id
      fila.propietarioNombre = tercero.Nombre
      this.indicePropietario = null
    },

    // Se valida aqui para no gastar un viaje en un 400 evitable, y para poder decir QUE fila de
    // QUE tabla esta mal: el backend solo diria que el payload es invalido.
    validar() {
      if (!this.consumos.length) return 'Agregue al menos un artículo consumido'
      if (!this.producidos.length) return 'Agregue al menos un artículo producido'

      for (let i = 0; i < this.consumos.length; i += 1) {
        const fila = this.consumos[i]
        const n = i + 1
        if (!fila.idBodega) return `Elija la bodega del consumo ${n}`
        if (!fila.idArticulo) return `Elija el artículo del consumo ${n}`
        if (!fila.BolsaEstado) return `Elija la bolsa del consumo ${n}`
        if (fila.BolsaEstado === 'RECIBIDO_DE_TALLER' && !fila.idPropietario) {
          return `Elija el propietario del consumo ${n}: con la bolsa Recibido de taller es obligatorio`
        }
        if (!(Number(fila.Cantidad) > 0)) return `La cantidad del consumo ${n} debe ser mayor que cero`
      }

      for (let i = 0; i < this.producidos.length; i += 1) {
        const fila = this.producidos[i]
        const n = i + 1
        if (!fila.idBodega) return `Elija la bodega del producido ${n}`
        if (!fila.idArticulo) return `Elija el artículo del producido ${n}`
        if (!(Number(fila.Cantidad) > 0)) return `La cantidad del producido ${n} debe ser mayor que cero`
      }

      return null
    },

    async confirmar() {
      // Vuetify 3: validate() es asincrono y devuelve { valid }, no un booleano.
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const error = this.validar()
      if (error) {
        Swal.fire('Atención', error, 'warning')
        return
      }

      this.guardando = true
      try {
        const { data } = await produccionService.create({
          idEmpresa: this.idEmpresa,
          Observaciones: this.observaciones.trim(),
          consumos: this.consumos.map((fila) => ({
            idArticulo: Number(fila.idArticulo),
            idBodega: Number(fila.idBodega),
            BolsaEstado: fila.BolsaEstado,
            // null con DISPONIBLE: el propietario solo existe para el material que devolvio el
            // taller.
            idPropietario: fila.BolsaEstado === 'RECIBIDO_DE_TALLER' ? Number(fila.idPropietario) : null,
            Cantidad: this.redondear(fila.Cantidad)
          })),
          producidos: this.producidos.map((fila) => ({
            idArticulo: Number(fila.idArticulo),
            idBodega: Number(fila.idBodega),
            Cantidad: this.redondear(fila.Cantidad)
          }))
        })
        // El await es intencional: primero se ve el mensaje, despues se navega.
        await Swal.fire('Éxito', data.msg || 'Orden de producción registrada', 'success')
        // Al volver, el List se reconstruye y su created() vuelve a consultar.
        this.$router.back()
      } catch (err) {
        const mensaje = err.response?.data?.msg || 'Ocurrió un error al registrar la orden de producción'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    // Las cantidades llegan del backend como "3.00": se redondea a dos decimales antes de
    // enviarlas para que lo guardado sea lo que el usuario escribio y no lo que la base recorte.
    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
/* El encabezado toma el mismo primary del tema definido en src/plugins/vuetify.js */
.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th:first-child) {
  border-top-left-radius: 4px;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th:last-child) {
  border-top-right-radius: 4px;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
