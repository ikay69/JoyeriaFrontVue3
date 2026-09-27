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
            v-if="esActiva && numerosCuotaDisponibles.length"
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

    <v-dialog v-model="dialogCuota" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">{{ cuotaEnEdicion ? 'Editar cuota' : 'Agregar cuota' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogCuota = false" />
        </div>

        <v-select
          v-if="!cuotaEnEdicion"
          v-model="formCuota.NumCuota"
          :items="numerosCuotaDisponibles"
          label="Número de cuota"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Sólo se ofrecen los números que aún no están registrados"
          persistent-hint
        />
        <v-text-field
          v-else
          :model-value="formCuota.NumCuota"
          label="Número de cuota"
          readonly
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <v-text-field
          v-model.number="formCuota.ValorCuota"
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
          v-model="formCuota.FechaPago"
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
          v-model="formCuota.Estado"
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
          <v-btn variant="outlined" @click="dialogCuota = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoCuota" @click="guardarCuota">Guardar</v-btn>
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
      dialogCuota: false,
      guardandoCuota: false,
      // null = estamos agregando; con valor = estamos editando esa cuota
      cuotaEnEdicion: null,
      formCuota: { NumCuota: null, ValorCuota: null, FechaPago: null, Estado: 'PENDIENTE' },
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
    // Sólo se ofrecen los numeros que faltan: asi el 400 "esa cuota ya esta registrada" no puede
    // ocurrir por descuido.
    numerosCuotaDisponibles() {
      const total = Number(this.compra?.compraNumeroCuotas) || 0
      const usados = new Set(this.cuotas.map((cuota) => Number(cuota.cuoNumCuota)))
      const libres = []
      for (let numero = 1; numero <= total; numero++) {
        if (!usados.has(numero)) libres.push(numero)
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
      this.cuotaEnEdicion = null
      this.formCuota = {
        NumCuota: this.numerosCuotaDisponibles[0] ?? null,
        ValorCuota: null,
        FechaPago: null,
        Estado: 'PENDIENTE'
      }
      this.dialogCuota = true
    },

    abrirCuotaEdicion(cuota) {
      this.cuotaEnEdicion = cuota
      this.formCuota = {
        NumCuota: cuota.cuoNumCuota,
        ValorCuota: Number(cuota.cuoValorCuota),
        FechaPago: this.aFechaInput(cuota.cuoFechaPago),
        Estado: cuota.cuoEstado || 'PENDIENTE'
      }
      this.dialogCuota = true
    },

    async guardarCuota() {
      if (!this.formCuota.NumCuota) {
        Swal.fire('Atención', 'Elija el número de la cuota', 'warning')
        return
      }
      if (!(Number(this.formCuota.ValorCuota) > 0)) {
        Swal.fire('Atención', 'El valor de la cuota debe ser mayor a cero', 'warning')
        return
      }

      this.guardandoCuota = true
      try {
        if (this.cuotaEnEdicion) {
          // Se envian los cuatro campos siempre. El endpoint conserva lo que no venga, pero
          // mandarlo todo hace que vaciar la fecha llegue como FechaPago: null —que SI es un
          // cambio, es como se borra una fecha ya puesta— y que un campo intacto viaje con su
          // propio valor, que es un no-op.
          const { data } = await compraService.updateCuota({
            idEmpresa: this.idEmpresa,
            idCuota: this.cuotaEnEdicion.cuoId,
            NumCuota: Number(this.formCuota.NumCuota),
            ValorCuota: Number(this.formCuota.ValorCuota),
            FechaPago: this.formCuota.FechaPago || null,
            Estado: this.formCuota.Estado
          })
          await Swal.fire('Éxito', data.msg || 'Cuota actualizada', 'success')
        } else {
          const { data } = await compraService.createCuota({
            idEmpresa: this.idEmpresa,
            idCompra: this.idCompra,
            NumCuota: Number(this.formCuota.NumCuota),
            ValorCuota: Number(this.formCuota.ValorCuota),
            FechaPago: this.formCuota.FechaPago || null,
            Estado: this.formCuota.Estado
          })
          await Swal.fire('Éxito', data.msg || 'Cuota agregada', 'success')
        }
        this.dialogCuota = false
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo guardar la cuota'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoCuota = false
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
