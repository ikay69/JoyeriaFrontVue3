import { jsPDF } from 'jspdf'

const dato = (valor, alternativo = '-') => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return alternativo
  return String(valor)
}

// pagoMonto llega como cadena ("150000.00"), se convierte antes de formatear
const formatearNumero = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '0'
  return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })
}

const formatearFechaHora = (valor) => {
  const fecha = valor ? new Date(valor) : new Date()
  if (Number.isNaN(fecha.getTime())) return '-'
  const hora = fecha.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  return `${fecha.toLocaleDateString('es-CO')} ${hora}`
}

const codigoPago = (pago) => {
  const anio = String(pago.pagoFecha || new Date().getFullYear()).slice(0, 4)
  return `P-${anio}-${String(pago.pagoId ?? '').padStart(4, '0')}`
}

const conceptoPago = (pago) => ({
  ABONO_VENTA: `Abono a la venta #${dato(pago.pagoOrigenId)}`,
  CUOTA_VENTA: `Cuota de la venta #${dato(pago.pagoOrigenId)}`
}[pago.pagoTipoOrigen] || 'Pago')

const metodoPago = (metodo) => ({
  EFECTIVO: 'Efectivo',
  TRANSACCION: 'Transacción'
}[metodo] || dato(metodo))

const estaAnulado = (pago) =>
  pago.pagoEstado === false || pago.pagoEstado === 0 || pago.pagoEstado === '0'

function dibujarContenidoTirillaPago(doc, { pago, empresa, x, ancho, inicioY }) {
  const fuente = 8.4
  const fuentePequena = 7
  const anchoInterior = ancho - 6
  const xInterior = x + 3
  const altoLinea = (tamano) => Math.max(2.1, tamano * 0.46)
  let y = inicioY

  const dibujarRegla = () => {
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.15)
    doc.line(xInterior, y, xInterior + anchoInterior, y)
    y += 3.2
  }

  const texto = (contenido, {
    tamano = fuente,
    estilo = 'normal',
    alineacion = 'left',
    color = [25, 25, 25],
    espacioDespues = 0
  } = {}) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    doc.setTextColor(...color)
    const posicionX = alineacion === 'center' ? x + ancho / 2 : xInterior
    doc.splitTextToSize(String(contenido ?? ''), anchoInterior).forEach((linea) => {
      doc.text(linea, posicionX, y, { align: alineacion })
      y += altoLinea(tamano)
    })
    y += espacioDespues
  }

  const centrado = (contenido, tamano = fuente, estilo = 'normal', opciones = {}) =>
    texto(contenido, { tamano, estilo, alineacion: 'center', ...opciones })

  const filaValor = (etiqueta, valor, { tamano = fuente, estilo = 'normal' } = {}) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    doc.setTextColor(25, 25, 25)
    doc.text(etiqueta, xInterior, y)
    doc.text(String(valor), xInterior + anchoInterior, y, { align: 'right' })
    y += altoLinea(tamano) + 0.5
  }

  const tipoNumeroEmpresa = [empresa?.TipoDocumento, empresa?.NumeroDocumento]
    .filter(Boolean)
    .join(' - ')
  const telefono = [empresa?.Celular, empresa?.Telefono].filter(Boolean).join(' / ')
  const documentoTercero = [pago.terceroTipoDocumento, pago.terceroNumeroDocumento]
    .filter(Boolean)
    .join(' ')

  centrado(dato(empresa?.Nombre, 'NOMBRE DE LA EMPRESA'), fuente * 1.12, 'bold')
  if (tipoNumeroEmpresa) centrado(tipoNumeroEmpresa, fuentePequena)
  if (empresa?.Direccion) centrado(`Dirección: ${empresa.Direccion}`, fuentePequena)
  if (telefono) centrado(`Teléfono: ${telefono}`, fuentePequena)
  dibujarRegla()

  centrado('RECIBO DE PAGO', fuente, 'bold', { espacioDespues: 0.5 })
  texto(`CÓDIGO PAGO: ${codigoPago(pago)}`, { estilo: 'bold', espacioDespues: 0.5 })
  texto(`FECHA PAGO: ${formatearFechaHora(pago.pagoFecha)}`, { tamano: fuentePequena })
  texto(`FECHA GENERACIÓN: ${formatearFechaHora()}`, { tamano: fuentePequena })
  dibujarRegla()

  texto(`CLIENTE: ${dato(pago.terceroNombreCompleto)}`, { estilo: 'bold' })
  texto(`Tipo documento: ${dato(documentoTercero)}`, { tamano: fuentePequena })
  dibujarRegla()

  texto(`CONCEPTO: ${conceptoPago(pago)}`, { estilo: 'bold', espacioDespues: 0.5 })
  if (pago.pagoObservacion) {
    texto(`Observaciones: ${pago.pagoObservacion}`, { tamano: fuentePequena })
  }
  dibujarRegla()

  filaValor('MÉTODO DE PAGO:', metodoPago(pago.pagoMetodoPago))
  filaValor('VALOR PAGADO:', formatearNumero(pago.pagoMonto), { estilo: 'bold' })
  dibujarRegla()

  texto(`USUARIO: ${dato(pago.pagoUsuario)}`, { tamano: fuentePequena })

  if (estaAnulado(pago)) {
    centrado('*** PAGO ANULADO ***', fuente, 'bold', { color: [198, 40, 40], espacioDespues: 1 })
  }

  dibujarRegla()
  centrado('¡Gracias por su pago!', fuente, 'bold')
  dibujarRegla()

  return y
}

export function generarTirillaPdfPagos({ pago, empresa }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const anchoPagina = doc.internal.pageSize.getWidth()
  const anchoTirilla = 100
  const x = (anchoPagina - anchoTirilla) / 2

  dibujarContenidoTirillaPago(doc, {
    pago,
    empresa,
    x,
    ancho: anchoTirilla,
    inicioY: 16
  })

  doc.save(`tirilla-pdf-pago-${pago.pagoId}.pdf`)
}
