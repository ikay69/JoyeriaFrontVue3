<template>
  <v-dialog v-model="dialogVisible" max-width="1000" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar venta</span>
        <v-btn icon="mdi-close" variant="text" title="Cerrar" @click="cerrar" />
      </v-card-title>
      <v-divider />
      <v-card-text />
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'VentasSeleccionar',

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    idEmpresa: {
      type: [Number, String],
      default: null
    }
  },

  emits: ['update:modelValue', 'seleccionar'],

  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(valor) {
        this.$emit('update:modelValue', valor)
      }
    }
  },

  methods: {
    cerrar() {
      this.dialogVisible = false
    }
  }
}
</script>
