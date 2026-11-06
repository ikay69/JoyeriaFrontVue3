import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { lineasParaImpresion } from './lineasImpresion'
import { codigoImpresionVenta } from './codigoImpresionVenta'
import { AVISO_VALIDAR_DOCUMENTO } from './avisoDocumento'
import { useLogoEmpresaStore } from '@/stores/logoEmpresa'

// Colores del formato: dorado oscuro (columna CANT.), dorado claro (columna VALOR), lineas y texto
const DORADO_OSCURO = [212, 172, 84]
const DORADO_CLARO = [233, 207, 122]
const DORADO_TEXTO = [176, 140, 50]
const COLOR_LINEA = [40, 40, 40]
const COLOR_TEXTO = [30, 30, 30]
const COLOR_SUAVE = [110, 110, 110]
const GROSOR_LINEA = 0.3

// Anchos fijos de la tabla de articulos; DESCRIPCIÓN ocupa el resto. El bloque de totales usa
// los mismos anchos para quedar alineado debajo de la tabla.
const ANCHO_CANT = 22
const ANCHO_PRECIO = 36
const ANCHO_VALOR = 36
const FILAS_MINIMAS = 5
const ALTO_FILA = 8

const mmDeFuente = (puntos) => puntos * 0.3528

const TEXTO_LEGAL =
  'Esta factura de venta por sí sola surte los efectos de título valor, en razón del cumplimiento de lo establecido en la ley 1231 del 2008. Estatuto tributario. Código de comercio y demás normas.'

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '$ 0,00'
  return `$ ${numero.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Dia, mes y año por separado para las tres casillas bajo el numero de factura.
const partesFecha = (valor) => {
  const fecha = valor ? new Date(valor) : null
  if (!fecha || Number.isNaN(fecha.getTime())) return ['-', '-', '-']
  return [
    String(fecha.getDate()).padStart(2, '0'),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getFullYear())
  ]
}

// detCantidadGramos llega como cadena ("3.5000") o null; Number(null) daria 0, por eso se
// descarta antes de convertir.
const formatearGramos = (valor) => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return ''
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return ''
  return numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })
}

const formatearCantidad = (valor) =>
  (Number(valor) || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })

const dato = (valor, alternativo = '-') => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return alternativo
  return String(valor)
}

// Las redes pueden venir como URL completa; en el pie solo se muestra el usuario o el numero.
const limpiarRed = (valor) =>
  String(valor || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/^(instagram\.com|facebook\.com|twitter\.com|x\.com|youtube\.com|wa\.me|tiktok\.com)\//i, '')
    .replace(/\/+$/, '')

// Logo de la empresa desde la cache (si no esta, se pide y se guarda). Si falla por algo distinto
// a "no tiene foto", la factura se imprime igual, sin logo.
async function obtenerLogo(idEmpresa) {
  if (!idEmpresa) return null
  try {
    return await useLogoEmpresaStore().getLogo(idEmpresa)
  } catch {
    return null
  }
}

// Dibuja la imagen dentro de un cuadrado de `lado`, sin deformarla (alineada a la izquierda y
// centrada en vertical).
function dibujarLogo(doc, logo, x, y, lado) {
  const propiedades = doc.getImageProperties(logo)
  const escala = Math.min(lado / propiedades.width, lado / propiedades.height)
  const anchoImg = propiedades.width * escala
  const altoImg = propiedades.height * escala
  doc.addImage(logo, propiedades.fileType, x, y + (lado - altoImg) / 2, anchoImg, altoImg)
  return anchoImg
}

function lineaFina(doc) {
  doc.setDrawColor(...COLOR_LINEA)
  doc.setLineWidth(GROSOR_LINEA)
}

// Celda con borde y texto centrado (vertical y opcionalmente horizontal).
function celda(doc, x, y, w, h, texto, { fuente = 'times', estilo = 'normal', tamano = 11, align = 'center', relleno = null, color = COLOR_TEXTO } = {}) {
  lineaFina(doc)
  if (relleno) {
    doc.setFillColor(...relleno)
    doc.rect(x, y, w, h, 'FD')
  } else {
    doc.rect(x, y, w, h, 'S')
  }
  if (texto === undefined || texto === null || texto === '') return
  doc.setFont(fuente, estilo)
  doc.setFontSize(tamano)
  doc.setTextColor(...color)
  const linea = doc.splitTextToSize(String(texto), w - 4)[0]
  const xTexto = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 2.5 : x + 3
  doc.text(linea, xTexto, y + h / 2, { align, baseline: 'middle' })
}

// Datos de contacto arriba a la derecha: etiqueta en negrita y valor, alineados a la derecha.
function datosContacto(doc, filas, xDerecha, yInicio) {
  let y = yInicio
  filas.forEach(([etiqueta, valor]) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_TEXTO)
    const lineas = doc.splitTextToSize(valor, 70)
    doc.text(lineas, xDerecha, y, { align: 'right' })
    const anchoValor = Math.max(...lineas.map((l) => doc.getTextWidth(l)))
    doc.setFont('helvetica', 'bold')
    doc.text(`${etiqueta} `, xDerecha - anchoValor, y, { align: 'right' })
    y += lineas.length * 4
  })
  return y
}

// Pie con las redes de la empresa: un cuadro de color con la inicial y el usuario/numero.
function pieRedes(doc, redes, margen, anchoUtil, y) {
  if (!redes.length) return
  const anchoRanura = anchoUtil / redes.length
  redes.forEach(({ inicial, color, valor }, indice) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const lineaValor = doc.splitTextToSize(valor, anchoRanura - 10)[0]
    const anchoContenido = 6 + 2.5 + doc.getTextWidth(lineaValor)
    const x = margen + anchoRanura * indice + (anchoRanura - anchoContenido) / 2
    doc.setFillColor(...color)
    doc.roundedRect(x, y - 3, 6, 6, 1.4, 1.4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(inicial, x + 3, y, { align: 'center', baseline: 'middle' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(lineaValor, x + 8.5, y, { baseline: 'middle' })
  })
}

export async function generarPdfVenta({ venta, empresa }) {
  const logo = await obtenerLogo(empresa?.Id)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const codigo = codigoImpresionVenta(venta)
  const ventaAnulada = venta.ventaEstado === false ||
    venta.ventaEstado === 0 ||
    venta.ventaEstado === '0'
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const margen = 12
  const anchoUtil = ancho - margen * 2

  // ---- Encabezado: logo y nombre a la izquierda, contacto a la derecha ----
  const ladoLogo = 32
  const yLogo = 9
  let anchoLogo = 0
  if (logo) {
    try {
      anchoLogo = dibujarLogo(doc, logo, margen, yLogo, ladoLogo)
    } catch {
      // una imagen que jsPDF no puede leer no debe impedir la factura
    }
  }
  // El nombre va a la derecha del logo, centrado en vertical con el; sin logo, arriba a la
  // izquierda. No pasa de donde empiezan los datos de contacto (hasta 70 mm a la derecha).
  const xNombre = anchoLogo ? margen + anchoLogo + 5 : margen
  const anchoNombre = ancho - margen - 75 - xNombre
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...DORADO_TEXTO)
  const lineasNombre = doc.splitTextToSize(dato(empresa?.Nombre, 'Empresa'), anchoNombre)
  const altoLineaNombre = 8
  let yFinEncabezado
  if (anchoLogo) {
    const altoNombre = lineasNombre.length * altoLineaNombre
    const yPrimera = yLogo + (ladoLogo - altoNombre) / 2 + altoLineaNombre / 2
    doc.text(lineasNombre, xNombre, yPrimera, { baseline: 'middle', lineHeightFactor: altoLineaNombre / mmDeFuente(20) })
    yFinEncabezado = Math.max(yLogo + ladoLogo, yPrimera + altoNombre - altoLineaNombre / 2)
  } else {
    doc.text(lineasNombre, margen, 22, { lineHeightFactor: altoLineaNombre / mmDeFuente(20) })
    yFinEncabezado = 22 + (lineasNombre.length - 1) * altoLineaNombre
  }

  const telefonos = [empresa?.Celular, empresa?.Telefono].filter(Boolean).join(' / ')
  const contacto = [
    telefonos ? ['TEL.', telefonos] : null,
    empresa?.NumeroDocumento ? ['NIT.', String(empresa.NumeroDocumento)] : null,
    empresa?.Direccion ? ['DIR.', String(empresa.Direccion)] : null,
    empresa?.Email ? ['CORREO', String(empresa.Email)] : null
  ].filter(Boolean)
  const yFinContacto = datosContacto(doc, contacto, ancho - margen, 14)

  // ---- Factura de venta / numero / fecha ----
  let y = Math.max(yFinEncabezado, yFinContacto) + 5
  celda(doc, margen, y, 62, 9, 'FACTURA DE VENTA', { tamano: 12 })
  celda(doc, margen + 62, y, 50, 9, `N.º ${codigo}`, { tamano: 12 })
  const [dia, mes, anio] = partesFecha(venta.ventaFecha)
  const casillas = [['DÍA', dia, 24], ['MES', mes, 24], ['AÑO', anio, 28]]
  let xCasilla = margen
  casillas.forEach(([etiqueta, valor, w]) => {
    celda(doc, xCasilla, y + 9, w, 9, valor, { fuente: 'helvetica', tamano: 9 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...COLOR_SUAVE)
    doc.text(etiqueta, xCasilla + 1.2, y + 11.2)
    xCasilla += w
  })
  if (ventaAnulada) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(198, 40, 40)
    doc.text('*** VENTA ANULADA ***', ancho - margen, y + 13.5, { align: 'right' })
  }

  // ---- Datos del cliente ----
  y += 18 + 5
  const anchoEtiqueta = 48
  const documentoCliente =
    `${dato(venta.ventaTerceroTipoDoc, '')} ${dato(venta.ventaTerceroNumeroDoc, '')}`.trim() || '-'
  const telefonoCliente = dato(venta.ventaTerceroCelular || venta.ventaTerceroTelefono)
  const filasCliente = [
    ['CLIENTE:', dato(venta.ventaTercero)],
    ['CÉDULA:', documentoCliente],
    ['TELÉFONO:', telefonoCliente]
  ]
  filasCliente.forEach(([etiqueta, valor], indice) => {
    const yFila = y + indice * 9
    celda(doc, margen, yFila, anchoEtiqueta, 9, etiqueta, { tamano: 11 })
    celda(doc, margen + anchoEtiqueta, yFila, anchoUtil - anchoEtiqueta, 9, valor, {
      fuente: 'helvetica',
      tamano: 9,
      align: 'left'
    })
  })

  // ---- Articulos ----
  y += filasCliente.length * 9 + 5
  const lineas = lineasParaImpresion(venta.lineas)
  const cuerpo = lineas.map((linea) => {
    const cantidad = Number(linea.detCantidad) || 0
    const precio = Number(linea.detPrecioVentaUnidad) || 0
    const gramos = formatearGramos(linea.detCantidadGramos)
    return [
      formatearCantidad(cantidad),
      gramos ? `${dato(linea.detArticuloNombre)} · ${gramos} g` : dato(linea.detArticuloNombre),
      formatearMoneda(precio),
      formatearMoneda(cantidad * precio)
    ]
  })
  while (cuerpo.length < FILAS_MINIMAS) cuerpo.push(['', '', '', ''])

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen, bottom: 22 },
    head: [['CANT.', 'DESCRIPCIÓN', 'PRECIO', 'VALOR']],
    body: cuerpo,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: COLOR_TEXTO,
      lineColor: COLOR_LINEA,
      lineWidth: GROSOR_LINEA,
      cellPadding: 2.2,
      minCellHeight: ALTO_FILA,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 11,
      fillColor: [255, 255, 255],
      textColor: COLOR_TEXTO,
      halign: 'center'
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: ANCHO_CANT, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: ANCHO_PRECIO, halign: 'right' },
      3: { cellWidth: ANCHO_VALOR, halign: 'right' }
    },
    // Las columnas CANT. y VALOR van en dorado, en el encabezado y en el cuerpo
    didParseCell: ({ cell, column }) => {
      if (column.index === 0) cell.styles.fillColor = DORADO_OSCURO
      if (column.index === 3) cell.styles.fillColor = DORADO_CLARO
    }
  })

  // ---- Totales: Cancelado es la suma de efectivo y transaccion ----
  const subtotal = Number(venta.ventaSubtotal) || 0
  const descuento = Number(venta.ventaDescuento) || 0
  const total = Math.max(0, subtotal - descuento)
  const efectivo = Number(venta.ventaEfectivo) || 0
  const transaccion = Number(venta.ventaTransaccion) || 0
  const filasTotales = [
    descuento > 0 ? ['DESCUENTO', formatearMoneda(descuento)] : null,
    ['TOTAL $', formatearMoneda(total), true],
    ['CANCELADO', formatearMoneda(efectivo + transaccion)],
    ['SALDO', formatearMoneda(venta.ventaSaldo)]
  ].filter(Boolean)

  const lineasLegal = (() => {
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    return doc.splitTextToSize(TEXTO_LEGAL, anchoUtil - 6)
  })()
  const lineasAviso = (() => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    return doc.splitTextToSize(AVISO_VALIDAR_DOCUMENTO, anchoUtil - 6)
  })()
  const altoTotales = filasTotales.length * ALTO_FILA
  const altoLegal = 4 + lineasLegal.length * 3.8 + 1.5 + lineasAviso.length * 3
  const altoFirmas = 30
  const necesario = altoTotales + altoLegal + 2 + altoFirmas

  let yTotales = doc.lastAutoTable.finalY
  if (yTotales + necesario > alto - 22) {
    doc.addPage()
    yTotales = 15
  }

  const anchoIzquierda = anchoUtil - ANCHO_PRECIO - ANCHO_VALOR
  const xEtiquetas = margen + anchoIzquierda
  lineaFina(doc)
  doc.rect(margen, yTotales, anchoIzquierda, altoTotales, 'S')
  const datosVenta = [
    `Tipo de venta: ${dato(venta.ventaTipoVenta)}`,
    `Vendedor: ${dato(venta.ventaVendedor)}`
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXTO)
  const altoDatos = datosVenta.length * 4.6
  datosVenta.forEach((texto, indice) => {
    const linea = doc.splitTextToSize(texto, anchoIzquierda - 6)[0]
    const yLinea = yTotales + (altoTotales - altoDatos) / 2 + 2.3 + indice * 4.6
    doc.text(linea, margen + anchoIzquierda / 2, yLinea, { align: 'center', baseline: 'middle' })
  })
  filasTotales.forEach(([etiqueta, valor, destacado], indice) => {
    const yFila = yTotales + indice * ALTO_FILA
    celda(doc, xEtiquetas, yFila, ANCHO_PRECIO, ALTO_FILA, etiqueta, {
      estilo: destacado ? 'bold' : 'normal',
      tamano: 10.5
    })
    celda(doc, xEtiquetas + ANCHO_PRECIO, yFila, ANCHO_VALOR, ALTO_FILA, valor, {
      fuente: 'helvetica',
      estilo: destacado ? 'bold' : 'normal',
      tamano: 9,
      align: 'right'
    })
  })

  // ---- Texto legal y aviso ----
  const yLegal = yTotales + altoTotales
  lineaFina(doc)
  doc.rect(margen, yLegal, anchoUtil, altoLegal, 'S')
  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(lineasLegal, ancho / 2, yLegal + 4.5, { align: 'center', lineHeightFactor: 1.2 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(lineasAviso, ancho / 2, yLegal + 4.5 + lineasLegal.length * 3.8 + 1, {
    align: 'center'
  })

  // ---- Firmas ----
  const yFirmas = yLegal + altoLegal + 2
  const anchoFirma = (anchoUtil - 2) / 2
  ;['Recibí', 'Vendedor'].forEach((titulo, indice) => {
    const x = margen + indice * (anchoFirma + 2)
    lineaFina(doc)
    doc.rect(x, yFirmas, anchoFirma, altoFirmas, 'S')
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(titulo, x + 3, yFirmas + 5)
    doc.setLineDashPattern([0.6, 0.8], 0)
    doc.setLineWidth(0.6)
    doc.line(x, yFirmas + altoFirmas - 6.5, x + anchoFirma, yFirmas + altoFirmas - 6.5)
    doc.setLineDashPattern([], 0)
    doc.setFontSize(8)
    doc.text('C.C o NIT', x + 3, yFirmas + altoFirmas - 2.3)
  })

  // ---- Pie: redes de la empresa y numero de pagina en todas las paginas ----
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

  doc.save(`factura-venta-${codigo}.pdf`)
}
