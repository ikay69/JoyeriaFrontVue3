<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Detalle de venta #{{ ventaId }}</h1>

    <v-card class="pa-6" max-width="600" elevation="1">
      <p class="text-body-2 text-medium-emphasis">
        Pantalla en construcción.
      </p>

      <div class="d-flex justify-end mt-4">
        <v-btn variant="outlined" @click="$router.back()">Volver</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'VentasDetalle',

  computed: {
    // recibidos por parametro desde VentasList.vue
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    ventaId() {
      return Number(this.$route.params.VentaId)
    }
  }
}
</script>