<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Movimiento en caja</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="filtros.fechaInicio"
            label="Fecha inicio"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="filtros.fechaFin"
            label="Fecha fin"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtros.estadoFiltro"
            :items="opcionesEstado"
            item-title="texto"
            item-value="valor"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-1">
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtros.campoOrdenar"
            :items="opcionesCampoOrdenar"
            item-title="texto"
            item-value="valor"
            label="Campo ordenar"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtros.orden"
            :items="opcionesOrden"
            item-title="texto"
            item-value="valor"
            label="Orden"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-1">
        <v-col cols="12">
          <v-select
            v-model="filtros.tipoFiltro"
            :items="opcionesTipo"
            item-title="texto"
            item-value="valor"
            label="Tipo de movimiento"
            placeholder="Todos"
            persistent-placeholder
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-1">
        <v-col cols="12">
          <v-select
            v-model="filtros.motivoFiltro"
            :items="opcionesMotivo"
            item-title="texto"
            item-value="valor"
            label="Motivo"
            placeholder="Todos"
            persistent-placeholder
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <!--
      Los totales salen de getsaldocaja, que SOLO acepta las fechas: el estado, el tipo y el
      motivo no entran en esa peticion. Por eso estos numeros no se mueven al marcar un tipo o un
      motivo aunque el grid de abajo si cambie, y es el contrato, no un desajuste.
    -->
    <v-card class="pa-4 mb-4" elevation="1">
      <div v-if="cargandoSaldo" class="d-flex justify-center py-2">
        <v-progress-circular indeterminate color="primary" size="24" />
      </div>
      <div v-else class="d-flex flex-wrap ga-8 align-center">
        <div v-for="total in totales" :key="total.etiqueta">
          <div class="text-caption text-medium-emphasis">{{ total.etiqueta }}</div>
          <div class="text-subtitle-1 font-weight-medium" :class="total.clase">
            {{ formatearMoneda(total.valor) }}
          </div>
        </div>
      </div>
    </v-card>

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table density="compact">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Motivo</th>
              <th>Método de pago</th>
              <th class="text-end">Valor</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="7" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!movimientos.length">
              <td colspan="7" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="mov in movimientos" :key="mov.movcajId">
              <td>
                {{ formatearFecha(mov.movcajFecha) }}
                <div class="text-caption text-medium-emphasis">
                  {{ formatearHora(mov.movcajFecha) }}
                </div>
              </td>
              <td>
                <v-chip
                  :color="mov.movcajTipo === 'ENTRADA' ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  {{ mov.movcajTipo }}
                </v-chip>
              </td>
              <td>{{ textoMotivo(mov.movcajMotivo) }}</td>
              <td>{{ mov.movcajMetodoPago }}</td>
              <td class="text-end">{{ formatearMoneda(mov.movcajValor) }}</td>
              <td class="text-center">
                <v-chip :color="mov.movcajEstado === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ mov.movcajEstado === 1 ? 'Activo' : 'Anulado' }}
                </v-chip>
              </td>
              <td class="text-center text-no-wrap">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  title="Ver el detalle"
                  @click="verDetalle(mov)"
                />
                <v-btn
                  v-if="mov.movcajEstado === 1"
                  icon="mdi-cancel"
                  size="small"
                  variant="text"
                  color="error"
                  title="Anular el movimiento"
                  :loading="anulandoId === mov.movcajId"
                  @click="anular(mov)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">
          Anterior
        </v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">
          Siguiente
        </v-btn>
      </div>
    </v-card>

  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import movimientoCajaService from '@/services/movimientoCajaService'
import { useAuthStore } from '@/stores/auth'
// El mapa de los nueve motivos vive en el utils porque lo comparten el filtro de esta pantalla,
// su tabla y el detalle. Con una copia por archivo, uno diria "Cuota empeño" y otro
// "CUOTA EMPENO".
import { MOTIVOS, textoMotivo } from '@/utils/movimientoCaja'

