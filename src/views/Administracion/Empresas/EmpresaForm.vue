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

    <v-alert v-else type="info" variant="tonal" class="mb-4" max-width="760">
      El estado de la empresa en sesión no se puede cambiar desde ella misma. Para activarla o
      desactivarla, selecciona otra empresa en la barra superior.
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
              :rules="[reglas.maxCorto, reglas.tipoDocumento]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="numeroDocumento"
              label="Número documento"
              maxlength="50"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.maxCorto, reglas.numeroDocumento]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model="celular"
              label="Celular"
              maxlength="10"
              inputmode="numeric"
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
              :rules="[reglas.maxTelefono, reglas.telefono]"
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

          <v-col cols="12">
            <h3 class="text-subtitle-2 mb-2">Redes sociales</h3>
          </v-col>
          <v-col v-for="red in redesSociales" :key="red.campo" cols="12" sm="6">
            <v-text-field
              v-model="redes[red.campo]"
              :label="red.etiqueta"
              :prepend-inner-icon="red.icono"
              maxlength="255"
              :disabled="!puedeEditarGeneral"
              :rules="[reglas.maxRed]"
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
                maxlength="15"
                :rules="[reglas.requerido, reglas.maxPass15, reglas.passPermitida]"
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

    <!-- LOGO DE LA EMPRESA (foto de la factura): verlo vale para cualquier empresa con la que el
         usuario tenga relacion activa; subir y eliminar solo la empresa del token -->
    <v-card v-if="esAdministrador" class="pa-6 mb-4" max-width="760" elevation="1">
      <h2 class="text-subtitle-1 mb-2">Logo de la empresa</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Imagen que se usará como logo en la factura. Formatos png, jpg o jpeg, máximo 500 KB.
      </p>

      <v-row dense align="center">
        <v-col cols="12" sm="5" class="d-flex justify-center">
          <v-sheet
            width="220"
            height="220"
            border
            rounded
            class="d-flex align-center justify-center overflow-hidden"
          >
            <v-progress-circular v-if="cargandoFoto" indeterminate color="primary" />
            <v-img
              v-else-if="fotoVisible"
              :src="fotoVisible"
              width="220"
              height="220"
            />
            <div v-else class="text-center text-medium-emphasis">
              <v-icon icon="mdi-image-off-outline" size="48" />
              <div class="text-caption mt-1">{{ errorFoto ? 'Logo no disponible' : 'Sin logo' }}</div>
            </div>
          </v-sheet>
        </v-col>

        <!-- otra empresa: solo se consulta -->
        <v-col v-if="!puedeEditarGeneral" cols="12" sm="7">
          <v-alert v-if="errorFoto" type="warning" variant="tonal" density="compact" class="mb-3">
            {{ errorFoto }}
          </v-alert>
          <p class="text-body-2 text-medium-emphasis">
            Para subir o eliminar el logo, selecciona esta empresa en la barra superior.
          </p>
        </v-col>

        <v-col v-else cols="12" sm="7">
          <v-alert v-if="errorFoto" type="warning" variant="tonal" density="compact" class="mb-3">
            {{ errorFoto }}
          </v-alert>
          <input
            ref="inputFoto"
            type="file"
            accept="image/png,image/jpeg"
            class="d-none"
            @change="seleccionarFoto"
          />

          <template v-if="fotoNueva">
            <v-alert type="info" variant="tonal" density="compact" class="mb-3">
              Vista previa de <strong>{{ fotoNuevaNombre }}</strong>. Aún no se ha guardado.
            </v-alert>
            <div class="d-flex flex-wrap ga-2">
              <v-btn color="primary" prepend-icon="mdi-upload" :loading="subiendoFoto" @click="subirFoto">
                Guardar logo
              </v-btn>
              <v-btn variant="outlined" :disabled="subiendoFoto" @click="descartarFotoNueva">
                Descartar
              </v-btn>
            </div>
          </template>

          <div v-else class="d-flex flex-wrap ga-2">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-image-plus"
              :disabled="cargandoFoto || eliminandoFoto"
              @click="$refs.inputFoto.click()"
            >
              {{ fotoUrl ? 'Cambiar logo' : 'Subir logo' }}
            </v-btn>
            <v-btn
              v-if="fotoUrl"
              color="error"
              variant="outlined"
              prepend-icon="mdi-delete"
              :loading="eliminandoFoto"
              @click="eliminarFoto"
            >
              Eliminar logo
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- CAMBIAR CLAVE -->
    <v-card v-if="puedeEditarGeneral" class="pa-6 mb-4" max-width="760" elevation="1">
      <h2 class="text-subtitle-1 mb-2">Cambiar clave de la empresa</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Al cambiar la clave se cierran todas las sesiones de esta empresa, incluida la tuya.
        Después se inicia sesión con la clave nueva.
      </p>
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
              :rules="[reglas.requerido, reglas.maxClave10, reglas.soloAlfanumerico, reglas.claveDistinta]"
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
              maxlength="15"
              :rules="[reglas.requerido, reglas.maxPass15, reglas.passPermitida]"
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
              maxlength="15"
              :rules="[reglas.requerido, reglas.maxPass15, reglas.passPermitida]"
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
              maxlength="15"
              :rules="[reglas.requerido, reglas.maxPass15, reglas.passPermitida]"
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

    <!-- CAMBIAR ESTADO: solo de OTRA empresa (la del token responde "no se puede anular así misma") -->
    <v-card v-if="esAdministrador && !esEmpresaEnSesion" class="pa-6 mb-4" max-width="760" elevation="1">
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
              maxlength="15"
              :rules="[reglas.requerido, reglas.maxPass15, reglas.passPermitida]"
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
import { useLogoEmpresaStore } from '@/stores/logoEmpresa'

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
      redes: {
        Whatsapp: '',
        Instagram: '',
        Twitter: '',
        Facebook: '',
        Youtube: ''
      },
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

      // logo de la empresa
      fotoUrl: null, // object URL de la foto guardada en el servidor
      fotoNueva: null, // Data URL de la imagen elegida, pendiente de guardar
      fotoNuevaNombre: '',
      cargandoFoto: false,
      errorFoto: '', // por que no se pudo traer el logo (p. ej. sin relacion con la empresa)
      subiendoFoto: false,
      eliminandoFoto: false,

      redesSociales: [
        { campo: 'Whatsapp', etiqueta: 'WhatsApp', icono: 'mdi-whatsapp' },
        { campo: 'Instagram', etiqueta: 'Instagram', icono: 'mdi-instagram' },
        { campo: 'Facebook', etiqueta: 'Facebook', icono: 'mdi-facebook' },
        { campo: 'Twitter', etiqueta: 'Twitter / X', icono: 'mdi-twitter' },
        { campo: 'Youtube', etiqueta: 'YouTube', icono: 'mdi-youtube' }
      ],

      opcionesEstado: [
        { valor: true, texto: 'Activo' },
        { valor: false, texto: 'Inactivo' }
      ],

      reglas: {
        requerido: (v) => !!v || 'Campo obligatorio',
        maxNombre: (v) => (!v || v.length <= 150) || 'Máximo 150 caracteres',
        maxCorto: (v) => (!v || v.length <= 50) || 'Máximo 50 caracteres',
        tipoDocumento: (v) =>
          /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ ]*$/.test(v || '') || 'Solo letras, números y espacios',
        numeroDocumento: (v) =>
          /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ -]*$/.test(v || '') ||
          'Solo letras, números, espacios y guion (ej. 900123456-7)',
        celular10: (v) => (!v || /^[0-9]{10}$/.test(v)) || 'Debe tener 10 dígitos numéricos',
        maxTelefono: (v) => (!v || v.length <= 25) || 'Máximo 25 caracteres',
        telefono: (v) => /^[a-zA-Z0-9 -]*$/.test(v || '') || 'Solo letras, números, espacios y guion',
        email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || 'Email inválido',
        maxEmail: (v) => (!v || v.length <= 150) || 'Máximo 150 caracteres',
        maxDireccion: (v) => (!v || v.length <= 200) || 'Máximo 200 caracteres',
        maxRed: (v) => (!v || v.length <= 255) || 'Máximo 255 caracteres',
        maxClave10: (v) => (v ? v.length <= 10 : true) || 'Máximo 10 caracteres',
        soloAlfanumerico: (v) =>
          /^[a-zA-Z0-9]+$/.test(v || '') || 'Solo letras y números, sin espacios ni acentos',
        // la clave nueva no puede ser la actual (el servidor no distingue mayusculas)
        claveDistinta: (v) =>
          (v || '').toLowerCase() !== (this.claveActual || '').toLowerCase() ||
          'Debe ser distinta a la clave actual',
        maxPass15: (v) => (v ? v.length <= 15 : true) || 'Máximo 15 caracteres',
        passPermitida: (v) =>
          /^[a-zA-Z0-9.!=#$@¡_-]+$/.test(v || '') ||
          'Solo letras (sin acentos ni Ñ), números y . ! = # $ @ ¡ - _, sin espacios'
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
    },

    // si hay una imagen elegida sin guardar se muestra esa; si no, la guardada
    fotoVisible() {
      return this.fotoNueva || this.fotoUrl
    }
  },

  created() {
    // getempresaid no devuelve el Estado, por eso viene por query desde EmpresaList.vue
    if (this.$route.query.estado !== undefined) {
      this.nuevoEstado = Number(this.$route.query.estado) === 1
    }
    this.cargarEmpresa()
    // traer la foto acepta cualquier empresa con relacion activa, no solo la del token
    if (this.esAdministrador) this.cargarFoto()
  },

  beforeUnmount() {
    this.liberarFotoUrl()
  },

  methods: {
    async cargarEmpresa() {
      this.cargando = true
      try {
        const { data } = await empresaService.getById({ idEmpresa: this.idEmpresaObjetivo })
        const e = data.data
        // los campos llegan "" o null; se normalizan a "" porque updateempresa
        // falla si TipoDocumento llega null
        this.nombre = e.Nombre ?? ''
        this.tipoDocumento = e.TipoDocumento ?? ''
        this.numeroDocumento = e.NumeroDocumento ?? ''
        this.celular = e.Celular ?? ''
        this.telefono = e.Telefono ?? ''
        this.email = e.Email ?? ''
        this.direccion = e.Direccion ?? ''
        for (const red of this.redesSociales) {
          this.redes[red.campo] = e[red.campo] ?? ''
        }
        this.claveActual = e.Clave
      } catch (error) {
        const mensaje = this.mensajeError(error, 'No se pudo cargar la empresa')
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
        // updateempresa reemplaza la ficha completa: lo que no se manda queda en null
        const { data } = await empresaService.update({
          idEmpresa: this.idEmpresaSesion,
          passEmpresa: this.passEmpresaGeneral,
          Nombre: this.nombre,
          TipoDocumento: this.tipoDocumento ?? '',
          NumeroDocumento: this.numeroDocumento,
          Celular: this.celular,
          Telefono: this.telefono,
          Email: this.email,
          Direccion: this.direccion,
          Whatsapp: this.redes.Whatsapp,
          Instagram: this.redes.Instagram,
          Twitter: this.redes.Twitter,
          Facebook: this.redes.Facebook,
          Youtube: this.redes.Youtube
        })
        await Swal.fire('Éxito', data.msg || 'Datos actualizados', 'success')
        this.passEmpresaGeneral = ''
        this.$refs.formGeneral.resetValidation()
      } catch (error) {
        const mensaje = this.mensajeError(error, 'No se pudieron actualizar los datos')
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
        const claveNueva = this.claveNueva
        await empresaService.cambiarClave({
          idEmpresa: this.idEmpresaSesion,
          passEmpresa: this.passEmpresaClave,
          newClave: claveNueva
        })
        // el token guarda la clave de la empresa: con la clave nueva deja de servir
        await Swal.fire(
          'Clave actualizada',
          `Debes iniciar sesión de nuevo usando la clave "${claveNueva}".`,
          'success'
        )
        this.authStore.logout()
        this.$router.push({ name: 'Login' })
      } catch (error) {
        const mensaje = this.mensajeError(error, 'No se pudo actualizar la clave')
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
        const mensaje = this.mensajeError(error, 'No se pudo actualizar la contraseña')
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
        const mensaje = this.mensajeError(error, 'No se pudo actualizar el estado')
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoEstado = false
      }
    },

    // getfotoempresa responde la imagen (blob); 404 = la empresa no tiene foto
    async cargarFoto() {
      this.cargandoFoto = true
      this.errorFoto = ''
      try {
        const resp = await empresaService.getFoto({ idEmpresa: this.idEmpresaObjetivo })
        // los errores vienen en JSON aunque se pida un blob: mirar el Content-Type
        if (!(resp.headers['content-type'] || '').startsWith('image/')) {
          throw { response: { data: resp.data } }
        }
        this.liberarFotoUrl()
        this.fotoUrl = URL.createObjectURL(resp.data)
      } catch (error) {
        this.liberarFotoUrl()
        if (error.response?.status === 404) return // sin foto: no es un error
        // se muestra en la tarjeta y no en un Swal: un administrador puede abrir empresas con
        // las que no tiene relacion ("No existe relacion entre usuario y empresa") y eso no
        // debe interrumpir la pantalla
        this.errorFoto = await this.mensajeErrorBlob(error, 'No se pudo cargar el logo')
      } finally {
        this.cargandoFoto = false
      }
    },

    seleccionarFoto(evento) {
      const archivo = evento.target.files?.[0]
      evento.target.value = '' // permite volver a elegir el mismo archivo
      if (!archivo) return

      if (!['image/png', 'image/jpeg'].includes(archivo.type)) {
        Swal.fire('Archivo no válido', 'El logo debe ser png, jpg o jpeg', 'warning')
        return
      }
      if (archivo.size > 500 * 1024) {
        Swal.fire('Archivo muy grande', 'El logo no puede superar los 500 KB', 'warning')
        return
      }

      const lector = new FileReader()
      lector.onload = () => {
        this.fotoNueva = lector.result // data:image/...;base64,...
        this.fotoNuevaNombre = archivo.name
      }
      lector.onerror = () => {
        Swal.fire('Error', 'No se pudo leer el archivo', 'error')
      }
      lector.readAsDataURL(archivo)
    },

    descartarFotoNueva() {
      this.fotoNueva = null
      this.fotoNuevaNombre = ''
    },

    async subirFoto() {
      if (!this.fotoNueva) return
      this.subiendoFoto = true
      try {
        const { data } = await empresaService.updateFoto({
          idEmpresa: this.idEmpresaSesion,
          Foto: this.fotoNueva
        })
        this.descartarFotoNueva()
        useLogoEmpresaStore().invalidar(this.idEmpresaSesion) // la factura la vuelve a pedir
        await this.cargarFoto() // se muestra la que quedo guardada en el servidor
        Swal.fire('Éxito', data.msg || 'Foto de la empresa actualizada', 'success')
      } catch (error) {
        const mensaje = this.mensajeError(error, 'No se pudo subir el logo')
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.subiendoFoto = false
      }
    },

    async eliminarFoto() {
      const confirmacion = await Swal.fire({
        title: 'Eliminar logo',
        text: '¿Seguro que deseas eliminar el logo de la empresa?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      })
      if (!confirmacion.isConfirmed) return

      this.eliminandoFoto = true
      try {
        const { data } = await empresaService.deleteFoto({ idEmpresa: this.idEmpresaSesion })
        this.liberarFotoUrl()
        useLogoEmpresaStore().invalidar(this.idEmpresaSesion)
        Swal.fire('Éxito', data.msg || 'Foto de la empresa eliminada', 'success')
      } catch (error) {
        const mensaje = this.mensajeError(error, 'No se pudo eliminar el logo')
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.eliminandoFoto = false
      }
    },

    liberarFotoUrl() {
      if (this.fotoUrl) URL.revokeObjectURL(this.fotoUrl)
      this.fotoUrl = null
    },

    // con responseType blob el JSON de error llega como Blob y hay que leerlo
    async mensajeErrorBlob(error, porDefecto) {
      const datos = error.response?.data
      if (datos instanceof Blob) {
        try {
          const json = JSON.parse(await datos.text())
          return json.msg || json.errors?.[0]?.msg || porDefecto
        } catch {
          return porDefecto
        }
      }
      return this.mensajeError(error, porDefecto)
    },

    // el backend responde {msg} o, con express-validator, {errors:[{msg}]}
    mensajeError(error, porDefecto) {
      return error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || porDefecto
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
