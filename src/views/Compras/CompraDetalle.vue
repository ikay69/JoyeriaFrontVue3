<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Compra {{ compra ? '#' + compra.compraId : '' }}
          <v-chip
            v-if="compra"
            :color="esActiva ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActiva ? 'Activa' : 'Anulada' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Una compra no se edita: la única operación correctiva es anularla.
        </p>
      </div>
      <v-btn
        v-if="compra"
        variant="tonal"
        prepend-icon="mdi-printer"
        @click="imprimir"
      >
        Imprimir
      </v-btn>
      <v-btn
        v-if="compra && esCredito && esActiva"
        variant="tonal"
        prepend-icon="mdi-cash-sync"
        @click="abrirCredito"
      >
        Cambiar cuota
      </v-btn>
      <v-btn
        v-if="compra && esActiva"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular compra
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="compra">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cabecera</div>
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Fecha</div>
            <div>{{ formatearFecha(compra.compraFecha) }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Documento soporte</div>
            <div>{{ compra.compraDocumentoSoporte || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Tipo de compra</div>
            <div>{{ compra.compraTipoCompra }}</div>
          </v-col>
          <v-col cols="12" sm="8">
            <div class="text-caption text-medium-emphasis">Tercero</div>
            <div>
              {{ compra.compraTercero }}
              <span class="text-medium-emphasis">
                ({{ compra.compraTerceroTipoDoc || '' }} {{ compra.compraTerceroNumeroDoc || '' }})
              </span>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Subtotal</div>
            <div>{{ formatearMoneda(compra.compraSubtotal) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Descuento</div>
            <div>{{ formatearMoneda(compra.compraDescuento) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Cancelado</div>
            <div>{{ formatearMoneda(compra.compraCancelado) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Saldo</div>
            <div class="font-weight-medium">{{ formatearMoneda(compra.compraSaldo) }}</div>
          </v-col>
        </v-row>

        <template v-if="esCredito">
          <v-divider class="my-4" />
          <v-row dense>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Número de cuotas</div>
              <div>{{ compra.compraNumeroCuotas ?? '-' }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Valor de la cuota</div>
              <div>
                {{ compra.compraValorCuota === null || compra.compraValorCuota === undefined
                  ? 'Valores distintos (ver detalle)'
                  : formatearMoneda(compra.compraValorCuota) }}
              </div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Fecha de compromiso</div>
              <div>{{ compra.compraFechaCompromiso ? formatearFecha(compra.compraFechaCompromiso) : '-' }}</div>
            </v-col>
          </v-row>
        </template>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Artículos comprados</div>
        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Bodega</th>
                <th class="text-end">Cantidad</th>
                <th class="text-end">Costo unidad</th>
                <th class="text-end">Costo total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  Esta compra no tiene líneas
                </td>
              </tr>
              <tr v-for="(linea, i) in lineas" :key="i">
                <td>{{ linea.detArticuloNombre }}</td>
                <td>{{ linea.detBodegaNombre }}</td>
                <td class="text-end">{{ linea.detCantidad }}</td>
                <td class="text-end">{{ formatearMoneda(linea.detCostoUnidad) }}</td>
                <td class="text-end">{{ formatearMoneda(totalLinea(linea)) }}</td>
              </tr>
            </tbody>
          </v-table>
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
        <v-table density="compact">
          <thead>
            <tr>
              <th style="width: 80px">N°</th>
              <th class="text-end">Valor</th>
              <th>Fecha de pago</th>
              <th class="text-center">Estado</th>
              <th v-if="esActiva" class="text-center" style="width: 100px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!cuotas.length">
              <td :colspan="esActiva ? 5 : 4" class="text-center py-6 text-medium-emphasis">
                No hay cuotas registradas
              </td>
            </tr>
            <tr v-for="cuota in cuotas" :key="cuota.cuoId">
              <td>{{ cuota.cuoNumCuota }}</td>
              <td class="text-end">{{ formatearMoneda(cuota.cuoValorCuota) }}</td>
              <td>{{ cuota.cuoFechaPago ? formatearFecha(cuota.cuoFechaPago) : '-' }}</td>
              <td class="text-center">
                <v-chip
                  :color="cuota.cuoEstado === 'CANCELADA' ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ etiquetaEstadoCuota(cuota.cuoEstado) }}
                </v-chip>
              </td>
              <td v-if="esActiva" class="text-center">
                <v-btn
                  icon="mdi-pencil" size="small" variant="text"
                  title="Editar esta cuota" @click="abrirCuotaEdicion(cuota)"
                />
                <v-btn
                  icon="mdi-delete" size="small" variant="text"
                  title="Borrar esta cuota" @click="borrarCuota(cuota)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
        <p class="text-caption text-medium-emphasis mt-3 mb-0">
          Marcar una cuota como pagada no mueve caja ni recalcula el saldo de la compra: es un
          registro informativo. El movimiento de caja llegará con el módulo de Abonos.
        </p>
      </v-card>

      <v-card v-if="!esActiva" class="pa-6 mb-4" elevation="1" color="error" variant="tonal">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="text-caption">Motivo</div>
            <div>{{ compra.compraMotivoAnulacion || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Fecha</div>
            <div>{{ compra.compraFechaAnulacion ? formatearFecha(compra.compraFechaAnulacion) : '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Anulada por</div>
            <div>{{ compra.compraUsuarioAnulador || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>
    </template>

    <!-- Dos dialogos y no uno con v-if: crear y editar van a endpoints distintos
         (newcompracuota / updatecompracuota), piden campos distintos (idCompra vs idCuota) y
         validan NumCuota contra topes distintos. Con un solo dialogo cada una de esas tres cosas
         era un ternario sobre "estoy editando", y el formulario compartido era la via por la que
         un resto del flujo anterior viajaba en el payload del siguiente. -->
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
          hint="Sólo los números que aún no están registrados, hasta una cuota más de las pactadas"
          persistent-hint
        />

        <v-text-field
          v-model.number="formNueva.ValorCuota"
          label="Valor de la cuota"
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
          clearable
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Puede quedar vacía"
          persistent-hint
        />

        <v-select
          v-model="formNueva.Estado"
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
          <v-btn variant="outlined" @click="dialogNueva = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoNueva" @click="crearCuota">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEdicion" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Editar cuota</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogEdicion = false" />
        </div>

        <v-select
          v-model="formEdicion.NumCuota"
          :items="numerosParaEditar"
          label="Número de cuota"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Los números libres de las cuotas pactadas, más el que la cuota ya tiene"
          persistent-hint
        />

        <v-text-field
          v-model.number="formEdicion.ValorCuota"
          label="Valor de la cuota"
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
          clearable
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Vaciarla borra la fecha registrada"
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
    <v-dialog v-model="dialogCredito" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Cambiar cuota</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogCredito = false" />
        </div>

        <p class="text-caption text-medium-emphasis mb-4">
          Cambia el plan de cuotas de la cabecera: cuántas son y por cuánto. No toca las cuotas ya
          registradas en la tabla de abajo, ni mueve caja, ni recalcula el saldo.
        </p>

        <v-text-field
          v-model="formCredito.NumeroCuotas"
          label="Número de cuotas"
          type="number"
          min="1"
          step="1"
          clearable
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Vaciarlo deja la cabecera sin número de cuotas"
          persistent-hint
        />

        <v-text-field
          v-model="formCredito.ValorCuota"
          label="Valor de la cuota"
          type="number"
          min="0"
          step="0.01"
          clearable
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Vaciarlo lo deja como «valores distintos»: cada cuota con el suyo"
          persistent-hint
        />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="dialogCredito = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoCredito" @click="guardarCredito">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import { generarPdfCompra } from '@/utils/compraPdf'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'CompraDetalle',

  data() {
    return {
      cargando: false,
      anulando: false,
      compra: null,
      lineas: [],
      cuotas: [],
      // Crear y editar no comparten dialogo, ni formulario, ni bandera de guardado: son dos
      // operaciones con endpoint, payload y validacion distintos. Con un formulario unico el modo
      // se deducia de una variable centinela, y un dato del flujo anterior podia viajar en el
      // payload del siguiente.
      dialogNueva: false,
      guardandoNueva: false,
      formNueva: { NumCuota: null, ValorCuota: null, FechaPago: null, Estado: 'PENDIENTE' },

      dialogEdicion: false,
      guardandoEdicion: false,
      // idCuota va DENTRO del formulario y no en una referencia a la fila: a updatecompracuota
      // solo le hace falta ese numero, y guardar el objeto entero deja una referencia viva a un
      // elemento de `cuotas` que cargar() reemplaza por otro distinto al recargar.
      formEdicion: {
        idCuota: null, NumCuota: null, ValorCuota: null, FechaPago: null, Estado: 'PENDIENTE'
      },
      // El numero con el que se abrio el dialogo de edicion. Una cuota puede nacer en N+1, y
      // entonces su propio numero esta por encima del tope de edicion: se recuerda para poder
      // ofrecerselo y aceptarlo, y no dejarla atrapada sin ningun valor elegible.
      numCuotaOriginal: null,

      dialogCredito: false,
      guardandoCredito: false,
      // Los dos campos son opcionales y vaciarlos es una operacion con sentido, no un olvido:
      // viaja null y el backend pone el campo en NULL. Se guardan como texto, sin .number, para
      // poder distinguir "vacio" de "cero": con v-model.number un clearable vaciado y un 0
      // tecleado llegan iguales, y uno significa NULL y el otro es un valor que el backend
      // rechaza.
      formCredito: { NumeroCuotas: null, ValorCuota: null },
      // 'CANCELADA' significa PAGADA. Al backend viajan los valores del contrato; el usuario lee
      // la palabra de la derecha.
      opcionesEstadoCuota: [
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'CANCELADA', texto: 'Pagada' }
      ]
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    // La empresa del detalle sale de la URL y puede NO ser la seleccionada en la barra superior,
    // asi que el nombre se busca por ese Id en vez de usar empresaActual.
    nombreEmpresa() {
      const empresa = this.authStore.empresas.find((emp) => emp.Id === this.idEmpresa)
      return empresa ? empresa.Nombre : ''
    },

    // La empresa sale de la URL, NO del store. Si el usuario cambia de empresa en la barra
    // superior con el detalle abierto, anularcompra y las cuotas tienen que seguir apuntando a
    // la compra correcta. Por eso el :EmpId de la ruta no es decorativo.
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    idCompra() {
      return Number(this.$route.params.ComId)
    },
    esActiva() {
      // compraEstado es 1 activa / 0 anulada. No es "pagada/pendiente".
      return this.compra?.compraEstado === 1
    },
    esCredito() {
      return this.compra?.compraTipoCompra === 'CREDITO'
    },
    // Las cuotas pactadas en la cabecera. Es el tope del que salen los dos rangos de abajo.
    cuotasPactadas() {
      return Number(this.compra?.compraNumeroCuotas) || 0
    },

    // Al crear se admite UNA cuota mas de las pactadas (N+1): es la cuota extra que aparece
    // cuando el proveedor refinancia. Editar no llega ahi, ver numerosParaEditar.
    // Sólo se ofrecen los numeros que faltan: asi el 400 "esa cuota ya esta registrada" no puede
    // ocurrir por descuido.
    numerosParaCrear() {
      const usados = new Set(this.cuotas.map((cuota) => Number(cuota.cuoNumCuota)))
      const libres = []
      for (let numero = 1; numero <= this.cuotasPactadas + 1; numero++) {
        if (!usados.has(numero)) libres.push(numero)
      }
      return libres
    },

    // Editar topa en las pactadas, no en N+1: a la cuota extra se llega creandola a proposito, no
    // empujando hacia arriba una que ya existia. La unica excepcion es su propio numero, que se
    // ofrece siempre aunque pase el tope; sin eso una cuota nacida en N+1 abriria el dialogo sin
    // ningun valor elegible y no habria forma de guardarla, solo de borrarla.
    numerosParaEditar() {
      const usadosPorOtras = new Set(
        this.cuotas
          .filter((cuota) => cuota.cuoId !== this.formEdicion.idCuota)
          .map((cuota) => Number(cuota.cuoNumCuota))
      )
      const libres = []
      for (let numero = 1; numero <= this.cuotasPactadas; numero++) {
        if (!usadosPorOtras.has(numero)) libres.push(numero)
      }
      if (this.numCuotaOriginal !== null && !libres.includes(this.numCuotaOriginal)) {
        libres.push(this.numCuotaOriginal)
        libres.sort((a, b) => a - b)
      }
      return libres
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data } = await compraService.getById({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra
        })
        this.compra = data.data
        this.lineas = data.data.lineas || []
        this.cuotas = data.data.cuotas || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la compra'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    async anular() {
      const { value: motivo } = await Swal.fire({
        title: '¿Anular esta compra?',
        // Decirlo aqui no es cortesia: sin esto el usuario supone que el inventario se corrige
        // solo, y no se corrige.
        html:
          '<p style="text-align:left">Anular <b>no revierte el inventario ni la caja</b>. Sólo marca la compra ' +
          'y guarda el motivo, quién anuló y cuándo. El ajuste de existencias es manual, por el ' +
          'módulo de Ajustes.</p>' +
          '<p style="text-align:left">Escriba el motivo (entre 5 y 300 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 300 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        // Se valida aqui para no gastar un viaje en un 400 evitable: el backend exige lo mismo.
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
        const { data } = await compraService.anular({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Compra anulada', 'success')
        // Se recarga en vez de parchear el estado local: una llamada, y la pantalla se
        // reconfigura sola (chip rojo, boton fuera, tarjeta de anulacion).
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    // cuoEstado 'CANCELADA' significa PAGADA (sentido coloquial de "cancelar una cuota"), mientras
    // compraEstado 0 significa ANULADA. Son opuestos con nombres parecidos y en la misma
    // pantalla, asi que el front traduce: al backend siguen viajando PENDIENTE y CANCELADA.
    etiquetaEstadoCuota(estado) {
      return estado === 'CANCELADA' ? 'Pagada' : 'Pendiente'
    },

    // El backend manda '2026-10-15T00:00:00.000Z' y el input type="date" necesita 'YYYY-MM-DD'.
    // Se corta la cadena en vez de pasar por new Date(): convertir a Date local corre la fecha un
    // dia en cualquier zona al oeste de UTC, y la cuota aparecería con la fecha del dia anterior.
    aFechaInput(valor) {
      if (!valor) return null
      return String(valor).slice(0, 10)
    },

    abrirCuotaNueva() {
      this.formNueva = {
        NumCuota: this.numerosParaCrear[0] ?? null,
        ValorCuota: null,
        FechaPago: null,
        Estado: 'PENDIENTE'
      }
      this.dialogNueva = true
    },

    abrirCuotaEdicion(cuota) {
      this.numCuotaOriginal = Number(cuota.cuoNumCuota)
      this.formEdicion = {
        idCuota: cuota.cuoId,
        NumCuota: Number(cuota.cuoNumCuota),
        ValorCuota: Number(cuota.cuoValorCuota),
        FechaPago: this.aFechaInput(cuota.cuoFechaPago),
        Estado: cuota.cuoEstado || 'PENDIENTE'
      }
      this.dialogEdicion = true
    },

    // POST /compra/newcompracuota. Es el unico sitio que lo llama: no comparte nada con
    // editarCuota salvo el service.
    async crearCuota() {
      const numero = Number(this.formNueva.NumCuota)
      // Se revalida aqui aunque el v-select ya acote los valores: cuando no queda ningun numero
      // libre el select se queda vacio y, sin esta guarda, Guardar mandaria NumCuota null.
      if (!Number.isInteger(numero) || numero < 1) {
        Swal.fire('Atención', 'Elija el número de la cuota', 'warning')
        return
      }
      const tope = this.cuotasPactadas + 1
      if (numero > tope) {
        Swal.fire(
          'Atención',
          `El número de cuota no puede pasar de ${tope}: la compra tiene ${this.cuotasPactadas} ` +
            'cuotas pactadas y sólo se admite una más.',
          'warning'
        )
        return
      }
      if (!(Number(this.formNueva.ValorCuota) > 0)) {
        Swal.fire('Atención', 'El valor de la cuota debe ser mayor a cero', 'warning')
        return
      }

      this.guardandoNueva = true
      try {
        const { data } = await compraService.createCuota({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra,
          NumCuota: numero,
          ValorCuota: Number(this.formNueva.ValorCuota),
          // Vacia viaja como null, que el endpoint acepta: una cuota puede no tener fecha aun.
          FechaPago: this.formNueva.FechaPago || null,
          Estado: this.formNueva.Estado
        })
        this.dialogNueva = false
        await Swal.fire('Éxito', data.msg || 'Cuota registrada', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo agregar la cuota'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoNueva = false
      }
    },

    // PUT /compra/updatecompracuota. Esta ruta ya solo actualiza: el alta tiene la suya.
    async editarCuota() {
      const numero = Number(this.formEdicion.NumCuota)
      if (!Number.isInteger(numero) || numero < 1) {
        Swal.fire('Atención', 'Elija el número de la cuota', 'warning')
        return
      }
      // El tope son las pactadas, con la excepcion del numero con el que se abrio el dialogo: una
      // cuota que ya vivia en N+1 puede quedarse ahi, pero ninguna puede SUBIR sobre el tope.
      if (numero > this.cuotasPactadas && numero !== this.numCuotaOriginal) {
        Swal.fire(
          'Atención',
          `El número de cuota no puede pasar de ${this.cuotasPactadas}, que son las cuotas ` +
            'pactadas en la compra.',
          'warning'
        )
        return
      }
      if (!(Number(this.formEdicion.ValorCuota) > 0)) {
        Swal.fire('Atención', 'El valor de la cuota debe ser mayor a cero', 'warning')
        return
      }

      this.guardandoEdicion = true
      try {
        // Se envian los cuatro campos siempre. El endpoint conserva lo que no venga, pero
        // mandarlo todo hace que vaciar la fecha llegue como FechaPago: null —que SI es un
        // cambio, es como se borra una fecha ya puesta— y que un campo intacto viaje con su
        // propio valor, que es un no-op.
        const { data } = await compraService.updateCuota({
          idEmpresa: this.idEmpresa,
          idCuota: this.formEdicion.idCuota,
          NumCuota: numero,
          ValorCuota: Number(this.formEdicion.ValorCuota),
          FechaPago: this.formEdicion.FechaPago || null,
          Estado: this.formEdicion.Estado
        })
        this.dialogEdicion = false
        await Swal.fire('Éxito', data.msg || 'Cuota actualizada', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo actualizar la cuota'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoEdicion = false
      }
    },

    // Vacio es null de verdad; cualquier otra cosa pasa por Number. Un NaN se devuelve tal cual,
    // para que lo rechacen las validaciones de guardarCredito y no se confunda con un vacio.
    // Hace falta porque Number('') es 0: sin esto, vaciar un campo viajaria como 0 y el backend
    // lo rechazaria por "mayor a cero" en vez de entenderlo como "ponlo en NULL".
    aNumeroONulo(valor) {
      if (valor === '' || valor === null || valor === undefined) return null
      return Number(valor)
    },

    abrirCredito() {
      // Precargado con lo que hay hoy: el usuario tiene que ver de que valores parte antes de
      // cambiarlos. compraValorCuota puede venir null —es el estado "valores distintos"— y
      // entonces el campo abre vacio, que es exactamente lo que representa.
      this.formCredito = {
        NumeroCuotas: this.compra.compraNumeroCuotas ?? null,
        ValorCuota:
          this.compra.compraValorCuota === null || this.compra.compraValorCuota === undefined
            ? null
            : Number(this.compra.compraValorCuota)
      }
      this.dialogCredito = true
    },

    async guardarCredito() {
      const numeroCuotas = this.aNumeroONulo(this.formCredito.NumeroCuotas)
      const valorCuota = this.aNumeroONulo(this.formCredito.ValorCuota)

      if (numeroCuotas !== null && !(Number.isInteger(numeroCuotas) && numeroCuotas > 0)) {
        Swal.fire(
          'Atención',
          'El número de cuotas debe ser un entero mayor a cero, o quedar vacío',
          'warning'
        )
        return
      }
      if (valorCuota !== null && !(valorCuota > 0)) {
        Swal.fire(
          'Atención',
          'El valor de la cuota debe ser mayor a cero, o quedar vacío',
          'warning'
        )
        return
      }

      // Se bloquea en vez de avisar: dejar cuotas registradas por encima del plan es un estado
      // que ninguna otra pantalla sabe representar, y las cuotas sobrantes no se borran solas.
      // Vaciar NumeroCuotas cae en la misma regla, porque vacio es un plan de cero cuotas y
      // entonces cualquier cuota registrada queda fuera.
      const tope = numeroCuotas ?? 0
      const sobrantes = this.cuotas
        .map((cuota) => Number(cuota.cuoNumCuota))
        .filter((numero) => numero > tope)
        .sort((a, b) => a - b)
      if (sobrantes.length) {
        const unaSola = sobrantes.length === 1
        Swal.fire(
          'Atención',
          `${unaSola ? 'La cuota' : 'Las cuotas'} ${sobrantes.join(', ')} ` +
            `${unaSola ? 'quedaría' : 'quedarían'} fuera de un plan de ` +
            `${numeroCuotas === null ? 'cero cuotas' : numeroCuotas + ' cuotas'}. ` +
            `${unaSola ? 'Bórrela' : 'Bórrelas'} primero desde la tabla de cuotas.`,
          'warning'
        )
        return
      }

      this.guardandoCredito = true
      try {
        const { data } = await compraService.updateCredito({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra,
          NumeroCuotas: numeroCuotas,
          // decimal(12,2): se redondea aqui para que el valor que quede guardado sea el que el
          // usuario escribio, y no uno con mas decimales que la columna recorta por su cuenta.
          ValorCuota: valorCuota === null ? null : Math.round(valorCuota * 100) / 100
        })
        this.dialogCredito = false
        await Swal.fire('Éxito', data.msg || 'Crédito de la compra actualizado', 'success')
        // Recarga, no parche local: compraNumeroCuotas es justo lo que alimenta cuotasPactadas y
        // con ella los rangos de numerosParaCrear y numerosParaEditar. Si el front se lo
        // inventara, los dos dialogos de cuota quedarian ofreciendo numeros de un plan viejo.
        await this.cargar()
      } catch (error) {
        const mensaje =
          error.response?.data?.msg || 'No se pudo actualizar el crédito de la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoCredito = false
      }
    },

    async borrarCuota(cuota) {
      const { isConfirmed } = await Swal.fire({
        title: `¿Borrar la cuota ${cuota.cuoNumCuota}?`,
        // Es el unico DELETE real del proyecto: esta tabla no tiene estado de fila y sus datos no
        // son contables. Decirlo evita que alguien lo trate como un "inactivar".
        text: 'Se borra de forma definitiva y no hay forma de recuperarla.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Borrar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828'
      })
      if (!isConfirmed) return

      try {
        // Responde 204 SIN cuerpo: no hay data.msg que leer, el mensaje es propio.
        await compraService.deleteCuota({ idEmpresa: this.idEmpresa, idCuota: cuota.cuoId })
        await Swal.fire('Éxito', 'Cuota borrada', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo borrar la cuota'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    imprimir() {
      try {
        generarPdfCompra({
          cabecera: this.compra,
          lineas: this.lineas,
          cuotas: this.cuotas,
          nombreEmpresa: this.nombreEmpresa
        })
      } catch (error) {
        Swal.fire('Error', error.message || 'No se pudo generar el PDF de la compra', 'error')
      }
    },

    totalLinea(linea) {
      const total = (Number(linea.detCantidad) || 0) * (Number(linea.detCostoUnidad) || 0)
      return Math.round(total * 100) / 100
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    }
  }
}
</script>
