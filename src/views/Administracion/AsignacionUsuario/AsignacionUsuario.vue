<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Asignar usuario a empresa</h1>
    <v-card class="pa-6" max-width="600" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <v-row dense>
          <!--fila 1-->
          <v-col cols="12">
            <v-select
                v-model="idUsuario"
                :items="usuarios"
                item-title="usuUsuario"
                item-value="usuId"
                label="Usuario para asignarlo"
                :rules="[reglas.requerido]"
                :loading="cargandoListas"
                variant="outlined"
                class="mb-2"
            />
          </v-col>

          <!--boton-->
          <v-col cols="12" class="d-flex justify-end ga-2 mt-2">
            <v-btn color="primary" :loading="guardando" type="submit">Confirmar</v-btn>
          </v-col>


        </v-row>
      </v-form>
    </v-card>

    <h1 class="text-h5 mb-4 mt-4">Usuarios en mi empresa</h1>
    <v-card elevation="1">
      <v-table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Fecha creación</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="cargando">
            <td colspan="7" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          
          <tr v-else-if="!usuariosMios.length">
            <td colspan="7" class="text-center py-6 text-medium-emphasis">
              No hay registros para mostrar
            </td>
          </tr>

          <tr v-for="usuMio in usuariosMios" :key="usuariosMios.usuMioId">
            <td>{{ usuMio.usuMioUsuario }}</td>
            <td>{{ usuMio.usuMioNombre }}</td>
            <td>{{ usuMio.usuMioRol }}</td>
            <td>
              <v-chip :color="usuMio.usuMioEstado === 1 ? 'success' : 'error'" size="small">
                {{ usuMio.usuMioEstado === 1 ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </td>
            <td>{{ usuMio.usuMioFecCreacion }}</td>
          </tr>

        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@/stores/auth'
import EnConstruccion from '@/components/common/EnConstruccion.vue'

export default {
  name: 'AsignacionUsuario',

  data(){
    return{
      usuarios:[],      // donde carga los usuarios 
      idUsuario:null,   //usario seleccionado
      cargandoLista: false, 
      guardando: false,     
      cargando:false,

      usuariosMios : [], //usuarios que estan en mi empresa
      
      
      reglas: {
        requerido: (v) => !!v || 'Campo obligatorio'
      }
    }
  },

  computed: { 
    authStore() {
      return useAuthStore()
    },

    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
  },

  async created() {
    await this.cargarLista()
    await this.cargarUsuariosMios()
  },

  methods:{
    async cargarLista(){
      this.cargandoLista = true
      try {

        /*
        cargar usuarios con

        Petición: post
        Ruta: http://localhost:3000/api/usuarioEmpresa/getusuariossinmiempresa
        Header:{token:”asdf”}
        Body: {"idEmpresa":3}
        Respuesta: {   "data": [
          {
                    "Id": 9,
                    "userName": "user108",
                    "Nombres": "user108",
                  "Apellidos": "user108",
                    "Rol": "ADMINISTRADOR"
        }
              ]
        }

        donde usuId =id
        y usuUsuario va a ser userName concatenado con Rol, los otros datos no importan
        
        */

        this.usuarios = [
          {usuId:"1",usuUsuario:"usuario 1"},
          {usuId:"2",usuUsuario:"usuario 2"},
          {usuId:"3",usuUsuario:"usuario 3"},
          {usuId:"4",usuUsuario:"usuario 4"}
        ]
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los usuarios'
        Swal.fire('Error', mensaje,'error')
      }finally{
        this.cargandoLista = false
      }
      
    },

    async cargarUsuariosMios(){
      this.cargando = true
      try {
        
        /*
        llenar usuariosMios con:
          Petición: post
          Ruta: http://localhost:3000/api/usuarioEmpresa/getusuariosconmiempresa
          Header: Header:{token:”asdf”}
          Body: { "idEmpresa":1 }
          Respuesta: {
              "data": [
                  {
                      "usuMioId": 1,
                      "usuMioUsuario": "user100",
                      "usuMioNombre": "user100 user100",
                      "usuMioEstado": 1,
                      "usuMioRol": "ADMINISTRADOR",
                      "usuMioFecCreacion": "2026-09-17T12:41:38.000Z"
                  }
              ]
          }
          Respuesta si sale mal: {“msg”:”mensaje de error”}

          La empresa es obligatoria, es un numero entero

        
        */



        this.usuariosMios = [
          {
            usuMioId:1,
            usuMioUsuario:"usuario",
            usuMioNombre:"pepe",
            usuMioRol:"ADMINISTRADOR",
            usuMioEstado:1,
            usuMioFecCreacion:"2026-09-17T12:41:38.000Z"
          },
          {
            usuMioId:2,
            usuMioUsuario:"usuario",
            usuMioNombre:"pepe",
            usuMioRol:"ADMINISTRADOR",
            usuMioEstado:0,
            usuMioFecCreacion:"2026-09-17T12:41:38.000Z"
          },
          {
            usuMioId:3,
            usuMioUsuario:"usuario",
            usuMioNombre:"pepe",
            usuMioRol:"ADMINISTRADOR",
            usuMioEstado:1,
            usuMioFecCreacion:"2026-09-17T12:41:38.000Z"
          },
          {
            usuMioId:4,
            usuMioUsuario:"usuario",
            usuMioNombre:"pepe",
            usuMioRol:"ADMINISTRADOR",
            usuMioEstado:0,
            usuMioFecCreacion:"2026-09-17T12:41:38.000Z"
          }
        ]

      } catch (error) {
        const mensaje  = error.response?.data?.msg || 'No se pudo consultar los usuarios'
        Swal.fire('Error',mensaje,'error')
      }finally{
        this.cargando = false
      }
    },

    async confirmar() {
      this.guardando = true
      try {
        /*
          guarda los datos donde envica la peticion de 

          Petición: post
          Ruta: http://localhost:3000/api/usuarioEmpresa/newrelacionusuarioempresa
          Header:{token:”asdf”}
          Body: {"idEmpresa":3, "idUsuario":2}
          Respuesta: {   "msg": "Usuario asignado"}
          donde idUsuario es idUsuario, el usuario selecciando en el combo



          despues de esto recargar la tabla
        */      
      
      
      
      
      } catch (error) {
        const mensaje  = error.response?.data?.msg || 'No se pudo consultar los usuarios'
        Swal.fire('Error',mensaje,'error')
      }finally{
        this.guardando = false
      }
      
    }
  }
  
}
</script>
