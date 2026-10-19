<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">Nuevo empeño</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Registre los datos del contrato y los artículos recibidos en garantía.
        </p>
      </div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <div class="mb-1 text-subtitle-2">Cliente</div>
        <div class="d-flex align-center ga-2 mb-4">
          <v-btn
            icon="mdi-plus"
            variant="tonal"
            title="Crear cliente"
            @click="mostrarAltaCliente"
          />
          <v-btn
            icon="mdi-magnify"
            variant="tonal"
            title="Buscar cliente"
            @click="abrirSelectorTercero"
          />
          <v-text-field
            :model-value="clienteTexto"
            :hint="clienteSeleccionado ? `Celular: ${clienteSeleccionado.Celular || '-'}` : ''"
            :persistent-hint="Boolean(clienteSeleccionado)"
            readonly
            placeholder="Seleccione un cliente"
            variant="outlined"
            density="comfortable"
            :hide-details="!clienteSeleccionado"
            class="flex-grow-1"
          />
          <v-btn
            v-if="clienteSeleccionado"
            icon="mdi-pencil"
            variant="tonal"
            title="Editar cliente seleccionado"
            @click="editarClienteSeleccionado"
          />
        </div>

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="codigoContrato"
              label="Código de contrato"
              maxlength="50"
              counter="50"
              :rules="[reglas.requerido, reglas.maximo50]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="terceroCiudadDoc"
              label="Ciudad del documento del tercero"
              maxlength="50"
              counter="50"
              :rules="[reglas.requerido, reglas.maximo50]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="fechaInicio"
              label="Fecha de inicio"
              type="date"
              :rules="[reglas.requerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="tasaInteresPeriodo"
              label="Tasa de interés (%)"
              type="number"
              min="0"
              max="999.99"
              step="0.01"
              :rules="[reglas.requerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="metodoPago"
              :items="opcionesMetodoPago"
              item-title="texto"
              item-value="valor"
              label="Método de pago"
              :rules="[reglas.requerido]"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              label="Monto inicial"
              :model-value="formatearMoneda(montoInicial)"
              readonly
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="mb-2 d-flex align-center justify-space-between ga-4">
          <span class="text-subtitle-2">Artículos recibidos</span>
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis">{{ lineas.length }} / 200</span>
            <v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              title="Volver a cargar las bodegas"
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
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 120px">Cantidad</th>
                <th style="min-width: 145px">Valor avalúo</th>
                <th style="min-width: 200px">Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos una línea
                </td>
              </tr>
              <tr v-for="(fila, index) in lineas" :key="fila.key">
                <td>
                  <v-select
                    v-model.number="fila.idBodega"
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
                    title="Registrar un artículo nuevo"
                    @click="abrirArticuloNuevo(index)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Elegir un artículo existente"
                    @click="abrirSelectorArticulo(index)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta línea"
                    @click="quitarLinea(index)"
                  />
                </td>
                <td>
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <v-chip
                    v-if="fila.articuloNuevo"
                    size="x-small"
                    color="secondary"
                    variant="tonal"
                    class="ml-1"
                  >
                    Nuevo
                  </v-chip>
                  <div v-if="fila.articuloSKU" class="text-caption text-medium-emphasis">
                    {{ fila.articuloSKU }}
                  </div>
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.Cantidad"
                    control-variant="hidden"
                    type="number"
                    min="0.01"
                    step="0.01"
                    :precision="2"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-number-input
                    v-model.number="fila.ValorAvaluo"
                    control-variant="hidden"
                    type="number"
                    min="0.01"
                    step="0.01"
                    :precision="2"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="fila.Observacion"
                    maxlength="255"
                    placeholder="Opcional"
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
          :disabled="lineas.length >= 200"
          class="mb-4"
          @click="agregarLinea"
        >
          Agregar línea
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
            Guardar empeño
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <ClientesSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />

    <ClientesFormDialog
      v-model="dialogClienteForm"
      :id-empresa="idEmpresa"
      :cliente="clienteParaEditar"
      @guardado="onClienteGuardado"
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
import empenoService from '@/services/empenoService'
import ClientesSeleccionar from '@/views/Clientes/ClientesSeleccionar.vue'
import ClientesFormDialog from '@/views/Clientes/ClientesFormDialog.vue'
import ArticulosSeleccionar from '@/components/common/ArticulosSeleccionar.vue'
import ArticuloNuevoDialog from '@/views/Compras/ArticuloNuevoDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

