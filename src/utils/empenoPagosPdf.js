import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  DORADO,
  DORADO_SUAVE,
  CREMA,
  DORADO_TEXTO,
  COLOR_LINEA,
  COLOR_TEXTO,
  COLOR_SUAVE,
  GROSOR_LINEA,
  dato,
  limpiarRed,
  obtenerLogo,
  dibujarLogo,
  celda,
  lineaFina
} from './empenoPdf'

// Recibo de un pago de empeño ("tablilla de pagos"): arriba el control de pagos del contrato
// (una fila por pago) con la nota de custodia, y abajo, separado por una linea de corte, el
// comprobante de caja del pago recien registrado.
//
// empeno:   cabecera emp* (codigo, cliente). Idealmente el empeño ya actualizado por /getidempeno.
// pagos:    data.pagos de /newpago (o "pagos" de /getidempeno), FechaPago ASC e Id ASC: el
//           recien registrado es SIEMPRE el ultimo.
// periodos: "periodos" de /getidempeno, para la FECHA LIMITE de cada pago. Opcional: sin ellos
//           la columna sale con "-".
// El valor en letras se deja en blanco a proposito: se escribe a mano.

const FILAS_MINIMAS = 4
const ALTO_FILA_RECIBO = 8

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '$ 0,00'
  return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Las fechas llegan 'aaaa-mm-dd': se corta la cadena (new Date() la correria un dia).
