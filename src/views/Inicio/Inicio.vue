<template>
  <v-container fluid class="pa-6">
    <v-card class="pa-8 text-center" elevation="2">
      <v-icon size="64" color="primary" class="mb-4">mdi-diamond-stone</v-icon>
      <h1 class="text-h4 mb-2">Bienvenido, {{ usuario }}</h1>
      <p class="text-subtitle-1 text-medium-emphasis">
        Empresa actual: {{ empresaActual ? empresaActual.Nombre : 'Ninguna seleccionada' }}
      </p>
      <p class="text-body-2 text-medium-emphasis mt-2">
        Sistema de gestión para joyería y compra venta.
      </p>
    </v-card>

    <!-- Accesos directos a crear. Una sola fila por ahora; mas adelante se agregan otros. -->
    <v-row class="mt-4">
      <v-col v-for="acceso in accesos" :key="acceso.ruta" cols="12" sm="6" md="3">
        <v-btn
          block
          size="x-large"
          color="primary"
          variant="tonal"
          :prepend-icon="acceso.icono"
          @click="$router.push({ name: acceso.ruta })"
        >
          {{ acceso.texto }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Inicio',
  data() {
    return {
      accesos: [
        { texto: 'Nueva venta', ruta: 'VentasNuevo', icono: 'mdi-cash-register' },
        { texto: 'Nuevo pago', ruta: 'PagosNuevo', icono: 'mdi-cash-multiple' },
        { texto: 'Nueva compra', ruta: 'CompraNueva', icono: 'mdi-cart-plus' },
        { texto: 'Nuevo gasto', ruta: 'GastosNuevo', icono: 'mdi-receipt-text-plus' }
      ]
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
    usuario() {
      return this.authStore.usuario
    },
    empresaActual() {
      return this.authStore.empresaActual
    }
  }
}
</script>
