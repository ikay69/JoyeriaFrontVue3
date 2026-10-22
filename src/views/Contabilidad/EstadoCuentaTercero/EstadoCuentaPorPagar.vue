<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Estado de cuenta por pagar</h1>

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
  name: 'EstadoCuentaPorPagar',

  data() {
    return {
      registros: [
        { id: 1, nombre: 'Compra de oro - Joyería Central', tipo: 'POR_PAGAR', montoOriginal: 4850000, montoPendiente: 2150000, fechaInicio: '2026-09-02', fechaVencimiento: '2026-10-05', tipoOrigen: 'COMPRA', origenRegistro: 'SISTEMA', estado: 'PARCIAL', motivo: 'Factura de compra de oro', updatedAt: '2026-10-10T09:30:00' },
        { id: 2, nombre: 'Insumos de taller - Metales del Sur', tipo: 'POR_PAGAR', montoOriginal: 1280000, montoPendiente: 1280000, fechaInicio: '2026-09-08', fechaVencimiento: '2026-10-12', tipoOrigen: 'INVENTARIO', origenRegistro: 'SISTEMA', estado: 'PENDIENTE', motivo: 'Material para producción', updatedAt: '2026-09-08T14:15:00' },
        { id: 3, nombre: 'Servicio de mantenimiento', tipo: 'POR_PAGAR', montoOriginal: 620000, montoPendiente: 0, fechaInicio: '2026-09-10', fechaVencimiento: '2026-10-01', tipoOrigen: 'AJUSTE', origenRegistro: 'MANUAL', estado: 'PAGADO', motivo: 'Mantenimiento de equipos', updatedAt: '2026-10-02T11:20:00' },
        { id: 4, nombre: 'Saldo inicial - Proveedor Andino', tipo: 'POR_PAGAR', montoOriginal: 3100000, montoPendiente: 3100000, fechaInicio: '2026-10-01', fechaVencimiento: '2026-11-15', tipoOrigen: 'SALDO_INICIAL', origenRegistro: 'MANUAL', estado: 'PENDIENTE', motivo: 'Saldo trasladado al sistema', updatedAt: '2026-10-01T08:00:00' },
        { id: 5, nombre: 'Arriendo local comercial', tipo: 'POR_PAGAR', montoOriginal: 2200000, montoPendiente: 1100000, fechaInicio: '2026-09-20', fechaVencimiento: '2026-10-20', tipoOrigen: 'AJUSTE', origenRegistro: 'MANUAL', estado: 'PARCIAL', motivo: 'Canon mensual del local', updatedAt: '2026-10-21T10:10:00' },
        { id: 6, nombre: 'Crédito para capital de trabajo', tipo: 'POR_PAGAR', montoOriginal: 8000000, montoPendiente: 8000000, fechaInicio: '2026-10-10', fechaVencimiento: '2026-10-30', tipoOrigen: 'APALANCAMIENTO', origenRegistro: 'MANUAL', estado: 'PENDIENTE', motivo: 'Cuota de financiación', updatedAt: '2026-10-10T16:45:00' },
        { id: 7, nombre: 'Compra de herramientas', tipo: 'POR_PAGAR', montoOriginal: 945000, montoPendiente: 0, fechaInicio: '2026-09-03', fechaVencimiento: '2026-10-10', tipoOrigen: 'COMPRA', origenRegistro: 'SISTEMA', estado: 'ANULADO', motivo: 'Documento duplicado', updatedAt: '2026-10-04T13:05:00' },
        { id: 8, nombre: 'Material de empaque', tipo: 'POR_PAGAR', montoOriginal: 375000, montoPendiente: 375000, fechaInicio: '2026-08-25', fechaVencimiento: '2026-09-30', tipoOrigen: 'INVENTARIO', origenRegistro: 'SISTEMA', estado: 'PENDIENTE', motivo: 'Compra de empaques', updatedAt: '2026-08-25T12:00:00' },
        { id: 9, nombre: 'Ajuste de saldo con proveedor', tipo: 'POR_PAGAR', montoOriginal: 180000, montoPendiente: 0, fechaInicio: '2026-09-15', fechaVencimiento: '2026-10-18', tipoOrigen: 'AJUSTE', origenRegistro: 'MANUAL', estado: 'PAGADO', motivo: 'Conciliación de cuenta', updatedAt: '2026-10-18T17:25:00' },
        { id: 10, nombre: 'Compra de vitrinas', tipo: 'POR_PAGAR', montoOriginal: 2650000, montoPendiente: 900000, fechaInicio: '2026-10-03', fechaVencimiento: '2026-11-03', tipoOrigen: 'COMPRA', origenRegistro: 'SISTEMA', estado: 'PARCIAL', motivo: 'Mobiliario para exhibición', updatedAt: '2026-10-19T09:40:00' }
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