const formatearFechaCorta = (valor) => {
  const partes = String(valor || '').slice(0, 10).split('-')
  if (partes.length !== 3) return '-'
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

// Fecha limite de un pago: el vencimiento del periodo en el que cayo la fecha del pago.
const fechaLimite = (pago, periodos) => {
  const fecha = String(pago.emppagoFechaPago || '').slice(0, 10)
  if (!fecha) return '-'
  const periodo = periodos.find((p) => {
    const inicio = String(p.empperFechaInicio || '').slice(0, 10)
    const fin = String(p.empperFechaVencimiento || '').slice(0, 10)
    return inicio && fin && inicio <= fecha && fecha < fin
  })
  return periodo ? formatearFechaCorta(periodo.empperFechaVencimiento) : '-'
}

// El sistema reparte el pago (interes primero, capital despues): el concepto sale de ese reparto.
const conceptoPago = (pago) => {
  const interes = Number(pago.emppagoInteres) || 0
  const capital = Number(pago.emppagoCapital) || 0
  const saldo = Number(pago.emppagoSaldoPosterior) || 0
  let concepto
  if (interes > 0 && capital > 0) concepto = saldo === 0 ? 'Intereses y pago total' : 'Intereses y abono a capital'
  else if (interes > 0) concepto = 'Intereses'
  else concepto = saldo === 0 ? 'Pago total' : 'Abono a capital'
  if (Number(pago.emppagoConDescuento)) concepto += ' (pronto pago)'
  return concepto
}

export async function generarReciboPagoEmpeno({ empeno, pagos, periodos = [], empresa }) {
  const lista = Array.isArray(pagos) ? pagos : []
  const listaPeriodos = Array.isArray(periodos) ? periodos : []
  const pago = lista[lista.length - 1]
  if (!pago) throw new Error('No hay pago para imprimir')

  const logo = await obtenerLogo(empresa?.Id)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const ancho = doc.internal.pageSize.getWidth()
  const margen = 12
  const anchoUtil = ancho - margen * 2
  const xDerecha = ancho - margen
  const nombreEmpresa = dato(empresa?.Nombre, 'Empresa')
  const codigo = dato(empeno?.empCodigoContrato, String(empeno?.empId ?? ''))
  const nombreCliente = dato(empeno?.empTerceroNombre)

  // ---- Encabezado: logo (o nombre) a la izquierda; control, contrato y telefono a la derecha ----
  const yLogo = 8
  const ladoLogo = 24
  let yFinIzquierda = yLogo
  let dibujoLogo = false
  if (logo) {
    try {
      dibujarLogo(doc, logo, margen, yLogo, ladoLogo)
      yFinIzquierda = yLogo + ladoLogo
      dibujoLogo = true
    } catch {
      // una imagen que jsPDF no puede leer no debe impedir el recibo
    }
  }
  if (!dibujoLogo) {
    doc.setFont('times', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...DORADO_TEXTO)
    const lineas = doc.splitTextToSize(nombreEmpresa, anchoUtil - 85)
    doc.text(lineas, margen, 17)
    yFinIzquierda = 17 + (lineas.length - 1) * 8 + 3
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text('CONTROL DE PAGOS Y PRÓRROGAS', xDerecha, 13, { align: 'right' })

  doc.setFontSize(10)
  doc.setTextColor(...DORADO_TEXTO)
  const textoCodigo = `[ ${codigo} ]`
  doc.text(textoCodigo, xDerecha, 19, { align: 'right' })
  const anchoCodigo = doc.getTextWidth(textoCodigo)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_TEXTO)
  doc.text('CONTRATO NO: ', xDerecha - anchoCodigo, 19, { align: 'right' })

  const telefono = [empresa?.Celular, empresa?.Telefono].filter(Boolean).join(' / ')
  if (telefono) {
    doc.setFontSize(9)
    doc.text(`TEL: ${telefono}`, xDerecha, 24, { align: 'right' })
  }

  // ---- Barra: calendario y cliente ----
  let y = Math.max(yFinIzquierda, 26) + 4
  const altoBarra = 10
  doc.setDrawColor(...COLOR_LINEA)
  doc.setLineWidth(0.6)
  doc.rect(margen, y, anchoUtil, altoBarra, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_TEXTO)
  const tituloBarra = 'CALENDARIO DE PAGOS Y ABONOS POR CUOTAS'
  doc.text(tituloBarra, margen + 3, y + altoBarra / 2, { baseline: 'middle' })
  const anchoTitulo = doc.getTextWidth(tituloBarra)
  doc.setFontSize(10.5)
  const anchoEtiquetaCliente = doc.getTextWidth('CLIENTE: ')
  const anchoDisponible = anchoUtil - anchoTitulo - anchoEtiquetaCliente - 12
  doc.setFontSize(11)
  const clienteCorto = doc.splitTextToSize(nombreCliente, anchoDisponible)[0]
  doc.text(clienteCorto, xDerecha - 3, y + altoBarra / 2, { align: 'right', baseline: 'middle' })
  const anchoCliente = doc.getTextWidth(clienteCorto)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'normal')
  doc.text('CLIENTE: ', xDerecha - 3 - anchoCliente, y + altoBarra / 2, { align: 'right', baseline: 'middle' })
  y += altoBarra + 3

  // ---- Tabla de cuotas: una fila por pago; las vacias quedan para llenar a mano ----
  const cuerpo = lista.map((fila, indice) => [
    String(indice + 1),
    fechaLimite(fila, listaPeriodos),
    formatearMoneda(fila.emppagoInteres),
    formatearMoneda(fila.emppagoCapital),
    formatearFechaCorta(fila.emppagoFechaPago)
  ])
  while (cuerpo.length < FILAS_MINIMAS) {
    cuerpo.push([
      String(cuerpo.length + 1),
      '[ DD/MM/20___ ]',
      '$ [ ____________ ]',
      '$ [ ____________ ]',
      '[ ____/____/20___ ]'
    ])
  }
  const indicePago = lista.length - 1

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [['CUOTA', 'FECHA LÍMITE', 'VALOR CUOTA/INT', 'ABONO CAPITAL', 'FECHA Y FIRMA PAGO']],
    body: cuerpo,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      textColor: COLOR_TEXTO,
      lineColor: COLOR_LINEA,
      lineWidth: GROSOR_LINEA,
      cellPadding: 1.8,
      minCellHeight: 7,
      valign: 'middle'
    },
    headStyles: { fontStyle: 'bold', fillColor: DORADO, textColor: COLOR_TEXTO, halign: 'center' },
    bodyStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 38, halign: 'center' },
      2: { cellWidth: 42, halign: 'right' },
      3: { cellWidth: 42, halign: 'right' },
      4: { halign: 'center' }
    },
    // El pago de este recibo va resaltado
    didParseCell: (celdaTabla) => {
      if (celdaTabla.section === 'body' && celdaTabla.row.index === indicePago) {
        celdaTabla.cell.styles.fillColor = DORADO_SUAVE
        celdaTabla.cell.styles.fontStyle = 'bold'
      }
    }
  })
  y = doc.lastAutoTable.finalY + 5

  // ---- Nota de custodia ----
  const vinetas = [
    'Presente este comprobante original y su cédula para efectuar abonos o retirar sus joyas.',
    'Transcurridos 4 meses sin prorrogar ni pagar intereses, la prenda pasa a propiedad de la compraventa.',
    'No olvide solicitar su recibo de caja firmado por cada abono realizado en nuestras oficinas.'
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const lineasNota = vinetas.flatMap((texto) => doc.splitTextToSize(`• ${texto}`, anchoUtil - 6))
  const interlineado = 4
  const altoNota = 6 + 4 + lineasNota.length * interlineado + 2
  doc.setDrawColor(...COLOR_LINEA)
  doc.setLineWidth(0.6)
  doc.setFillColor(248, 248, 248)
  doc.rect(margen, y, anchoUtil, altoNota, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text('NOTA DE CUSTODIA Y SEGURIDAD:', margen + 3, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(lineasNota, margen + 3, y + 11, { lineHeightFactor: interlineado / (8.5 * 0.3528) })
  y += altoNota + 7

  // ---- Linea de corte ----
  doc.setDrawColor(...COLOR_LINEA)
  doc.setLineWidth(0.7)
  doc.setLineDashPattern([2.5, 1.5], 0)
  doc.line(margen, y, xDerecha, y)
  doc.setLineDashPattern([], 0)
  y += 8

  // ---- Comprobante de caja del pago ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DORADO_TEXTO)
  doc.text('COMPROBANTE - RECIBO DE CAJA', ancho / 2, y, { align: 'center' })
  y += 4

  const anchoEtiqueta = 52
  const anchoValor = anchoUtil - anchoEtiqueta
  const etiqueta = { estilo: 'bold', tamano: 9.5, relleno: CREMA }
  const xValor = margen + anchoEtiqueta

  celda(doc, margen, y, anchoEtiqueta, ALTO_FILA_RECIBO, 'RECIBIDO DE:', etiqueta)
  celda(doc, xValor, y, anchoValor, ALTO_FILA_RECIBO, nombreCliente, { estilo: 'bold' })
  y += ALTO_FILA_RECIBO

  // La suma: primero el valor en numeros y despues una raya en blanco para escribirlo en letras a mano.
  celda(doc, margen, y, anchoEtiqueta, ALTO_FILA_RECIBO, 'LA SUMA DE:', etiqueta)
  celda(doc, xValor, y, anchoValor, ALTO_FILA_RECIBO, '')
  const textoMonto = `(${formatearMoneda(pago.emppagoMontoTotal)})`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(textoMonto, xValor + 2.5, y + ALTO_FILA_RECIBO / 2, { baseline: 'middle' })
  const inicioRaya = xValor + 2.5 + doc.getTextWidth(textoMonto) + 3
  doc.setDrawColor(...COLOR_SUAVE)
  doc.setLineWidth(0.3)
  doc.line(inicioRaya, y + ALTO_FILA_RECIBO - 2, xDerecha - 3, y + ALTO_FILA_RECIBO - 2)
  y += ALTO_FILA_RECIBO

  const anchoSaldoEtiqueta = 32
  const anchoSaldoValor = 44
  const anchoConcepto = anchoValor - anchoSaldoEtiqueta - anchoSaldoValor
  celda(doc, margen, y, anchoEtiqueta, ALTO_FILA_RECIBO, 'POR CONCEPTO DE:', etiqueta)
  celda(doc, xValor, y, anchoConcepto, ALTO_FILA_RECIBO, conceptoPago(pago))
  celda(doc, xValor + anchoConcepto, y, anchoSaldoEtiqueta, ALTO_FILA_RECIBO, 'SALDO HOY:', etiqueta)
  celda(doc, xValor + anchoConcepto + anchoSaldoEtiqueta, y, anchoSaldoValor, ALTO_FILA_RECIBO,
    formatearMoneda(pago.emppagoSaldoPosterior), { estilo: 'bold', align: 'right' })
  y += ALTO_FILA_RECIBO

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_SUAVE)
  doc.text(
    `Pago N.º ${dato(pago.emppagoId)} · ${formatearFechaCorta(pago.emppagoFechaPago)} · ${dato(pago.emppagoMetodoPago)} · Registró: ${dato(pago.emppagoUsuario)}`,
    margen,
    y + 4
  )

  // ---- Firmas ----
  y += 22
  const anchoFirma = 85
  const xFirma2 = xDerecha - anchoFirma
  lineaFina(doc)
  doc.setLineWidth(0.5)
  doc.line(margen, y, margen + anchoFirma, y)
  doc.line(xFirma2, y, xDerecha, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text('Firma Cliente / Entregó', margen + anchoFirma / 2, y + 5, { align: 'center' })
  const cajero = doc.splitTextToSize(`Cajero ${nombreEmpresa} / Recibió`, anchoFirma)[0]
  doc.text(cajero, xFirma2 + anchoFirma / 2, y + 5, { align: 'center' })

  // ---- Redes de la empresa ----
  const redes = [
    ['WhatsApp', empresa?.Whatsapp],
    ['Instagram', empresa?.Instagram],
    ['Facebook', empresa?.Facebook],
    ['X', empresa?.Twitter],
    ['YouTube', empresa?.Youtube]
  ]
    .map(([nombre, valor]) => [nombre, limpiarRed(valor)])
    .filter(([, valor]) => valor)
  if (redes.length) {
    const yRedes = y + 14
    const anchoRanura = anchoUtil / redes.length
    redes.forEach(([nombre, valor], indice) => {
      const etiquetaRed = `${nombre}: `
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      const anchoEtiquetaRed = doc.getTextWidth(etiquetaRed)
      doc.setFont('helvetica', 'normal')
      const valorCorto = doc.splitTextToSize(valor, anchoRanura - anchoEtiquetaRed - 4)[0]
      const anchoTotal = anchoEtiquetaRed + doc.getTextWidth(valorCorto)
      const x = margen + anchoRanura * indice + (anchoRanura - anchoTotal) / 2
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLOR_TEXTO)
      doc.text(etiquetaRed, x, yRedes)
      doc.setFont('helvetica', 'normal')
      doc.text(valorCorto, x + anchoEtiquetaRed, yRedes)
    })
  }

  doc.save(`recibo-pago-empeno-${codigo}-${dato(pago.emppagoId, 'nuevo')}.pdf`)
}
