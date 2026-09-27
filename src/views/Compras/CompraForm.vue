<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">Nueva compra</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Una compra no se puede editar después de guardarla: sólo anularse.
        </p>
      </div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <div class="mb-1 text-subtitle-2">Tercero</div>
        <div class="d-flex ga-2 mb-2">
          <v-btn icon="mdi-arrow-right" variant="tonal" @click="dialogTercero = true" />
          <v-text-field
            :model-value="terceroSeleccionado ? terceroSeleccionado.Nombre : ''"
            readonly
            placeholder="Seleccione un tercero"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              label="Identificación"
              :model-value="terceroSeleccionado ? terceroSeleccionado.identificacion : ''"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Celular"
              :model-value="terceroSeleccionado ? terceroSeleccionado.Celular : ''"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="documentoSoporte"
              label="Documento soporte"
              maxlength="50"
              counter="50"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="mb-1 text-subtitle-2">Tipo de compra</div>
        <v-radio-group v-model="tipoCompra" inline hide-details class="mb-4">
          <v-radio label="Contado" value="CONTADO" />
          <v-radio label="Crédito" value="CREDITO" />
        </v-radio-group>

        <v-row dense>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              label="Subtotal"
              :model-value="formatearMoneda(subtotal)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              v-model.number="descuento"
              label="Descuento"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              v-model.number="efectivo"
              label="Pago en efectivo"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model.number="transaccion"
              label="Pago en transacción"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              label="Saldo"
              :model-value="formatearMoneda(saldo)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <template v-if="esCredito">
          <v-divider class="my-4" />
          <div class="mb-2 text-subtitle-2">Condiciones del crédito</div>

          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="fechaCompromiso"
                label="Fecha de compromiso"
                type="date"
                :disabled="fechaCompromisoDeshabilitada"
                :hint="fechaCompromisoDeshabilitada
                  ? 'Con más de una cuota las fechas se registran en la tabla'
                  : 'Obligatoria cuando hay una sola cuota'"
                persistent-hint
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="numeroCuotas"
                label="Número de cuotas"
                type="number"
                min="1"
                max="60"
                step="1"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="valorCuota"
                label="Valor de la cuota"
                type="number"
                min="0"
                step="0.01"
                :disabled="cuotasEditadas"
                :hint="cuotasEditadas ? 'Las cuotas tienen valores distintos' : ''"
                persistent-hint
                variant="outlined"
                density="comfortable"
                @update:model-value="sembrarCuotas"
              />
              <v-btn
                v-if="cuotasEditadas"
                variant="text"
                size="small"
                prepend-icon="mdi-undo"
                class="mt-1"
                @click="volverAValorUnico"
              >
                Volver a un valor único
              </v-btn>
            </v-col>
          </v-row>

          <template v-if="cuotas.length">
            <div class="mt-2 mb-2 text-subtitle-2">Detalle de las cuotas</div>
            <p class="text-caption text-medium-emphasis mb-2">
              Las cuotas las calcula el proveedor con su propio interés: aquí sólo se transcriben.
              Es normal que sumen más que el saldo.
            </p>
            <v-table density="compact" class="mb-4">
              <thead>
                <tr>
                  <th style="width: 80px">N°</th>
                  <th style="min-width: 150px">Valor</th>
                  <th style="min-width: 170px">Fecha de pago</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cuota in cuotas" :key="cuota.NumCuota">
                  <td>{{ cuota.NumCuota }}</td>
                  <td>
                    <v-text-field
                      v-model.number="cuota.ValorCuota"
                      type="number"
                      min="0"
                      step="0.01"
                      variant="outlined"
                      density="compact"
                      hide-details
                      @update:model-value="onValorFilaEditado"
                    />
                  </td>
                  <td>
                    <v-text-field
                      v-model="cuota.FechaPago"
                      type="date"
                      clearable
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
        </template>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos comprados</span>
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis">{{ lineas.length }} / 200</span>
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
          <v-table density="compact" class="mb-2">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 110px">Cantidad</th>
                <th style="min-width: 130px">Costo unidad</th>
                <th class="text-end" style="min-width: 120px">Costo total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos una línea
                </td>
              </tr>
              <tr v-for="(fila, i) in lineas" :key="i">
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
                    @click="abrirSelectorArticulo(i)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta línea"
                    @click="quitarLinea(i)"
                  />
                </td>
                <td>
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <!-- v-chip con su propio v-if, deliberadamente DESPUES del par v-if/v-else de
                  arriba: si fuera entre medio, el compilador de Vue empareja v-else con el
                  sibling anterior que tenga v-if, que pasaria a ser este chip en vez del primer
                  span, y "Sin artículo" se mostraria en cualquier fila sin articuloNuevo (es
                  decir, en toda fila con articulo EXISTENTE). -->
                  <v-chip v-if="fila.articuloNuevo" size="x-small" color="secondary" variant="tonal" class="ml-1">
                    Nuevo
                  </v-chip>
                  <div v-if="fila.articuloSKU" class="text-caption text-medium-emphasis">
                    {{ fila.articuloSKU }}
                  </div>
                </td>
                <td>
                  <v-text-field
                    v-model.number="fila.Cantidad"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="fila.CostoUnidad"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-end">{{ formatearMoneda(totalLinea(fila)) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="lineas.length >= 200"
          class="mb-4"
          @click="agregarLinea"
        >
          Agregar línea
        </v-btn>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-content-save" :loading="guardando" :disabled="guardando" type="submit">
            Guardar
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

    <ArticuloNuevoDialog
      v-model="dialogArticuloNuevo"
      :id-empresa="idEmpresa"
      :valor-inicial="filaActiva !== null && lineas[filaActiva] ? lineas[filaActiva].articuloNuevo : null"
      @guardar="onArticuloNuevoGuardado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import TercerosSeleccionar from '@/views/Terceros/TercerosSeleccionar.vue'
