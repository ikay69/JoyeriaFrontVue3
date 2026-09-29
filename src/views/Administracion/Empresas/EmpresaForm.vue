<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Editar empresa</h1>

    <v-alert v-if="!esAdministrador" type="warning" variant="tonal" class="mb-4" max-width="760">
      Solo un usuario con rol Administrador puede modificar los datos de una empresa.
    </v-alert>

    <v-alert v-else-if="!esEmpresaEnSesion" type="info" variant="tonal" class="mb-4" max-width="760">
      Los datos generales, la clave y la contraseña solo se pueden editar en la empresa que
      tienes seleccionada actualmente en la barra superior. Aquí puedes consultarlos y, si lo
      necesitas, cambiar el estado de esta empresa.
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mb-4" style="max-width: 760px;" />

    <!-- DATOS GENERALES -->
    <v-card class="pa-6 mb-4" max-width="760" elevation="1">
      <h2 class="text-subtitle-1 mb-4">Datos generales</h2>
      <v-form ref="formGeneral" @submit.prevent="guardarGeneral">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="nombre"
              label="Nombre"
              maxlength="150"
              counter="150"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.requerido, reglas.maxNombre]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="tipoDocumento"
              label="Tipo documento"
              maxlength="50"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.maxCorto]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="numeroDocumento"
              label="Número documento"
              maxlength="50"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.maxCorto]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model="celular"
              label="Celular"
              maxlength="10"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.celular10]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model="telefono"
              label="Teléfono"
              maxlength="25"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.maxTelefono]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="email"
              label="Email"
              maxlength="150"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.email, reglas.maxEmail]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="direccion"
              label="Dirección"
              maxlength="200"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.maxDireccion]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="claveActual"
              label="Clave actual"
              :type="mostrarClaveActual ? 'text' : 'password'"
              :append-inner-icon="mostrarClaveActual ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="mostrarClaveActual = !mostrarClaveActual"
              readonly
              variant="outlined"
              hint="Para cambiarla usa la tarjeta 'Cambiar clave de la empresa'"
              persistent-hint
            />
          </v-col>
        </v-row>

        <template v-if="puedeEditarGeneral">
          <v-divider class="my-4" />
          <v-row dense align="center">
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="passEmpresaGeneral"
                label="Contraseña de la empresa (para confirmar)"
                :type="mostrarPassGeneral ? 'text' : 'password'"
                :append-inner-icon="mostrarPassGeneral ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="mostrarPassGeneral = !mostrarPassGeneral"
                maxlength="10"
                :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico]"
                variant="outlined"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4" class="d-flex justify-end">
              <v-btn color="primary" :loading="guardandoGeneral" type="submit">
                Guardar cambios
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </v-form>
    </v-card>

    <!-- CAMBIAR CLAVE -->
    <v-card v-if="puedeEditarGeneral" class="pa-6 mb-4" max-width="760" elevation="1">
      <h2 class="text-subtitle-1 mb-4">Cambiar clave de la empresa</h2>
      <v-form ref="formClave" @submit.prevent="cambiarClave">
        <v-row dense align="center">
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="claveNueva"
              label="Clave nueva"
              :type="mostrarClaveNueva ? 'text' : 'password'"
              :append-inner-icon="mostrarClaveNueva ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="mostrarClaveNueva = !mostrarClaveNueva"
              maxlength="10"
              :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico]"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="passEmpresaClave"
              label="Contraseña actual de la empresa"
              :type="mostrarPassClave ? 'text' : 'password'"
              :append-inner-icon="mostrarPassClave ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="mostrarPassClave = !mostrarPassClave"
              maxlength="10"
              :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico]"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" sm="2" class="d-flex justify-end">
            <v-btn
              icon="mdi-key-change"
              color="primary"
              :loading="guardandoClave"
              type="submit"
              title="Cambiar clave"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card>

    <!-- CAMBIAR CONTRASEÑA -->
    <v-card v-if="puedeEditarGeneral" class="pa-6 mb-4" max-width="760" elevation="1">
      <h2 class="text-subtitle-1 mb-4">Cambiar contraseña de la empresa</h2>
      <v-form ref="formPass" @submit.prevent="cambiarPassword">
        <v-row dense align="center">
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="passActual"
              label="Contraseña actual"
              :type="mostrarPassActual ? 'text' : 'password'"
              :append-inner-icon="mostrarPassActual ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="mostrarPassActual = !mostrarPassActual"
              maxlength="10"
              :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico]"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="passNueva"
              label="Contraseña nueva"
              :type="mostrarPassNueva ? 'text' : 'password'"
              :append-inner-icon="mostrarPassNueva ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="mostrarPassNueva = !mostrarPassNueva"
              maxlength="10"
              :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico]"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" sm="2" class="d-flex justify-end">
            <v-btn
              icon="mdi-lock-reset"
              color="primary"
              :loading="guardandoPass"
              type="submit"
              title="Cambiar contraseña"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card>

    <!-- CAMBIAR ESTADO -->
    <v-card v-if="esAdministrador" class="pa-6 mb-4" max-width="760" elevation="1">
      <h2 class="text-subtitle-1 mb-4">Estado de la empresa</h2>
      <v-form ref="formEstado" @submit.prevent="cambiarEstado">
        <v-row dense align="center">
          <v-col cols="12" sm="4">
            <v-select
              v-model="nuevoEstado"
              :items="opcionesEstado"
              item-title="texto"
              item-value="valor"
              label="Nuevo estado"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="passEmpresaEstado"
              label="Contraseña de esta empresa"
              :type="mostrarPassEstado ? 'text' : 'password'"
              :append-inner-icon="mostrarPassEstado ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="mostrarPassEstado = !mostrarPassEstado"
              maxlength="10"
              :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico]"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" sm="2" class="d-flex justify-end">
            <v-btn color="primary" :loading="guardandoEstado" type="submit">
              Cambiar
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>

    <div class="d-flex justify-end" style="max-width: 760px;">
      <v-btn variant="outlined" @click="cancelar">Volver</v-btn>
    </div>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import empresaService from '@/services/empresaService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'EmpresaForm',

  data() {
    return {
      cargando: false,

      // datos generales
      nombre: '',
      tipoDocumento: '',
      numeroDocumento: '',
      celular: '',
      telefono: '',
      email: '',
      direccion: '',
      claveActual: '',
      mostrarClaveActual: false,

      passEmpresaGeneral: '',
      mostrarPassGeneral: false,
      guardandoGeneral: false,

      // cambiar clave
      claveNueva: '',
      mostrarClaveNueva: false,
      passEmpresaClave: '',
      mostrarPassClave: false,
      guardandoClave: false,

      // cambiar contraseña
      passActual: '',
      mostrarPassActual: false,
      passNueva: '',
      mostrarPassNueva: false,
      guardandoPass: false,

      // cambiar estado
      nuevoEstado: true,
      passEmpresaEstado: '',
      mostrarPassEstado: false,
      guardandoEstado: false,

      opcionesEstado: [
        { valor: true, texto: 'Activo' },
        { valor: false, texto: 'Inactivo' }
      ],

      reglas: {
        requerido: (v) => !!v || 'Campo obligatorio',
        maxNombre: (v) => (!v || v.length <= 150) || 'Máximo 150 caracteres',
        maxCorto: (v) => (!v || v.length <= 50) || 'Máximo 50 caracteres',
        celular10: (v) => (!v || v.length === 10) || 'Debe tener 10 caracteres',
        maxTelefono: (v) => (!v || v.length <= 25) || 'Máximo 25 caracteres',
        email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || 'Email inválido',
        maxEmail: (v) => (!v || v.length <= 150) || 'Máximo 150 caracteres',
        maxDireccion: (v) => (!v || v.length <= 200) || 'Máximo 200 caracteres',
        maxClave10: (v) => (v ? v.length <= 10 : true) || 'Máximo 10 caracteres',
        soloAlfanumerico: (v) =>
          /^[a-zA-Z0-9]+$/.test(v || '') || 'Solo letras y números, sin espacios ni acentos'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    // empresa que se esta viendo/editando (la que se abrio desde la lista)
    idEmpresaObjetivo() {
      return Number(this.$route.params.EmpId)
    },

    // empresa actualmente seleccionada en la barra superior
    idEmpresaSesion() {
      return this.authStore.empresaSeleccionada
    },

    esAdministrador() {
      return this.authStore.rol === 'ADMINISTRADOR'
    },

    esEmpresaEnSesion() {
      return this.idEmpresaObjetivo === this.idEmpresaSesion
    },

    // datos generales, clave y contraseña: solo admin Y solo la empresa en sesion
    puedeEditarGeneral() {
      return this.esAdministrador && this.esEmpresaEnSesion
    }
  },

  created() {
    // getempresaid no devuelve el Estado, por eso viene por query desde EmpresaList.vue
    if (this.$route.query.estado !== undefined) {
      this.nuevoEstado = Number(this.$route.query.estado) === 1
    }
    this.cargarEmpresa()
  },

  methods: {
    async cargarEmpresa() {
      this.cargando = true
      try {
        const { data } = await empresaService.getById({ idEmpresa: this.idEmpresaObjetivo })
        const e = data.data
        this.nombre = e.Nombre
        this.tipoDocumento = e.TipoDocumento
        this.numeroDocumento = e.NumeroDocumento
        this.celular = e.Celular
        this.telefono = e.Telefono
        this.email = e.Email
        this.direccion = e.Direccion
        this.claveActual = e.Clave
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la empresa'
        await Swal.fire('Error', mensaje, 'error')
        this.cancelar()
      } finally {
        this.cargando = false
      }
    },

    async guardarGeneral() {
      const { valid } = await this.$refs.formGeneral.validate()
      if (!valid) return

      this.guardandoGeneral = true
      try {
        const { data } = await empresaService.update({
          idEmpresa: this.idEmpresaSesion,
          passEmpresa: this.passEmpresaGeneral,
          Nombre: this.nombre,
          TipoDocumento: this.tipoDocumento,
          NumeroDocumento: this.numeroDocumento,
          Celular: this.celular,
          Telefono: this.telefono,
          Email: this.email,
          Direccion: this.direccion
        })
        await Swal.fire('Éxito', data.msg || 'Datos actualizados', 'success')
        this.passEmpresaGeneral = ''
        this.$refs.formGeneral.resetValidation()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron actualizar los datos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoGeneral = false
      }
    },

    async cambiarClave() {
      const { valid } = await this.$refs.formClave.validate()
      if (!valid) return

      this.guardandoClave = true
      try {
        const { data } = await empresaService.cambiarClave({
          idEmpresa: this.idEmpresaSesion,
          passEmpresa: this.passEmpresaClave,
          newClave: this.claveNueva
        })
        await Swal.fire('Éxito', data.msg || 'Clave actualizada', 'success')
        this.passEmpresaClave = ''
        this.claveNueva = ''
        this.$refs.formClave.resetValidation()
        this.cargarEmpresa()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo actualizar la clave'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoClave = false
      }
    },

    async cambiarPassword() {
      const { valid } = await this.$refs.formPass.validate()
      if (!valid) return

      this.guardandoPass = true
      try {
        const { data } = await empresaService.cambiarPassword({
          idEmpresa: this.idEmpresaSesion,
          passEmpresa: this.passActual,
          newPass: this.passNueva
        })
        await Swal.fire('Éxito', data.msg || 'Contraseña actualizada', 'success')
        this.passActual = ''
        this.passNueva = ''
        this.$refs.formPass.resetValidation()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo actualizar la contraseña'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoPass = false
      }
    },

    async cambiarEstado() {
      const { valid } = await this.$refs.formEstado.validate()
      if (!valid) return

      this.guardandoEstado = true
      try {
        const { data } = await empresaService.cambiarEstado({
          idEmpresa: this.idEmpresaObjetivo,
          passEmpresa: this.passEmpresaEstado,
          newEstado: this.nuevoEstado
        })
        await Swal.fire('Éxito', data.msg || 'Estado actualizado', 'success')
        this.passEmpresaEstado = ''
        this.$refs.formEstado.resetValidation()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo actualizar el estado'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoEstado = false
      }
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>