<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">{{ esEdicion ? 'Editar promoción' : 'Nueva promoción' }}</h1>

    <v-card class="pa-6" max-width="760" elevation="1">
      <v-form ref="form" :disabled="cargando" @submit.prevent="confirmar">
        <v-text-field
          v-model="nombre"
          label="Nombre"
          maxlength="50"
          counter="50"
          hint="Se guarda en mayúsculas y no se puede repetir. Si se repite cada año, incluya el año (ej. NAVIDAD 2026)."
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea
          v-model="descripcion"
          label="Descripción"
          maxlength="255"
          counter="255"
          rows="2"
          auto-grow
          variant="outlined"
          class="mb-2"
        />

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="fechaInicio"
              label="Fecha de inicio"
              type="date"
              :rules="[reglas.requerido]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="fechaFin"
              label="Fecha de fin"
              type="date"
              :min="fechaInicio || undefined"
              :rules="[reglas.requerido, reglas.fechaFin]"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <div class="text-subtitle-2 mb-2">Descuento</div>
        <v-row dense align="center">
          <v-col cols="12" sm="6">
            <v-btn-toggle
              v-model="tipoDescuento"
              mandatory
              color="primary"
              variant="outlined"
              divided
              class="w-100"
            >
              <v-btn value="PORCENTAJE" class="flex-grow-1">Porcentaje</v-btn>
              <v-btn value="VALOR" class="flex-grow-1">Valor fijo</v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-if="tipoDescuento === 'PORCENTAJE'"
              v-model="porcentajeDescuento"
              label="Porcentaje de descuento"
              type="number"
              min="0"
              max="100"
              step="0.01"
              suffix="%"
              :rules="[reglas.requerido, reglas.porcentaje]"
              variant="outlined"
            />
            <v-text-field
              v-else
              v-model="valorDescuento"
              label="Valor del descuento"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              :rules="[reglas.requerido, reglas.montoObligatorio]"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <div class="text-subtitle-2 mt-2">Condiciones</div>
        <div class="text-caption text-medium-emphasis mb-2">
          Todas son opcionales: déjelas vacías si no aplican. Si llena varias, se deben cumplir todas.
        </div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="montoMinimoVenta"
              label="Monto mínimo de la venta"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              :rules="[reglas.montoOpcional]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="cantidadMinimaCompras"
              label="Cantidad mínima de compras del cliente"
              type="number"
              min="0"
              step="1"
              :rules="[reglas.enteroOpcional]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="montoMinimoAcumulado"
              label="Monto mínimo acumulado del cliente"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              :rules="[reglas.montoOpcional]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="topeDescuento"
              label="Tope de descuento"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              hint="Solo informativo: el sistema no lleva la cuenta de lo descontado."
              :rules="[reglas.montoOpcional]"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-select
          v-if="esEdicion"
          v-model="estado"
          :items="opcionesEstado"
          item-title="texto"
          item-value="valor"
          label="Estado"
          variant="outlined"
          class="mt-2 mb-2"
        />

        <div v-if="esEdicion && usuario" class="mb-4">
          <div class="text-caption text-medium-emphasis">
            Creado por: <strong>{{ usuario }}</strong>
          </div>
          <div class="text-caption text-medium-emphasis" style="font-size: 11px;">
            Fecha creación: {{ fechaCreacionFormateada }}
          </div>
        </div>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" type="submit">Confirmar</v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import promocionService from '@/services/promocionService'
import { useAuthStore } from '@/stores/auth'

const MONTO_MAXIMO = 9999999999.99
const CANTIDAD_MAXIMA = 4294967295

const vacio = (v) => v === null || v === undefined || String(v).trim() === ''

// Un opcional vacio (o 0) va como null: el backend lo toma como "sin esa condicion".
const numeroOpcional = (v) => {
  if (vacio(v)) return null
  const numero = Number(v)
  return numero === 0 ? null : numero
}

// Los campos numericos de v-text-field guardan texto; null del backend se muestra vacio.
const aCampo = (v) => (v === null || v === undefined ? '' : String(v))

