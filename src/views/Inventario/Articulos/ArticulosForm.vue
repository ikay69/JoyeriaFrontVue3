<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">{{ esEdicion ? 'Editar artículo' : 'Nuevo artículo' }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Complete los datos del producto para registrarlo en el sistema.
        </p>
      </div>
    </div>

    <v-card class="pa-6 mt-4" max-width="820" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <div class="mb-1 text-subtitle-2">Producto</div>
        <div class="d-flex ga-2 mb-4">
          <v-btn icon="mdi-arrow-right" variant="tonal" @click="abrirDialogProducto" />
          <v-text-field
            :model-value="productoSeleccionado ? productoSeleccionado.proNombre : ''"
            readonly
            placeholder="Seleccione un producto"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              label="Tipo de producto"
              :model-value="productoSeleccionado ? productoSeleccionado.TipoProductoNombre : ''"
              readonly
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Categoría"
              :model-value="productoSeleccionado ? productoSeleccionado.CategoriaNombre : ''"
              readonly
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="nombre"
          label="Nombre artículo"
          maxlength="150"
          counter="150"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea
          v-model="descripcion"
          label="Descripción"
          maxlength="300"
          counter="300"
          rows="3"
          variant="outlined"
          class="mb-2"
        />

        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="precioVentaUnitario"
              label="Precio de venta unitario"
              type="number"
              step="0.01"
              min="0"
              :rules="[reglas.requerido]"
              variant="outlined"
              class="mb-2"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="cantidadGramos"
              label="Cantidad en gramos (opcional)"
              type="number"
              step="0.0001"
              min="0"
              suffix="g"
              :rules="[reglas.gramos]"
              variant="outlined"
              class="mb-2"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="vender"
              :items="opcionesVender"
              item-title="texto"
              item-value="valor"
              label="Para vender"
              variant="outlined"
              class="mb-2"
            />
          </v-col>
        </v-row>

        <v-select v-if="esEdicion"
          v-model="estado"
          :items="opcionesEstado"
          item-title="texto"
          item-value="valor"
          label="Estado"
          variant="outlined"
          class="mb-4"
        />

        <div class="d-flex align-center justify-space-between mt-4 mb-2">
          <span class="text-subtitle-2">Propiedades</span>
        </div>
        <v-table density="compact" class="mb-2">
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Tipo valor</th>
              <th>Valor</th>
              <th>Unidad de medida</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, i) in propiedades" :key="i">
              <td style="min-width: 180px">
                <v-select
                  v-model="fila.idPropiedad"
                  :items="propiedadesDisponibles"
                  item-title="Nombre"
                  item-value="Id"
                  placeholder="Seleccione una propiedad"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="onCambioPropiedad(fila)"
                />
              </td>
              <td style="min-width: 130px">
                <v-text-field
                  :model-value="fila.tipoDato"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </td>
              <td style="min-width: 140px">
                <v-text-field
                  v-model="fila.valor"
                  placeholder="Ingrese el valor"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </td>
              <td style="min-width: 160px">
                <v-select
                  v-model="fila.idUnidadMedida"
                  :items="unidadesMedida"
                  item-title="uniMedNombre"
                  item-value="uniMedId"
                  placeholder="--"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :loading="cargandoListas"
                />
              </td>
              <td class="text-center">
                <v-btn icon="mdi-delete" size="small" variant="text" @click="quitarPropiedad(i)" />
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-btn variant="outlined" prepend-icon="mdi-plus" @click="agregarPropiedad" class="mb-4">
          Agregar
        </v-btn>

        <v-table v-if="esEdicion && existencias.length" density="compact" class="mb-4">
          <caption class="text-subtitle-2 text-start pa-2">Existencias</caption>
          <thead>
            <tr>
              <th>Bodega</th>
              <th>Bolsa</th>
              <th>Propietario</th>
              <th>Cantidad</th>
              <th>Costo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ex, i) in existencias" :key="i">
              <td>{{ ex.existBodegaNombre }}</td>
              <td>{{ ex.existBolsa }}</td>
              <td>{{ ex.existPropietarioNombre || '-' }}</td>
              <td>{{ ex.existCantidad }}</td>
              <td>{{ ex.existCosto }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-content-save" :loading="guardando" type="submit">Guardar</v-btn>
        </div>
      </v-form>
    </v-card>

    <ProductosSeleccionar
      v-model="dialogProducto"
      :id-empresa="idEmpresa"
      @seleccionar="seleccionarProducto"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import articuloService from '@/services/articuloService'
import propiedadService from '@/services/propiedadService'
import unidadMedidaService from '@/services/unidadMedidaService'
import ProductosSeleccionar from '@/views/Inventario/Productos/ProductosSeleccionar.vue'
import { useAuthStore } from '@/stores/auth'

const UNIDAD_MEDIDA_SIN_REGISTRO = 'SIN_UNIDAD_MEDIDA'

export default {
  name: 'ArticulosForm',

  components: { ProductosSeleccionar },

  data() {
    return {
      productoSeleccionado: null,
      dialogProducto: false,

      nombre: '',
      descripcion: '',
      precioVentaUnitario: 0,
      // '' = sin dato; se envia null
      cantidadGramos: '',
      vender: true,
      estado: true,
      usuario: '',
      fechaCreacion: '',
      sku: '',

      propiedades: [],
      propiedadesDisponibles: [],
      unidadesMedida: [],
      existencias: [],

      cargando: false,
      cargandoListas: false,
      guardando: false,

      opcionesVender: [
        { valor: true, texto: 'Para vender' },
        { valor: false, texto: 'No vender' }
      ],
      opcionesEstado: [
        { valor: true, texto: 'Activo' },
        { valor: false, texto: 'Inactivo' }
      ],

      reglas: {
        requerido: (v) => (v !== null && v !== undefined && v !== '') || 'Campo obligatorio',
        gramos: (v) => {
          if (v === null || v === undefined || String(v).trim() === '') return true
          const numero = Number(v)
          if (!Number.isFinite(numero) || numero < 0) return 'Debe ser un número mayor o igual a cero'
          if (numero >= 10000000000) return 'La cantidad de gramos supera el máximo permitido'
          return true
        }
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    idEmpresa() {
      if (this.esEdicion) {
        return Number(this.$route.params.EmpId)
      } else {
        return this.authStore.empresaSeleccionada
      }
    },

    esEdicion() {
      return this.$route.name === 'ArticulosEditar'
    },

    idArticulo() {
      return Number(this.$route.params.ArtId)
    }
  },

  async created() {
    await this.cargarListas()
    if (this.esEdicion) {
      await this.cargarArticulo()
    }
  },

  methods: {
    async cargarListas() {
      this.cargandoListas = true
      try {
        const [resPropiedades, resUnidades] = await Promise.all([
          propiedadService.getActivas({ idEmpresa: this.idEmpresa }),
          unidadMedidaService.getActivas({ idEmpresa: this.idEmpresa })
        ])
        this.propiedadesDisponibles = resPropiedades.data.data || []
        this.unidadesMedida = [
          { uniMedId: UNIDAD_MEDIDA_SIN_REGISTRO, uniMedNombre: '--' },
          ...(resUnidades.data.data || [])
        ]
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron cargar las listas de propiedades y unidades de medida'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoListas = false
      }
    },

    abrirDialogProducto() {
      this.dialogProducto = true
    },

    seleccionarProducto(producto) {
      this.productoSeleccionado = producto
    },

    agregarPropiedad() {
      this.propiedades.push({
        idPropiedad: null,
        tipoDato: '',
        valor: '',
        idUnidadMedida: UNIDAD_MEDIDA_SIN_REGISTRO
      })
    },

    quitarPropiedad(index) {
      this.propiedades.splice(index, 1)
    },

    onCambioPropiedad(fila) {
      const encontrada = this.propiedadesDisponibles.find((p) => p.Id === fila.idPropiedad)
      fila.tipoDato = encontrada ? encontrada.TipoDato : ''
    },

    async cargarArticulo() {
      this.cargando = true
      try {
        const { data } = await articuloService.getById({
          idEmpresa: this.idEmpresa,
          idArticulo: this.idArticulo
        })
        const art = data.data
        this.sku = art.artSKU
        this.nombre = art.artNombre
        this.descripcion = art.artDescripcion
        this.precioVentaUnitario = Number(art.artPrecio)
        // llega como cadena con 4 decimales ("5.2370") o null
        this.cantidadGramos = art.artCantidadGramos === null || art.artCantidadGramos === undefined
          ? ''
          : String(Number(art.artCantidadGramos))
        this.vender = art.artVender === 1
        this.estado = art.artEstado === 1
        this.usuario = art.artUsuario
        this.fechaCreacion = art.artFecCreacion
        this.existencias = art.existencias || []

        this.productoSeleccionado = {
          proId: art.artProductoId,
          proNombre: art.artProductoNombre,
          TipoProductoNombre: art.artTipoProducto,
          CategoriaNombre: art.artCategoria,
          // El backend no devuelve la unidad de medida al consultar por id,
          // este campo queda vacío en edición (pendiente de confirmar).
          UnidadMedidaNombre: ''
        }

        this.propiedades = (art.propiedades || []).map((p) => ({
          idPropiedad: p.propId,
          tipoDato: p.propTipoDato,
          valor: p.propValor,
          idUnidadMedida: p.propUnidadMedidaId ?? p.idUnidadMedida ?? UNIDAD_MEDIDA_SIN_REGISTRO
        }))

        this.propiedades.forEach((fila, index) => {
          if (fila.idUnidadMedida === UNIDAD_MEDIDA_SIN_REGISTRO) return
          const existe = this.unidadesMedida.some((unidad) => unidad.uniMedId === fila.idUnidadMedida)
          if (!existe) {
            const original = (art.propiedades || [])[index]
            this.unidadesMedida.push({
              uniMedId: fila.idUnidadMedida,
              uniMedNombre: original?.propUnidadMedidaNombre || original?.unidadMedidaNombre || ''
            })
          }
        })

        // Si alguna propiedad del artículo ya no está activa, la agregamos
        // igual a la lista disponible para que el combo la muestre bien.
        this.propiedades.forEach((fila) => {
          const existe = this.propiedadesDisponibles.some((p) => p.Id === fila.idPropiedad)
          if (!existe) {
            const original = (art.propiedades || []).find((p) => p.propId === fila.idPropiedad)
            this.propiedadesDisponibles.push({
              Id: fila.idPropiedad,
              Nombre: original ? original.propNombre : '',
              TipoDato: fila.tipoDato
            })
          }
        })
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el artículo'
        await Swal.fire('Error', mensaje, 'error')
        this.cancelar()
      } finally {
        this.cargando = false
      }
    },

    async confirmar() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      if (!this.productoSeleccionado) {
        Swal.fire('Atención', 'Seleccione un producto', 'warning')
        return
      }

      const propiedadesEnviar = this.propiedades
        .filter((fila) => fila.idPropiedad && fila.valor !== '')
        .map((fila) => ({
          idPropiedad: fila.idPropiedad,
          idUnidadMedida: fila.idUnidadMedida === UNIDAD_MEDIDA_SIN_REGISTRO ? null : fila.idUnidadMedida,
          Valor: fila.valor
        }))

      // El update es un reemplazo completo: si no se manda, el peso se borra
      const cantidadGramos = String(this.cantidadGramos ?? '').trim() === ''
        ? null
        : Math.round((Number(this.cantidadGramos) + Number.EPSILON) * 10000) / 10000

      this.guardando = true
      try {
        if (this.esEdicion) {
          const { data } = await articuloService.update({
            idEmpresa: this.idEmpresa,
            idArticulo: this.idArticulo,
            idProducto: this.productoSeleccionado.proId,
            Nombre: this.nombre,
            Descripcion: this.descripcion,
            PrecioVentaUnitario: this.precioVentaUnitario,
            CantidadGramos: cantidadGramos,
            Vender: this.vender,
            Estado: this.estado,
            Propiedades: propiedadesEnviar
          })
          await Swal.fire('Éxito', data.msg || 'Artículo actualizado', 'success')
        } else {
          const { data } = await articuloService.create({
            idEmpresa: this.idEmpresa,
            idProducto: this.productoSeleccionado.proId,
            Nombre: this.nombre,
            Descripcion: this.descripcion,
            PrecioVentaUnitario: this.precioVentaUnitario,
            CantidadGramos: cantidadGramos,
            Vender: this.vender,
            Propiedades: propiedadesEnviar
          })
          await Swal.fire('Éxito', data.msg || 'Artículo creado', 'success')
        }
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar el artículo'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
