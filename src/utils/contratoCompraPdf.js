import { jsPDF } from 'jspdf'
import { codigoImpresionVenta } from '@/utils/codigoImpresionVenta'
import autoTable from 'jspdf-autotable'
import empresaService from '@/services/empresaService'
import terceroService from '@/services/terceroService'
import {
  DORADO,
  DORADO_TEXTO,
  COLOR_LINEA,
  COLOR_TEXTO,
  COLOR_SUAVE,
  GROSOR_LINEA,
  mmDeFuente,
  formatearNumero,
  dato,
  limpiarRed,
  obtenerLogo,
  dibujarLogo,
  lineaFina,
  celda,
  datosContacto,
  parrafoMixto,
  pieRedes
} from '@/utils/empenoPdf'

// Contrato de compra directa (venta pura y simple, art. 1849 C.C.). Sigue la estructura de
// contrato_compra_directa_editable.docx: titulo y numero, comparecencia del vendedor, tabla de
// articulos con su peso, valor en letras con la declaracion, fecha y valor, y firmas con huella.
// Recibe la compra tal como la devuelven /newcompra (data) y /getidcompra (data): cabecera
// compra*, lineas[] con det*.

const FILAS_MINIMAS = 4
const ALTO_FILA = 8
const ANCHO_PESO = 48
const BLANCO_LARGO = '______________________________'
const BLANCO_CORTO = '__________________'

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '$ 0'
  return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// compraFecha llega en UTC (termina en Z): se muestra en hora de Colombia.
const formatearFechaContrato = (valor) => {
  if (!valor) return '-'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 10)
  return fecha.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Dinero y cantidades llegan como cadena ("500000.00"): se convierten antes de operar.
const totalCompra = (compra) => {
  const total = (Number(compra.compraSubtotal) || 0) - (Number(compra.compraDescuento) || 0)
  return Math.round(total * 100) / 100
}

const descripcionLinea = (linea) => {
  const cantidad = Number(linea.detCantidad) || 0
  const nombre = dato(linea.detArticuloNombre)
  return cantidad === 1 ? nombre : `${formatearNumero(cantidad, 4)} x ${nombre}`
}

// detCantidadGramos es el peso de UNA unidad: se multiplica por la cantidad de la linea.
const pesoLinea = (linea) => {
  const gramos = linea.detCantidadGramos
  if (gramos === null || gramos === undefined || String(gramos).trim() === '') return '-'
  const total = Number(gramos) * (Number(linea.detCantidad) || 0)
  if (!Number.isFinite(total)) return '-'
  return `${formatearNumero(total, 4)} g`
}

// Busca los datos que la compra no trae (la empresa completa y la ciudad del documento del
// vendedor) y genera el contrato. Si alguna consulta falla, el contrato sale igual con lo que
// haya: la ciudad queda en blanco para llenarla a mano.
export async function imprimirContratoCompra({ compra, idEmpresa, empresaRespaldo = null }) {
  if (!compra) throw new Error('No hay datos de la compra para imprimir')
  const id = Number(idEmpresa)

  let empresa = empresaRespaldo || {}
  try {
    const { data } = await empresaService.getById({ idEmpresa: id })
    empresa = data?.data || empresa
  } catch {
    // se usan los datos de respaldo
  }

  let ciudadDocumento = ''
  const idTercero = Number(compra.compraTerceroId)
  if (Number.isInteger(idTercero) && idTercero > 0) {
    try {
      const { data } = await terceroService.getById({ idEmpresa: id, idTercero })
      ciudadDocumento = String(data?.data?.terCiudadDoc ?? '').trim()
    } catch {
      // sin ciudad: queda la raya para llenarla a mano
    }
  }

  await generarPdfContratoCompra({ compra, empresa, ciudadDocumento })
}