const MAXIMO_DECIMAL_12_2 = 9999999999.99

export default {
  name: 'EmpenosForm',

  components: { ClientesSeleccionar, ClientesFormDialog, ArticulosSeleccionar, ArticuloNuevoDialog },

  data() {
    return {
      dialogTercero: false,
      dialogClienteForm: false,
      clienteParaEditar: null,
      abrirSelectorDespuesDeAlta: false,
      dialogArticulo: false,
      dialogArticuloNuevo: false,
      filaActiva: null,
      clienteSeleccionado: null,
      codigoContrato: '',
      terceroCiudadDoc: '',
      fechaInicio: '',
      tasaInteresPeriodo: '',
      metodoPago: 'EFECTIVO',
      lineas: [],
      bodegas: [],
      guardando: false,
      siguienteKey: 1,
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      reglas: {
        requerido: (valor) => (valor !== null && valor !== undefined && String(valor).trim() !== '') || 'Campo obligatorio',
        maximo50: (valor) => String(valor || '').trim().length <= 50 || 'Máximo 50 caracteres'
      }
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
    clienteTexto() {
      if (!this.clienteSeleccionado) return ''
      return [this.clienteSeleccionado.identificacion, this.clienteSeleccionado.Nombre]
        .filter(Boolean)
        .join(' ')
    },
    montoInicial() {
      const suma = this.lineas.reduce((total, fila) => total + (Number(fila.ValorAvaluo) || 0), 0)
      return this.redondear(suma)
    }
  },

  watch: {
    idEmpresa() {
      this.limpiarFormulario()
      this.cargarBodegas()
    },
    dialogClienteForm(visible) {
      if (!visible && this.abrirSelectorDespuesDeAlta) {
        this.abrirSelectorDespuesDeAlta = false
        this.$nextTick(() => {
          this.dialogTercero = true
        })
      }
    }
  },

  created() {
    this.agregarLinea()
    this.cargarBodegas()
  },

  methods: {
    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    async cargarBodegas() {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        this.bodegas = []
        return
      }
      try {
        this.bodegas = await this.catalogosStore.getBodegas(idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    async refrescarBodegas() {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) return
      this.catalogosStore.invalidar(idEmpresa)
      await this.cargarBodegas()
    },

    agregarLinea() {
      if (this.lineas.length >= 200) return
      this.lineas.push({
        key: this.siguienteKey++,
        idBodega: null,
        idArticulo: null,
        articuloNombre: '',
        articuloSKU: '',
        articuloNuevo: null,
        Cantidad: 1,
        ValorAvaluo: null,
        Observacion: ''
      })
    },

    quitarLinea(index) {
      this.lineas.splice(index, 1)
      this.filaActiva = null
    },

    abrirSelectorTercero() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      this.dialogTercero = true
    },

    mostrarAltaCliente() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      this.clienteParaEditar = null
      this.dialogClienteForm = true
    },

    editarClienteSeleccionado() {
      if (!this.clienteSeleccionado) return
      this.clienteParaEditar = { ...this.clienteSeleccionado }
      this.dialogClienteForm = true
    },

    onClienteGuardado({ creado, cliente }) {
      if (cliente) {
        this.clienteSeleccionado = cliente
      }
      this.clienteParaEditar = null
      this.abrirSelectorDespuesDeAlta = creado
    },

    onTerceroSeleccionado(cliente) {
      this.clienteSeleccionado = cliente
    },

    abrirSelectorArticulo(index) {
      this.filaActiva = index
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(articulo) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      if (!fila) return
      fila.idArticulo = articulo.artId
      fila.articuloNombre = articulo.artNombre
      fila.articuloSKU = articulo.artSKU || ''
      fila.articuloNuevo = null
      this.filaActiva = null
    },

    async abrirArticuloNuevo(index) {
      this.filaActiva = index
      await this.$nextTick()
      this.dialogArticuloNuevo = true
    },

    onArticuloNuevoGuardado(articuloNuevo) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      if (!fila) return
      fila.articuloNuevo = articuloNuevo
      fila.articuloNombre = articuloNuevo.Nombre
      fila.articuloSKU = ''
      fila.idArticulo = null
      this.filaActiva = null
    },

    validarDecimal(valor, etiqueta, maximo = MAXIMO_DECIMAL_12_2) {
      if (valor === null || valor === undefined || String(valor).trim() === '') {
        return `${etiqueta} es obligatorio`
      }
      const numero = Number(valor)
      if (!Number.isFinite(numero) || numero <= 0) return `${etiqueta} debe ser mayor a cero`
      if (numero > maximo) return `${etiqueta} excede el máximo permitido`
      if (Math.abs(numero - Number(numero.toFixed(2))) > 0.0000001) {
        return `${etiqueta} admite máximo dos decimales`
      }
      return null
    },

    validarLineas() {
      if (!this.lineas.length) return 'Debe registrar al menos un artículo'
      if (this.lineas.length > 200) return 'No puede registrar más de 200 artículos'

      for (let index = 0; index < this.lineas.length; index++) {
        const fila = this.lineas[index]
        const numero = index + 1
        const idBodega = Number(fila.idBodega)
        if (!Number.isInteger(idBodega) || idBodega <= 0) {
          return 'Seleccione una bodega para la línea ' + numero
        }

        const idArticuloInformado = fila.idArticulo !== null && fila.idArticulo !== undefined && fila.idArticulo !== ''
        const articuloNuevoInformado = fila.articuloNuevo !== null && fila.articuloNuevo !== undefined
        if (idArticuloInformado === articuloNuevoInformado) {
          return `La línea ${numero} debe tener exactamente un artículo existente o uno nuevo`
        }
        if (idArticuloInformado && (!Number.isInteger(Number(fila.idArticulo)) || Number(fila.idArticulo) <= 0)) {
          return `El artículo existente de la línea ${numero} no es válido`
        }
        if (articuloNuevoInformado) {
          const articuloNuevo = fila.articuloNuevo
          if (!Number.isInteger(Number(articuloNuevo.idProducto)) || Number(articuloNuevo.idProducto) <= 0) {
            return `Seleccione el producto del artículo nuevo en la línea ${numero}`
          }
          if (!String(articuloNuevo.Nombre || '').trim()) {
            return `El artículo nuevo de la línea ${numero} debe tener nombre`
          }
        }

        const errorCantidad = this.validarDecimal(fila.Cantidad, `La cantidad de la línea ${numero}`)
        if (errorCantidad) return errorCantidad
        const errorAvaluo = this.validarDecimal(fila.ValorAvaluo, `El valor de avalúo de la línea ${numero}`)
        if (errorAvaluo) return errorAvaluo
      }
      return null
    },

    validarCabecera() {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return 'Seleccione una empresa válida en la barra superior'
      }

      const idTercero = Number(this.clienteSeleccionado?.Id)
      if (!Number.isInteger(idTercero) || idTercero <= 0) return 'Seleccione un cliente'

      const codigoContrato = String(this.codigoContrato || '').trim()
      if (!codigoContrato) return 'El código de contrato es obligatorio'
      if (codigoContrato.length > 50) return 'El código de contrato no puede superar 50 caracteres'

      const ciudad = String(this.terceroCiudadDoc || '').trim()
      if (!ciudad) return 'La ciudad del documento del tercero es obligatoria'
      if (ciudad.length > 50) return 'La ciudad del documento no puede superar 50 caracteres'

      if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fechaInicio || '')) {
        return 'La fecha de inicio es obligatoria y debe tener formato AAAA-MM-DD'
      }

      const tasa = Number(this.tasaInteresPeriodo)
      if (this.tasaInteresPeriodo === '' || this.tasaInteresPeriodo === null || this.tasaInteresPeriodo === undefined) {
        return 'La tasa de interés es obligatoria'
      }
      if (!Number.isFinite(tasa) || tasa < 0 || tasa > 999.99) {
        return 'La tasa debe estar entre 0 y 999.99'
      }
      if (Math.abs(tasa - Number(tasa.toFixed(2))) > 0.0000001) {
        return 'La tasa admite máximo dos decimales'
      }

      if (!['EFECTIVO', 'TRANSACCION'].includes(this.metodoPago)) {
        return 'Seleccione un método de pago válido'
      }
      return null
    },

    armarArticulos() {
      return this.lineas.map((fila) => {
        const linea = {
          idBodega: Number(fila.idBodega),
          idArticulo: null,
          Cantidad: Number(fila.Cantidad),
          ValorAvaluo: Number(fila.ValorAvaluo),
          ArticuloNuevo: null
        }

        if (fila.articuloNuevo) {
          linea.ArticuloNuevo = {
            idProducto: Number(fila.articuloNuevo.idProducto),
            Nombre: String(fila.articuloNuevo.Nombre).trim(),
            Propiedades: (fila.articuloNuevo.Propiedades || []).map((propiedad) => ({
              idPropiedad: Number(propiedad.idPropiedad),
              Valor: String(propiedad.Valor).trim()
            }))
          }
        } else {
          linea.idArticulo = Number(fila.idArticulo)
        }

        const observacion = String(fila.Observacion || '').trim()
        if (observacion) linea.Observacion = observacion
        return linea
      })
    },

    async confirmar() {
      if (this.guardando) return

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      const errorCabecera = this.validarCabecera()
      if (errorCabecera) {
        await Swal.fire('Atención', errorCabecera, 'warning')
        return
      }

      const errorLineas = this.validarLineas()
      if (errorLineas) {
        await Swal.fire('Atención', errorLineas, 'warning')
        return
      }

      if (this.montoInicial > MAXIMO_DECIMAL_12_2) {
        await Swal.fire('Atención', 'El monto inicial excede el máximo permitido', 'warning')
        return
      }

      const payload = {
        idEmpresa: Number(this.idEmpresa),
        idTercero: Number(this.clienteSeleccionado.Id),
        CodigoContrato: this.codigoContrato.trim(),
        TerceroCiudadDoc: this.terceroCiudadDoc.trim(),
        FechaInicio: this.fechaInicio,
        TasaInteresPeriodo: Number(this.tasaInteresPeriodo),
        MetodoPago: this.metodoPago,
        MontoInicial: this.montoInicial,
        Articulos: this.armarArticulos()
      }

      this.guardando = true
      try {
        const { data } = await empenoService.create(payload)
        await Swal.fire('Éxito', data.msg || 'Empeño registrado', 'success')
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al registrar el empeño'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    limpiarFormulario() {
      this.dialogTercero = false
      this.dialogClienteForm = false
      this.clienteParaEditar = null
      this.abrirSelectorDespuesDeAlta = false
      this.dialogArticulo = false
      this.dialogArticuloNuevo = false
      this.filaActiva = null
      this.clienteSeleccionado = null
      this.codigoContrato = ''
      this.terceroCiudadDoc = ''
      this.fechaInicio = ''
      this.tasaInteresPeriodo = ''
      this.metodoPago = 'EFECTIVO'
      this.lineas = []
      this.agregarLinea()
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
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
