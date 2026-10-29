<template>
  <v-dialog v-model="dialogVisible" max-width="600" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Producto nuevo</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-form ref="form" @submit.prevent="guardar">
          <v-text-field
            v-model="nombre"
            label="Nombre"
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
            <v-col cols="12" sm="6">
              <v-select
                v-model="idTipoProducto"
                :items="tiposProducto"
                item-title="tipProNombre"
                item-value="tipProId"
                label="Tipo de producto"
                :rules="[reglas.requerido]"
                :loading="cargandoListas"
                variant="outlined"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="idCategoria"
                :items="categorias"
                item-title="Nombre"
                item-value="Id"
                label="Categoría"
                :loading="cargandoListas"
                variant="outlined"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="tipoSeguimiento"
                :items="opcionesTipoSeguimiento"
                item-title="texto"
                item-value="valor"
                label="Tipo de seguimiento"
                :rules="[reglas.requerido]"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="outlined" @click="cerrar">Cancelar</v-btn>
            <v-btn color="primary" prepend-icon="mdi-content-save" :loading="guardando" type="submit">
              Guardar
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import productoService from '@/services/productoService'
import tipoProductoService from '@/services/tipoProductoService'
import categoriaService from '@/services/categoriaService'

const SIN_CATEGORIA = 'SIN_CATEGORIA'

// Alta de un producto como ventanilla flotante, para abrirla desde cualquier pantalla. A
// diferencia de ArticuloNuevoDialog, que solo devuelve datos, este SI crea el producto en el
// backend: un producto es un registro maestro, no una linea de un documento.
// Uso: <ProductoNuevoDialog v-model="dialog" :id-empresa="idEmpresa" @creado="..." />
// Crear un producto es solo de ADMINISTRADOR (api-productos.txt).
export default {
  name: 'ProductoNuevoDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], required: true }
  },

  // `creado` lleva { proId, proNombre, TipoProductoNombre, CategoriaNombre }, la misma forma que
  // una fila de getActivas, o null si el producto se creo pero no se pudo localizar.
  emits: ['update:modelValue', 'creado'],

  data() {
    return {
      nombre: '',
      descripcion: '',
      idTipoProducto: null,
      idCategoria: SIN_CATEGORIA,
      tipoSeguimiento: 'CANTIDAD',

      tiposProducto: [],
      categorias: [{ Id: SIN_CATEGORIA, Nombre: 'Sin Categoría' }],

      cargandoListas: false,
      guardando: false,
      opcionesTipoSeguimiento: [
        { valor: 'CANTIDAD', texto: 'Cantidad' },
        { valor: 'UNIDAD', texto: 'Unidad' }
      ],
      reglas: {
        requerido: (v) => !!v || 'Campo obligatorio'
      }
    }
  },

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

  watch: {
    modelValue(visible) {
      if (!visible) return
      this.limpiar()
      this.cargarListas()
    },
    // La ventanilla vive en una pantalla persistente: las listas son de la empresa anterior.
    idEmpresa() {
      if (this.modelValue) {
        this.limpiar()
        this.cargarListas()
      }
    }
  },

  methods: {
    limpiar() {
      this.nombre = ''
      this.descripcion = ''
      this.idTipoProducto = null
      this.idCategoria = SIN_CATEGORIA
      this.tipoSeguimiento = 'CANTIDAD'
      this.$refs.form?.resetValidation()
    },

    async cargarListas() {
      this.cargandoListas = true
      try {
        const [resTipos, resCategorias] = await Promise.all([
          tipoProductoService.getActivas({ idEmpresa: this.idEmpresa }),
          categoriaService.getActivas({ idEmpresa: this.idEmpresa })
        ])
        this.tiposProducto = resTipos.data.data || []
        this.categorias = [
          { Id: SIN_CATEGORIA, Nombre: 'Sin Categoría' },
          ...(resCategorias.data.data || [])
        ]
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron cargar las listas de tipo de producto o categoría'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoListas = false
      }
    },

    async guardar() {
      if (this.guardando) return

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const payload = {
        idEmpresa: this.idEmpresa,
        Nombre: this.nombre.trim(),
        Descripcion: this.descripcion.trim() || null,
        idTipoProducto: this.idTipoProducto,
        // null y no 0: el 0 se busca como id y da "Categoria invalida".
        idCategoria: this.idCategoria === SIN_CATEGORIA ? null : this.idCategoria,
        TipoSeguimiento: this.tipoSeguimiento
      }

      this.guardando = true
      try {
        const { data } = await productoService.create(payload)
        // Se cierra antes de avisar: esperar el aviso (y la busqueda del creado) con la
        // ventanilla abierta la deja a la vista aunque el producto ya se guardo.
        this.cerrar()
        Swal.fire('Éxito', data.msg || 'Producto creado', 'success')
        this.$emit('creado', await this.buscarCreado(payload.Nombre))
      } catch (error) {
        // Los campos obligatorios y los ids mal formados llegan como errors[0].msg
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'Ocurrió un error al guardar el producto'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    // Crear no devuelve el id. El nombre es unico por empresa (y queda en mayusculas), asi que se
    // busca por nombre y se compara exacto: el filtro es un LIKE y puede traer otros parecidos.
    // Si la busqueda falla el producto ya existe, asi que no se trata como error: se avisa con null.
    async buscarCreado(nombre) {
      try {
        const { data } = await productoService.getActivas({
          idEmpresa: this.idEmpresa,
          campoOrdenar: 2,
          orden: 'DESC',
          pagina: 1,
          textoFiltro: nombre
        })
        const encontrado = (data.data || []).find((p) => p.proNombre === nombre.toUpperCase())
        return encontrado
          ? {
              proId: encontrado.proId,
              proNombre: encontrado.proNombre,
              TipoProductoNombre: encontrado.TipoProductoNombre,
              CategoriaNombre: encontrado.CategoriaNombre
            }
          : null
      } catch {
        return null
      }
    },

    cerrar() {
      this.dialogVisible = false
    }
  }
}
</script>
