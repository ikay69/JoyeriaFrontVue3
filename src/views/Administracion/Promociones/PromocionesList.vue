<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Promociones</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="3">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar por nombre"
            maxlength="50"
            :disabled="filtros.campoOrdenar !== 1"
            :hint="filtros.campoOrdenar !== 1 ? 'Solo aplica al ordenar por nombre' : ''"
            persistent-hint
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
            @keyup.enter="consultar"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.campoOrdenar"
            :items="opcionesCampoOrdenar"
            item-title="texto"
            item-value="valor"
            label="Ordenar por"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
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
        <v-col cols="6" sm="2">
          <v-select
            v-model="filtros.estadoFiltro"
            :items="opcionesEstadoFiltro"
            item-title="texto"
            item-value="valor"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card elevation="1">
      <v-table class="tabla-listado">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Vigencia</th>
            <th class="text-right">Descuento</th>
            <th>Condiciones</th>
            <th>Estado</th>
            <th>Usuario</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="7" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!promociones.length">
            <td colspan="7" class="text-center py-6 text-medium-emphasis">
              No hay registros para mostrar
            </td>
          </tr>
          <template v-else>
            <tr v-for="promo in promociones" :key="promo.promoId">
              <td>
                <div class="font-weight-medium">{{ promo.promoNombre }}</div>
                <div v-if="promo.promoDescripcion" class="text-caption text-medium-emphasis">
                  {{ promo.promoDescripcion }}
                </div>
              </td>
              <td class="text-no-wrap">
                {{ formatearFechaSinHora(promo.promoFechaInicio) }} – {{ formatearFechaSinHora(promo.promoFechaFin) }}
              </td>
              <td class="text-right text-no-wrap font-weight-medium">{{ textoDescuento(promo) }}</td>
              <td>
                <div v-if="condiciones(promo).length" class="d-flex flex-wrap ga-1 py-1">
                  <v-chip
                    v-for="condicion in condiciones(promo)"
                    :key="condicion"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ condicion }}
                  </v-chip>
                </div>
                <span v-else class="text-medium-emphasis">Sin condiciones</span>
              </td>
              <td>
                <v-chip :color="etiquetaEstado(promo).color" size="small">
                  {{ etiquetaEstado(promo).texto }}
                </v-chip>
              </td>
              <td>{{ promo.promoUsuario }}</td>
              <td class="text-center text-no-wrap">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Editar"
                  @click="irAEditar(promo.promoId)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Eliminar"
                  :loading="eliminandoId === promo.promoId"
                  @click="eliminar(promo)"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>

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
import promocionService from '@/services/promocionService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'PromocionesList',
  data() {
    return {
      cargando: false,
      eliminandoId: null,
      promociones: [],
      cantData: 0,
      pagina: 1,
      // Las filas de promociones no traen la empresa: se guarda con cual se consulto el listado
      // para que editar vaya contra esa empresa aunque luego cambie el selector de la barra.
      empresaListado: null,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 3,
        orden: 'DESC',
        estadoFiltro: 0
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'Fecha de inicio' },
        { valor: 3, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ],
      opcionesEstadoFiltro: [
        { valor: 0, texto: 'Todas' },
        { valor: 1, texto: 'Activas' },
        { valor: 2, texto: 'Inactivas' }
      ]
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
      // El backend pagina de 50 en 50: este 50 no es arbitrario.
      return Math.max(1, Math.ceil(this.cantData / 50))
    },
    // Fecha local de hoy en aaaa-mm-dd, para comparar como texto con promoFechaInicio/Fin.
    hoy() {
      const ahora = new Date()
      const mes = String(ahora.getMonth() + 1).padStart(2, '0')
      const dia = String(ahora.getDate()).padStart(2, '0')
      return `${ahora.getFullYear()}-${mes}-${dia}`
    }
  },
  watch: {
    idEmpresa() {
      this.consultar()
    }
  },
  created() {
    this.consultar()
  },
  methods: {
    // Al cambiar un filtro se vuelve a la pagina 1: si no, se consulta la pagina 7 de un
    // resultado que ahora puede tener una sola pagina y la tabla sale vacia.
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const idEmpresa = Number(this.idEmpresa)
      this.cargando = true
      try {
        const payload = {
          idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          estadoFiltro: this.filtros.estadoFiltro
        }
        // textoFiltro solo filtra con campoOrdenar 1; con los otros el backend lo ignora.
        if (this.filtros.campoOrdenar === 1) {
          payload.textoFiltro = String(this.filtros.textoFiltro || '').trim()
        }
        const { data } = await promocionService.getAll(payload)
        this.promociones = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
        this.empresaListado = idEmpresa
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo consultar las promociones'), 'error')
      } finally {
        this.cargando = false
      }
    },

    async eliminar(promo) {
      const { isConfirmed } = await Swal.fire({
        title: `¿Eliminar la promoción ${promo.promoNombre}?`,
        text: 'Se borra de forma definitiva y no se puede recuperar. Si solo quiere que deje de aplicar, edítela y póngala inactiva.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828'
      })
      if (!isConfirmed) return

      this.eliminandoId = promo.promoId
      try {
        const { data } = await promocionService.delete({
          idEmpresa: this.empresaListado,
          idPromocion: promo.promoId
        })
        await Swal.fire('Éxito', data.msg || 'Promoción eliminada', 'success')
        // Si se borro la ultima fila de la ultima pagina, el backend recorta la pagina solo.
        await this.buscar(this.pagina)
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo eliminar la promoción'), 'error')
      } finally {
        this.eliminandoId = null
      }
    },

    irANuevo() {
      this.$router.push({ name: 'PromocionesNuevo' })
    },

    irAEditar(PromoId) {
      this.$router.push({
        name: 'PromocionesEditar',
        params: { EmpId: this.empresaListado, PromoId }
      })
    },

    textoDescuento(promo) {
      if (promo.promoPorcentaje !== null && promo.promoPorcentaje !== undefined) {
        return `${this.formatearNumero(promo.promoPorcentaje)} %`
      }
      if (promo.promoValor !== null && promo.promoValor !== undefined) {
        return this.formatearMoneda(promo.promoValor)
      }
      return '-'
    },

    condiciones(promo) {
      const lista = []
      if (promo.promoMontoMinimoVenta) lista.push(`Venta desde ${this.formatearMoneda(promo.promoMontoMinimoVenta)}`)
      if (promo.promoCantidadMinimaCompras) lista.push(`${promo.promoCantidadMinimaCompras}+ compras`)
      if (promo.promoMontoMinimoAcumulado) lista.push(`Acumulado desde ${this.formatearMoneda(promo.promoMontoMinimoAcumulado)}`)
      if (promo.promoTope) lista.push(`Tope ${this.formatearMoneda(promo.promoTope)}`)
      return lista
    },

    // promoEstado dice si esta activa; la vigencia se calcula contra la fecha de hoy.
    etiquetaEstado(promo) {
      if (promo.promoEstado !== 1) return { texto: 'Inactiva', color: 'error' }
      if (promo.promoFechaFin < this.hoy) return { texto: 'Vencida', color: 'grey' }
      if (promo.promoFechaInicio > this.hoy) return { texto: 'Programada', color: 'info' }
      return { texto: 'Vigente', color: 'success' }
    },

    // Los 400 llegan como {msg} o como {errors:[{msg}]} (express-validator).
    mensajeError(error, alternativo) {
      const respuesta = error.response?.data
      return respuesta?.msg || respuesta?.errors?.[0]?.msg || alternativo
    },

    // Las fechas de vigencia llegan 'aaaa-mm-dd' sin hora: se cortan como texto, porque pasar
    // por new Date() las corre un dia en Colombia.
    formatearFechaSinHora(valor) {
      const partes = String(valor || '').slice(0, 10).split('-')
      if (partes.length !== 3) return '-'
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`
    },

    formatearNumero(valor) {
      return (Number(valor) || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })
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
