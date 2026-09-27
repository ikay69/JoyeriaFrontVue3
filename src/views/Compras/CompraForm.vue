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
                    disabled
                    title="Dar de alta un artículo nuevo (pendiente)"
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
          <v-btn color="primary" prepend-icon="mdi-content-save" :loading="guardando" type="submit">
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
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import TercerosSeleccionar from '@/views/Terceros/TercerosSeleccionar.vue'
import ArticulosSeleccionar from '@/views/Inventario/Articulos/ArticulosSeleccionar.vue'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'CompraForm',

  components: { TercerosSeleccionar, ArticulosSeleccionar },

  data() {
    return {
      dialogTercero: false,
      dialogArticulo: false,
      // fila para la que se abrio el selector de articulo: sin esto, el @seleccionar no sabria
      // a que linea pertenece el articulo elegido.
      filaActiva: null,

      terceroSeleccionado: null,
      documentoSoporte: '',
      tipoCompra: 'CONTADO',
      descuento: 0,
      efectivo: 0,
      transaccion: 0,

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
      return null
    },

    armarArticulos() {
      return this.lineas.map((fila) => {
        const linea = {
          idBodega: Number(fila.idBodega),
          Cantidad: Number(fila.Cantidad),
          CostoUnidad: Number(fila.CostoUnidad)
        }
        if (fila.articuloNuevo) {
          linea.ArticuloNuevo = fila.articuloNuevo
        } else {
          linea.idArticulo = Number(fila.idArticulo)
        }
        return linea
      })
    },

    async confirmar() {
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