import ArticulosSeleccionar from '@/views/Inventario/Articulos/ArticulosSeleccionar.vue'
import ArticuloNuevoDialog from '@/views/Compras/ArticuloNuevoDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'CompraForm',

  components: { TercerosSeleccionar, ArticulosSeleccionar, ArticuloNuevoDialog },

  data() {
    return {
      dialogTercero: false,
      dialogArticulo: false,
      dialogArticuloNuevo: false,
      // fila para la que se abrio el selector de articulo: sin esto, el @seleccionar no sabria
      // a que linea pertenece el articulo elegido.
      filaActiva: null,

      terceroSeleccionado: null,
      documentoSoporte: '',
      tipoCompra: 'CONTADO',
      descuento: 0,
      efectivo: 0,
      transaccion: 0,

      fechaCompromiso: null,
      numeroCuotas: 1,
      valorCuota: null,
      cuotas: [],
      // true en cuanto el usuario edita el valor de UNA fila: a partir de ahi la cabecera deja de
      // ser "el valor comun" y se manda ValorCuota: null con el desglose (escenario 3).
      cuotasEditadas: false,

      lineas: [],
      bodegas: [],
      guardando: false
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
      // No hay modo edicion en este formulario, asi que no hay que leer $route.params.EmpId:
      // una compra nunca se edita. El detalle si lo lee, porque alli SI importa.
      return this.authStore.empresaSeleccionada
    },

    subtotal() {
      // Se redondea UNA sola vez sobre la suma cruda, igual que
      // calcularSubtotalCompra en el backend: sumar los totales de linea ya
      // redondeados da un resultado distinto cuando un producto tiene mas de dos
      // decimales (Cantidad puede ser fraccionaria), y con muchas lineas la
      // diferencia supera la tolerancia de un centavo del contado.
      const total = this.lineas.reduce(
        (acc, fila) => acc + (Number(fila.Cantidad) || 0) * (Number(fila.CostoUnidad) || 0),
        0
      )
      return this.redondear(total)
    },

    saldo() {
      return this.redondear(
        this.subtotal -
          (Number(this.descuento) || 0) -
          (Number(this.efectivo) || 0) -
          (Number(this.transaccion) || 0)
      )
    },

    esCredito() {
      return this.tipoCompra === 'CREDITO'
    },

    // El backend DESCARTA FechaCompromiso cuando NumeroCuotas > 1: con varias cuotas las fechas
    // son de las cuotas y viven en CompraCuotas. Dejarla editable seria dejar al usuario
    // escribiendo una fecha que nunca se guarda.
    fechaCompromisoDeshabilitada() {
      return Number(this.numeroCuotas) > 1
    }
  },

  watch: {
    // El indice por empresa del store de catalogos es necesario pero no suficiente: esta pantalla
    // vive dentro de un v-app-bar persistente (MainLayout.vue) cuyo selector de empresa NO navega,
    // solo llama authStore.setEmpresaSeleccionada. Sin este watch, cambiar de empresa con el
    // formulario abierto deja el combo de bodega mostrando las de la empresa anterior, las lineas
    // ya elegidas con un idBodega/idArticulo ajeno y terceroSeleccionado con un idTercero ajeno,
    // mientras que payload.idEmpresa pasa a ser la empresa NUEVA: una escritura silenciosa contra
    // una empresa equivocada. Por eso se resetea todo lo que dependia de la empresa anterior.
    idEmpresa() {
      this.terceroSeleccionado = null
      this.lineas = []
      this.agregarLinea()
      this.cargarBodegas()
      // Sin esto, filaActiva quedaria apuntando a un indice de las lineas viejas, mas alla del
      // arreglo recien reconstruido: onArticuloSeleccionado/onArticuloNuevoGuardado explotarian
      // leyendo fila.idArticulo de un fila undefined.
      this.filaActiva = null
      // Los datos de credito tambien son de la compra en curso, no de la empresa: se limpian por
      // la misma razon que terceroSeleccionado y lineas, para no arrastrar cuotas de una empresa
      // ajena al payload de la nueva.
      this.fechaCompromiso = null
      this.numeroCuotas = 1
      this.valorCuota = null
      this.cuotas = []
      this.cuotasEditadas = false
    },

    tipoCompra(valor) {
      if (valor === 'CONTADO') {
        // una compra de contado no guarda datos de financiacion: se limpian para que no viajen
        // restos de un cambio de opinion.
        this.fechaCompromiso = null
        this.numeroCuotas = 1
        this.valorCuota = null
        this.cuotas = []
        this.cuotasEditadas = false
      } else {
        this.sincronizarCuotas()
      }
    },

    numeroCuotas() {
      this.sincronizarCuotas()
    }
  },

  created() {
    this.cargarBodegas()
    this.agregarLinea()
  },

  methods: {
    // Se redondea a dos decimales antes de mostrar Y antes de comparar. Sin esto,
    // 620000 - 0 - 619999.99 da 0.010000000046566129 y el usuario ve eso en el campo Saldo.
    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    totalLinea(fila) {
      return this.redondear((Number(fila.Cantidad) || 0) * (Number(fila.CostoUnidad) || 0))
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
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

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
    },

    agregarLinea() {
      this.lineas.push({
        idBodega: null,
        idArticulo: null,
        articuloNombre: '',
        articuloSKU: '',
        articuloNuevo: null,
        Cantidad: 1,
        CostoUnidad: 0
      })
    },

    quitarLinea(index) {
      this.lineas.splice(index, 1)
      // Tras el splice el indice puede apuntar fuera del arreglo o a otra fila, y la plantilla lo
      // dereferencia al renderizar: dejarlo puesto revienta el render de todo el formulario.
      this.filaActiva = null
    },

    abrirSelectorArticulo(index) {
      this.filaActiva = index
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(art) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      fila.idArticulo = art.artId
      fila.articuloNombre = art.artNombre
      fila.articuloSKU = art.artSKU
      // Cada linea trae idArticulo O ArticuloNuevo, nunca ambos: el backend responde 400 con las
      // dos cosas y con ninguna. Elegir un articulo existente descarta el articulo nuevo de ESTA
      // fila.
      fila.articuloNuevo = null
      this.filaActiva = null
    },

    async abrirArticuloNuevo(index) {
      this.filaActiva = index
      // `valor-inicial` se calcula a partir de filaActiva: hay que dejar que la prop se
      // propague antes de abrir, o el watcher del dialogo puede leer la fila anterior.
      await this.$nextTick()
      this.dialogArticuloNuevo = true
    },

    onArticuloNuevoGuardado(articuloNuevo) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      fila.articuloNuevo = articuloNuevo
      fila.articuloNombre = articuloNuevo.Nombre
      fila.articuloSKU = ''
      // Cada linea trae idArticulo O ArticuloNuevo, nunca ambos: el backend responde 400 con las
      // dos cosas. Dar de alta un articulo descarta el existente de ESTA fila.
      fila.idArticulo = null
      this.filaActiva = null
    },

    // Devuelve un mensaje de error, o null si las lineas estan bien.
    validarLineas() {
      if (!this.lineas.length) return 'Debe registrar al menos un artículo'
      if (this.lineas.length > 200) return 'La compra no puede tener más de 200 líneas'

      for (let i = 0; i < this.lineas.length; i++) {
        const fila = this.lineas[i]
        const numero = i + 1
        if (!fila.idBodega) return `Elija la bodega de la línea ${numero}`
        // Sin esta guarda el payload sale sin idArticulo ni ArticuloNuevo, el backend responde
        // 400 y el usuario pierde el formulario entero sin saber que fila era.
        if (!fila.idArticulo && !fila.articuloNuevo) {
          return `Elija el artículo de la línea ${numero}`
        }
        if (!(Number(fila.Cantidad) > 0)) return `La cantidad de la línea ${numero} debe ser mayor a cero`
        if (!(Number(fila.CostoUnidad) > 0)) return `El costo de la línea ${numero} debe ser mayor a cero`
      }
      return null
    },

    // Devuelve un mensaje de error, o null si la cabecera esta bien. Espejo de las reglas del
    // backend, para no gastar un viaje en un error evitable.
    validarCabecera() {
      if (!this.idEmpresa) return 'Seleccione una empresa en la barra superior'
      if (!this.terceroSeleccionado) return 'Seleccione el tercero de la compra'

      const vDescuento = Number(this.descuento) || 0
      if (vDescuento < 0) return 'El descuento no puede ser negativo'
      if (vDescuento > this.subtotal) return 'El descuento no puede superar el subtotal'

      const cancelado = (Number(this.efectivo) || 0) + (Number(this.transaccion) || 0)

      if (this.tipoCompra === 'CONTADO') {
        if (cancelado <= 0) return 'Debe registrar algún valor cancelado (efectivo o transacción)'
        // Misma tolerancia de un centavo que usa el backend: si el saldo cabe dentro del ruido
        // de redondeo, la compra quedo pagada.
        if (Math.abs(this.saldo) > 0.01) {
          return 'El valor cancelado debe cubrir exactamente el total de la compra de contado'
        }
      }

      if (this.tipoCompra === 'CREDITO') {
        // Espejo de la del contado, del otro lado: alla el saldo debe ser cero, aca positivo.
        if (!(this.saldo > 0.01)) {
          return 'Una compra a crédito debe quedar con saldo pendiente; use CONTADO'
        }

        const numeroCuotas = Number(this.numeroCuotas)
        // Number.isInteger('3') es false, y un v-text-field puede entregar cadena: de ahi el
        // Number() antes de comprobar. Tambien atrapa un 3.5 tecleado a mano.
        if (!Number.isInteger(numeroCuotas) || numeroCuotas < 1) {
          return 'El número de cuotas debe ser un entero mayor o igual a 1'
        }
        if (numeroCuotas > 60) {
          return 'El número de cuotas no puede superar 60'
        }
        if (numeroCuotas === 1 && !this.fechaCompromiso) {
          return 'La fecha de pago es obligatoria cuando hay una sola cuota'
        }

        const credito = this.armarCredito()
        if (!credito.Cuotas && !(Number(credito.ValorCuota) > 0)) {
          return 'El valor de la cuota es obligatorio cuando no se detallan las cuotas'
        }
        if (credito.Cuotas && credito.Cuotas.some((cuota) => !(Number(cuota.ValorCuota) > 0))) {
          return 'El valor de cada cuota debe ser mayor a cero'
        }
      }
      return null
    },

    // La tabla existe solo con mas de una cuota: con una sola, el monto y la fecha son datos de
    // la cabecera y no justifican una tabla.
    sincronizarCuotas() {
      // Un campo vacio es un tecleo a mitad de camino (borrar "12" para escribir "3"), no una
      // instruccion de descartar el desglose ya cargado: se deja la tabla como esta.
      // validarCabecera ya bloquea el guardado mientras numeroCuotas no sea un entero valido, asi
      // que no hace falta reaccionar a cada estado intermedio invalido.
      if (this.numeroCuotas === '' || this.numeroCuotas === null || this.numeroCuotas === undefined) {
        return
      }

      const cantidad = Number(this.numeroCuotas)
      if (!Number.isInteger(cantidad)) return

      // Escenario 1 genuino: una sola cuota, sin tabla. A diferencia del campo vacio de arriba,
      // aca hay un valor real y es el que colapsa la tabla a proposito.
      if (cantidad === 1) {
        this.cuotas = []
        this.cuotasEditadas = false
        return
      }

      // Cualquier otro valor fuera de [2, 60] (0, negativos, o un exceso pegado/tecleado de mas)
      // tampoco justifica reconstruir: sin este tope, un "12" pasando por "123" al escribir, o un
      // valor pegado, armaria miles de filas y de v-text-field antes de que validarCabecera
      // pueda rechazarlo al guardar. Se deja la tabla previa hasta que el numero sea valido.
      if (cantidad < 2 || cantidad > 60) return

      const anteriores = this.cuotas
      this.cuotas = Array.from({ length: cantidad }, (unused, i) => {
        const previa = anteriores[i]
        if (previa) return previa
        return {
          NumCuota: i + 1,
          ValorCuota: this.cuotasEditadas ? null : this.valorCuota,
          FechaPago: null
        }
      })
    },

    // El valor de la cabecera es "el valor comun": al escribirlo, siembra todas las filas.
    sembrarCuotas() {
      if (this.cuotasEditadas) return
      this.cuotas.forEach((cuota) => {
        cuota.ValorCuota = this.valorCuota
      })
    },

    // Editar el valor de UNA fila significa que las cuotas no son iguales: la cabecera se vacia y
    // se deshabilita, y el envio pasa al escenario 3.
    onValorFilaEditado() {
      if (this.cuotasEditadas) return
      this.cuotasEditadas = true
      this.valorCuota = null
    },

    // La salida del estado anterior. Sin esto, un valor cambiado por error deja al usuario
    // encerrado en el escenario 3 y obligado a reescribir las N filas a mano.
    volverAValorUnico() {
      this.cuotasEditadas = false
      this.valorCuota = null
      this.cuotas.forEach((cuota) => {
        cuota.ValorCuota = null
      })
    },

    // Traduce el estado de la pantalla a los cuatro campos de credito del payload.
    //
    // Con NumeroCuotas > 1 el backend descarta FechaCompromiso, asi que se manda null en vez de
    // arrastrar un valor que se va a ignorar.
    //
    // La regla que parece arbitraria y no lo es: validarCuotasCompra exige ValorCuota > 0 en CADA
    // fila del desglose. Una fila que solo lleva fecha se rechazaria con "El valor de la cuota
    // debe ser mayor a cero", asi que una fila se envia con su valor sembrado o no se envia.
    armarCredito() {
      const numeroCuotas = Number(this.numeroCuotas)

      // Escenario 1: una cuota, un monto, fecha obligatoria en la cabecera.
      if (numeroCuotas === 1) {
        return {
          FechaCompromiso: this.fechaCompromiso || null,
          NumeroCuotas: numeroCuotas,
          ValorCuota: Number(this.valorCuota),
          Cuotas: null
        }
      }

      // Escenario 3: valores distintos. La cabecera va NULL y el desglose lleva todas las filas.
      if (this.cuotasEditadas) {
        return {
          FechaCompromiso: null,
          NumeroCuotas: numeroCuotas,
          ValorCuota: null,
          Cuotas: this.cuotas.map((cuota) => ({
            NumCuota: cuota.NumCuota,
            ValorCuota: Number(cuota.ValorCuota),
            FechaPago: cuota.FechaPago || null
          }))
        }
      }

      // Escenario 2: mismo valor. Solo se envian las filas CON fecha, con el valor de la
      // cabecera. Sin ninguna fecha, el desglose no se envia y el valor vive solo en la cabecera.
      const conFecha = this.cuotas.filter((cuota) => cuota.FechaPago)
      return {
        FechaCompromiso: null,
        NumeroCuotas: numeroCuotas,
        ValorCuota: Number(this.valorCuota),
        Cuotas: conFecha.length
          ? conFecha.map((cuota) => ({
              NumCuota: cuota.NumCuota,
              ValorCuota: Number(this.valorCuota),
              FechaPago: cuota.FechaPago
            }))
          : null
      }
    },

    armarArticulos() {
      return this.lineas.map((fila) => {
        const linea = {
          idBodega: Number(fila.idBodega),
          Cantidad: Number(fila.Cantidad),
          CostoUnidad: Number(fila.CostoUnidad)
        }
        if (fila.articuloNuevo) {
          // `_producto` es solo para poder reabrir el dialogo: no viaja al backend.
          const { _producto, ...articuloNuevo } = fila.articuloNuevo
          linea.ArticuloNuevo = articuloNuevo
        } else {
          linea.idArticulo = Number(fila.idArticulo)
        }
        return linea
      })
    },

    async confirmar() {
      // Guarda de reentrada, lo primero de todo: el boton es type="submit" y v-form renderiza un
      // <form> real, asi que Enter en cualquier campo llama aqui directamente, sin pasar por el
      // boton ni por su pointer-events de carga. Una compra no se puede editar ni deshacer, asi
      // que un doble envio mueve existencias dos veces y recalcula el costo promedio dos veces.
      if (this.guardando) return

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      // validarLineas() va primero: si no hay lineas, subtotal es 0 y la rama CONTADO de
      // validarCabecera() dispararia un mensaje de dinero en vez de "Debe registrar al menos
      // un articulo", que quedaria inalcanzable.
      const errorLineas = this.validarLineas()
      if (errorLineas) {
        Swal.fire('Atención', errorLineas, 'warning')
        return
      }

      const errorCabecera = this.validarCabecera()
      if (errorCabecera) {
        Swal.fire('Atención', errorCabecera, 'warning')
        return
      }

      const payload = {
        idEmpresa: this.idEmpresa,
        idTercero: this.terceroSeleccionado.Id,
        TipoCompra: this.tipoCompra,
        NumeroDocumentoSoporte: this.documentoSoporte.trim() || null,
        ValorDescuento: Number(this.descuento) || 0,
        ValorEfectivo: Number(this.efectivo) || 0,
        ValorTransaccion: Number(this.transaccion) || 0,
        Articulos: this.armarArticulos()
      }

      if (this.esCredito) {
        const credito = this.armarCredito()
        payload.FechaCompromiso = credito.FechaCompromiso
        payload.NumeroCuotas = credito.NumeroCuotas
        payload.ValorCuota = credito.ValorCuota
        // `Cuotas` es opcional: solo se manda si hay desglose que mandar.
        if (credito.Cuotas) payload.Cuotas = credito.Cuotas
      }

      this.guardando = true
      try {
        const { data } = await compraService.create(payload)
        await Swal.fire('Éxito', data.msg || 'Compra registrada', 'success')
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar la compra'
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