export default {
  name: 'PromocionesForm',

  data() {
    return {
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      tipoDescuento: 'PORCENTAJE',
      porcentajeDescuento: '',
      valorDescuento: '',
      montoMinimoVenta: '',
      cantidadMinimaCompras: '',
      montoMinimoAcumulado: '',
      topeDescuento: '',
      estado: true,
      usuario: '',
      fechaCreacion: '',

      cargando: false,
      guardando: false,
      opcionesEstado: [
        { valor: true, texto: 'Activa' },
        { valor: false, texto: 'Inactiva' }
      ],
      reglas: {
        requerido: (v) => !vacio(v) || 'Campo obligatorio',
        fechaFin: (v) =>
          !v || !this.fechaInicio || v >= this.fechaInicio || 'No puede ser anterior a la fecha de inicio',
        porcentaje: (v) => {
          const numero = Number(v)
          return (Number.isFinite(numero) && numero > 0 && numero <= 100) || 'Debe ser mayor que 0 y máximo 100'
        },
        montoObligatorio: (v) => {
          const numero = Number(v)
          return (Number.isFinite(numero) && numero > 0 && numero <= MONTO_MAXIMO) || 'Debe ser mayor que 0'
        },
        montoOpcional: (v) => {
          if (vacio(v)) return true
          const numero = Number(v)
          return (Number.isFinite(numero) && numero >= 0 && numero <= MONTO_MAXIMO) || 'Valor inválido'
        },
        enteroOpcional: (v) => {
          if (vacio(v)) return true
          const numero = Number(v)
          return (Number.isInteger(numero) && numero >= 0 && numero <= CANTIDAD_MAXIMA) || 'Debe ser un número entero'
        }
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    // En edicion la empresa sale de la ruta, NO del store: si el usuario cambia el selector de
    // empresa de la barra superior con el registro abierto, el guardado iria contra la equivocada.
    idEmpresa() {
      if (this.esEdicion) {
        return Number(this.$route.params.EmpId)
      }
      return this.authStore.empresaSeleccionada
    },

    esEdicion() {
      return this.$route.name === 'PromocionesEditar'
    },

    idPromocion() {
      return Number(this.$route.params.PromoId)
    },

    fechaCreacionFormateada() {
      if (!this.fechaCreacion) return ''
      return new Date(this.fechaCreacion).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  created() {
    if (this.esEdicion) {
      this.cargarPromocion()
    }
  },

  methods: {
    async cargarPromocion() {
      this.cargando = true
      try {
        const { data } = await promocionService.getById({
          idEmpresa: this.idEmpresa,
          idPromocion: this.idPromocion
        })
        const promo = data.data
        this.nombre = promo.promoNombre || ''
        this.descripcion = promo.promoDescripcion || ''
        // Llegan 'aaaa-mm-dd' sin hora, justo lo que espera un input type="date".
        this.fechaInicio = String(promo.promoFechaInicio || '').slice(0, 10)
        this.fechaFin = String(promo.promoFechaFin || '').slice(0, 10)
        this.tipoDescuento = promo.promoValor !== null && promo.promoValor !== undefined ? 'VALOR' : 'PORCENTAJE'
        this.porcentajeDescuento = aCampo(promo.promoPorcentaje)
        this.valorDescuento = aCampo(promo.promoValor)
        this.montoMinimoVenta = aCampo(promo.promoMontoMinimoVenta)
        this.cantidadMinimaCompras = aCampo(promo.promoCantidadMinimaCompras)
        this.montoMinimoAcumulado = aCampo(promo.promoMontoMinimoAcumulado)
        this.topeDescuento = aCampo(promo.promoTope)
        // Estado llega como 1/0, no como booleano.
        this.estado = promo.promoEstado === 1
        this.usuario = promo.promoUsuario
        this.fechaCreacion = promo.promoFecCreacion
      } catch (error) {
        await Swal.fire('Error', this.mensajeError(error, 'No se pudo cargar la promoción'), 'error')
        this.cancelar()
      } finally {
        this.cargando = false
      }
    },

    // Editar REEMPLAZA todos los campos: se arma siempre el cuerpo completo. De los dos
    // descuentos va solo el elegido; el otro en null.
    armarCuerpo() {
      const esPorcentaje = this.tipoDescuento === 'PORCENTAJE'
      return {
        Nombre: this.nombre.trim(),
        Descripcion: this.descripcion.trim() || null,
        FechaInicio: this.fechaInicio,
        FechaFin: this.fechaFin,
        PorcentajeDescuento: esPorcentaje ? Number(this.porcentajeDescuento) : null,
        ValorDescuento: esPorcentaje ? null : Number(this.valorDescuento),
        MontoMinimoVenta: numeroOpcional(this.montoMinimoVenta),
        CantidadMinimaCompras: numeroOpcional(this.cantidadMinimaCompras),
        MontoMinimoAcumulado: numeroOpcional(this.montoMinimoAcumulado),
        TopeDescuento: numeroOpcional(this.topeDescuento)
      }
    },

    async confirmar() {
      if (this.guardando) return

      // validate() es async y devuelve { valid }, no un booleano.
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.guardando = true
      try {
        if (this.esEdicion) {
          const { data } = await promocionService.update({
            idEmpresa: this.idEmpresa,
            idPromocion: this.idPromocion,
            ...this.armarCuerpo(),
            Estado: this.estado
          })
          await Swal.fire('Éxito', data.msg || 'Promoción actualizada', 'success')
        } else {
          // Crear responde la promocion creada en data y no trae msg: el aviso es propio.
          await promocionService.create({
            idEmpresa: this.idEmpresa,
            ...this.armarCuerpo()
          })
          await Swal.fire('Éxito', 'Promoción creada', 'success')
        }
        this.$router.back()
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'Ocurrió un error al guardar la promoción'), 'error')
      } finally {
        this.guardando = false
      }
    },

    // Los 400 llegan como {msg} o como {errors:[{msg}]} (express-validator).
    mensajeError(error, alternativo) {
      const respuesta = error.response?.data
      return respuesta?.msg || respuesta?.errors?.[0]?.msg || alternativo
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
