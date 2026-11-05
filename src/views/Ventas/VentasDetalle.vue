<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Venta {{ venta ? '#' + venta.ventaId : '#' + ventaId }}
          <v-chip
            v-if="venta"
            :color="esActiva ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActiva ? 'Activa' : 'Anulada' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Consulte el detalle y los estados de la venta.
        </p>
      </div>
    </div>

    <div v-if="venta" class="d-flex align-center flex-wrap ga-3 mb-4">
      <span class="text-body-2 font-weight-medium">Tipo impresión:</span>
      <v-select
        v-model="tipoImpresion"
        :items="opcionesTipoImpresion"
        item-title="texto"
        item-value="valor"
        label="Formato"
        variant="outlined"
        density="compact"
        hide-details
        class="selector-impresion"
      />
      <v-select
        v-if="tipoImpresion === 'tirilla'"
        v-model.number="anchoTirilla"
        :items="opcionesAnchoTirilla"
        item-title="texto"
        item-value="valor"
        label="Ancho"
        variant="outlined"
        density="compact"
        hide-details
        class="selector-ancho"
      />
      <v-btn
        icon="mdi-printer"
        variant="tonal"
        title="Imprimir"
        aria-label="Imprimir venta"
        :loading="imprimiendo"
        :disabled="imprimiendo"
        @click="imprimir"
      />
    </div>

    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-btn
        v-if="venta && esActiva"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular venta
      </v-btn>
      <v-btn
        v-if="venta && esActiva"
        variant="tonal"
        prepend-icon="mdi-cash-multiple"
        @click="abrirEstadoPago"
      >
        Cambiar estado de pago
      </v-btn>
      <v-btn
        v-if="venta && esActiva"
        variant="tonal"
        prepend-icon="mdi-invoice-send"
        @click="abrirEstadoInventario"
      >
        Cambiar estado de inventario
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="venta">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cabecera</div>
        <v-row dense>
          <v-col cols="12" md="6">
            <div class="campo">
              <span class="campo-rotulo">Fecha:</span>
              <span>{{ formatearFecha(venta.ventaFecha) }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Tipo de venta:</span>
              <span>{{ venta.ventaTipoVenta || '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Cliente:</span>
              <span>{{ terceroCompleto }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Vendedor:</span>
              <span>{{ venta.ventaVendedor || '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Usuario:</span>
              <span>{{ venta.ventaUsuario || '-' }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="campo">
              <span class="campo-rotulo">Estado de pago:</span>
              <span>{{ venta.ventaEstadoPago || '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Estado de inventario:</span>
              <span>{{ venta.ventaEstadoInventario || '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Fecha último pago:</span>
              <span>{{ venta.ventaFechaUltimoPago ? formatearFecha(venta.ventaFechaUltimoPago) : '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Fecha de pago:</span>
              <span>{{ venta.ventaFechaPago ? formatearFecha(venta.ventaFechaPago) : '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Usuario de pago:</span>
              <span>{{ venta.ventaUsuarioPago || '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Fecha de inventario:</span>
              <span>{{ venta.ventaFechaInventario ? formatearFecha(venta.ventaFechaInventario) : '-' }}</span>
            </div>
            <div class="campo">
              <span class="campo-rotulo">Usuario de inventario:</span>
              <span>{{ venta.ventaUsuarioInventario || '-' }}</span>
            </div>
          </v-col>
        </v-row>

        <template v-if="esCredito">
          <v-divider class="my-4" />
          <v-row dense>
            <v-col cols="12" sm="4">
              <div class="campo">
                <span class="campo-rotulo">Número cuotas:</span>
                <span>{{ venta.ventaNumeroCuotas ?? '-' }}</span>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="campo">
                <span class="campo-rotulo">Valor cuota:</span>
                <span>
                  {{ tieneCuotaCabecera
                    ? formatearMoneda(venta.ventaValorCuota)
                    : (cuotas.length ? 'Ver detalle de cuotas' : '-') }}
                </span>
              </div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="campo">
                <span class="campo-rotulo">Fecha compromiso:</span>
                <span>{{ venta.ventaFechaCompromiso ? formatearDia(venta.ventaFechaCompromiso) : '-' }}</span>
              </div>
            </v-col>
          </v-row>
        </template>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Artículos vendidos</div>
        <div style="overflow-x: auto;">
          <v-table density="compact" class="tabla-listado">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Bodega</th>
                <th class="text-center">Bolsa</th>
                <th class="text-end" title="Cantidad en gramos">Gr</th>
                <th class="text-end">Cantidad</th>
                <th class="text-end">Precio unidad</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  Esta venta no tiene artículos
                </td>
              </tr>
              <tr v-for="(linea, indice) in lineas" :key="`${linea.detArticuloId}-${indice}`">
                <td>
                  <div>{{ linea.detArticuloNombre || '-' }}</div>
                  <div v-if="linea.detArticuloPropiedades" class="text-caption text-medium-emphasis">
                    {{ linea.detArticuloPropiedades }}
                  </div>
                </td>
                <td>{{ linea.detBodegaNombre || '-' }}</td>
                <td class="text-center">
                  <v-chip
                    :color="esBolsa(linea) ? 'primary' : 'default'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ esBolsa(linea) ? 'Sí' : 'No' }}
                  </v-chip>
                </td>
                <td class="text-end">{{ formatearGramos(linea.detCantidadGramos) }}</td>
                <td class="text-end">{{ formatearCantidad(linea.detCantidad) }}</td>
                <td class="text-end">{{ formatearMoneda(linea.detPrecioVentaUnidad) }}</td>
                <td class="text-end">
                  {{ formatearMoneda(Number(linea.detCantidad) * Number(linea.detPrecioVentaUnidad)) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1" aria-label="Resumen de la venta">
        <div class="d-flex justify-end">
          <div class="resumen-montos">
            <div class="text-subtitle-2 mb-2 text-end">Resumen de la venta</div>
            <div class="resumen-montos__fila">
              <span>Subtotal</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(venta.ventaSubtotal) }}</span>
            </div>
            <div class="resumen-montos__fila">
              <span>Descuento</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(venta.ventaDescuento) }}</span>
            </div>
            <div class="resumen-montos__fila">
              <span>Efectivo</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(venta.ventaEfectivo) }}</span>
            </div>
            <div class="resumen-montos__fila">
              <span>Transacción</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(venta.ventaTransaccion) }}</span>
            </div>
            <div class="resumen-montos__fila">
              <span>Cancelado</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(venta.ventaCancelado) }}</span>
            </div>
            <div v-if="venta.ventaTipoVenta !== 'CONTADO'" class="resumen-montos__fila">
              <span>Suma pagos</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(sumaPagosActivos) }}</span>
            </div>
            <div class="resumen-montos__fila">
              <span>Saldo</span>
              <span class="resumen-montos__valor">{{ formatearMoneda(venta.ventaSaldo) }}</span>
            </div>
          </div>
        </div>
      </v-card>
      <v-card v-if="esCredito" class="pa-6 mb-4" elevation="1">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-subtitle-2">Cuotas</span>
          <v-btn
            v-if="esActiva && numerosParaCrear.length"
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-plus"
            @click="abrirCuotaNueva"
          >
            Agregar cuota
          </v-btn>
        </div>
        <div style="overflow-x: auto;">
          <v-table density="compact" class="tabla-listado">
            <thead>
              <tr>
                <th style="width: 80px">N°</th>
                <th class="text-end">Valor</th>
                <th>Fecha de pago</th>
                <th class="text-center">Estado</th>
                <th v-if="esActiva" class="text-center" style="width: 120px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <!-- Venta de UNA cuota: la cuota vive en la cabecera, no en "cuotas", y no tiene
                   idCuota: no se puede editar ni borrar. -->
              <tr v-if="tieneCuotaCabecera">
                <td>1</td>
                <td class="text-end">{{ formatearMoneda(venta.ventaValorCuota) }}</td>
                <td>{{ venta.ventaFechaCompromiso ? formatearDia(venta.ventaFechaCompromiso) : '-' }}</td>
                <td class="text-center">-</td>
                <td v-if="esActiva" class="text-center text-caption text-medium-emphasis">
                  No editable
                </td>
              </tr>
              <tr v-else-if="!cuotas.length">
                <td :colspan="esActiva ? 5 : 4" class="text-center py-6 text-medium-emphasis">
                  No hay cuotas registradas
                </td>
              </tr>
              <tr v-for="cuota in cuotas" :key="cuota.cuoId">
                <td>{{ cuota.cuoNumCuota }}</td>
                <td class="text-end">{{ formatearMoneda(cuota.cuoValorCuota) }}</td>
                <td>{{ cuota.cuoFechaPago ? formatearDia(cuota.cuoFechaPago) : '-' }}</td>
                <td class="text-center">
                  <v-chip
                    :color="cuota.cuoEstado === 'PAGADA' ? 'success' : 'grey'"
                    size="small"
                    variant="tonal"
                  >
                    {{ etiquetaEstadoCuota(cuota.cuoEstado) }}
                  </v-chip>
                </td>
                <td v-if="esActiva" class="text-center text-no-wrap">
                  <v-btn
                    icon="mdi-pencil" size="small" variant="text"
                    title="Editar esta cuota" @click="abrirCuotaEdicion(cuota)"
                  />
                  <v-btn
                    icon="mdi-delete" size="small" variant="text"
                    :disabled="!puedeBorrarCuotas"
                    :title="puedeBorrarCuotas ? 'Borrar esta cuota' : 'La venta debe conservar al menos una cuota'"
                    @click="borrarCuota(cuota)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
        <p v-if="tieneCuotaCabecera" class="text-caption text-medium-emphasis mt-3 mb-0">
          Al agregar la cuota 2, la cuota única pasa al detalle y ya se puede editar.
        </p>
        <p class="text-caption text-medium-emphasis mt-3 mb-0">
          Marcar una cuota como pagada no mueve caja ni recalcula el saldo de la venta: es un
          registro informativo. El cobro se registra en el módulo de Pagos.
        </p>
      </v-card>

      <v-card v-if="venta.ventaTipoVenta !== 'CONTADO'" class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Pagos</div>
        <div style="overflow-x: auto;">
          <v-table density="compact" class="tabla-listado">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Método</th>
                <th class="text-end">Monto</th>
                <th>Observación</th>
                <th>Usuario</th>
                <th class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pagos.length">
                <td colspan="7" class="text-center py-6 text-medium-emphasis">
                  Esta venta no tiene pagos registrados
                </td>
              </tr>
              <tr
                v-for="pago in pagos"
                :key="pago.pagoId"
                :class="{ 'fila-anulada': !pagoActivo(pago) }"
              >
                <td>{{ formatearFecha(pago.pagoFecha) }}</td>
                <td>{{ pago.pagoTipoOrigen || '-' }}</td>
                <td>{{ pago.pagoMetodoPago || '-' }}</td>
                <td class="text-end">{{ formatearMoneda(pago.pagoMonto) }}</td>
                <td>{{ pago.pagoObservacion || '-' }}</td>
                <td>{{ pago.pagoUsuario || '-' }}</td>
                <td class="text-center">
                  <v-chip
                    :color="pagoActivo(pago) ? 'success' : 'error'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ pagoActivo(pago) ? 'Activo' : 'Anulado' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>

      <v-card v-if="!esActiva" class="pa-6 mb-4" elevation="1" color="error" variant="tonal">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="text-caption">Motivo</div>
            <div>{{ venta.ventaMotivoAnulacion || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Fecha</div>
            <div>{{ venta.ventaFechaAnulacion ? formatearFecha(venta.ventaFechaAnulacion) : '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Anulada por</div>
            <div>{{ venta.ventaUsuarioAnulador || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>
    </template>

    <v-dialog v-model="dialogNueva" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Agregar cuota</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogNueva = false" />
        </div>

        <v-select
          v-model="formNueva.NumCuota"
          :items="numerosParaCrear"
          label="Número de cuota"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Los números libres, hasta una cuota más de las pactadas (máximo 24)"
          persistent-hint
        />

        <v-text-field
          v-model.number="formNueva.ValorCuota"
          label="Valor de la cuota"
          prefix="$"
          type="number"
          min="0"
          step="0.01"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <v-text-field
          v-model="formNueva.FechaPago"
          label="Fecha de pago"
          type="date"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Obligatoria. Debe quedar en orden con la cuota anterior y la siguiente"
          persistent-hint
        />

        <p class="text-caption text-medium-emphasis mb-0">La cuota nace en estado Pendiente.</p>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="dialogNueva = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoNueva" @click="crearCuota">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEdicion" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Editar cuota {{ formEdicion.NumCuota }}</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogEdicion = false" />
        </div>

        <v-text-field
          v-model.number="formEdicion.ValorCuota"
          label="Valor de la cuota"
          prefix="$"
          type="number"
          min="0"
          step="0.01"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <v-text-field
          v-model="formEdicion.FechaPago"
          label="Fecha de pago"
          type="date"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Obligatoria: no se puede dejar vacía"
          persistent-hint
        />

        <v-select
          v-model="formEdicion.Estado"
          :items="opcionesEstadoCuota"
          item-title="texto"
          item-value="valor"
          label="Estado"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="dialogEdicion = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoEdicion" @click="editarCuota">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEstadoPago" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Cambiar estado de pago</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogEstadoPago = false" />
        </div>
        <p class="text-caption text-medium-emphasis mb-4">
          Cambia el estado de pago de la venta. Selecciona el nuevo estado para continuar.
        </p>
        <v-select
          v-model="estadoPagoNuevo"
          :items="opcionesEstadoPago"
          item-title="texto"
          item-value="valor"
          label="Estado de pago"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="dialogEstadoPago = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoEstadoPago" @click="guardarEstadoPago">
            Aceptar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEstadoInventario" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Cambiar estado de inventario</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogEstadoInventario = false" />
        </div>
        <p class="text-caption text-medium-emphasis mb-4">
          Al marcar el inventario como completo se registran los artículos de la venta en el inventario.
          ¿Desea continuar?
        </p>
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="dialogEstadoInventario = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoEstadoInventario" @click="guardarEstadoInventario">
            Aceptar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import ventasService from '@/services/ventasService'
import empresaService from '@/services/empresaService'
import { generarPdfVenta } from '@/utils/ventaPdf'
import { generarTirillaPDF } from '@/utils/tirillaPDF'
import { generarTirilla } from '@/utils/tirilla'

export default {
  name: 'VentasDetalle',

  data() {
    return {
      cargando: false,
      imprimiendo: false,
      anulando: false,
      venta: null,
      lineas: [],
      pagos: [],
      cuotas: [],
      dialogNueva: false,
      guardandoNueva: false,
      formNueva: { NumCuota: null, ValorCuota: null, FechaPago: null },
      dialogEdicion: false,
      guardandoEdicion: false,
      // idCuota va dentro del formulario: cargar() reemplaza las filas de `cuotas` al recargar
      formEdicion: { idCuota: null, NumCuota: null, ValorCuota: null, FechaPago: null, Estado: 'PENDIENTE' },
      opcionesEstadoCuota: [
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'PAGADA', texto: 'Pagada' }
      ],
      dialogEstadoPago: false,
      guardandoEstadoPago: false,
      estadoPagoNuevo: '',
      dialogEstadoInventario: false,
      guardandoEstadoInventario: false,
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
      opcionesEstadoPago: [
        { valor: 'PARCIAL', texto: 'Parcial' },
        { valor: 'COMPLETO', texto: 'Completo' }
      ]
    }
  },

  computed: {
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    ventaId() {
      return Number(this.$route.params.VentaId)
    },
    esActiva() {
      return this.venta?.ventaEstado === 1 ||
        this.venta?.ventaEstado === true ||
        this.venta?.ventaEstado === '1'
    },
    esCredito() {
      return this.venta?.ventaTipoVenta === 'CREDITO'
    },
    // Las cuotas pactadas. Las ventas a credito anteriores al 2026-11-04 lo traen null: cuentan 0.
    cuotasPactadas() {
      return Number(this.venta?.ventaNumeroCuotas) || 0
    },
    // Venta de UNA cuota creada asi: la cuota 1 esta en ventaValorCuota/ventaFechaCompromiso
    tieneCuotaCabecera() {
      return !this.cuotas.length &&
        this.venta?.ventaValorCuota !== null &&
        this.venta?.ventaValorCuota !== undefined
    },
    // Numeros que se pueden crear: los libres de 1..N mas el N+1 (tope 24). La cuota de la
    // cabecera ocupa el 1, igual que una fila de "cuotas".
    numerosParaCrear() {
      const usados = new Set(this.cuotas.map((cuota) => Number(cuota.cuoNumCuota)))
      if (this.tieneCuotaCabecera) usados.add(1)
      const tope = Math.min(this.cuotasPactadas + 1, 24)
      const libres = []
      for (let numero = 1; numero <= tope; numero++) {
        if (!usados.has(numero)) libres.push(numero)
      }
      return libres
    },
    // El backend no deja la venta sin cuotas: con ventaNumeroCuotas 1 o menos responde 400
    puedeBorrarCuotas() {
      return this.cuotasPactadas > 1
    },
    sumaPagosActivos() {
      return this.pagos
        .filter((pago) => this.pagoActivo(pago))
        .reduce((total, pago) => total + (Number(pago.pagoMonto) || 0), 0)
    },
    terceroCompleto() {
      if (!this.venta) return '-'
      const partes = [
        this.venta.ventaTerceroTipoDoc,
        this.venta.ventaTerceroNumeroDoc,
        this.venta.ventaTercero
      ].filter(Boolean)
      return partes.length ? partes.join(' ') : '-'
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data: respuesta } = await ventasService.getById({
          idEmpresa: this.idEmpresa,
          idVenta: this.ventaId
        })
        if (!respuesta?.data) {
          await Swal.fire('Error', respuesta?.msg || 'No se pudo cargar la venta', 'error')
          this.$router.back()
          return
        }
        this.venta = respuesta.data
        this.lineas = Array.isArray(respuesta.data.lineas) ? respuesta.data.lineas : []
        this.pagos = Array.isArray(respuesta.data.pagos) ? respuesta.data.pagos : []
        this.cuotas = Array.isArray(respuesta.data.cuotas) ? respuesta.data.cuotas : []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la venta'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    async anular() {
      const { value: motivo } = await Swal.fire({
        title: '¿Anular esta venta?',
        html:
          '<p style="text-align:left">La anulación marca la venta y guarda el motivo, quién la anuló y cuándo.</p>' +
          // Sin esto el usuario supone que la caja y el inventario se corrigen solos, y no se corrigen.
          '<p style="text-align:left">Anular <b>no revierte la caja, el inventario ni los pagos</b>: ' +
          'si hay que devolver plata o mercancía, se hace a mano con un ajuste de caja, un ajuste de ' +
          'inventario y la anulación de cada pago. <b>Una venta anulada no se puede reactivar.</b></p>' +
          '<p style="text-align:left">Escriba el motivo (entre 5 y 300 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 300 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 5) return 'El motivo debe tener al menos 5 caracteres'
          if (texto.length > 300) return 'El motivo no puede superar los 300 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulando = true
      try {
        const { data } = await ventasService.anular({
          idEmpresa: this.idEmpresa,
          idVenta: this.ventaId,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Venta anulada', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular la venta'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    etiquetaEstadoCuota(estado) {
      return estado === 'PAGADA' ? 'Pagada' : 'Pendiente'
    },

    // El backend manda '2026-11-19T05:00:00.000Z' y el input type="date" necesita 'aaaa-mm-dd'
    aFechaInput(valor) {
      if (!valor) return null
      return String(valor).slice(0, 10)
    },

    // el backend responde {msg} o, con express-validator, {errors:[{msg}]}
    mensajeError(error, porDefecto) {
      return error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || porDefecto
    },

    abrirCuotaNueva() {
      this.formNueva = {
        NumCuota: this.numerosParaCrear[0] ?? null,
        ValorCuota: null,
        FechaPago: null
      }
      this.dialogNueva = true
    },

    abrirCuotaEdicion(cuota) {
      this.formEdicion = {
        idCuota: cuota.cuoId,
        NumCuota: Number(cuota.cuoNumCuota),
        ValorCuota: Number(cuota.cuoValorCuota),
        FechaPago: this.aFechaInput(cuota.cuoFechaPago),
        Estado: cuota.cuoEstado || 'PENDIENTE'
      }
      this.dialogEdicion = true
    },

    async crearCuota() {
      const numero = Number(this.formNueva.NumCuota)
      // El select queda vacio cuando no hay numeros libres: sin esto viajaria NumCuota null
      if (!Number.isInteger(numero) || !this.numerosParaCrear.includes(numero)) {
        Swal.fire('Atención', 'Elija el número de la cuota', 'warning')
        return
      }
      if (!(Number(this.formNueva.ValorCuota) > 0)) {
        Swal.fire('Atención', 'El valor de la cuota debe ser mayor a cero', 'warning')
        return
      }
      if (!this.formNueva.FechaPago) {
        Swal.fire('Atención', 'La fecha de pago de la cuota es obligatoria', 'warning')
        return
      }

      this.guardandoNueva = true
      try {
        const { data } = await ventasService.createCuota({
          idEmpresa: this.idEmpresa,
          idVenta: this.ventaId,
          NumCuota: numero,
          ValorCuota: Number(this.formNueva.ValorCuota),
          FechaPago: this.formNueva.FechaPago
        })
        this.dialogNueva = false
        await Swal.fire('Éxito', data.msg || 'Cuota registrada', 'success')
        await this.cargar()
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo agregar la cuota'), 'error')
      } finally {
        this.guardandoNueva = false
      }
    },

    async editarCuota() {
      if (!(Number(this.formEdicion.ValorCuota) > 0)) {
        Swal.fire('Atención', 'El valor de la cuota debe ser mayor a cero', 'warning')
        return
      }
      if (!this.formEdicion.FechaPago) {
        Swal.fire('Atención', 'La fecha de pago no se puede dejar vacía', 'warning')
        return
      }

      this.guardandoEdicion = true
      try {
        // NumCuota no se edita en ventas: no se manda
        const { data } = await ventasService.updateCuota({
          idEmpresa: this.idEmpresa,
          idCuota: this.formEdicion.idCuota,
          Estado: this.formEdicion.Estado,
          ValorCuota: Number(this.formEdicion.ValorCuota),
          FechaPago: this.formEdicion.FechaPago
        })
        this.dialogEdicion = false
        await Swal.fire('Éxito', data.msg || 'Cuota actualizada', 'success')
        await this.cargar()
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo actualizar la cuota'), 'error')
      } finally {
        this.guardandoEdicion = false
      }
    },

    async borrarCuota(cuota) {
      const esUltima = Number(cuota.cuoNumCuota) === this.cuotasPactadas
      const { isConfirmed } = await Swal.fire({
        title: `¿Borrar la cuota ${cuota.cuoNumCuota}?`,
        text: esUltima
          ? 'Se borra de forma definitiva y la venta queda con una cuota pactada menos.'
          : 'Se borra de forma definitiva. El número queda libre para volver a crearla.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Borrar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828'
      })
      if (!isConfirmed) return

      try {
        // Responde 204 SIN cuerpo: no hay data.msg que leer
        await ventasService.deleteCuota({ idEmpresa: this.idEmpresa, idCuota: cuota.cuoId })
        await Swal.fire('Éxito', 'Cuota borrada', 'success')
        await this.cargar()
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo borrar la cuota'), 'error')
      }
    },

    abrirEstadoPago() {
      this.estadoPagoNuevo = ''
      this.dialogEstadoPago = true
    },

    async guardarEstadoPago() {
      if (!this.estadoPagoNuevo) {
        await Swal.fire('Atención', 'Seleccione el nuevo estado de pago', 'warning')
        return
      }
      this.guardandoEstadoPago = true
      try {
        const { data } = await ventasService.updateEstadoPago({
          idEmpresa: this.idEmpresa,
          idVenta: this.ventaId,
          EstadoPago: this.estadoPagoNuevo
        })
        this.dialogEstadoPago = false
        await Swal.fire('Éxito', data.msg || 'Estado de pago actualizado', 'success')
        await this.cargar()
      } catch (error) {
        this.dialogEstadoPago = false
        const mensaje = error.response?.data?.msg || 'No se pudo actualizar el estado de pago'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoEstadoPago = false
      }
    },

    abrirEstadoInventario() {
      this.dialogEstadoInventario = true
    },

    async guardarEstadoInventario() {
      this.guardandoEstadoInventario = true
      try {
        const { data } = await ventasService.updateEstadoInventario({
          idEmpresa: this.idEmpresa,
          idVenta: this.ventaId,
          EstadoInventario: 'COMPLETO'
        })
        this.dialogEstadoInventario = false
        await Swal.fire('Éxito', data.msg || 'Estado de inventario actualizado', 'success')
        await this.cargar()
      } catch (error) {
        this.dialogEstadoInventario = false
        const mensaje = error.response?.data?.msg || 'No se pudo actualizar el estado de inventario'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoEstadoInventario = false
      }
    },

    async imprimir() {
      if (this.imprimiendo || !this.venta) return
      this.imprimiendo = true
      try {
        const { data: respuestaEmpresa } = await empresaService.getById({
          idEmpresa: this.idEmpresa
        })
        const empresa = respuestaEmpresa?.data
        if (!empresa) {
          await Swal.fire(
            'Error',
            respuestaEmpresa?.msg || 'No se recibieron los datos de la empresa para imprimir',
            'error'
          )
          return
        }

        const parametros = { venta: this.venta, empresa }
        if (this.tipoImpresion === 'tirillaPdf') {
          generarTirillaPDF(parametros)
        } else if (this.tipoImpresion === 'tirilla') {
          generarTirilla({ ...parametros, anchoMm: this.anchoTirilla })
        } else {
          await generarPdfVenta(parametros)
        }
      } catch (error) {
        const mensaje = error.response?.data?.msg || error.message ||
          'No se pudo cargar la empresa o generar la impresión de la venta'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.imprimiendo = false
      }
    },

    pagoActivo(pago) {
      return pago.pagoEstado === 1 || pago.pagoEstado === true || pago.pagoEstado === '1'
    },

    esBolsa(linea) {
      return linea.detEsBolsa === true || linea.detEsBolsa === 1 || linea.detEsBolsa === '1'
    },

    formatearFecha(fecha) {
      if (!fecha) return '-'
      const valorFecha = new Date(fecha)
      if (Number.isNaN(valorFecha.getTime())) return String(fecha).slice(0, 10)
      return valorFecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    // Solo el dia (vencimientos y fecha de compromiso): sin hora, que no aplica
    formatearDia(fecha) {
      if (!fecha) return '-'
      const [anio, mes, dia] = String(fecha).slice(0, 10).split('-')
      if (!anio || !mes || !dia) return String(fecha)
      return `${dia}/${mes}/${anio}`
    },

    formatearCantidad(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    // Llega como cadena con 4 decimales ("3.5000") o null si el articulo no tiene peso;
    // Number(null) daria 0, por eso null se descarta antes.
    formatearGramos(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }
  }
}
</script>

<style scoped>
.campo {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.campo-rotulo {
  font-weight: 600;
}

.fila-anulada td {
  opacity: 0.55;
  text-decoration: line-through;
}

.selector-impresion {
  flex: 0 1 240px;
}

.selector-ancho {
  flex: 0 1 140px;
}

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
.resumen-montos {
  width: min(100%, 420px);
}

.resumen-montos__fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  align-items: center;
  gap: 16px;
  min-height: 36px;
}

.resumen-montos__valor {
  text-align: right;
  font-weight: 500;
}
</style>
