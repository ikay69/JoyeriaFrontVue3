<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Estado de cuenta por cobrar</h1>

    <v-card elevation="1">
      <div class="tabla-scroll">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
               <th>Origen</th>
              <th>Nombre</th>
              <th>Monto original</th>
              <th>Monto pendiente</th>
              <th>Fecha inicio</th>
              <th>Fecha vencimiento</th>
              <th>Tipo origen</th>
              
              <th>Estado</th>
              <th>Motivo</th>
              <th>fecha actualizacion</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="registro in registros"
              :key="registro.id"
              :class="{ 'fila-vencida': estaVencida(registro) }"
            >
              <td>{{ registro.origenRegistro }}</td>
              <td>{{ registro.nombre }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.montoOriginal) }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.montoPendiente) }}</td>
              <td class="text-no-wrap">{{ formatearFecha(registro.fechaInicio) }}</td>
              <td class="text-no-wrap">{{ formatearFecha(registro.fechaVencimiento) }}</td>
              <td>{{ registro.tipoOrigen }}</td>
              <td>
                <v-chip :color="colorEstado(registro.estado)" size="small" variant="tonal">
                  {{ registro.estado }}
                </v-chip>
              </td>
              <td>{{ registro.motivo }}</td>
              <td class="text-no-wrap">{{ formatearFechaHora(registro.updatedAt) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'EstadoCuentaPorCobrar',

  data() {
    return {
      registros: [
        { id: 1, nombre: 'María Gómez', tipo: 'POR_COBRAR', montoOriginal: 1250000, montoPendiente: 450000, fechaInicio: '2026-09-01', fechaVencimiento: '2026-10-01', tipoOrigen: 'VENTA', origenRegistro: 'SISTEMA', estado: 'PARCIAL', motivo: 'Venta de anillo en cuotas', updatedAt: '2026-10-12T10:20:00' },
        { id: 2, nombre: 'Comercial La Esmeralda', tipo: 'POR_COBRAR', montoOriginal: 3820000, montoPendiente: 3820000, fechaInicio: '2026-09-05', fechaVencimiento: '2026-10-15', tipoOrigen: 'VENTA', origenRegistro: 'SISTEMA', estado: 'PENDIENTE', motivo: 'Factura de venta mayorista', updatedAt: '2026-09-05T15:30:00' },
        { id: 3, nombre: 'Saldo inicial - Carlos Ruiz', tipo: 'POR_COBRAR', montoOriginal: 760000, montoPendiente: 760000, fechaInicio: '2026-10-01', fechaVencimiento: '2026-11-01', tipoOrigen: 'SALDO_INICIAL', origenRegistro: 'MANUAL', estado: 'PENDIENTE', motivo: 'Saldo trasladado al sistema', updatedAt: '2026-10-01T08:15:00' },
        { id: 4, nombre: 'Laura Méndez', tipo: 'POR_COBRAR', montoOriginal: 980000, montoPendiente: 0, fechaInicio: '2026-09-03', fechaVencimiento: '2026-10-03', tipoOrigen: 'VENTA', origenRegistro: 'SISTEMA', estado: 'PAGADO', motivo: 'Venta de cadena de oro', updatedAt: '2026-10-02T16:40:00' },
        { id: 5, nombre: 'Joyería Horizonte', tipo: 'POR_COBRAR', montoOriginal: 2400000, montoPendiente: 1200000, fechaInicio: '2026-09-12', fechaVencimiento: '2026-10-18', tipoOrigen: 'VENTA', origenRegistro: 'SISTEMA', estado: 'PARCIAL', motivo: 'Venta de lote de accesorios', updatedAt: '2026-10-20T09:05:00' },
        { id: 6, nombre: 'Andrés Castillo', tipo: 'POR_COBRAR', montoOriginal: 530000, montoPendiente: 530000, fechaInicio: '2026-10-10', fechaVencimiento: '2026-10-28', tipoOrigen: 'VENTA', origenRegistro: 'SISTEMA', estado: 'PENDIENTE', motivo: 'Abono pendiente de compra', updatedAt: '2026-10-10T12:50:00' },
        { id: 7, nombre: 'Ajuste a favor - Diana López', tipo: 'POR_COBRAR', montoOriginal: 145000, montoPendiente: 0, fechaInicio: '2026-09-18', fechaVencimiento: '2026-10-10', tipoOrigen: 'AJUSTE', origenRegistro: 'MANUAL', estado: 'PAGADO', motivo: 'Corrección de saldo', updatedAt: '2026-10-09T14:35:00' },
        { id: 8, nombre: 'Pedro Salazar', tipo: 'POR_COBRAR', montoOriginal: 690000, montoPendiente: 0, fechaInicio: '2026-09-08', fechaVencimiento: '2026-10-08', tipoOrigen: 'VENTA', origenRegistro: 'SISTEMA', estado: 'ANULADO', motivo: 'Venta cancelada', updatedAt: '2026-09-10T11:10:00' },
        { id: 9, nombre: 'Saldo de inventario - Taller Norte', tipo: 'POR_COBRAR', montoOriginal: 1720000, montoPendiente: 1720000, fechaInicio: '2026-08-28', fechaVencimiento: '2026-09-28', tipoOrigen: 'INVENTARIO', origenRegistro: 'MANUAL', estado: 'PENDIENTE', motivo: 'Material entregado para reparación', updatedAt: '2026-08-28T13:25:00' },
        { id: 10, nombre: 'Inversiones Brillante', tipo: 'POR_COBRAR', montoOriginal: 4150000, montoPendiente: 2150000, fechaInicio: '2026-09-25', fechaVencimiento: '2026-10-22', tipoOrigen: 'APALANCAMIENTO', origenRegistro: 'MANUAL', estado: 'PARCIAL', motivo: 'Recuperación de capital financiado', updatedAt: '2026-10-21T17:00:00' }
      ]
    }
  },

  methods: {
    estaVencida(registro) {
      if (!['PENDIENTE', 'PARCIAL'].includes(registro.estado) || !registro.fechaVencimiento) return false
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const vencimiento = new Date(`${registro.fechaVencimiento}T00:00:00`)
      return !Number.isNaN(vencimiento.getTime()) && hoy > vencimiento
    },

    colorEstado(estado) {
      return {
        PENDIENTE: 'warning',
        PARCIAL: 'info',
        PAGADO: 'success',
        ANULADO: 'error'
      }[estado] || 'default'
    },

    formatearMoneda(valor) {
      return `$ ${Number(valor || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
      return `${dia}/${mes}/${anio}`
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>

<style scoped>
.tabla-scroll {
  overflow-x: auto;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-vencida > td) {
  background-color: #ffebee;
  border-top: 1px solid #ef9a9a;
  border-bottom: 1px solid #ef9a9a;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-vencida > td:first-child) {
  border-left: 4px solid #d32f2f;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-vencida:hover > td) {
  background-color: #ffebee;
}
</style>
