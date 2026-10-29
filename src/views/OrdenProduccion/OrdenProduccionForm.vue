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
          class="mb-2"
        />

        <!-- ===================== RESUMEN DE COSTOS ===================== -->
        <div class="d-flex flex-wrap ga-4 mb-6">
          <!-- Izquierda: la alerta, alineada con la fila de Variacion de costo (la ultima de la
               derecha). Solo informativa: no impide registrar la orden. -->
          <div class="flex-grow-1 d-flex flex-column justify-end resumen-alerta">
            <v-chip
              v-if="variacionCosto > 0"
              variant="tonal"
              color="amber-darken-2"
              class="font-weight-bold align-self-start"
            >
              ¡Alerta inflación de costo!
            </v-chip>
            <v-chip
              v-else-if="variacionCosto < 0"
              variant="tonal"
              color="error"
              class="font-weight-bold align-self-start"
            >
              ¡Alerta Falta costo por asignar!
            </v-chip>
          </div>

          <div class="resumen-costos" aria-label="Resumen de costos de la orden">
            <div class="resumen-costos__fila">
              <span>Total Fundido:</span>
              <span class="total-consumos__valor">{{ formatearMoneda(totalConsumos) }}</span>
            </div>
            <div class="resumen-costos__fila">
              <span>Total Gastos:</span>
              <span class="total-consumos__valor">{{ formatearMoneda(totalGastos) }}</span>
            </div>
            <div class="resumen-costos__fila">
              <span>Costo Real:</span>
              <span class="total-consumos__valor">{{ formatearMoneda(costoReal) }}</span>
            </div>
            <div class="resumen-costos__fila">
              <span>Total Producido:</span>
              <span class="total-consumos__valor">{{ formatearMoneda(totalProducidos) }}</span>
            </div>
            <div class="resumen-costos__fila">
              <span class="d-inline-flex align-center ga-1">
                Variación de costo
                <v-tooltip location="top" open-on-click>
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="small" style="cursor: help">mdi-help-circle-outline</v-icon>
                  </template>
                  Es el Total Producido - Total Fundido - Total Gasto
                </v-tooltip>
                :
              </span>
              <span class="total-consumos__valor">{{ formatearMoneda(variacionCosto) }}</span>
            </div>
          </div>
        </div>

        <!-- ===================== CONSUMOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos fundidos</span>
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
          <v-table density="compact" class="mb-2 tabla-listado tabla-consumos">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th style="min-width: 200px">Bolsa</th>
                <th style="min-width: 220px">Propietario</th>
                <th style="min-width: 220px">Artículo (+)</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-end" style="min-width: 140px">Costo unitario</th>
                <th style="min-width: 110px">Cantidad</th>
                <th class="text-end" style="min-width: 140px">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!consumos.length">
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos un artículo fundido
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
                    @update:model-value="limpiarArticulo(fila)"
                  />
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
                  <div class="d-flex align-center ga-2">
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      variant="text"
                      color="primary"
                      title="Elegir el artículo"
                      @click="abrirSelectorArticulo('consumos', i)"
                    />
                    <div>
                      <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                      <span v-else class="text-medium-emphasis">Seleccione un artículo</span>
                      <div v-if="fila.articuloSKU" class="text-caption text-medium-emphasis">
                        {{ fila.articuloSKU }}
                      </div>
                    </div>
                  </div>
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
                <td class="text-end">{{ formatearMoneda(fila.CostoUnitario) }}</td>
                <td>
                  <v-number-input
                    v-model.number="fila.Cantidad"
                    control-variant="hidden"
                    :min="0"
                    :step="0.0001"
                    :precision="4"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-end">{{ formatearMoneda(calcularSubtotal(fila)) }}</td>
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
          Consumo
        </v-btn>

        <!-- ===================== PRODUCIDOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2">
            <span class="text-subtitle-2">Artículos producidos</span>
            <!-- Crear un producto es solo de ADMINISTRADOR: a un vendedor el backend le responde 401. -->
            <v-btn
              v-if="esAdministrador"
              size="small"
              variant="tonal"
              prepend-icon="mdi-plus"
              @click="dialogProductoNuevo = true"
            >
              Producto
            </v-btn>
          </div>
          <span class="text-caption text-medium-emphasis">{{ producidos.length }} / 200</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado tabla-producidos">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 110px">Cantidad</th>
                <th style="min-width: 140px">Costo unitario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!producidos.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
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
                    icon="mdi-book-plus"
                    size="small"
                    variant="text"
                    color="secondary"
                    title="Dar de alta un artículo nuevo"
                    @click="abrirArticuloNuevo(i)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Elegir un artículo existente"
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
                  <v-chip v-if="fila.articuloNuevo" size="x-small" color="secondary" variant="tonal">
                    Nuevo
                  </v-chip>
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.Cantidad"
                    control-variant="hidden"
                    type="number"
                    min="0"
                    step="0.0001"
                    :precision="4"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.CostoUnitario"
                    control-variant="hidden"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
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
           producido
        </v-btn>

        <!-- ===================== GASTOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Gastos de la orden</span>
          <span class="text-caption text-medium-emphasis">{{ gastos.length }} / 50</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th style="min-width: 220px">Tipo de gasto</th>
                <th style="min-width: 260px">Descripción</th>
                <th style="min-width: 160px">Método de pago</th>
                <th style="min-width: 160px">Monto</th>
                <th class="text-center" style="width: 48px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!gastos.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  La orden no tiene gastos
                </td>
              </tr>
              <tr v-for="(gasto, i) in gastos" :key="i">
                <td>
                  <v-select
                    v-model="gasto.idTipoGasto"
                    :items="tiposGasto"
                    item-title="tipgasNombre"
                    item-value="tipgasId"
                    placeholder="Tipo de gasto"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="gasto.Descripcion"
                    maxlength="255"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-select
                    v-model="gasto.MetodoPago"
                    :items="opcionesMetodoPago"
                    item-title="texto"
                    item-value="valor"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <!-- v-text-field y no v-number-input: este ultimo solo actualiza el modelo al
                       salir del campo, y el Total Gastos tiene que moverse mientras se escribe. -->
                  <v-text-field
                    v-model.number="gasto.Monto"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar este gasto"
                    @click="quitarGasto(i)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="gastos.length >= 50"
          class="mb-4"
          @click="agregarGasto"
        >
          Agregar gasto
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

    <ArticulosProduccion
      v-model="dialogArticuloProduccion"
      :id-empresa="idEmpresa"
      :id-bodega="idBodegaConsumoActiva"
      :id-tercero="idTerceroConsumoActivo"
      @seleccionar="onArticuloSeleccionado"
    />

    <TalleresSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />

    <ArticuloNuevoDialog
      v-model="dialogArticuloNuevo"
      :id-empresa="idEmpresa"
      :valor-inicial="articuloNuevoInicial"
      @guardar="onArticuloNuevoGuardado"
    />

    <ProductoNuevoDialog
      v-model="dialogProductoNuevo"
      :id-empresa="idEmpresa"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import produccionService from '@/services/produccionService'
