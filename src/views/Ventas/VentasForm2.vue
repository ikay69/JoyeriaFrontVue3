<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div><h1 class="text-h5">Nueva venta</h1></div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form @submit.prevent="confirmar">
        <!-- Promociones vigentes hoy: solo informan al vendedor; si aplican o no a este cliente
             lo decide el backend despues (/aplicacionpromo). -->
        <div class="promociones-venta mb-4 pa-3 rounded">
          <div class="text-subtitle-2 font-weight-bold text-primary">
            <v-icon start size="small" icon="mdi-tag-multiple" />PROMOCIONES
          </div>
          <div v-if="cargandoPromociones" class="text-body-2 text-medium-emphasis">
            Cargando promociones...
          </div>
          <div v-else-if="errorPromociones" class="text-body-2 text-error">
            {{ errorPromociones }}
          </div>
          <div v-else-if="!promociones.length" class="text-body-2 text-medium-emphasis">
            No hay promociones vigentes hoy
          </div>
          <template v-else>
            <div v-for="(promo, indice) in promociones" :key="indice" class="text-body-2">
              <v-icon size="small" color="primary" icon="mdi-tag" class="mr-1" />{{ textoPromocion(promo) }}
            </div>
          </template>
        </div>

        <v-row dense>
          <v-col cols="12" md="4" class="d-flex ga-2">
            <v-select
              v-model="tipoImpresion"
              :items="opcionesTipoImpresion"
              item-title="texto"
              item-value="valor"
              label="Tipo de impresión"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <v-select
              v-if="tipoImpresion === 'tirilla'"
              v-model.number="anchoTirilla"
              :items="opcionesAnchoTirilla"
              item-title="texto"
              item-value="valor"
              label="Ancho"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="tipoVenta"
              :items="tiposVenta"
              item-title="texto"
              item-value="valor"
              label="Tipo de venta"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model.number="idVendedor"
              :items="vendedores"
              item-title="vdrNombre"
              item-value="vdrId"
              label="Vendedor"
              :loading="cargandoVendedores"
              clearable
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col v-if="tipoVenta !== 'CONTADO'" cols="12" md="4">
            <v-checkbox
              v-model="retiraInventario"
              label="Retirar del inventario"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Venta financiada por una plataforma (Sistecredito, Addi...). Solo informativo: no cambia
             caja, saldo, estado de pago, inventario ni cuotas. Vale en los tres tipos de venta. -->
        <v-row dense align="center" class="mt-1">
          <v-col cols="12" md="4">
            <v-checkbox
              v-model="esFinanciado"
              label="Venta financiada"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="financiadoPor"
              label="Financiado por"
              placeholder="Sistecredito, Addi..."
              maxlength="100"
              counter="100"
              :disabled="!esFinanciado"
              :rules="esFinanciado ? [reglaFinanciadoPor] : []"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
            />
          </v-col>
        </v-row>

        <template v-if="esCredito">
          <v-divider class="my-4" />
          <div class="mb-2 text-subtitle-2">Condiciones del crédito</div>

          <v-row dense>
            <v-col cols="12" sm="4">
              <v-number-input
                v-model.number="numeroCuotas"
                control-variant="hidden"
                label="Número de cuotas"
                type="number"
                :min="1"
                :max="MAX_CUOTAS"
                step="1"
                hint="Entre 1 y 24"
                persistent-hint
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-number-input
                v-model.number="valorCuota"
                control-variant="hidden"
                label="Valor de la cuota"
                prefix="$"
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
          </v-row>

          <template v-if="cuotas.length">
            <div class="mt-2 mb-2 d-flex align-center justify-space-between ga-4">
              <span class="text-subtitle-2">Detalle de las cuotas</span>
              <span class="text-subtitle-2">
                Total cuotas:
                <span class="font-weight-medium">{{ formatearMoneda(totalCuotas) }}</span>
              </span>
            </div>
            <p class="text-caption text-medium-emphasis mb-2">
              Las cuotas las pone quien financia con su propio interés: aquí sólo se transcriben.
              Es normal que sumen más que el saldo. Cada cuota necesita valor y fecha, y las fechas
              van en orden.
            </p>
            <v-table density="compact" class="mb-4 tabla-listado">
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
                    <v-number-input
                      v-model.number="cuota.ValorCuota"
                      control-variant="hidden"
                      prefix="$"
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

        <div class="mt-4 mb-1 text-subtitle-2">Cliente</div>
        <div class="d-flex align-center ga-2">
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
            :hint="terceroSeleccionado ? `Celular: ${terceroSeleccionado.Celular || '-'}` : ''"
            :persistent-hint="Boolean(terceroSeleccionado)"
            readonly
            placeholder="Seleccione un cliente"
            variant="outlined"
            density="comfortable"
            :hide-details="!terceroSeleccionado"
            class="flex-grow-1"
          />
          <v-btn
            v-if="terceroSeleccionado"
            icon="mdi-pencil"
            variant="tonal"
            title="Editar cliente seleccionado"
            @click="editarClienteSeleccionado"
          />
        </div>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos</span>
          <span class="text-caption text-medium-emphasis">{{ lineas.length }} / 200</span>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2 tabla-listado">
            <thead>
              <tr>
                <th class="text-center" style="width: 72px">Bolsa</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th
                  style="min-width: 220px; cursor: pointer; user-select: none"
                  title="Ordenar por nombre"
                  @click="ordenarPorNombre"
                >
                  Artículo
                  <v-icon size="small">{{ iconoOrdenNombre }}</v-icon>
                </th>
                <th class="text-end" style="min-width: 80px" title="Cantidad en gramos">Gr</th>
                <th style="min-width: 110px">Cantidad</th>
                <th style="min-width: 140px">Precio Und</th>
                <th class="text-end" style="min-width: 140px">Precio total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos una línea
                </td>
              </tr>
              <tr v-for="(fila, indice) in lineas" :key="fila.clave">
                <td class="text-center">
                  <v-checkbox
                    v-model="fila.EsBolsa"
                    density="compact"
                    hide-details
                    aria-label="Es bolsa"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Seleccionar artículo"
                    @click="abrirSelectorArticulo(indice)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta línea"
                    @click="quitarLinea(indice)"
                  />
                </td>
                <td>
                  <span v-if="fila.artNombre">{{ fila.artNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <div v-if="fila.artPropiedades" class="text-caption text-medium-emphasis">
                    {{ fila.artPropiedades }}
                  </div>
                </td>
                <td class="text-end">{{ formatearGramos(fila.artCantidadGramos) }}</td>
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
                    v-model.number="fila.PrecioVentaUnidad"
                    control-variant="hidden"
                    prefix="$"
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

        <div class="d-flex justify-end mt-2">
          <div class="totales-venta" aria-label="Resumen de pagos">
            <div class="totales-venta__fila">
              <span>Subtotal</span>
              <span class="totales-venta__valor">{{ formatearMoneda(subtotal) }}</span>
            </div>
            <div class="totales-venta__fila">
              <div class="d-flex align-center ga-1">
                <label for="venta-descuento">Descuento</label>
                <v-btn
                  icon="mdi-tag"
                  size="x-small"
                  variant="text"
                  color="primary"
                  :loading="aplicandoPromociones"
                  :disabled="!promociones.length || aplicandoPromociones"
                  :title="promociones.length ? 'Aplicar promociones' : 'No hay promociones vigentes'"
                  aria-label="Aplicar promociones"
                  @click="aplicarPromociones"
                />
              </div>
              <v-number-input
                id="venta-descuento"
                v-model.number="descuento"
                class="totales-venta__campo"
                control-variant="hidden"
                aria-label="Descuento"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                :precision="2"
                :min-fraction-digits="0"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <div class="totales-venta__fila">
              <label for="venta-efectivo">Pago efectivo</label>
              <v-number-input
                id="venta-efectivo"
                v-model.number="efectivo"
                class="totales-venta__campo"
                control-variant="hidden"
                aria-label="Pago efectivo"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                :precision="2"
                :min-fraction-digits="0"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <div class="totales-venta__fila">
              <label for="venta-transaccion">Pago por transacción</label>
              <v-number-input
                id="venta-transaccion"
                v-model.number="transaccion"
                class="totales-venta__campo"
                control-variant="hidden"
                aria-label="Pago por transacción"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                :precision="2"
                :min-fraction-digits="0"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
            <div class="totales-venta__fila">
              <span>Saldo</span>
              <span class="totales-venta__valor">{{ formatearMoneda(saldo) }}</span>
            </div>
          </div>
        </div>
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

        <!-- Promociones que aplicaron a esta venta (resultado de /aplicacionpromo) -->
        <div v-if="aplicacionPromo" class="mt-6">
          <div class="text-subtitle-2 font-weight-bold text-primary mb-2">
            <v-icon start size="small" icon="mdi-tag-multiple" />Promociones aplicadas
          </div>
          <v-alert
            v-if="promocionesDesactualizadas"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            El cliente o el subtotal cambiaron después de aplicar las promociones. Vuelva a
            aplicarlas con el icono junto a Descuento.
          </v-alert>
          <div v-if="!aplicacionPromo.promociones.length" class="text-body-2 text-medium-emphasis">
            Ninguna promoción aplicó a esta venta.
          </div>
          <v-table v-else density="compact" class="tabla-listado">
            <thead>
              <tr>
                <th>Promoción</th>
                <th>Descuento de la promoción</th>
                <th class="text-end">Tope</th>
                <th class="text-end">Valor descontado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(promo, indice) in aplicacionPromo.promociones" :key="indice">
                <td>
                  <v-icon size="small" color="primary" icon="mdi-tag" class="mr-1" />{{ promo.promoNombre }}
                </td>
                <td>{{ textoDescuentoPromo(promo) }}</td>
                <td class="text-end">
                  {{ promo.promoTope === null || promo.promoTope === undefined ? 'Sin tope' : formatearMoneda(promo.promoTope) }}
                </td>
                <td class="text-end">{{ formatearMoneda(promo.promoMonto) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end font-weight-bold">Total descuento</td>
                <td class="text-end font-weight-bold">
                  {{ formatearMoneda(aplicacionPromo.descuentoTotal) }}
                </td>
              </tr>
            </tfoot>
          </v-table>
        </div>
      </v-form>
    </v-card>

    <TercerosSeleccionar
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

    <ArticulosVender
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      :id-bodega="null"
      @seleccionar="onArticuloSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'
import ventasService from '@/services/ventasService'
import promocionService from '@/services/promocionService'
import { generarPdfVenta } from '@/utils/ventaPdf'
import { generarTirillaPDF } from '@/utils/tirillaPDF'
import { generarTirilla } from '@/utils/tirilla'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'
import ClientesFormDialog from '@/views/Clientes/ClientesFormDialog.vue'
import ArticulosVender from '@/views/Inventario/Articulos/ArticulosVender.vue'

const MAX_LINEAS = 200
const MAX_DECIMAL_12_2 = 9999999999.99
// /newventa admite de 1 a 24 cuotas en CREDITO
const MAX_CUOTAS = 24

export default {
  name: 'VentasForm2',

  components: { TercerosSeleccionar, ClientesFormDialog, ArticulosVender },

  data() {
    return {
      dialogTercero: false,
      dialogClienteForm: false,
      clienteParaEditar: null,
      dialogArticulo: false,
      filaActiva: null,
      siguienteClaveLinea: 1,

      tipoImpresion: 'pdf',
      anchoTirilla: 80,
      opcionesTipoImpresion: [
        { valor: 'pdf', texto: 'PDF' },
        { valor: 'tirillaPdf', texto: 'Tirilla PDF' },
        { valor: 'tirilla', texto: 'Tirilla' }
      ],
      opcionesAnchoTirilla: [
        { valor: 80, texto: '80 mm' },
        { valor: 50, texto: '50 mm' }
      ],
      tipoVenta: 'CONTADO',
      idVendedor: null,
      terceroSeleccionado: null,
      descuento: 0,
      efectivo: 0,
      transaccion: 0,
      retiraInventario: false,
      // EsFinanciado / FinanciadoPor (desde 2026-11-19): solo informativos
      esFinanciado: false,
      financiadoPor: '',

      // datos de la venta a CREDITO (POR_ABONO y CONTADO no llevan cuotas)
      MAX_CUOTAS,
      numeroCuotas: 1,
      valorCuota: null,
      fechaCompromiso: null,
      cuotas: [],
      // true cuando se edito el valor de alguna fila: las cuotas ya no son iguales
      cuotasEditadas: false,

      tiposVenta: [
        { valor: 'CONTADO', texto: 'Contado' },
        { valor: 'CREDITO', texto: 'Crédito' },
        { valor: 'POR_ABONO', texto: 'Por abono' }
      ],
      vendedores: [],
      lineas: [],
      ordenNombre: null,
      cargandoVendedores: false,
      promociones: [],
      cargandoPromociones: false,
      errorPromociones: '',
      aplicandoPromociones: false,
      // Resultado de /aplicacionpromo + con que cliente y subtotal se calculo:
      // { idTercero, subtotal, descuentoTotal, promociones: [...] } o null si no se ha aplicado
      aplicacionPromo: null,
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
      return this.authStore.empresaSeleccionada
    },
    clienteTexto() {
      if (!this.terceroSeleccionado) return ''
      return [
        this.terceroSeleccionado.identificacion,
        this.terceroSeleccionado.Nombre
      ].filter(Boolean).join(' ')
    },
    subtotal() {
      const total = this.lineas.reduce(
        (acumulado, fila) =>
          acumulado +
          (Number(fila.Cantidad) || 0) * (Number(fila.PrecioVentaUnidad) || 0),
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
    iconoOrdenNombre() {
      if (this.ordenNombre === 'asc') return 'mdi-arrow-up'
      if (this.ordenNombre === 'desc') return 'mdi-arrow-down'
      return 'mdi-swap-vertical'
    },
    esCredito() {
      return this.tipoVenta === 'CREDITO'
    },
    // Las promociones se calcularon con otro cliente u otro subtotal: hay que volver a aplicarlas
    promocionesDesactualizadas() {
      if (!this.aplicacionPromo) return false
      return (
        this.aplicacionPromo.idTercero !== Number(this.terceroSeleccionado?.Id) ||
        this.aplicacionPromo.subtotal !== this.subtotal
      )
    },
    // Con varias cuotas el backend ignora FechaCompromiso: las fechas van en el detalle
    fechaCompromisoDeshabilitada() {
      return Number(this.numeroCuotas) > 1
    },
    // Solo informativo: no se compara con el saldo
    totalCuotas() {
      return this.redondear(
        this.cuotas.reduce((acumulado, cuota) => acumulado + (Number(cuota.ValorCuota) || 0), 0)
      )
    }
  },

  watch: {
    // Cada cambio de modalidad empieza el credito de cero: no deben viajar cuotas de un cambio
    // de opinion (POR_ABONO y CONTADO con Cuotas responden 400).
    tipoVenta(valor) {
      if (valor === 'CONTADO') this.retiraInventario = false
      this.limpiarCredito()
    },
    numeroCuotas() {
      this.sincronizarCuotas()
    },
    idEmpresa() {
      this.reiniciarFormulario()
      this.cargarCatalogos()
    }
  },

  created() {
    this.agregarLinea()
    this.cargarCatalogos()
  },

  methods: {
    // Reordena las lineas en el arreglo mismo para que los indices de las acciones sigan validos.
    // Las lineas sin articulo quedan siempre al final.
    ordenarPorNombre() {
      this.ordenNombre = this.ordenNombre === 'asc' ? 'desc' : 'asc'
      const signo = this.ordenNombre === 'asc' ? 1 : -1
      this.lineas.sort((a, b) => {
        if (!a.artNombre && !b.artNombre) return 0
        if (!a.artNombre) return 1
        if (!b.artNombre) return -1
        return signo * a.artNombre.localeCompare(b.artNombre, 'es', { sensitivity: 'base' })
      })
    },

    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return '$ ' + numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    totalLinea(fila) {
      return this.redondear(
        (Number(fila.Cantidad) || 0) * (Number(fila.PrecioVentaUnidad) || 0)
      )
    },

    // Aqui no se carga la lista de bodegas: la bodega de cada linea sale de la fila que se elige
    // en la ventanilla de articulos vendibles.
    async cargarCatalogos() {
      if (!this.idEmpresa) {
        this.vendedores = []
        this.promociones = []
        return
      }
      await Promise.all([this.cargarVendedores(), this.cargarPromociones()])
    },

    // /getvigentespromocion: activas y con hoy dentro de su vigencia, la que vence primero
    // va primero. Un fallo no bloquea la venta: solo se avisa en el recuadro.
    async cargarPromociones() {
      this.cargandoPromociones = true
      this.errorPromociones = ''
      try {
        const { data } = await promocionService.getVigentes({ idEmpresa: Number(this.idEmpresa) })
        this.promociones = Array.isArray(data?.data) ? data.data : []
      } catch (error) {
        this.promociones = []
        this.errorPromociones =
          error.response?.data?.msg || 'No se pudieron cargar las promociones vigentes'
      } finally {
        this.cargandoPromociones = false
      }
    },

    // "NAVIDAD 2026 hasta el 31/12/2026 con descuento de 10%; monto mínimo $ 50.000,00"
    // El monto minimo solo se muestra si la promocion lo tiene.
    textoPromocion(promo) {
      const partes = [promo.promoNombre || 'Promoción']

      const fechaFin = this.formatearFechaPromo(promo.promoFechaFin)
      if (fechaFin) partes.push(`hasta el ${fechaFin}`)

      const porcentaje = promo.promoPorcentaje
      const valor = promo.promoValor
      if (porcentaje !== null && porcentaje !== undefined && porcentaje !== '') {
        const numero = Number(porcentaje).toLocaleString('es-CO', { maximumFractionDigits: 2 })
        partes.push(`con descuento de ${numero}%`)
      } else if (valor !== null && valor !== undefined && valor !== '') {
        partes.push(`con descuento de ${this.formatearMoneda(valor)}`)
      }

      let texto = partes.join(' ')
      const minimo = Number(promo.montoMinVenta)
      if (promo.montoMinVenta !== null && promo.montoMinVenta !== undefined && minimo > 0) {
        texto += `; monto mínimo ${this.formatearMoneda(minimo)}`
      }
      return texto
    },

    // "10%" o "$ 20.000,00" segun el tipo de descuento de la promocion
    textoDescuentoPromo(promo) {
      if (promo.promoPorcentaje !== null && promo.promoPorcentaje !== undefined) {
        return Number(promo.promoPorcentaje).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + '%'
      }
      if (promo.promoValor !== null && promo.promoValor !== undefined) {
        return this.formatearMoneda(promo.promoValor)
      }
      return '-'
    },

    // /aplicacionpromo: el backend evalua las condiciones contra el historial del cliente (que el
    // vendedor no puede ver) y devuelve cuales aplican y cuanto descuenta cada una. El front no
    // calcula nada: solo pone el descuentoTotal en el campo Descuento.
    async aplicarPromociones() {
      if (this.aplicandoPromociones) return

      const idTercero = Number(this.terceroSeleccionado?.Id)
      if (!Number.isInteger(idTercero) || idTercero <= 0) {
        await Swal.fire('Atención', 'Seleccione el cliente antes de aplicar las promociones', 'warning')
        return
      }
      const subtotal = this.subtotal
      if (!(subtotal > 0)) {
        await Swal.fire('Atención', 'Agregue artículos a la venta antes de aplicar las promociones', 'warning')
        return
      }

      this.aplicandoPromociones = true
      try {
        const { data } = await promocionService.aplicar({
          idEmpresa: Number(this.idEmpresa),
          idTercero,
          Subtotal: subtotal
        })
        const resultado = data?.data || {}
        const promociones = Array.isArray(resultado.promociones) ? resultado.promociones : []
        const descuentoTotal = this.redondear(resultado.descuentoTotal)

        this.aplicacionPromo = { idTercero, subtotal, descuentoTotal, promociones }

        if (!promociones.length) {
          await Swal.fire('Promociones', 'Ninguna promoción aplica a esta venta', 'info')
          return
        }

        // newventa rechaza un descuento mayor que el subtotal: se deja en el subtotal
        if (descuentoTotal > subtotal) {
          this.descuento = subtotal
          await Swal.fire(
            'Descuento ajustado',
            `Las promociones suman ${this.formatearMoneda(descuentoTotal)}, más que el subtotal. ` +
              `El descuento se dejó en ${this.formatearMoneda(subtotal)}.`,
            'warning'
          )
          return
        }

        this.descuento = descuentoTotal
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudieron aplicar las promociones'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.aplicandoPromociones = false
      }
    },

    // Con promociones vigentes, antes de guardar se pregunta siempre si se aplicaron, para que al
    // vendedor no se le olviden. Devuelve true si se sigue guardando.
    async confirmarPromociones() {
      if (!this.promociones.length) return true

      let titulo = '¿Aplicó las promociones?'
      let texto
      let icono = 'question'
      if (!this.aplicacionPromo) {
        texto = `Hay ${this.promociones.length} promoción(es) vigente(s) y no se han aplicado a esta venta.`
        icono = 'warning'
      } else if (this.promocionesDesactualizadas) {
        texto = 'El cliente o el subtotal cambiaron después de aplicar las promociones; el descuento puede no corresponder.'
        icono = 'warning'
      } else if (!this.aplicacionPromo.promociones.length) {
        texto = 'Se revisaron las promociones y ninguna aplica a esta venta.'
      } else {
        titulo = 'Promociones aplicadas'
        texto = `Se aplicaron ${this.aplicacionPromo.promociones.length} promoción(es) por ` +
          `${this.formatearMoneda(this.aplicacionPromo.descuentoTotal)}. ` +
          `Descuento de la venta: ${this.formatearMoneda(this.descuento)}.`
      }

      const resultado = await Swal.fire({
        title: titulo,
        text: texto,
        icon: icono,
        showCancelButton: true,
        confirmButtonText: 'Guardar venta',
        cancelButtonText: 'Volver y ajustar'
      })
      return resultado.isConfirmed
    },

    // 'YYYY-MM-DD' -> 'DD/MM/YYYY' sin pasar por Date (evita el corrimiento de zona horaria)
    formatearFechaPromo(fecha) {
      const coincide = String(fecha || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
      return coincide ? `${coincide[3]}/${coincide[2]}/${coincide[1]}` : ''
    },

    async cargarVendedores() {
      this.cargandoVendedores = true
      try {
        this.vendedores = await this.catalogosStore.getVendedores(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de vendedores'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoVendedores = false
      }
    },

    reiniciarFormulario() {
      this.tipoVenta = 'CONTADO'
      this.idVendedor = null
      this.terceroSeleccionado = null
      this.descuento = 0
      this.aplicacionPromo = null
      this.efectivo = 0
      this.transaccion = 0
      this.retiraInventario = false
      this.esFinanciado = false
      this.financiadoPor = ''
      this.limpiarCredito()
      this.lineas = []
      this.siguienteClaveLinea = 1
      this.filaActiva = null
      this.dialogTercero = false
      this.dialogClienteForm = false
      this.clienteParaEditar = null
      this.dialogArticulo = false
      this.agregarLinea()
    },

    limpiarCredito() {
      this.numeroCuotas = 1
      this.valorCuota = null
      this.fechaCompromiso = null
      this.cuotas = []
      this.cuotasEditadas = false
    },

    // La tabla existe solo con mas de una cuota: con una sola, el valor y la fecha van en la
    // cabecera (ValorCuota y FechaCompromiso).
    sincronizarCuotas() {
      // Campo vacio = tecleo a medio camino: no se descarta el detalle ya cargado
      if (this.numeroCuotas === '' || this.numeroCuotas === null || this.numeroCuotas === undefined) {
        return
      }
      const cantidad = Number(this.numeroCuotas)
      if (!Number.isInteger(cantidad)) return

      if (cantidad === 1) {
        this.cuotas = []
        this.cuotasEditadas = false
        return
      }
      // Fuera de rango no se reconstruye: validarCredito lo rechaza al guardar
      if (cantidad < 2 || cantidad > MAX_CUOTAS) return

      const anteriores = this.cuotas
      this.cuotas = Array.from({ length: cantidad }, (sinUso, i) => {
        const previa = anteriores[i]
        if (previa) return previa
        return {
          NumCuota: i + 1,
          ValorCuota: this.cuotasEditadas ? null : this.valorCuota,
          FechaPago: null
        }
      })
    },

    // El valor de la cabecera es "el valor comun": al escribirlo, siembra todas las filas
    sembrarCuotas() {
      if (this.cuotasEditadas) return
      this.cuotas.forEach((cuota) => {
        cuota.ValorCuota = this.valorCuota
      })
    },

    // Editar el valor de UNA fila significa que las cuotas no son iguales
    onValorFilaEditado() {
      if (this.cuotasEditadas) return
      this.cuotasEditadas = true
      this.valorCuota = null
    },

    volverAValorUnico() {
      this.cuotasEditadas = false
      this.valorCuota = null
      this.cuotas.forEach((cuota) => {
        cuota.ValorCuota = null
      })
    },

    validarCredito() {
      const numeroCuotas = Number(this.numeroCuotas)
      if (!Number.isInteger(numeroCuotas) || numeroCuotas < 1 || numeroCuotas > MAX_CUOTAS) {
        return `El número de cuotas debe ser un entero entre 1 y ${MAX_CUOTAS}`
      }

      if (numeroCuotas === 1) {
        if (!(Number(this.valorCuota) > 0) || !this.esDecimal12_2(this.valorCuota)) {
          return 'El valor de la cuota debe ser mayor a cero y tener máximo dos decimales'
        }
        if (!this.fechaCompromiso) {
          return 'La fecha de compromiso es obligatoria cuando hay una sola cuota'
        }
        return null
      }

      if (this.cuotas.length !== numeroCuotas) {
        return `El detalle debe traer exactamente ${numeroCuotas} cuotas`
      }
      for (let i = 0; i < this.cuotas.length; i++) {
        const cuota = this.cuotas[i]
        if (!(Number(cuota.ValorCuota) > 0) || !this.esDecimal12_2(cuota.ValorCuota)) {
          return `El valor de la cuota ${cuota.NumCuota} debe ser mayor a cero y tener máximo dos decimales`
        }
        if (!cuota.FechaPago) {
          return `La fecha de pago de la cuota ${cuota.NumCuota} es obligatoria`
        }
        // aaaa-mm-dd se compara bien como texto; el mismo dia si vale
        if (i > 0 && cuota.FechaPago < this.cuotas[i - 1].FechaPago) {
          return `La cuota ${cuota.NumCuota} no puede vencer antes que la cuota ${this.cuotas[i - 1].NumCuota}`
        }
      }
      return null
    },

    // Los cuatro campos de credito del payload. Fuera de CREDITO van en null: el backend
    // responde 400 si POR_ABONO o CONTADO traen detalle de cuotas.
    armarCredito() {
      if (!this.esCredito) {
        return { NumeroCuotas: null, ValorCuota: null, FechaCompromiso: null, Cuotas: null }
      }
      const numeroCuotas = Number(this.numeroCuotas)
      // 1 cuota: valor y fecha en la cabecera, sin detalle
      if (numeroCuotas === 1) {
        return {
          NumeroCuotas: 1,
          ValorCuota: Number(this.valorCuota),
          FechaCompromiso: this.fechaCompromiso,
          Cuotas: null
        }
      }
      // varias cuotas: la cabecera se ignora y el detalle va completo
      return {
        NumeroCuotas: numeroCuotas,
        ValorCuota: null,
        FechaCompromiso: null,
        Cuotas: this.cuotas.map((cuota) => ({
          NumCuota: cuota.NumCuota,
          ValorCuota: Number(cuota.ValorCuota),
          FechaPago: cuota.FechaPago
        }))
      }
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
      if (!this.terceroSeleccionado) return
      this.clienteParaEditar = { ...this.terceroSeleccionado }
      this.dialogClienteForm = true
    },

    onClienteGuardado({ creado, cliente }) {
      if (cliente) {
        this.terceroSeleccionado = cliente
      } else if (creado) {
        this.terceroSeleccionado = null
      }
      this.clienteParaEditar = null
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
    },

    agregarLinea() {
      if (this.lineas.length >= MAX_LINEAS) return
      this.lineas.push({
        clave: this.siguienteClaveLinea++,
        EsBolsa: false,
        idBodega: null,
        idArticulo: null,
        artNombre: '',
        artPropiedades: '',
        // solo informativo: no viaja al backend
        artCantidadGramos: null,
        Cantidad: 1,
        PrecioVentaUnidad: 0
      })
    },

    // artCantidadGramos llega como CADENA con 4 decimales ("5.2370") o null
    formatearGramos(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })
    },

    // La ventanilla se abre sin bodega (todas): una fila por articulo + bodega, y la bodega de
    // la linea es la de la fila elegida.
    abrirSelectorArticulo(indice) {
      this.filaActiva = indice
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(articulo) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      if (!fila) {
        this.filaActiva = null
        return
      }
      fila.idBodega = Number(articulo.artBodegaId)
      fila.idArticulo = Number(articulo.artId)
      fila.artNombre = articulo.artNombre
      fila.artPropiedades = articulo.artPropiedades || ''
      fila.artCantidadGramos = articulo.artCantidadGramos ?? null
      fila.PrecioVentaUnidad = Number(articulo.artPrecio)
      this.filaActiva = null
    },

    quitarLinea(indice) {
      this.lineas.splice(indice, 1)
      this.filaActiva = null
    },

    esDecimal12_2(valor) {
      const numero = Number(valor)
      return Number.isFinite(numero) &&
        numero >= 0 &&
        numero <= MAX_DECIMAL_12_2 &&
        Number(numero.toFixed(2)) === numero
    },

    esCantidadHasta4Decimales(valor) {
      const numero = Number(valor)
      return Number.isFinite(numero) &&
        numero > 0 &&
        numero <= MAX_DECIMAL_12_2 &&
        Number(numero.toFixed(4)) === numero
    },

    validarLineas() {
      if (this.lineas.length < 1) return 'Debe agregar al menos un artículo'
      if (this.lineas.length > MAX_LINEAS) return 'La venta no puede tener más de 200 artículos'

      for (let indice = 0; indice < this.lineas.length; indice++) {
        const fila = this.lineas[indice]
        const numero = indice + 1
        // La bodega llega junto con el articulo: sin uno no hay el otro.
        if (!Number.isInteger(Number(fila.idArticulo)) || Number(fila.idArticulo) <= 0 ||
            !Number.isInteger(Number(fila.idBodega)) || Number(fila.idBodega) <= 0) {
          return 'Seleccione el artículo de la línea ' + numero
        }
        if (!this.esCantidadHasta4Decimales(fila.Cantidad)) {
          return 'La cantidad de la línea ' + numero +
            ' debe ser mayor a cero y tener máximo cuatro decimales'
        }
        // Una bolsa puede ir en cero (incluida sin cobrar); el resto exige precio mayor a cero
        if (fila.EsBolsa) {
          if (!this.esDecimal12_2(fila.PrecioVentaUnidad)) {
            return 'El precio de la bolsa de la línea ' + numero +
              ' debe ser cero o mayor y tener máximo dos decimales'
          }
        } else if (!(Number(fila.PrecioVentaUnidad) > 0) || !this.esDecimal12_2(fila.PrecioVentaUnidad)) {
          return 'El precio de la línea ' + numero +
            ' debe ser mayor a cero y tener máximo dos decimales'
        }
      }

      // El backend agrupa el mismo artículo en la misma bodega y rechaza si difieren precio o bolsa
      for (let i = 0; i < this.lineas.length; i++) {
        for (let j = i + 1; j < this.lineas.length; j++) {
          const a = this.lineas[i]
          const b = this.lineas[j]
          if (Number(a.idArticulo) !== Number(b.idArticulo) || Number(a.idBodega) !== Number(b.idBodega)) continue
          if (Number(a.PrecioVentaUnidad) !== Number(b.PrecioVentaUnidad)) {
            return `Las líneas ${i + 1} y ${j + 1} tienen el mismo artículo y bodega con precios distintos`
          }
          if (Boolean(a.EsBolsa) !== Boolean(b.EsBolsa)) {
            return `Las líneas ${i + 1} y ${j + 1} tienen el mismo artículo y bodega, pero solo una está marcada como bolsa`
          }
        }
      }
      return null
    },

    // FinanciadoPor: obligatorio (sin contar espacios) y maximo 100 cuando la venta es financiada
    reglaFinanciadoPor(valor) {
      const texto = (valor || '').trim()
      if (!texto) return 'Indique quién financia la venta (Sistecredito, Addi...)'
      if (texto.length > 100) return 'Financiado por no puede superar los 100 caracteres'
      return true
    },

    validarCabecera() {
      if (!Number.isInteger(Number(this.idEmpresa)) || Number(this.idEmpresa) <= 0) {
        return 'Seleccione una empresa en la barra superior'
      }
      if (!this.terceroSeleccionado ||
          !Number.isInteger(Number(this.terceroSeleccionado.Id)) ||
          Number(this.terceroSeleccionado.Id) <= 0) {
        return 'Seleccione un cliente'
      }
      if (this.idVendedor !== null && this.idVendedor !== undefined &&
          (!Number.isInteger(Number(this.idVendedor)) || Number(this.idVendedor) <= 0)) {
        return 'Seleccione un vendedor válido'
      }
      if (this.esFinanciado) {
        const errorFinanciado = this.reglaFinanciadoPor(this.financiadoPor)
        if (errorFinanciado !== true) return errorFinanciado
      }
      if (!this.esDecimal12_2(this.descuento)) {
        return 'El descuento debe ser un valor no negativo con máximo dos decimales'
      }
      if (Number(this.descuento) > this.subtotal) {
        return 'El descuento no puede superar el subtotal'
      }
      if (!this.esDecimal12_2(this.efectivo)) {
        return 'El pago en efectivo debe ser un valor no negativo con máximo dos decimales'
      }
      if (!this.esDecimal12_2(this.transaccion)) {
        return 'El pago por transacción debe ser un valor no negativo con máximo dos decimales'
      }
      if (this.tipoVenta === 'CONTADO') {
        if (this.saldo !== 0) {
          return 'La venta de contado debe quedar con saldo cero'
        }
      } else if (!(this.saldo > 0)) {
        return 'Una venta a crédito o por abono debe quedar con saldo pendiente'
      }
      if (this.esCredito) return this.validarCredito()
      return null
    },

    armarArticulos() {
      return this.lineas.map((fila) => ({
        EsBolsa: Boolean(fila.EsBolsa),
        idBodega: Number(fila.idBodega),
        idArticulo: Number(fila.idArticulo),
        Cantidad: Number(fila.Cantidad),
        PrecioVentaUnidad: Number(fila.PrecioVentaUnidad)
      }))
    },

    async confirmar() {
      if (this.guardando) return

      const errorLineas = this.validarLineas()
      if (errorLineas) {
        await Swal.fire('Atención', errorLineas, 'warning')
        return
      }

      const errorCabecera = this.validarCabecera()
      if (errorCabecera) {
        await Swal.fire('Atención', errorCabecera, 'warning')
        return
      }

      if (!(await this.confirmarPromociones())) return

      const payload = {
        idEmpresa: Number(this.idEmpresa),
        idTercero: Number(this.terceroSeleccionado.Id),
        idVendedor: this.idVendedor ? Number(this.idVendedor) : null,
        TipoVenta: this.tipoVenta,
        RetiraInventario: Boolean(this.retiraInventario),
        // booleano real: el backend rechaza "true" en texto, 1 o 0
        EsFinanciado: this.esFinanciado === true,
        FinanciadoPor: this.esFinanciado ? this.financiadoPor.trim() : null,
        ValorDescuento: Number(this.descuento),
        ValorEfectivo: Number(this.efectivo),
        ValorTransaccion: Number(this.transaccion),
        ...this.armarCredito(),
        Articulos: this.armarArticulos()
      }

      this.guardando = true
      try {
        const { data: respuestaVenta } = await ventasService.create(payload)
        const venta = respuestaVenta?.data

        if (!venta) {
          await Swal.fire(
            'Venta registrada',
            respuestaVenta?.msg || 'La venta se guardó, pero no se recibieron los datos para generar la factura.',
            'warning'
          )
          this.$router.back()
          return
        }

        let empresa = this.authStore.empresaActual || {}
        let mensajeEmpresa = ''
        try {
          empresa = await this.authStore.obtenerDatosEmpresa(Number(this.idEmpresa))
        } catch (errorEmpresa) {
          mensajeEmpresa = errorEmpresa.response?.data?.msg ||
            'No se pudieron cargar los datos completos de la empresa; se usaron los disponibles en la sesión.'
        }

        try {
          const parametros = { venta, empresa }
          if (this.tipoImpresion === 'tirillaPdf') {
            generarTirillaPDF(parametros)
          } else if (this.tipoImpresion === 'tirilla') {
            generarTirilla({ ...parametros, anchoMm: this.anchoTirilla })
          } else {
            await generarPdfVenta(parametros)
          }
        } catch (errorPdf) {
          const mensaje = errorPdf.message || 'Error desconocido'
          await Swal.fire(
            'Venta registrada',
            `La venta se guardó, pero no se pudo generar la impresión: ${mensaje}`,
            'warning'
          )
          this.$router.back()
          return
        }

        if (mensajeEmpresa) {
          await Swal.fire('Venta registrada', `La factura se descargó. ${mensajeEmpresa}`, 'warning')
        } else {
          await Swal.fire('Éxito', 'Venta registrada y factura generada', 'success')
        }
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar la venta'
        await Swal.fire('Error', mensaje, 'error')
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

<style scoped>
/* Fondo del recuadro de promociones: cambiar aqui el gris */
.promociones-venta {
  background-color: #d7d7d7;
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
.totales-venta {
  width: min(100%, 420px);
}

.totales-venta__fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  align-items: center;
  gap: 16px;
  min-height: 52px;
}

.totales-venta__valor {
  text-align: right;
  font-weight: 500;
}

.totales-venta__campo {
  width: 100%;
}
</style>