// El backend quiere AAAA-MM-DD, y lo quiere en la fecha LOCAL. `toISOString()` convierte a UTC
// antes de recortar, asi que en Colombia (UTC-5) a partir de las 7 de la tarde devolveria el dia
// siguiente y el filtro "hoy" se saltaria los movimientos de la noche.
function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export default {
  name: 'MovimientoCajaList',

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      cargandoSaldo: false,
      movimientos: [],
      saldo: null,
      cantData: 0,
      pagina: 1,
      // id del movimiento que se esta anulando: el spinner va en el boton de ESA fila.
      anulandoId: null,
      filtros: {
        // Arranca en el mes en curso: del dia 1 a hoy.
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy),
        // 0 todos, 1 activos, 2 anulados.
        estadoFiltro: 1,
        campoOrdenar: 1,
        orden: 'DESC',
        // Arreglos VACIOS, que es como el backend dice "todos". No null.
        tipoFiltro: [],
        motivoFiltro: []
      },
      opcionesEstado: [
        { valor: 0, texto: 'Todos' },
        { valor: 1, texto: 'Activos' },
        { valor: 2, texto: 'Anulados' }
      ],
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Fecha de creación' },
        { valor: 2, texto: 'Valor' },
        { valor: 3, texto: 'Motivo' },
        { valor: 4, texto: 'Tipo de movimiento' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ],
      opcionesTipo: [
        { valor: 'ENTRADA', texto: 'Entradas' },
        { valor: 'SALIDA', texto: 'Salidas' }
      ],
      opcionesMotivo: MOTIVOS
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
    totalPaginas() {
      // 50 por pagina es el tope del backend, no es configurable.
      return Math.max(1, Math.ceil(this.cantData / 50))
    },
    totales() {
      const s = this.saldo || {}
      return [
        { etiqueta: 'Entradas', valor: s.movcajEntradas, clase: 'text-success' },
        { etiqueta: 'Salidas', valor: s.movcajSalidas, clase: 'text-error' },
        { etiqueta: 'Saldo', valor: s.movcajSaldo, clase: this.claseSigno(s.movcajSaldo) },
        { etiqueta: 'Efectivo', valor: s.movcajSaldoEfectivo, clase: this.claseSigno(s.movcajSaldoEfectivo) },
        { etiqueta: 'Transacciones', valor: s.movcajSaldoTransaccion, clase: this.claseSigno(s.movcajSaldoTransaccion) }
      ]
    }
  },

  watch: {
    // El selector de empresa vive en un v-app-bar persistente que NO navega, asi que esta
    // pantalla no se remonta al cambiar de empresa: sin este watch el grid y los totales se
    // quedarian mostrando la caja de la empresa anterior.
    idEmpresa() {
      this.consultar()
    }
  },

  created() {
    this.consultar()
  },

  methods: {
    // Se expone como metodo para poder llamarlo desde la plantilla.
    textoMotivo,

    // El boton Consultar SIEMPRE vuelve a la pagina 1: cambiar un filtro y quedarse en la pagina
    // 7 es la forma clasica de ver una tabla vacia sin entender por que.
    consultar() {
      this.buscar(1, true)
    },

    // Paginar no toca las fechas, y los totales solo dependen de las fechas: pedirlos otra vez
    // seria un viaje a gastar para recibir lo mismo.
    irPagina(pagina) {
      this.buscar(pagina, false)
    },

    async buscar(pagina, recargarSaldo) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      // Las mismas dos fechas alimentan el listado y los totales: es lo que hace que los numeros
      // de arriba correspondan al periodo del grid.
      const fechas = {
        fechaInicio: this.filtros.fechaInicio || null,
        fechaFin: this.filtros.fechaFin || null
      }

      this.cargando = true
      if (recargarSaldo) this.cargandoSaldo = true
      try {
        const peticiones = [
          movimientoCajaService.getAll({
            idEmpresa: this.idEmpresa,
            campoOrdenar: this.filtros.campoOrdenar,
            orden: this.filtros.orden,
            pagina,
            estadoFiltro: this.filtros.estadoFiltro,
            ...fechas,
            // El `|| []` cubre el null que deja Vuetify si se vacia un select multiple: el
            // backend espera un arreglo, y el vacio es justo "todos".
            tipoFiltro: this.filtros.tipoFiltro || [],
            motivoFiltro: this.filtros.motivoFiltro || []
          })
        ]
        if (recargarSaldo) {
          peticiones.push(movimientoCajaService.getSaldo({ idEmpresa: this.idEmpresa, ...fechas }))
        }

        const [respListado, respSaldo] = await Promise.all(peticiones)
        this.movimientos = respListado.data.data || []
        this.cantData = respListado.data.cantData || 0
        this.pagina = pagina
        if (respSaldo) this.saldo = respSaldo.data.data || null
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los movimientos de caja'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
        this.cargandoSaldo = false
      }
    },

    irANuevo() {
      this.$router.push({ name: 'MovimientoCajaNuevo' })
    },

    // La empresa viaja en la URL, y sale de la propia fila (movcajEmp), no del store: asi el
    // detalle apunta a la empresa del registro aunque el selector de arriba cambie despues.
    verDetalle(mov) {
      this.$router.push({
        name: 'MovimientoCajaDetalle',
        params: { EmpId: mov.movcajEmp || this.idEmpresa, MovId: mov.movcajId }
      })
    },

    async anular(mov) {
      // Un movimiento nacido de una compra o una venta se anula aqui igual que un ajuste, pero
      // conviene decir que esta pantalla solo marca el movimiento de caja: el documento que lo
      // genero sigue vivo en su propio modulo.
      const aviso = mov.movcajMotivo === 'AJUSTE'
        ? ''
        : `<p style="text-align:left">Este movimiento nació de un documento de tipo ` +
          `<b>${mov.movcajTipoOrigen || mov.movcajMotivo}</b>. Anularlo aquí <b>no anula ese ` +
          `documento</b>: eso se hace desde su propio módulo.</p>`

      const { value: motivo } = await Swal.fire({
        title: '¿Anular este movimiento de caja?',
        html:
          aviso +
          '<p style="text-align:left">Escriba el motivo (entre 6 y 255 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 255 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        // Se valida aqui para no gastar un viaje en un 400 evitable: el backend exige lo mismo.
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 6) return 'El motivo debe tener al menos 6 caracteres'
          if (texto.length > 255) return 'El motivo no puede superar los 255 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulandoId = mov.movcajId
      try {
        const { data } = await movimientoCajaService.anular({
          idEmpresa: this.idEmpresa,
          idMovimientoCaja: mov.movcajId,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Movimiento de caja anulado', 'success')
        // Se queda en la pagina actual, pero SI se recargan los totales: anular cambia los
        // saldos. Con el filtro en "Activos" la fila desaparece del grid, que es correcto.
        await this.buscar(this.pagina, true)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular el movimiento de caja'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulandoId = null
      }
    },

    claseSigno(valor) {
      return Number(valor) < 0 ? 'text-error' : ''
    },

    // Dos decimales forzados, a diferencia del formateo de Compras: en caja se sigue el centavo.
    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (Number.isNaN(numero)) return String(valor)
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    },

    formatearHora(valor) {
      if (!valor) return ''
      return new Date(valor).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>
