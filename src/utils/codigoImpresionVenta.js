// Codigo que identifica una impresion de venta: fecha de la venta AAMMDD + 4 digitos al azar.
// Se usa en lugar del id de la venta. Es DISTINTO en cada impresion, asi que debe generarse una
// sola vez por impresion y pasarse a quien dibuja y a quien nombra el archivo.
export function codigoImpresionVenta(venta) {
  let fecha = venta?.ventaFecha ? new Date(venta.ventaFecha) : new Date()
  if (Number.isNaN(fecha.getTime())) fecha = new Date()

  // Fecha local: ventaFecha llega en UTC y cerca de la medianoche el dia puede cambiar.
  const anio = String(fecha.getFullYear()).slice(-2)
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  const aleatorio = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${anio}${mes}${dia}${aleatorio}`
}
