<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Ventas</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
        Agregar
      </v-btn>

      
    </div>


    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12">
          <div class="mb-1 text-subtitle-2">Cliente</div>
          <div class="d-flex align-center ga-2 mb-4">
            <v-btn icon="mdi-arrow-right" variant="tonal" @click="mostrarSelectorTercero = true"></v-btn>
            <p v-if="NombreTercero" class="mb-0 flex-grow-1">
              <strong>Identificación:</strong> {{ DocumentosTercero }} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Nombre: </strong>{{ NombreTercero }}
            </p>
          </div>
        </v-col>
      </v-row>

      <v-row dense align="center">
          <v-col cols="12">
            <div class="mb-1 text-subtitle-2">Articulo</div>
            <div class="d-flex align-center ga-2 mb-4">
              <v-btn icon="mdi-arrow-right" variant="tonal" @click="mostrarSelectorArticulo  = true"></v-btn>
              <p v-if="articuloNombre" class="mb-0 flex-grow-1">
                <strong>Sku:</strong> {{articuloSku}} <strong>Art:</strong> {{ articuloNombre }} - {{articuloUnidadMedida}} - {{articuloPropiedades }} 
              </p>
          </div>
        </v-col>
      </v-row>


  </v-card>
    

    <TercerosSeleccionar
      v-model="mostrarSelectorTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />



    <ArticulosSeleccionar
      v-model="mostrarSelectorArticulo"
      :id-empresa="idEmpresa"
      @seleccionar="onArticuloSeleccionado"
    />

  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@/stores/auth'
import TercerosSeleccionar from '@/views/Terceros/TercerosSeleccionar.vue'
import ArticulosSeleccionar from '@/views/Inventario/Articulos/ArticulosSeleccionar.vue'

export default {
  name: 'Ventas',

  components: { TercerosSeleccionar ,ArticulosSeleccionar},

  data() {
    return {
      mostrarSelectorTercero: false,
      
      idTercero: 0,
      DocumentosTercero:'',
      NombreTercero: '',

      mostrarSelectorArticulo:false,
      idArticulo :0,
      articuloNombre:'',
      articuloSku:'',
      articuloPropiedades:'',
      articuloUnidadMedida:''
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    }
  },

  methods: {
    onTerceroSeleccionado(tercero) {
      console.log(tercero)
      this.idTercero = tercero.Id
      this.NombreTercero = tercero.Nombre
      this.DocumentosTercero = tercero.identificacion
      // ter.identificacion y ter.Celular tambien vienen disponibles si los necesitas
    },

    onArticuloSeleccionado(articulo) {
      this.idArticulo = articulo.artId
      this.articuloNombre = articulo.artNombre
      this.articuloSku  = articulo.artSKU
      this.articuloPropiedades = articulo.artPropiedades
      this.articuloUnidadMedida = articulo.artUnidadMedida
    },

    irANuevo() {
      Swal.fire('Atención', 'En proceso de construcción', 'warning')
    }
  }
}
</script>