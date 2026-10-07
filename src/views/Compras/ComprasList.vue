<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5">Compras</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$router.push({ name: 'CompraNueva' })">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4">
      
      <v-row dense align="center" class="mb-2">
        <v-col cols="12" sm="12">
          <div class="d-flex align-center">
            <v-btn icon="mdi-account-search" variant="tonal" size="small" @click="dialogTercero = true" />
            <v-text-field
              :model-value="terceroSeleccionado ? terceroSeleccionado.Nombre : ''"
              label="Tercero"
              placeholder="Todos"
              readonly
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-btn
              v-if="terceroSeleccionado"
              icon="mdi-close"
              variant="text"
              size="small"
              title="Quitar el filtro de tercero"
              @click="limpiarTercero"
            />
          </div>
        </v-col>
      </v-row>

      

      <v-row dense align="center" class="mb-2">
        <v-col cols="6" sm="3">
          <v-text-field
            v-model="filtros.fechaInicio"
            label="Desde"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model="filtros.fechaFin"
            label="Hasta"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.EstadoPago"
            :items="opcionesPago"
            item-title="texto"
            item-value="valor"
            label="Filtar Pago"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.EstadoInventario"
            :items="opcionesInventario"
            item-title="texto"
            item-value="valor"
            label="Filtrar Inventario"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mb-2">
        <v-col cols="12" sm="3">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar"
            maxlength="100"
            :disabled="filtros.campoOrdenar === 5"
            :hint="filtros.campoOrdenar === 5 ? 'No aplica al ordenar por fecha de creación' : ''"
            persistent-hint
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
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
        <v-col cols="6" sm="3">
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
        <v-col cols="12" sm="3">
          <v-btn color="primary" variant="tonal" block @click="consultar">Consultar</v-btn>
        </v-col>
      </v-row>

      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Documento</th>
              <th>Tercero</th>
              <th>Tipo</th>
              <th>Pago</th>
              <th>Inventario</th>
              <th class="text-end">Sub Total</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!compras.length">
              <td colspan="10" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="com in compras" :key="com.compraId">
              <td>{{ formatearFecha(com.compraFecha) }}</td>
              <td>{{ com.compraDocumentoSoporte || '-' }}</td>
              <td>
                {{ com.compraTercero }}
                <div class="text-caption text-medium-emphasis">
                  {{ com.compraTerceroTipoDoc || '' }} {{ com.compraTerceroNumeroDoc || '' }}
                </div>
              </td>
              <td>{{ com.compraTipoCompra }}</td>
              <td>{{ com.compraEstadoPago}}</td>
              <td>{{com.compraEstadoInventario}}</td>
              <td class="text-end">{{ formatearMoneda(com.compraSubtotal) }}</td>
              <td class="text-center">
                <v-chip :color="com.compraEstado === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ com.compraEstado === 1 ? 'Activa' : 'Anulada' }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Ver detalle"
                  @click="irDetalle(com)"
                />
                <v-btn
                  icon="mdi-printer"
                  size="small"
                  variant="text"
                  :loading="imprimiendoId === com.compraId"
                  title="Imprimir el comprobante en PDF"
                  @click="imprimir(com)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">Anterior</v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">Siguiente</v-btn>
      </div>
    </v-card>

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import { useAuthStore } from '@/stores/auth'
import { generarPdfCompra } from '@/utils/compraPdf'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'

export default {
  name: 'ComprasList',

  components: { TercerosSeleccionar },

  data() {
    return {
      cargando: false,
      compras: [],
      cantData: 0,
      pagina: 1,
      dialogTercero: false,
      terceroSeleccionado: null,
      // id de la compra que se esta imprimiendo: el spinner va en el boton de ESA fila, no en
      // toda la tabla.
      imprimiendoId: null,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 5,
        orden: 'DESC',
        idTercero: 0,
        fechaInicio: null,
        fechaFin: null,
        EstadoPago:'',
        EstadoInventario:''
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Documento soporte' },
        { valor: 2, texto: 'Tipo doc. tercero' },
        { valor: 3, texto: 'N° doc. tercero' },
        { valor: 4, texto: 'Nombre del tercero' },
        { valor: 5, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ],
      opcionesPago:[
        { valor: '', texto: 'Todos' },
        { valor: 'PENDIENTE', texto: 'Pago pendiente' },
        { valor: 'PARCIAL', texto: 'Pago parcial' },
        { valor: 'COMPLETO', texto: 'Pago completo' }
      ],
      opcionesInventario:[
        { valor: '', texto: 'Todos' },
        { valor: 'PENDIENTE', texto: 'Pendiente agregar al inventario' },
        { valor: 'COMPLETO', texto: 'Completo agregado al inventario' }
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
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    // El selector de empresa vive en un v-app-bar persistente que NO navega, asi que esta pantalla
    // no se remonta al cambiar de empresa: sin este watch el grid sigue mostrando las compras de la
    // empresa anterior. Tambien se limpia el filtro de tercero, que es un id de la empresa vieja.
    idEmpresa() {
      this.terceroSeleccionado = null
      this.filtros.idTercero = 0
      this.consultar()
    }
  },

  created() {
    this.consultar()
  },

  methods: {
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

      this.cargando = true
      try {
        console.log(this.EstadoPago)
        const { data } = await compraService.getAll({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro || '',
          idTercero: this.filtros.idTercero || 0,
          fechaInicio: this.filtros.fechaInicio || null,
          fechaFin: this.filtros.fechaFin || null,
          EstadoPago: this.filtros.EstadoPago,
          EstadoInventario:this.filtros.EstadoInventario
        })
        this.compras = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las compras'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
      this.filtros.idTercero = tercero.Id
      this.consultar()
    },

    limpiarTercero() {
      this.terceroSeleccionado = null
      // 0, no null: null es 400 Tercero invalido.
      this.filtros.idTercero = 0
      this.consultar()
    },

    irDetalle(com) {
      this.$router.push({
        name: 'CompraDetalle',
        params: { EmpId: this.idEmpresa, ComId: com.compraId }
      })
    },

    async imprimir(com) {
      this.imprimiendoId = com.compraId
      try {
        // El listado no trae las lineas ni las cuotas: hace falta el detalle completo.
        const { data } = await compraService.getById({
          idEmpresa: this.idEmpresa,
          idCompra: com.compraId
        })
        generarPdfCompra({
          cabecera: data.data,
          lineas: data.data.lineas || [],
          cuotas: data.data.cuotas || [],
          nombreEmpresa: this.authStore.empresaActual?.Nombre || ''
        })
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo generar el PDF de la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.imprimiendoId = null
      }
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
