<template>
  <v-dialog v-model="dialogVisible" max-width="1200" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar artículo en existencia</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <!-- Mismos filtros que Existencias.vue: texto (nombre o SKU), bodega y bolsa. -->
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filtros.textoFiltro"
              label="Buscar (nombre o SKU)"
              maxlength="150"
              clearable
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="consultar"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <!-- Con idBodega desde quien invoca, la bodega queda fija: no se puede elegir de otra. -->
            <v-select
              v-model="filtros.idBodega"
              :items="opcionesBodega"
              item-title="Nombre"
              item-value="Id"
              label="Bodega"
              :disabled="bodegaFija"
              :loading="cargandoBodegas"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-select
              v-model="filtros.BolsaEstado"
              :items="opcionesBolsaEstado"
              item-title="texto"
              item-value="valor"
              label="Existencia"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn color="primary" variant="tonal" block @click="consultar">
              Buscar
            </v-btn>
          </v-col>
        </v-row>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th>Existencia</th>
                <th>SKU</th>
                <th style="min-width: 22ch;">Nombre</th>
                <th class="text-end" title="Gramos de una unidad">Cant. gramos</th>
                <th>Propiedades</th>
                <th class="text-end">Unidades</th>
                <th class="text-end">Costo unitario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="8" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!existencias.length">
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  No hay registros para mostrar
                </td>
              </tr>
              <tr v-for="ex in existencias" :key="ex.existId">
                <td class="text-center">
                  <!-- Una bolsa en cero puede seguir listada hasta que se eliminen las existencias en cero. -->
                  <v-btn
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="small"
                    variant="text"
                    :disabled="!(Number(ex.existCantidad) > 0)"
                    title="Seleccionar esta existencia"
                    @click="seleccionar(ex)"
                  />
                </td>
                <td>
                  {{ textoBolsa(ex.existBolsa) }}
                  <div v-if="ex.existPropietarioNombre" class="text-caption text-medium-emphasis">
                    {{ ex.existPropietarioNombre }}
                  </div>
                </td>
                <td>{{ ex.existSKU || '-' }}</td>
                <td>{{ ex.existArticuloNombre || '-' }}</td>
                <td class="text-end">{{ formatearCantidad(ex.existCantGramos) }}</td>
                <td>{{ ex.existPropiedades || '-' }}</td>
                <td class="text-end">{{ formatearCantidad(ex.existCantidad) }}</td>
                <td class="text-end">
                  <!-- null a proposito desde el backend: la bolsa no lleva costo -->
                  <span v-if="ex.existCosto === null" class="text-medium-emphasis">Sin costo</span>
                  <span v-else>{{ formatearMoneda(ex.existCosto) }}</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">
            Anterior
          </v-btn>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">
            Siguiente
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import existenciaService from '@/services/existenciaService'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'ArticuloExistencia',

  props: {
    // v-model: controla si el dialogo esta visible
    modelValue: { type: Boolean, default: false },
    // la pantalla que lo invoca SIEMPRE debe pasar la empresa
    idEmpresa: { type: [Number, String], required: true },
    // null = el usuario elige la bodega (o Todas); numero = bodega fija.
    idBodega: { type: [Number, String], default: null },
    // Bolsa con la que abre el filtro; '' = Todas. Se puede cambiar dentro del dialogo.
    bolsaEstado: { type: String, default: '' }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    return {
      cargando: false,
      cargandoBodegas: false,
      bodegas: [],
      existencias: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        idBodega: 0,
        BolsaEstado: ''
      },
      opcionesBolsaEstado: [
        { valor: '', texto: 'Todas' },
        { valor: 'DISPONIBLE', texto: 'Disponible' },
        { valor: 'RESERVADO', texto: 'Reservado' },
        { valor: 'PRESTADO_A_TALLER', texto: 'Prestado a taller' },
        { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller' },
        { valor: 'EN_GARANTIA_EMPENO', texto: 'En garantía/empeño' },
        { valor: 'EN_REPARACION', texto: 'En reparación' }
      ]
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
    },
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    },
    bodegaFija() {
      const bodega = Number(this.idBodega)
      return Number.isInteger(bodega) && bodega > 0
    },
    opcionesBodega() {
      return [{ Id: 0, Nombre: 'Todas' }, ...this.bodegas]
    }
  },

  watch: {
    // Cada vez que se abre toma la bodega y la bolsa de quien lo invoca y consulta.
    modelValue(visible) {
      if (!visible) return
      this.filtros.idBodega = this.bodegaFija ? Number(this.idBodega) : 0
      this.filtros.BolsaEstado = this.bolsaEstado || ''
      this.existencias = []
      this.cantData = 0
      this.cargarBodegas()
      this.consultar()
    }
  },

  methods: {
    async cargarBodegas() {
      if (!this.idEmpresa) return
      this.cargandoBodegas = true
      try {
        this.bodegas = await useCatalogosStore().getBodegas(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoBodegas = false
      }
    },

    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'No se indicó la empresa para buscar existencias', 'warning')
        return
      }

      this.cargando = true
      try {
        // La misma ruta de Existencias.vue: orden fijo (lo mas reciente primero), 50 por pagina.
        const { data } = await existenciaService.getExistencias({
          idEmpresa: Number(this.idEmpresa),
          pagina,
          textoFiltro: (this.filtros.textoFiltro || '').trim(),
          BolsaEstado: this.filtros.BolsaEstado || '',
          idBodega: Number(this.filtros.idBodega) || 0
        })
        this.existencias = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudo consultar las existencias'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    seleccionar(ex) {
      // se devuelve la fila de existencia completa (bolsa, propietario, cantidad y costo)
      this.$emit('seleccionar', { ...ex })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    textoBolsa(valor) {
      return this.opcionesBolsaEstado.find((o) => o.valor === valor)?.texto || valor || '-'
    },

    // existCosto llega como CADENA ("450000.00") o null
    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    // existCantidad y existCantGramos llegan como CADENA con 4 decimales ("3.0000")
    formatearCantidad(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })
    }
  }
}
</script>
