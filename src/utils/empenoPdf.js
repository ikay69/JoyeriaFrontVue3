import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useLogoEmpresaStore } from '@/stores/logoEmpresa'

// Contrato de compraventa con pacto de retroventa (empeño). Recibe el empeño tal como lo devuelven
// /newempeno y /getidempeno: cabecera emp*, articulos[] con empart*.

export const DORADO = [228, 190, 100]
export const DORADO_SUAVE = [250, 240, 214]
export const CREMA = [252, 248, 238]
export const DORADO_TEXTO = [176, 140, 50]
export const COLOR_LINEA = [40, 40, 40]
export const COLOR_TEXTO = [30, 30, 30]
export const COLOR_SUAVE = [110, 110, 110]
export const GROSOR_LINEA = 0.3

const ANCHO_CANT = 20
const ANCHO_PESO = 36
const ANCHO_VALOR = 38
const FILAS_MINIMAS = 4
const ALTO_FILA = 8
// El backend crea 4 periodos mensuales al firmar: ese es el plazo de la retroventa.
const PLAZO_MESES = 4
const PLAZO_DIAS = 120

export const mmDeFuente = (puntos) => puntos * 0.3528

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '$ 0,00'
  return `$ ${numero.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export const formatearNumero = (valor, decimales) =>
  (Number(valor) || 0).toLocaleString('es-CO', { maximumFractionDigits: decimales })

// empFechaInicio llega como 'aaaa-mm-dd'. Se corta la cadena: pasar por new Date() la correria un
// dia al oeste de UTC.
const formatearFechaCorta = (valor) => {
  const texto = String(valor || '').slice(0, 10)
  const partes = texto.split('-')
  if (partes.length !== 3) return '-'
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export const dato = (valor, alternativo = '-') => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return alternativo
  return String(valor)
}

// Peso de la linea: empartCantidadGramos es el de UNA unidad, por eso se multiplica por la cantidad.
const pesoLinea = (articulo) => {
  const gramos = articulo.empartCantidadGramos
  if (gramos === null || gramos === undefined || String(gramos).trim() === '') return '-'
  const total = Number(gramos) * (Number(articulo.empartCantidad) || 0)
  if (!Number.isFinite(total)) return '-'
  return `${formatearNumero(total, 4)} g`
}

const descripcionLinea = (articulo) => {
  const partes = [dato(articulo.empartArticuloNombre)]
  if (articulo.empartPropiedades) partes.push(String(articulo.empartPropiedades))
  let texto = partes.join(' · ')
  if (articulo.empartObservacion) texto += ` (${articulo.empartObservacion})`
  return texto
}

// Las redes pueden venir como URL completa; en el pie solo se muestra el usuario o el numero.
export const limpiarRed = (valor) =>
  String(valor || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/^(instagram\.com|facebook\.com|twitter\.com|x\.com|youtube\.com|wa\.me|tiktok\.com)\//i, '')
    .replace(/\/+$/, '')

export async function obtenerLogo(idEmpresa) {
  if (!idEmpresa) return null
  try {
    return await useLogoEmpresaStore().getLogo(idEmpresa)
  } catch {
    return null
  }
}

export function dibujarLogo(doc, logo, x, y, lado) {
  const propiedades = doc.getImageProperties(logo)
  const escala = Math.min(lado / propiedades.width, lado / propiedades.height)
  const anchoImg = propiedades.width * escala
  const altoImg = propiedades.height * escala
  doc.addImage(logo, propiedades.fileType, x, y + (lado - altoImg) / 2, anchoImg, altoImg)
  return anchoImg
}

export function lineaFina(doc) {
  doc.setDrawColor(...COLOR_LINEA)
  doc.setLineWidth(GROSOR_LINEA)
}

export function celda(doc, x, y, w, h, texto, { estilo = 'normal', tamano = 9.5, align = 'left', relleno = null, color = COLOR_TEXTO } = {}) {
  lineaFina(doc)
  if (relleno) {
    doc.setFillColor(...relleno)
    doc.rect(x, y, w, h, 'FD')
  } else {
    doc.rect(x, y, w, h, 'S')
  }
  if (texto === undefined || texto === null || texto === '') return
  doc.setFont('helvetica', estilo)
  doc.setFontSize(tamano)
  doc.setTextColor(...color)
  const linea = doc.splitTextToSize(String(texto), w - 4)[0]
  const xTexto = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 2.5 : x + 2.5
  doc.text(linea, xTexto, y + h / 2, { align, baseline: 'middle' })
}

export function datosContacto(doc, filas, xDerecha, yInicio) {
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

// Parrafo con tramos en negrita y normal mezclados, partido por palabras. Con dibujar=false solo
// mide. Devuelve la altura que ocupa.
export function parrafoMixto(doc, tramos, x, y, ancho, { tamano = 8.5, interlineado = 3.7, dibujar = true } = {}) {
  doc.setFontSize(tamano)
  doc.setTextColor(...COLOR_TEXTO)
  const palabras = []
  tramos.forEach(({ texto, negrita }) => {
    String(texto).split(/(\s+)/).filter((p) => p !== '').forEach((p) => {
      palabras.push({ texto: p, negrita: !!negrita, espacio: /^\s+$/.test(p) })
    })
  })
  let xActual = x
  let yActual = y
  palabras.forEach((palabra) => {
    doc.setFont('helvetica', palabra.negrita ? 'bold' : 'normal')
    let anchoPalabra = doc.getTextWidth(palabra.espacio ? ' ' : palabra.texto)
    // Una raya para llenar a mano (solo guiones bajos): jsPDF la mide un poco mas corta de lo que
    // la dibuja el visor, y en una raya larga se come el espacio y pega la palabra siguiente.
    if (!palabra.espacio && /^_+$/.test(palabra.texto)) anchoPalabra *= 1.03
    if (palabra.espacio) {
      if (xActual > x) xActual += anchoPalabra
      return
    }
    if (xActual + anchoPalabra > x + ancho && xActual > x) {
      xActual = x
      yActual += interlineado
    }
    if (dibujar) doc.text(palabra.texto, xActual, yActual)
    xActual += anchoPalabra
  })
  return yActual - y + interlineado
}

export function pieRedes(doc, redes, margen, anchoUtil, y) {
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

// cliente es opcional: { Celular, Direccion }. El empeño no trae el telefono ni la direccion del
// cliente, asi que quien llama puede pasarlos si los tiene.
// vistaPrevia: el contrato se arma con lo que hay en el formulario, antes de guardar. Lleva la marca
// de agua "VISTA PREVIA" y se abre en una pestaña en vez de descargarse.
export async function generarPdfEmpeno({ empeno, empresa, cliente = null, vistaPrevia = false }) {
  const logo = await obtenerLogo(empresa?.Id)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const margen = 12
  const anchoUtil = ancho - margen * 2
  const nombreEmpresa = dato(empresa?.Nombre, 'Empresa')
  const codigo = dato(empeno.empCodigoContrato, String(empeno.empId ?? ''))

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

  // ---- Titulo y numero ----
  let y = Math.max(yFinEncabezado, yFinContacto) + 4
  const anchoNumero = 52
  celda(doc, margen, y, anchoUtil - anchoNumero, 10, 'CONTRATO DE COMPRAVENTA CON PACTO DE RETROVENTA', {
    estilo: 'bold',
    tamano: 11.5
  })
  lineaFina(doc)
  doc.rect(margen + anchoUtil - anchoNumero, y, anchoNumero, 10, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DORADO_TEXTO)
  const textoN = 'N.º '
  doc.setFontSize(11)
  const anchoN = doc.getTextWidth(textoN)
  doc.setFontSize(12)
  const codigoCorto = doc.splitTextToSize(codigo, anchoNumero - anchoN - 6)[0]
  const anchoCodigo = doc.getTextWidth(codigoCorto)
  const xFinNumero = margen + anchoUtil - 3
  doc.setTextColor(...COLOR_TEXTO)
  doc.text(codigoCorto, xFinNumero, y + 5, { align: 'right', baseline: 'middle' })
  doc.setFontSize(11)
  doc.setTextColor(...DORADO_TEXTO)
  doc.text(textoN, xFinNumero - anchoCodigo, y + 5, { align: 'right', baseline: 'middle' })

  // ---- Datos del cliente ----
  y += 10
  const anchoEtiqueta = 36
  const anchoValorCorto = 72
  const anchoEtiqueta2 = 30
  const xEtiqueta2 = margen + anchoEtiqueta + anchoValorCorto
  const anchoValor2 = anchoUtil - anchoEtiqueta - anchoValorCorto - anchoEtiqueta2
  const documento = [
    `${dato(empeno.empTerceroTipoDoc, '')} ${dato(empeno.empTerceroNumeroDoc, '')}`.trim(),
    empeno.empTerceroCiudadDoc ? `de ${empeno.empTerceroCiudadDoc}` : ''
  ].filter(Boolean).join(' ') || '-'
  const opcionesEtiqueta = { estilo: 'bold', tamano: 9.5, relleno: CREMA }

  celda(doc, margen, y, anchoEtiqueta, ALTO_FILA, 'CLIENTE:', opcionesEtiqueta)
  celda(doc, margen + anchoEtiqueta, y, anchoUtil - anchoEtiqueta, ALTO_FILA, dato(empeno.empTerceroNombre))
  y += ALTO_FILA
  celda(doc, margen, y, anchoEtiqueta, ALTO_FILA, 'CÉDULA:', opcionesEtiqueta)
  celda(doc, margen + anchoEtiqueta, y, anchoValorCorto, ALTO_FILA, documento)
  celda(doc, xEtiqueta2, y, anchoEtiqueta2, ALTO_FILA, 'TELÉFONO:', opcionesEtiqueta)
  celda(doc, xEtiqueta2 + anchoEtiqueta2, y, anchoValor2, ALTO_FILA, dato(cliente?.Celular))
  y += ALTO_FILA
  celda(doc, margen, y, anchoEtiqueta, ALTO_FILA, 'DIRECCIÓN:', opcionesEtiqueta)
  celda(doc, margen + anchoEtiqueta, y, anchoValorCorto, ALTO_FILA, dato(cliente?.Direccion))
  celda(doc, xEtiqueta2, y, anchoEtiqueta2, ALTO_FILA, 'FECHA:', opcionesEtiqueta)
  celda(doc, xEtiqueta2 + anchoEtiqueta2, y, anchoValor2, ALTO_FILA, formatearFechaCorta(empeno.empFechaInicio))
  y += ALTO_FILA + 4

  // ---- Joyas ----
  const articulos = Array.isArray(empeno.articulos) ? empeno.articulos : []
  const cuerpo = articulos.map((articulo) => [
    formatearNumero(articulo.empartCantidad, 2),
    descripcionLinea(articulo),
    pesoLinea(articulo),
    formatearMoneda(articulo.empartValorAvaluo)
  ])
  while (cuerpo.length < FILAS_MINIMAS) cuerpo.push(['', '', '', ''])

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen, bottom: 22 },
    head: [['CANT.', 'DESCRIPCIÓN DE LA JOYA / PRENDA', 'PESO (G)', 'VALOR ($)']],
    body: cuerpo,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: COLOR_TEXTO,
      lineColor: COLOR_LINEA,
      lineWidth: GROSOR_LINEA,
      cellPadding: 2,
      minCellHeight: 7,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 9.5,
      fillColor: DORADO,
      textColor: COLOR_TEXTO,
      halign: 'center',
      minCellHeight: 10
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: ANCHO_CANT, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: ANCHO_PESO, halign: 'center' },
      3: { cellWidth: ANCHO_VALOR, halign: 'right' }
    }
  })

  // ---- Lo que sigue a la tabla: total, clausulas y firmas, en una sola pagina ----
  const tasa = Number(empeno.empTasa)
  const textoTasa = Number.isFinite(tasa) && tasa > 0 ? ` (${formatearNumero(tasa, 2)} % mensual)` : ''
  const nombreMayus = nombreEmpresa.toUpperCase()
  const tramosClausulas = [
    { texto: '1. DECLARACIÓN:', negrita: true },
    { texto: ` EL VENDEDOR transfiere a favor de ${nombreMayus} la propiedad de las joyas descritas, declarando bajo juramento su propiedad exclusiva y procedencia 100% lícita. ` },
    { texto: '2. PACTO DE RETROVENTA:', negrita: true },
    { texto: ` EL VENDEDOR se reserva la facultad de recobrar las joyas vendidas (Art. 1939 Código Civil), reembolsando el capital otorgado más los intereses/sobreprecio de custodia convenidos${textoTasa}. ` },
    { texto: '3. PLAZO Y VINCULACIÓN:', negrita: true },
    { texto: ' El plazo máximo para ejercer la retroventa es de ' },
    { texto: `${PLAZO_MESES} MESES (${PLAZO_DIAS} días)`, negrita: true },
    { texto: '. Se deberán cancelar los intereses por mes cumplido o fracción. ' },
    { texto: '4. PÉRDIDA DE DERECHO:', negrita: true },
    { texto: ` Superados los cuatro (${PLAZO_MESES}) meses sin efectuar prórroga o pago de cuotas, EL VENDEDOR perderá de pleno derecho la facultad de recuperar las joyas, autorizando a ${nombreMayus} a disponer libremente de los bienes para su venta o fundición.` }
  ]
  const anchoTextoClausulas = anchoUtil - 5
  const altoTextoClausulas = parrafoMixto(doc, tramosClausulas, 0, 0, anchoTextoClausulas, { dibujar: false })
  const altoClausulas = altoTextoClausulas + 4
  const altoFirmas = 30
  const necesario = ALTO_FILA + 3 + altoClausulas + 3 + altoFirmas

  let yTotal = doc.lastAutoTable.finalY
  if (yTotal + necesario > alto - 22) {
    doc.addPage()
    yTotal = 15
  }

  const anchoEtiquetaTotal = anchoUtil - ANCHO_PESO - ANCHO_VALOR
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...COLOR_TEXTO)
  doc.text('VALOR VENTA COMPRAVENTA:', margen + anchoEtiquetaTotal - 3, yTotal + ALTO_FILA / 2 + 0.5, {
    align: 'right',
    baseline: 'middle'
  })
  celda(doc, margen + anchoEtiquetaTotal, yTotal, ANCHO_PESO + ANCHO_VALOR, ALTO_FILA + 1, formatearMoneda(empeno.empMontoInicial), {
    estilo: 'bold',
    tamano: 11,
    align: 'right',
    relleno: DORADO_SUAVE
  })

  const yClausulas = yTotal + ALTO_FILA + 4
  lineaFina(doc)
  doc.setFillColor(...CREMA)
  doc.rect(margen, yClausulas, anchoUtil, altoClausulas, 'FD')
  parrafoMixto(doc, tramosClausulas, margen + 2.5, yClausulas + 4.3, anchoTextoClausulas)

  // ---- Firmas: comprador (la empresa) y vendedor (el cliente), con casilla de huella ----
  const yFirmas = yClausulas + altoClausulas + 3
  const anchoFirma = anchoUtil / 2
  const nitEmpresa = dato(empresa?.NumeroDocumento, '')
  const documentoCliente = `${dato(empeno.empTerceroTipoDoc, '')} ${dato(empeno.empTerceroNumeroDoc, '')}`.trim()
  const firmas = [
    { titulo: `Comprador (${nombreEmpresa})`, documento: nitEmpresa, huella: false },
    { titulo: 'Vendedor', documento: documentoCliente, huella: true }
  ]
  firmas.forEach(({ titulo, documento: documentoFirma, huella }, indice) => {
    const x = margen + indice * anchoFirma
    lineaFina(doc)
    doc.rect(x, yFirmas, anchoFirma, altoFirmas, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(doc.splitTextToSize(titulo, anchoFirma - (huella ? 30 : 6))[0], x + 3, yFirmas + 5.5)

    const finLinea = huella ? x + anchoFirma - 28 : x + anchoFirma - 4
    doc.setLineDashPattern([0.6, 0.8], 0)
    doc.setLineWidth(0.4)
    doc.line(x + 3, yFirmas + altoFirmas - 7, finLinea, yFirmas + altoFirmas - 7)
    doc.setLineDashPattern([], 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text(`C.C o NIT: ${documentoFirma}`, x + 3, yFirmas + altoFirmas - 3)

    if (huella) {
      const lado = 20
      const xHuella = x + anchoFirma - lado - 4
      const yHuella = yFirmas + 4
      doc.setDrawColor(...COLOR_SUAVE)
      doc.setLineWidth(0.4)
      doc.setLineDashPattern([1.2, 0.8], 0)
      doc.rect(xHuella, yHuella, lado, lado + 2, 'S')
      doc.setLineDashPattern([], 0)
      doc.setFontSize(7)
      doc.setTextColor(...COLOR_SUAVE)
      doc.text('HUELLA', xHuella + lado / 2, yHuella + lado - 0.5, { align: 'center' })
    }
  })

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
    if (vistaPrevia) marcaDeAgua(doc, ancho, alto)
  }

  if (vistaPrevia) {
    // Despues de las consultas ya no hay clic del usuario "en curso" y el navegador puede bloquear
    // la pestaña nueva; en ese caso se descarga.
    const pestana = window.open(doc.output('bloburl'), '_blank')
    if (!pestana) doc.save(`vista-previa-empeno-${codigo}.pdf`)
    return
  }
  doc.save(`contrato-empeno-${codigo}.pdf`)
}

export function marcaDeAgua(doc, ancho, alto) {
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.13 }))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(80)
  doc.setTextColor(198, 40, 40)
  // jsPDF no centra un texto girado: se calcula el punto de inicio para que el centro del texto
  // caiga en el centro de la pagina (el giro es antihorario y en el PDF la y crece hacia abajo).
  const texto = 'VISTA PREVIA'
  const angulo = 40
  const radianes = (angulo * Math.PI) / 180
  const mitad = doc.getTextWidth(texto) / 2
  const x = ancho / 2 - mitad * Math.cos(radianes)
  const y = alto / 2 + mitad * Math.sin(radianes)
  doc.text(texto, x, y, { baseline: 'middle', angle: angulo })
  doc.restoreGraphicsState()
}
