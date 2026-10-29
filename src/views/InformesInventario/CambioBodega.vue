<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">Cambio de bodega</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Traslada existencias de una bodega a otra. Cada artículo entra en la misma bolsa y con el mismo propietario.
        </p>
      </div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <!-- ===================== BODEGAS ===================== -->
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select
              v-model="idBodegaOrigen"
              :items="bodegas"
              item-title="Nombre"
              item-value="Id"
              label="Bodega origen"
              :loading="cargandoBodegas"
              :rules="[reglaRequerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="idBodegaDestino"
              :items="bodegas"
              item-title="Nombre"
              item-value="Id"
              label="Bodega destino"
              :loading="cargandoBodegas"
              :rules="[reglaRequerido, reglaBodegaDistinta]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <!-- ===================== TOTALES ===================== -->
        <v-row dense class="mb-4">
          <v-col cols="12" sm="6">
            <div class="resumen-linea">
              <span class="d-inline-flex align-center ga-1">
                Costo total
                <v-tooltip location="top" open-on-click>
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="small" style="cursor: help">mdi-help-circle-outline</v-icon>
                  </template>
                  Suma solo las líneas con costo unidad. Una línea sin costo entra con el costo de la bodega origen.
                </v-tooltip>
                :
              </span>
              <span class="font-weight-bold text-no-wrap">{{ formatearMoneda(costoTotal) }}</span>
            </div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="resumen-linea">
              <span>Total gastos:</span>
              <span class="font-weight-bold text-no-wrap">{{ formatearMoneda(totalGastos) }}</span>
            </div>
          </v-col>
        </v-row>

        <!-- ===================== ARTICULOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos a trasladar</span>
          <span class="text-caption text-medium-emphasis">{{ articulos.length }} / {{ MAX_ARTICULOS }}</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th style="min-width: 200px">Bolsa</th>
                <th style="min-width: 220px">Propietario</th>
                <th style="min-width: 280px">Artículo</th>
                <th style="min-width: 120px">Cantidad</th>
                <th style="min-width: 160px">Costo unidad</th>
                <th class="text-end" style="min-width: 150px">Costo total</th>
                <th class="text-center" style="width: 48px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!articulos.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos un artículo
                </td>
              </tr>
              <tr v-for="(fila, i) in articulos" :key="i">
                <td>
                  <v-select
                    v-model="fila.BolsaEstado"
                    :items="opcionesBolsaEstado"
                    item-title="texto"
                    item-value="valor"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @update:model-value="onBolsaCambiada(fila)"
                  />
                </td>
                <td>
                  <!-- DISPONIBLE no admite propietario; las otras cinco bolsas lo exigen. -->
                  <div v-if="bolsaExigePropietario(fila.BolsaEstado)" class="d-flex ga-1 align-center">
                    <v-btn
                      icon="mdi-magnify"
                      variant="tonal"
                      size="small"
                      title="Buscar el propietario"
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
                      @click="abrirSelectorArticulo(i)"
                    />
                    <div>
                      <span v-if="fila.idArticulo">{{ textoArticulo(fila) }}</span>
                      <span v-else class="text-medium-emphasis">Seleccione un artículo</span>
                      <div v-if="fila.articuloPropiedades" class="text-caption text-medium-emphasis">
                        {{ fila.articuloPropiedades }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <!-- v-text-field y no v-number-input: el total tiene que moverse mientras se escribe. -->
                  <v-text-field
                    v-model.number="fila.Cantidad"
                    type="number"
                    min="0"
                    step="0.0001"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="fila.CostoUnidad"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    placeholder="Costo origen"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-end">{{ formatearMoneda(calcularCostoTotal(fila)) }}</td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta fila"
                    @click="quitarArticulo(i)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="articulos.length >= MAX_ARTICULOS"
          class="mb-6"
          @click="agregarArticulo"
        >
          Agregar artículo
        </v-btn>

        <!-- ===================== GASTOS ===================== -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Gastos del traslado</span>
          <span class="text-caption text-medium-emphasis">{{ gastos.length }} / {{ MAX_GASTOS }}</span>
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
                  El traslado no tiene gastos
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
                  <!-- 241 y no 255: el backend antepone "Cambio Bodega-" a la descripcion. -->
                  <v-text-field
                    v-model="gasto.Descripcion"
                    :maxlength="MAX_DESCRIPCION_GASTO"
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
          :disabled="gastos.length >= MAX_GASTOS"
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

    <!-- Un solo selector de cada tipo para toda la tabla: la fila destino la dice indiceActivo.
         Los articulos salen de las existencias de la bodega origen. -->
    <ArticuloExistencia
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      :id-bodega="idBodegaOrigen"
      :bolsa-estado="bolsaFilaActiva"
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
import existenciaService from '@/services/existenciaService'
import tipoGastoService from '@/services/tipoGastoService'
import ArticuloExistencia from '@/views/Inventario/Articulos/ArticuloExistencia.vue'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

// Limites de /api/existencia/cambiobodega
const MAX_ARTICULOS = 100
const MAX_GASTOS = 50
const MAX_DESCRIPCION_GASTO = 241

export default {
  name: 'CambioBodega',

  components: { ArticuloExistencia, TercerosSeleccionar },

  data() {
    return {
      MAX_ARTICULOS,
      MAX_GASTOS,
      MAX_DESCRIPCION_GASTO,

      guardando: false,
      cargandoBodegas: false,
      bodegas: [],
      tiposGasto: [],

      idBodegaOrigen: null,
      idBodegaDestino: null,
      articulos: [],
      gastos: [],

      dialogArticulo: false,
      dialogTercero: false,
      // Fila de la tabla de articulos a la que vuelve la seleccion de los dialogos.
      indiceActivo: null,

      opcionesBolsaEstado: [
        { valor: 'DISPONIBLE', texto: 'Disponible' },
        { valor: 'RESERVADO', texto: 'Reservado' },
        { valor: 'PRESTADO_A_TALLER', texto: 'Prestado a taller' },
        { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller' },
        { valor: 'EN_GARANTIA_EMPENO', texto: 'En garantía/empeño' },
        { valor: 'EN_REPARACION', texto: 'En reparación' }
      ],
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
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
    bolsaFilaActiva() {
      return this.articulos[this.indiceActivo]?.BolsaEstado || ''
    },
    // Las lineas sin costo unidad no suman: entran con el costo de origen, que aqui no se conoce.
    costoTotal() {
      return this.redondear(this.articulos.reduce((total, fila) => total + (this.calcularCostoTotal(fila) ?? 0), 0))
    },
    totalGastos() {
      return this.redondear(this.gastos.reduce((total, gasto) => total + (Number(gasto.Monto) || 0), 0))
    }
  },

  watch: {
    // El selector de empresa de la barra no remonta la pantalla: sin este reset viajarian
    // bodegas, articulos y terceros de la empresa anterior con el idEmpresa de la nueva.
    idEmpresa() {
      this.idBodegaOrigen = null
      this.idBodegaDestino = null
      this.articulos = []
      this.gastos = []
      this.indiceActivo = null
      this.dialogArticulo = false
      this.dialogTercero = false
      this.agregarArticulo()
      this.cargarBodegas()
      this.cargarTiposGasto()
    },
    // Al cambiar la origen, la regla "distinta" de la destino tiene que volver a evaluarse, y los
    // articulos ya elegidos (con su cantidad y costo) eran existencias de la bodega anterior.
    idBodegaOrigen() {
      this.articulos.forEach((fila) => this.limpiarArticulo(fila))
      if (this.idBodegaDestino) this.$nextTick(() => this.$refs.form?.validate())
    }
  },

  created() {
    this.cargarBodegas()
    this.cargarTiposGasto()
    this.agregarArticulo()
  },

  methods: {
    reglaRequerido(valor) {
      if (valor === null || valor === undefined || valor === '') return 'Campo obligatorio'
      return true
    },

    reglaBodegaDistinta(valor) {
      if (valor && this.idBodegaOrigen && Number(valor) === Number(this.idBodegaOrigen)) {
        return 'La bodega destino debe ser distinta de la bodega origen'
      }
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

    async cargarTiposGasto() {
      if (!this.idEmpresa) return
      try {
        const { data } = await tipoGastoService.getActivas({ idEmpresa: this.idEmpresa })
        this.tiposGasto = data.data || data || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron cargar los tipos de gasto'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    bolsaExigePropietario(bolsa) {
      return Boolean(bolsa) && bolsa !== 'DISPONIBLE'
    },

    agregarArticulo() {
      this.articulos.push({
        BolsaEstado: 'DISPONIBLE',
        idPropietario: null,
        propietarioNombre: '',
        idArticulo: null,
        articuloNombre: '',
        articuloGramos: null,
        articuloPropiedades: '',
        // Unidades de la bolsa en la bodega origen, segun la existencia elegida.
        disponible: null,
        Cantidad: 1,
        CostoUnidad: ''
      })
    },

    quitarArticulo(indice) {
      this.articulos.splice(indice, 1)
      // Tras el splice el indice podria apuntar a otra fila.
      this.indiceActivo = null
    },

    // El articulo elegido era de UNA bolsa: al cambiarla deja de valer.
    // Volver a DISPONIBLE borra tambien el propietario: esa bolsa no lo admite.
    onBolsaCambiada(fila) {
      this.limpiarArticulo(fila)
      if (!this.bolsaExigePropietario(fila.BolsaEstado)) {
        fila.idPropietario = null
        fila.propietarioNombre = ''
      }
    },

    abrirSelectorTercero(indice) {
      this.indiceActivo = indice
      this.dialogTercero = true
    },

    // El Nombre del selector ya viene con nombre y apellidos unidos.
    onTerceroSeleccionado(tercero) {
      const fila = this.articulos[this.indiceActivo]
      if (!fila) return
      // Otro propietario es otra bolsa: el articulo elegido deja de valer.
      if (Number(fila.idPropietario) !== Number(tercero.Id)) this.limpiarArticulo(fila)
      fila.idPropietario = tercero.Id
      fila.propietarioNombre = tercero.Nombre
      this.indiceActivo = null
    },

    abrirSelectorArticulo(indice) {
      if (!this.idBodegaOrigen) {
        Swal.fire('Atención', 'Seleccione la bodega origen antes de elegir artículos', 'warning')
        return
      }
      this.indiceActivo = indice
      this.dialogArticulo = true
    },

    // La existencia elegida fija bolsa y propietario de la fila, y trae cantidad y costo de origen.
    onArticuloSeleccionado(ex) {
      const fila = this.articulos[this.indiceActivo]
      if (!fila) return
      fila.BolsaEstado = ex.existBolsa
      if (ex.existPropietarioId == null) {
        fila.idPropietario = null
        fila.propietarioNombre = ''
      } else if (Number(fila.idPropietario) !== Number(ex.existPropietarioId)) {
        // La existencia solo trae el nombre; si ya venia elegido con la lupa se conserva nombre y apellido.
        fila.idPropietario = ex.existPropietarioId
        fila.propietarioNombre = ex.existPropietarioNombre || ''
      }
      fila.idArticulo = ex.existArticuloId
      fila.articuloNombre = ex.existArticuloNombre || ''
      fila.articuloGramos = ex.existCantGramos ?? null
      fila.articuloPropiedades = ex.existPropiedades || ''
      const disponible = Number(ex.existCantidad)
      fila.disponible = Number.isFinite(disponible) ? disponible : null
      fila.Cantidad = Number.isFinite(disponible) ? this.redondearCantidad(disponible) : 1
      const costo = Number(ex.existCosto)
      fila.CostoUnidad = ex.existCosto === null || ex.existCosto === '' || !Number.isFinite(costo) ? '' : costo
      this.indiceActivo = null
    },

    limpiarArticulo(fila) {
      fila.idArticulo = null
      fila.articuloNombre = ''
      fila.articuloGramos = null
      fila.articuloPropiedades = ''
      fila.disponible = null
      fila.Cantidad = 1
      fila.CostoUnidad = ''
    },

    // "Nombre - 3,2 g"; sin gramos registrados solo el nombre.
    textoArticulo(fila) {
      const gramos = Number(fila.articuloGramos)
      if (fila.articuloGramos === null || fila.articuloGramos === '' || !Number.isFinite(gramos)) {
        return fila.articuloNombre
      }
      return `${fila.articuloNombre} - ${gramos.toLocaleString('es-CO', { maximumFractionDigits: 4 })} g`
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

    // Se valida aqui para decir QUE linea esta mal y no gastar un viaje en un 400 evitable.
    validar() {
      if (Number(this.idBodegaOrigen) === Number(this.idBodegaDestino)) {
        return 'La bodega origen y la bodega destino deben ser distintas'
      }
      if (!this.articulos.length) return 'Agregue al menos un artículo'

      const vistos = new Map()
      for (let i = 0; i < this.articulos.length; i += 1) {
        const fila = this.articulos[i]
        const n = i + 1
        if (!fila.BolsaEstado) return `Elija la bolsa del artículo ${n}`
        if (this.bolsaExigePropietario(fila.BolsaEstado) && !fila.idPropietario) {
          return `Elija el propietario del artículo ${n}: la bolsa ${this.textoBolsa(fila.BolsaEstado)} lo exige`
        }
        if (!fila.idArticulo) return `Elija el artículo de la línea ${n}`

        const cantidad = Number(fila.Cantidad)
        if (fila.Cantidad === '' || fila.Cantidad === null || !Number.isFinite(cantidad) || cantidad <= 0) {
          return `La cantidad del artículo ${n} debe ser mayor que cero`
        }
        if (Number(cantidad.toFixed(4)) !== cantidad) return `La cantidad del artículo ${n} admite máximo cuatro decimales`
        if (fila.disponible !== null && cantidad > fila.disponible) {
          return `La cantidad del artículo ${n} supera lo disponible en la bodega origen (${this.formatearCantidad(fila.disponible)})`
        }

        if (!this.costoVacio(fila.CostoUnidad)) {
          const costo = Number(fila.CostoUnidad)
          if (!Number.isFinite(costo) || costo < 0) return `El costo unidad del artículo ${n} no puede ser negativo`
        }

        const clave = `${fila.idArticulo}|${fila.BolsaEstado}|${fila.idPropietario || 0}`
        if (vistos.has(clave)) {
          return `El artículo ${n} repite artículo, bolsa y propietario del artículo ${vistos.get(clave)}`
        }
        vistos.set(clave, n)
      }

      for (let i = 0; i < this.gastos.length; i += 1) {
        const gasto = this.gastos[i]
        const n = i + 1
        if (!gasto.idTipoGasto) return `Elija el tipo del gasto ${n}`
        const descripcion = String(gasto.Descripcion ?? '').trim()
        if (descripcion.length < 6 || descripcion.length > MAX_DESCRIPCION_GASTO) {
          return `La descripción del gasto ${n} debe tener entre 6 y ${MAX_DESCRIPCION_GASTO} caracteres`
        }
        if (!(this.redondear(gasto.Monto) > 0)) return `El monto del gasto ${n} debe ser mayor que cero`
        if (!gasto.MetodoPago) return `Elija el método de pago del gasto ${n}`
      }

      return null
    },

    async confirmar() {
      // Guarda de reentrada: Enter en cualquier campo envia el form, y un doble envio trasladaria dos veces.
      if (this.guardando) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      const error = this.validar()
      if (error) {
        Swal.fire('Atención', error, 'warning')
        return
      }

      const payload = {
        idEmpresa: this.idEmpresa,
        idBodegaOrigen: Number(this.idBodegaOrigen),
        idBodegaDestino: Number(this.idBodegaDestino),
        articulos: this.articulos.map((fila) => ({
          idArticulo: Number(fila.idArticulo),
          BolsaEstado: fila.BolsaEstado,
          idPropietario: this.bolsaExigePropietario(fila.BolsaEstado) ? Number(fila.idPropietario) : null,
          Cantidad: this.redondearCantidad(fila.Cantidad),
          // Vacio viaja como null: el backend usa el costo de la bodega origen.
          CostoUnidad: this.costoVacio(fila.CostoUnidad) ? null : this.redondear(fila.CostoUnidad)
        })),
        gastos: this.gastos.map((gasto) => ({
          idTipoGasto: Number(gasto.idTipoGasto),
          Descripcion: String(gasto.Descripcion).trim(),
          Monto: this.redondear(gasto.Monto),
          MetodoPago: gasto.MetodoPago
        }))
      }

      this.guardando = true
      try {
        const { data } = await existenciaService.cambioBodega(payload)
        await Swal.fire('Éxito', data.msg || 'Cambio de bodega registrado', 'success')
        this.$router.back()
      } catch (err) {
        const mensaje = err.response?.data?.msg ||
          err.response?.data?.errors?.[0]?.msg ||
          'Ocurrió un error al registrar el cambio de bodega'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    },

    textoBolsa(valor) {
      return this.opcionesBolsaEstado.find((o) => o.valor === valor)?.texto || valor
    },

    costoVacio(valor) {
      return valor === null || valor === undefined || String(valor).trim() === ''
    },

    calcularCostoTotal(fila) {
      if (this.costoVacio(fila.CostoUnidad) || fila.Cantidad === '' || fila.Cantidad === null) return null
      const cantidad = Number(fila.Cantidad)
      const costo = Number(fila.CostoUnidad)
      if (!Number.isFinite(cantidad) || !Number.isFinite(costo)) return null
      return this.redondear(cantidad * costo)
    },

    formatearCantidad(valor) {
      return Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 4 })
    },

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
    }
  }
}
</script>

<style scoped>
.resumen-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 420px;
  min-height: 34px;
}

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
