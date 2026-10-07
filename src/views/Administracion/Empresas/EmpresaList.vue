<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Empresas</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" :loading="creando" @click="crearEmpresa">
        Agregar
      </v-btn>
    </div>

    <v-card elevation="1">
      <v-table class="tabla-listado">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo Doc.</th>
            <th>N° Documento</th>
            <th>Celular</th>
            <th>Estado</th>
            <th>Fecha de creación</th>
            <th class="text-center">Usuarios</th>
            <th class="text-center">Editar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="8" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!empresas.length">
            <td colspan="8" class="text-center py-6 text-medium-emphasis">
              No hay registros para mostrar
            </td>
          </tr>
          <tr v-for="emp in empresas" :key="emp.Id">
            <td>{{ emp.Nombre }}</td>
            <td>{{ (emp.TipoDocumento || '').toUpperCase() }}</td>
            <td>{{ emp.NumeroDocumento }}</td>
            <td>{{ emp.Celular || '-' }}</td>
            <td>
              <v-chip :color="emp.Estado === 1 ? 'success' : 'error'" size="small">
                {{ emp.Estado === 1 ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </td>
            <td>{{ formatearFecha(emp.FechaCreacion) }}</td>
            <td class="text-center">{{ emp.cantUsuarios }}</td>
            <td class="text-center">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="irAEditar(emp)" />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import empresaService from '@/services/empresaService'

export default {
  name: 'EmpresaList',

  data() {
    return {
      cargando: false,
      creando: false,
      empresas: []
    }
  },

  created() {
    this.cargarEmpresas()
  },

  methods: {
    async cargarEmpresas() {
      this.cargando = true
      try {
        const { data } = await empresaService.getAll()
        this.empresas = data.data || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las empresas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    async crearEmpresa() {
      this.creando = true
      try {
        const { data } = await empresaService.create()

        // El mensaje debe permanecer visible hasta que el usuario mismo lo cierre:
        // se bloquea el cierre por click afuera o por tecla Escape.
        await Swal.fire({
          title: 'Empresa creada',
          text: data.msg,
          icon: 'success',
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: 'Aceptar'
        })

        await this.cargarEmpresas()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo crear la empresa'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.creando = false
      }
    },

    irAEditar(emp) {
      this.$router.push({
        name: 'EmpresaEditar',
        params: { EmpId: emp.Id },
        query: { estado: emp.Estado }
      })
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
