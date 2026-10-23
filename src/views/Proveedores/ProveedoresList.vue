<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Proveedores</h1>
      <div class="d-flex ga-2">
        <input ref="archivoCsv" class="d-none" type="file" accept=".csv,text/csv" @change="manejarArchivoCsv">
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-download" @click="descargarPlantilla">
          Plantilla
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-upload" :loading="subiendo" @click="abrirSelectorCsv">
          Subir
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
          Agregar
        </v-btn>
      </div>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar"
            maxlength="10"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
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
        <v-col cols="12" sm="2">
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
            <th>Identificación</th>
            <th>Nombre</th>
            <th>Celular</th>
            <th>Estado</th>
            <th>Fecha de creación</th>
            <th class="text-center">Editar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!proveedores.length">
            <td colspan="6" class="text-center py-6 text-medium-emphasis">
              No hay registros para mostrar
            </td>
          </tr>
          <tr v-for="proveedor in proveedores" :key="proveedor.Id">
            <td>{{ proveedor.identificacion }}</td>
            <td>{{ proveedor.Nombre }}</td>
            <td>{{ proveedor.Celular || '-' }}</td>
            <td>
              <v-chip :color="proveedor.Estado === 1 ? 'success' : 'error'" size="small">
                {{ proveedor.Estado === 1 ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </td>
            <td>{{ formatearFecha(proveedor.FechaCreacion) }}</td>
            <td class="text-center">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="irAEditar(idEmpresa, proveedor.Id)" />
            </td>
          </tr>
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
import terceroService from '@/services/terceroService'
import { useAuthStore } from '@/stores/auth'
import { descargarCsv } from '@/utils/descargarCsv'
import { parsearTercerosCsv, plantillaTercerosCsv, MAX_TERCEROS_IMPORTAR } from '@/utils/tercerosCsv'

export default {
  name: 'ProveedoresList',
  data() {
    return {
      cargando: false,
      subiendo: false,
      proveedores: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 5,
        orden: 'DESC',
        estadoFiltro: 0
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'Apellidos' },
        { valor: 3, texto: 'Número de documento' },
        { valor: 4, texto: 'Email' },
        { valor: 5, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ],
      opcionesEstadoFiltro: [
        { valor: 0, texto: 'Todos' },
        { valor: 1, texto: 'Activos' },
        { valor: 2, texto: 'Inactivos' }
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
        const { data } = await terceroService.getAllProveedores({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro || '',
          estadoFiltro: this.filtros.estadoFiltro
        })
        this.proveedores = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los proveedores'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    irANuevo() {
      this.$router.push({ name: 'ProveedoresNuevo' })
    },

    descargarPlantilla() {
      descargarCsv('plantilla_proveedores.csv', plantillaTercerosCsv())
    },

    abrirSelectorCsv() {
      this.$refs.archivoCsv?.click()
    },

    async manejarArchivoCsv(event) {
      const archivo = event.target.files?.[0]
      event.target.value = ''
      if (!archivo) return

      if (!archivo.name.toLowerCase().endsWith('.csv')) {
        Swal.fire('Archivo no válido', 'Seleccione un archivo CSV', 'warning')
        return
      }

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const terceros = parsearTercerosCsv(await archivo.text(), 'PROVEEDOR')
      if (!terceros.length) {
        Swal.fire('Archivo vacío', 'El archivo no tiene proveedores para importar', 'warning')
        return
      }
      if (terceros.length > MAX_TERCEROS_IMPORTAR) {
        Swal.fire('Archivo muy grande', `El archivo tiene ${terceros.length} filas; el máximo es ${MAX_TERCEROS_IMPORTAR}. Divídalo en varios archivos`, 'warning')
        return
      }

      const confirmacion = await Swal.fire({
        title: 'Importar proveedores',
        text: `Se importarán ${terceros.length} proveedores. ¿Desea continuar?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Importar',
        cancelButtonText: 'Cancelar'
      })
      if (!confirmacion.isConfirmed) return

      this.subiendo = true
      try {
        const { data } = await terceroService.importar({ idEmpresa: this.idEmpresa, terceros })
        const detalle = `Creados: ${data.creados}<br>Ya existían: ${data.ignorados}<br>Con rol agregado: ${data.rolesAsignados}`
        Swal.fire({ title: data.msg || 'Importación finalizada', html: detalle, icon: 'success' })
        this.consultar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo importar el archivo'
        Swal.fire('Error', `${mensaje}. No se guardó ningún registro`, 'error')
      } finally {
        this.subiendo = false
      }
    },

    irAEditar(EmpId, TerId) {
      this.$router.push({ name: 'ProveedoresEditar', params: { EmpId, TerId } })
    },

    formatearFecha(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleDateString('es-CO')
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