export async function generarPdfContratoCompra({ compra, empresa, ciudadDocumento = '' }) {
  const logo = await obtenerLogo(empresa?.Id)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const margen = 12
  const anchoUtil = ancho - margen * 2
  const nombreEmpresa = dato(empresa?.Nombre, 'Empresa')
  // Mismo numero que la factura de una venta: fecha local AAAAMMDD + id con 4 digitos.
  const numero = codigoImpresionVenta({ ventaFecha: compra.compraFecha, ventaId: compra.compraId })
  const total = totalCompra(compra)

  // ---- Encabezado: logo y nombre a la izquierda, contacto a la derecha ----
  const ladoLogo = 28
  const yLogo = 8
  let anchoLogo = 0
  if (logo) {
    try {
      anchoLogo = dibujarLogo(doc, logo, margen, yLogo, ladoLogo)
    } catch {
      // una imagen que jsPDF no puede leer no debe impedir el contrato
    }
  }
  const xNombre = anchoLogo ? margen + anchoLogo + 5 : margen
  const anchoNombre = ancho - margen - 75 - xNombre
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...DORADO_TEXTO)
  const lineasNombre = doc.splitTextToSize(nombreEmpresa, anchoNombre)
  const altoLineaNombre = 8
  const factorLinea = altoLineaNombre / mmDeFuente(20)
  let yFinEncabezado
  if (anchoLogo) {
    const altoNombre = lineasNombre.length * altoLineaNombre
    const yPrimera = yLogo + (ladoLogo - altoNombre) / 2 + altoLineaNombre / 2
    doc.text(lineasNombre, xNombre, yPrimera, { baseline: 'middle', lineHeightFactor: factorLinea })
    yFinEncabezado = Math.max(yLogo + ladoLogo, yPrimera + altoNombre - altoLineaNombre / 2)
  } else {
    doc.text(lineasNombre, margen, 20, { lineHeightFactor: factorLinea })
    yFinEncabezado = 20 + (lineasNombre.length - 1) * altoLineaNombre
  }

  const telefonos = [empresa?.Celular, empresa?.Telefono].filter(Boolean).join(' / ')
  const contacto = [
    telefonos ? ['TEL.', telefonos] : null,
    empresa?.NumeroDocumento ? ['NIT.', String(empresa.NumeroDocumento)] : null,
    empresa?.Direccion ? ['DIR.', String(empresa.Direccion)] : null,
    empresa?.Email ? ['CORREO', String(empresa.Email)] : null
  ].filter(Boolean)
  const yFinContacto = datosContacto(doc, contacto, ancho - margen, 13)

  // ---- Titulo y numero, con la raya gruesa debajo como en el documento ----
  let y = Math.max(yFinEncabezado, yFinContacto) + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...DORADO_TEXTO)
  doc.text('CONTRATO DE COMPRA DIRECTA', margen, y + 5, { baseline: 'middle' })

  const anchoNumero = 52
  const xNumero = margen + anchoUtil - anchoNumero
  lineaFina(doc)
  doc.rect(xNumero, y, anchoNumero, 10, 'S')
  doc.setFontSize(11)
  const textoN = 'No. '
  const anchoN = doc.getTextWidth(textoN)
  doc.setFontSize(12)
  const numeroCorto = doc.splitTextToSize(numero, anchoNumero - anchoN - 6)[0]
  const anchoNumeroTexto = doc.getTextWidth(numeroCorto)
  const xFinNumero = margen + anchoUtil - 3
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(numeroCorto, xFinNumero, y + 5, { align: 'right', baseline: 'middle' })
  doc.setFontSize(11)
  doc.setTextColor(...DORADO_TEXTO)
  doc.text(textoN, xFinNumero - anchoNumeroTexto, y + 5, { align: 'right', baseline: 'middle' })

  y += 13
  doc.setDrawColor(...COLOR_TEXTO)
  doc.setLineWidth(0.8)
  doc.line(margen, y, margen + anchoUtil, y)
  y += 6

  // Una compra anulada impresa sin que el papel lo diga termina usandose como si valiera.
  if (Number(compra.compraEstado) === 0) {
    doc.setFillColor(253, 236, 236)
    doc.setDrawColor(198, 40, 40)
    doc.setLineWidth(0.5)
    doc.rect(margen, y, anchoUtil, 11, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(198, 40, 40)
    doc.text('COMPRA ANULADA', margen + 3, y + 4.3, { baseline: 'middle' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const motivo = doc.splitTextToSize(`Motivo: ${dato(compra.compraMotivoAnulacion)}`, anchoUtil - 6)[0]
    doc.text(motivo, margen + 3, y + 8.5, { baseline: 'middle' })
    y += 15
  }

  // ---- Comparecencia ----
  const tipoDoc = dato(compra.compraTerceroTipoDoc, 'CC')
  const numeroDoc = dato(compra.compraTerceroNumeroDoc, BLANCO_CORTO)
  const tramosComparecencia = [
    { texto: 'Entre los suscritos ' },
    { texto: dato(compra.compraTercero, BLANCO_LARGO).toUpperCase(), negrita: true },
    { texto: ` identificado con ${tipoDoc} No. ` },
    { texto: numeroDoc, negrita: true },
    { texto: ' de ' },
    { texto: ciudadDocumento ? ciudadDocumento.toUpperCase() : BLANCO_CORTO, negrita: true },
    { texto: ' y el Almacén de Compraventa con Pacto de Retroventa ' },
    { texto: nombreEmpresa.toUpperCase(), negrita: true },
    { texto: ' se ha celebrado un contrato de venta pura simple y directa del bien mueble:' }
  ]
  const opcionesParrafo = { tamano: 10, interlineado: 5 }
  y += 1
  y += parrafoMixto(doc, tramosComparecencia, margen, y + 3, anchoUtil, opcionesParrafo) + 3

  // ---- Articulos ----
  const lineas = Array.isArray(compra.lineas) ? compra.lineas : []
  const cuerpo = lineas.map((linea) => [descripcionLinea(linea), pesoLinea(linea)])
  while (cuerpo.length < FILAS_MINIMAS) cuerpo.push(['', ''])

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen, bottom: 22 },
    head: [['DESCRIPCIÓN DEL ARTÍCULO', 'PESO EN GRAMOS']],
    body: cuerpo,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      textColor: COLOR_TEXTO,
      lineColor: COLOR_LINEA,
      lineWidth: GROSOR_LINEA,
      cellPadding: 2,
      minCellHeight: 8,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 10,
      fillColor: DORADO,
      textColor: COLOR_TEXTO,
      halign: 'center',
      minCellHeight: 10
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: ANCHO_PESO, halign: 'center' }
    }
  })

  // ---- Valor en letras y declaracion, fecha y valor, firmas: juntos en una pagina ----
  const tramosDeclaracion = [
    { texto: 'Por la suma de (letras) ' },
    { texto: '______________________________________________________________' },
    { texto: ' Declaro bajo la gravedad de juramento que los bienes que vendo son de mi exclusiva propiedad, tienen procedencia lícita y me comprometo a responder ante el comprador por los perjuicios que se deriven directa o indirectamente de esta venta. Este contrato de compra venta queda sometido a los efectos que trata el artículo 1849 del Código Civil, la venta se considera pura y simple y una vez se recibe, el almacén se declara legítimo dueño de la cosa vendida; de la cual puede disponer libremente y de forma inmediata del mismo. Una vez firmado este contrato, se entiende perfeccionado estando las partes en consentimiento para su realización.' }
  ]
  const opcionesDeclaracion = { tamano: 9, interlineado: 4.2 }
  const anchoTextoDeclaracion = anchoUtil - 5
  const altoDeclaracion = parrafoMixto(doc, tramosDeclaracion, 0, 0, anchoTextoDeclaracion, {
    ...opcionesDeclaracion,
    dibujar: false
  }) + 4
  const altoFirmas = 32
  const necesario = 4 + altoDeclaracion + 4 + ALTO_FILA * 2 + 4 + altoFirmas

  let yBloque = doc.lastAutoTable.finalY + 4
  if (yBloque + necesario > alto - 22) {
    doc.addPage()
    yBloque = 15
  }

  lineaFina(doc)
  doc.rect(margen, yBloque, anchoUtil, altoDeclaracion, 'S')
  parrafoMixto(doc, tramosDeclaracion, margen + 2.5, yBloque + 4.6, anchoTextoDeclaracion, opcionesDeclaracion)

  // ---- Fecha del contrato y valor ----
  const yFecha = yBloque + altoDeclaracion + 4
  const mitad = anchoUtil / 2
  const opcionesCabecera = { estilo: 'bold', tamano: 10, align: 'center', relleno: DORADO }
  celda(doc, margen, yFecha, mitad, ALTO_FILA, 'FECHA DEL CONTRATO', opcionesCabecera)
  celda(doc, margen + mitad, yFecha, mitad, ALTO_FILA, 'VALOR', opcionesCabecera)
  celda(doc, margen, yFecha + ALTO_FILA, mitad, ALTO_FILA, formatearFechaContrato(compra.compraFecha), {
    tamano: 10.5,
    align: 'center'
  })
  celda(doc, margen + mitad, yFecha + ALTO_FILA, mitad, ALTO_FILA, formatearMoneda(total), {
    estilo: 'bold',
    tamano: 11,
    align: 'center'
  })

  // ---- Firmas: comprador (la empresa), vendedor y huella ----
  const yFirmas = yFecha + ALTO_FILA * 2 + 4
  const anchoHuella = 34
  const anchoFirma = (anchoUtil - anchoHuella) / 2
  const documentoVendedor = [compra.compraTerceroTipoDoc, compra.compraTerceroNumeroDoc].filter(Boolean).join(' ')
  const firmas = [
    { titulo: 'FIRMA COMPRADOR', nombre: nombreEmpresa, documento: dato(empresa?.NumeroDocumento, '') },
    { titulo: 'FIRMA VENDEDOR', nombre: dato(compra.compraTercero, ''), documento: documentoVendedor }
  ]
  firmas.forEach(({ titulo, nombre, documento }, indice) => {
    const x = margen + indice * anchoFirma
    lineaFina(doc)
    doc.rect(x, yFirmas, anchoFirma, altoFirmas, 'S')
    const yLinea = yFirmas + altoFirmas - 13
    doc.setLineDashPattern([0.6, 0.8], 0)
    doc.setLineWidth(0.4)
    doc.line(x + 5, yLinea, x + anchoFirma - 5, yLinea)
    doc.setLineDashPattern([], 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(titulo, x + anchoFirma / 2, yLinea + 4, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(doc.splitTextToSize(nombre, anchoFirma - 6)[0] || '', x + anchoFirma / 2, yLinea + 8, { align: 'center' })
    if (documento) doc.text(`C.C o NIT: ${documento}`, x + anchoFirma / 2, yLinea + 11.5, { align: 'center' })
  })

  const xHuella = margen + anchoFirma * 2
  lineaFina(doc)
  doc.rect(xHuella, yFirmas, anchoHuella, altoFirmas, 'S')
  doc.setDrawColor(...COLOR_SUAVE)
  doc.setLineWidth(0.4)
  doc.setLineDashPattern([1.2, 0.8], 0)
  doc.rect(xHuella + 6, yFirmas + 3, anchoHuella - 12, altoFirmas - 10, 'S')
  doc.setLineDashPattern([], 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_SUAVE)
  doc.text('HUELLA', xHuella + anchoHuella / 2, yFirmas + altoFirmas - 3, { align: 'center' })

  // ---- Pie: redes de la empresa y numero de pagina ----
  const redes = [
    empresa?.Whatsapp ? { inicial: 'W', color: [37, 211, 102], valor: limpiarRed(empresa.Whatsapp) } : null,
    empresa?.Instagram ? { inicial: 'I', color: [214, 41, 118], valor: limpiarRed(empresa.Instagram) } : null,
    empresa?.Facebook ? { inicial: 'f', color: [24, 119, 242], valor: limpiarRed(empresa.Facebook) } : null,
    empresa?.Twitter ? { inicial: 'X', color: [20, 20, 20], valor: limpiarRed(empresa.Twitter) } : null,
    empresa?.Youtube ? { inicial: 'Y', color: [255, 0, 0], valor: limpiarRed(empresa.Youtube) } : null
  ].filter((red) => red && red.valor)

  const totalPaginas = doc.internal.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina)
    pieRedes(doc, redes, margen, anchoUtil, alto - 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR_SUAVE)
    doc.text(`Página ${pagina} de ${totalPaginas}`, ancho - margen, alto - 5, { align: 'right' })
  }

  doc.save(`contrato-compra-${numero}.pdf`)
}
