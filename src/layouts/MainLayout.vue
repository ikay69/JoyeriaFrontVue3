<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title class="d-none d-sm-flex">
        <v-icon start icon="mdi-diamond-stone" />
        Joyería Compra Venta
      </v-app-bar-title>

      <v-spacer />

      <v-select
        v-model="empresaSeleccionada"
        :items="empresas"
        item-title="Nombre"
        item-value="Id"
        label="Empresa"
        density="compact"
        variant="solo-filled"
        hide-details
        style="max-width: 260px"
        class="mr-4"
      />

      <v-btn variant="text" prepend-icon="mdi-logout" @click="cerrarSesion">
        Cerrar sesión
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer permanent width="280">
      <v-list-item
        :title="usuario"
        :subtitle="rol"
        prepend-icon="mdi-account-circle"
        class="py-3"
      />
      <v-divider />

      <v-list density="compact" nav>
        <v-list-item :to="{ name: 'Inicio' }" prepend-icon="mdi-home" title="Inicio" />

        <v-list-group value="inventario">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-package-variant-closed"
              title="Inventario"
            />
          </template>
          <v-list-item :to="{ name: 'CategoriaList' }" title="Categorías" />
          <v-list-item :to="{ name: 'UnidadesMedida' }" title="Unidades de medida" />
          <v-list-item :to="{ name: 'Propiedades' }" title="Propiedades" />
          <v-list-item :to="{ name: 'TipoProductos' }" title="Tipos de Productos" />
          <v-list-item :to="{ name: 'Productos' }" title="Productos" />
          <v-list-item :to="{ name: 'Articulos' }" title="Artículos" class="bg-red text-white"/>
          <v-list-item :to="{ name: 'MovimientosInventario' }" title="Movimientos de inventario" class="bg-red text-white"/>
        </v-list-group>

        <v-list-item :to="{ name: 'Terceros' }" prepend-icon="mdi-account-group" title="Terceros" />
        <v-list-item :to="{ name: 'Ventas' }" prepend-icon="mdi-cash-register" title="Ventas" class="bg-red text-white"/>
        <v-list-item :to="{ name: 'Compras' }" prepend-icon="mdi-cart" title="Compras" class="bg-red text-white"/>
        <v-list-item :to="{ name: 'Prestamos' }" prepend-icon="mdi-hand-coin" title="Préstamos" class="bg-red text-white"/>
        <v-list-item :to="{ name: 'Empenos' }" prepend-icon="mdi-diamond-stone" title="Empeños"class="bg-red text-white" />
        <v-list-item :to="{ name: 'Abonos' }" prepend-icon="mdi-cash-plus" title="Abonos" class="bg-red text-white"/>
        <v-list-item :to="{ name: 'Gastos' }" prepend-icon="mdi-cash-minus" title="Gastos" class="bg-red text-white"/>

        <v-list-group value="contabilidad">
          <template #activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-book-open-variant" title="Contabilidad" />
          </template>
          <v-list-item :to="{ name: 'MovimientoCaja' }" title="Movimiento en caja" class="bg-red text-white"/>
          <v-list-item :to="{ name: 'EstadoCuentaTercero' }" title="Estado de cuenta por tercero" class="bg-red text-white"/>
        </v-list-group>

        <v-list-group value="administracion">
          <template #activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-cog" title="Administración" />
          </template>
          <v-list-item :to="{ name: 'Usuarios' }" title="Usuarios"/>
          <v-list-item :to="{ name: 'Empresas' }" title="Empresas" class="bg-red text-white"/>
          <v-list-item :to="{ name: 'AsignacionUsuario' }" title="Asignación de usuario" />
          <v-list-item :to="{ name: 'TiposDocumento' }" title="Tipos de documento" />
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'MainLayout',
  computed: {
    authStore() {
      return useAuthStore()
    },
    usuario() {
      return this.authStore.usuario
    },
    rol() {
      return this.authStore.rol
    },
    empresas() {
      return this.authStore.empresas
    },
    empresaSeleccionada: {
      get() {
        return this.authStore.empresaSeleccionada
      },
      set(idEmpresa) {
        this.authStore.setEmpresaSeleccionada(idEmpresa)
      }
    }
  },
  methods: {
    async cerrarSesion() {
      const resultado = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: 'Se cerrará la sesión actual.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
      })

      if (resultado.isConfirmed) {
        this.authStore.logout()
        this.$router.push({ name: 'Login' })
      }
    }
  }
}
</script>
