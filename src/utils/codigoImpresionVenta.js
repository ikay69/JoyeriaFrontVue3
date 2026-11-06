// Numero de factura de una venta: fecha de la venta AAAAMMDD + id de la venta con 4 digitos
// (1 -> 0001, 23 -> 0023). Si el id pasa de 9999 se muestra completo, sin recortar.
export function codigoImpresionVenta(venta) {
  let fecha = venta?.ventaFecha ? new Date(venta.ventaFecha) : new Date()
  if (Number.isNaN(fecha.getTime())) fecha = new Date()

  // Fecha local: ventaFecha llega en UTC y cerca de la medianoche el dia puede cambiar.
  const anio = String(fecha.getFullYear())
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  const id = String(venta?.ventaId ?? '').trim().padStart(4, '0')
  return `${anio}${mes}${dia}${id}`
}
