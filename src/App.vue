<template>
  <router-view />
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* Sweetalert2 usa z-index 1060 y los v-dialog de Vuetify ~2400: sin esto la alerta
   queda debajo del dialogo y el await Swal.fire() nunca se resuelve */
.swal2-container {
  z-index: 3000 !important;
}
</style>