import tipoGastoService from '@/services/tipoGastoService'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'
import ArticulosSeleccionar from '@/components/common/ArticulosSeleccionar.vue'
import ArticulosProduccion from '@/views/Inventario/Articulos/ArticulosProduccion.vue'
import TalleresSeleccionar from '@/views/Talleres/TalleresSeleccionar.vue'
import ArticuloNuevoDialog from '@/views/Inventario/Articulos/ArticuloNuevoDialog.vue'
import ProductoNuevoDialog from '@/views/Inventario/Productos/ProductoNuevoDialog.vue'

export default {
  name: 'OrdenProduccionForm',

  components: { ArticulosSeleccionar, ArticulosProduccion, TalleresSeleccionar, ArticuloNuevoDialog, ProductoNuevoDialog },

  data() {
    return {
      observaciones: '',
      consumos: [],
      producidos: [],
      gastos: [],
      tiposGasto: [],
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      bodegas: [],
      guardando: false,
      dialogArticulo: false,
      dialogArticuloProduccion: false,
      dialogTercero: false,
      dialogArticuloNuevo: false,
      dialogProductoNuevo: false,
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
    },
    esAdministrador() {
      return this.authStore.rol === 'ADMINISTRADOR'
    },
    idBodegaConsumoActiva() {
      if (this.filaActiva?.tabla !== 'consumos') return null
      return this.consumos[this.filaActiva.indice]?.idBodega ?? null
    },
    idTerceroConsumoActivo() {
      if (this.filaActiva?.tabla !== 'consumos') return null
      const fila = this.consumos[this.filaActiva.indice]
      return fila?.BolsaEstado === 'RECIBIDO_DE_TALLER' ? fila.idPropietario : null
    },
    // Lo ya escrito en la fila, para reabrir el dialogo y corregir en vez de empezar de cero.
    articuloNuevoInicial() {
      if (this.filaActiva?.tabla !== 'producidos') return null
      return this.producidos[this.filaActiva.indice]?.articuloNuevo ?? null
    },
    totalConsumos() {
      return this.redondear(this.consumos.reduce((total, fila) => {
        return total + (this.calcularSubtotal(fila) ?? 0)
      }, 0))
    },
    // Un producido sin costo unitario suma cero: el servidor lo calcula al guardar.
    totalProducidos() {
      return this.redondear(this.producidos.reduce((total, fila) => {
        return total + (this.calcularSubtotal(fila) ?? 0)
      }, 0))
    },
    // Los gastos sin monto valido suman cero.
    totalGastos() {
      return this.redondear(this.gastos.reduce((total, gasto) => total + (Number(gasto.Monto) || 0), 0))
    },
    costoReal() {
      return this.redondear(this.totalConsumos + this.totalGastos)
    },
    variacionCosto() {
      return this.redondear(this.totalProducidos - this.totalConsumos - this.totalGastos)
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
      this.gastos = []
      this.agregarConsumo()
      this.agregarProducido()
      this.cargarBodegas()
      this.cargarTiposGasto()
      // Si no se limpian, apuntarian a indices de los arreglos viejos y los callbacks de los
      // dialogos leerian una fila undefined.
      this.filaActiva = null
      this.indicePropietario = null
      this.dialogArticulo = false
      this.dialogArticuloProduccion = false
      this.dialogTercero = false
      this.dialogArticuloNuevo = false
    }
  },

  created() {
    this.cargarBodegas()
    this.cargarTiposGasto()
    this.agregarConsumo()
    this.agregarProducido()
  },

  methods: {
    async cargarTiposGasto() {
      try {
        const { data } = await tipoGastoService.getActivas({ idEmpresa: this.idEmpresa })
        this.tiposGasto = data.data || data || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron cargar los tipos de gasto'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    agregarGasto() {
      this.gastos.push({
        idTipoGasto: null,
        Descripcion: '',
        MetodoPago: 'EFECTIVO',
        Monto: null
      })
    },

    quitarGasto(indice) {
      this.gastos.splice(indice, 1)
    },

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
        Cantidad: 1,
        CostoUnitario: null
      })
    },

    agregarProducido() {
      this.producidos.push({
        idBodega: null,
        idArticulo: null,
        // idArticulo O articuloNuevo, nunca los dos: el backend responde 400 con ambos
        articuloNuevo: null,
        articuloNombre: '',
        articuloSKU: '',
        Cantidad: 1,
        CostoUnitario: null
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
      this.limpiarArticulo(fila)
      if (fila.BolsaEstado !== 'RECIBIDO_DE_TALLER') {
        fila.idPropietario = null
        fila.propietarioNombre = ''
      }
    },

    limpiarArticulo(fila) {
      fila.idArticulo = null
      fila.articuloNombre = ''
      fila.articuloSKU = ''
      fila.CostoUnitario = null
      fila.Cantidad = 1
    },

    abrirSelectorArticulo(tabla, indice) {
      if (tabla === 'consumos') {
        const fila = this.consumos[indice]
        if (!Number.isInteger(Number(fila?.idBodega)) || Number(fila.idBodega) <= 0) {
          Swal.fire('Atención', 'Seleccione una bodega para el consumo', 'warning')
          return
        }
        // Sin propietario el selector pediria la bolsa DISPONIBLE (idTercero null) y se
        // elegiria material de una bolsa distinta a la indicada en la fila.
        if (fila.BolsaEstado === 'RECIBIDO_DE_TALLER' && !fila.idPropietario) {
          Swal.fire('Atención', 'Seleccione el propietario antes de elegir el artículo', 'warning')
          return
        }
        this.filaActiva = { tabla, indice }
        this.dialogArticuloProduccion = true
        return
      }
      this.filaActiva = { tabla, indice }
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(art) {
      if (!this.filaActiva) return
      const fila = this[this.filaActiva.tabla][this.filaActiva.indice]
      if (!fila) return
      const tabla = this.filaActiva.tabla
      fila.idArticulo = art.artId
      fila.articuloNombre = art.artNombre || art.rtNombre || ''
      fila.articuloSKU = art.artSKU || ''
      if (tabla === 'consumos') {
        const disponible = Number(art.artCantidadDisponible)
        const costo = Number(art.artCostoUnitario)
        fila.Cantidad = Number.isFinite(disponible) ? this.redondearCantidad(disponible) : 0
        fila.CostoUnitario = art.artCostoUnitario === null || art.artCostoUnitario === undefined ||
          art.artCostoUnitario === '' || !Number.isFinite(costo)
          ? null
          : costo
      } else {
        // Elegir un articulo existente descarta el articulo nuevo de ESTA fila.
        fila.articuloNuevo = null
      }
      this.filaActiva = null
    },

    async abrirArticuloNuevo(indice) {
      this.filaActiva = { tabla: 'producidos', indice }
      // `valor-inicial` se calcula a partir de filaActiva: hay que dejar que la prop se
      // propague antes de abrir, o el watcher del dialogo puede leer la fila anterior.
      await this.$nextTick()
      this.dialogArticuloNuevo = true
    },

    onArticuloNuevoGuardado(articuloNuevo) {
      if (this.filaActiva?.tabla !== 'producidos') return
      const fila = this.producidos[this.filaActiva.indice]
      if (!fila) return
      fila.articuloNuevo = articuloNuevo
      fila.articuloNombre = articuloNuevo.Nombre
      fila.articuloSKU = ''
      // Dar de alta un articulo descarta el existente de ESTA fila.
      fila.idArticulo = null
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
      this.limpiarArticulo(fila)
      this.indicePropietario = null
    },

    // Se valida aqui para no gastar un viaje en un 400 evitable, y para poder decir QUE fila de
    // QUE tabla esta mal: el backend solo diria que el payload es invalido.
    validar() {
      if (!this.consumos.length) return 'Agregue al menos un artículo fundido'
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
        const errorCantidad = this.validarCantidad(fila.Cantidad, `La cantidad del consumo ${n}`)
        if (errorCantidad) return errorCantidad
      }

      for (let i = 0; i < this.producidos.length; i += 1) {
        const fila = this.producidos[i]
        const n = i + 1
        if (!fila.idBodega) return `Elija la bodega del producido ${n}`
        if (!fila.idArticulo && !fila.articuloNuevo) return `Elija el artículo del producido ${n}`
        const errorCantidad = this.validarCantidad(fila.Cantidad, `La cantidad del producido ${n}`)
        if (errorCantidad) return errorCantidad
      }

      for (let i = 0; i < this.gastos.length; i += 1) {
        const gasto = this.gastos[i]
        const n = i + 1
        if (!gasto.idTipoGasto) return `Elija el tipo del gasto ${n}`
        const descripcion = String(gasto.Descripcion ?? '').trim()
        if (descripcion.length < 6 || descripcion.length > 255) {
          return `La descripción del gasto ${n} debe tener entre 6 y 255 caracteres`
        }
        if (!(this.redondear(gasto.Monto) > 0)) return `El monto del gasto ${n} debe ser mayor que cero`
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

      // La variacion de costo no impide guardar: solo se pide confirmar.
      if (this.variacionCosto !== 0) {
        const mensaje = this.variacionCosto > 0
          ? '¡Alerta inflación de costo!'
          : '¡Alerta Falta costo por asignar!'
        const { isConfirmed } = await Swal.fire({
          icon: 'warning',
          title: mensaje,
          text: '¿Está seguro de guardar?',
          showCancelButton: true,
          confirmButtonText: 'Sí, guardar',
          cancelButtonText: 'Cancelar'
        })
        if (!isConfirmed) return
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
            Cantidad: this.redondearCantidad(fila.Cantidad)
          })),
          producidos: this.producidos.map((fila) => {
            const linea = {
              idBodega: Number(fila.idBodega),
              Cantidad: this.redondearCantidad(fila.Cantidad),
              CostoUnitario: this.normalizarCostoUnitario(fila.CostoUnitario)
            }
            if (fila.articuloNuevo) {
              // `_producto` es solo para poder reabrir el dialogo: no viaja al backend.
              const { _producto, ...articuloNuevo } = fila.articuloNuevo
              linea.ArticuloNuevo = articuloNuevo
            } else {
              linea.idArticulo = Number(fila.idArticulo)
            }
            return linea
          }),
          gastos: this.gastos.map((gasto) => ({
            idTipoGasto: Number(gasto.idTipoGasto),
            Descripcion: String(gasto.Descripcion).trim(),
            Monto: this.redondear(gasto.Monto),
            MetodoPago: gasto.MetodoPago
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

    // Los valores monetarios se redondean a dos decimales antes de enviarlos.
    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    redondearCantidad(valor) {
      return Math.round((Number(valor) || 0) * 10000) / 10000
    },

    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    calcularSubtotal(fila) {
      if (
        fila.Cantidad === null || fila.Cantidad === undefined || fila.Cantidad === '' ||
        fila.CostoUnitario === null || fila.CostoUnitario === undefined || fila.CostoUnitario === ''
      ) return null

      const cantidad = Number(fila.Cantidad)
      const costoUnitario = Number(fila.CostoUnitario)
      if (!Number.isFinite(cantidad) || !Number.isFinite(costoUnitario)) return null
      return this.redondear(cantidad * costoUnitario)
    },

    validarCantidad(valor, etiqueta) {
      const numero = Number(valor)
      if (!Number.isFinite(numero) || numero <= 0) return `${etiqueta} debe ser mayor que cero`
      if (Number(numero.toFixed(4)) !== numero) {
        return `${etiqueta} admite máximo cuatro decimales`
      }
      return null
    },

    normalizarCostoUnitario(valor) {
      if (valor === null || valor === undefined || String(valor).trim() === '') return null
      const costo = Number(valor)
      if (!Number.isFinite(costo) || costo === 0) return null
      return this.redondear(costo)
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

.tabla-consumos :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: #EF5350;
  color: #fff;
}

.tabla-producidos :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: #4CAF50;
  color: #fff;
}

.resumen-costos {
  width: min(100%, 420px);
}

/* Altura de una fila del resumen, para que la alerta quede a la altura de Variacion de costo. */
.resumen-alerta {
  min-height: 34px;
  min-width: 240px;
}

.resumen-costos__fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  align-items: center;
  gap: 16px;
  min-height: 34px;
}

.total-consumos__valor {
  text-align: right;
  font-weight: 600;
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
