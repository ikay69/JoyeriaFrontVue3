import { jsPDF } from 'jspdf'

const dato = (valor, alternativo = '-') => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return alternativo
  return String(valor)
}

const formatearNumero = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '0'
  return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })
}

const fechaGeneracion = () => {
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString('es-CO')
  const hora = ahora.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  return `${fecha} ${hora}`
}

const codigoVenta = (venta) => {
  const anio = String(venta.ventaFecha || new Date().getFullYear()).slice(0, 4)
  return `V-${anio}-${String(venta.ventaId ?? '').padStart(4, '0')}`
}

const estaAnulada = (venta) =>
  venta.ventaEstado === false || venta.ventaEstado === 0 || venta.ventaEstado === '0'

const formaPago = (tipo) => ({
  CONTADO: 'Contado',
  CREDITO: 'Crédito',
  POR_ABONO: 'Por abono'
}[tipo] || dato(tipo))

/**
 * Dibuja el contenido compartido de la tirilla en un documento jsPDF.
 * `ancho` es el ancho del bloque de tirilla, y `x` su posición horizontal.
 */
export function dibujarContenidoTirilla(doc, {
  venta,
  empresa,
  x = 0,
  ancho,
  inicioY = 12,
  permitirPaginas = false,
  margenInferior = 12
}) {
  const escala = ancho <= 55 ? 0.72 : ancho <= 85 ? 0.88 : 1
  const fuente = 8.4 * escala
  const fuentePequena = 7 * escala
  const fuenteTabla = (ancho <= 55 ? 6.7 : 7.1) * escala
  const fuenteTablaPequena = (ancho <= 55 ? 5.6 : 6.1) * escala
  const anchoInterior = ancho - 6
  const xInterior = x + 3
  const altoPagina = doc.internal.pageSize.getHeight()
  const altoLinea = (tamano) => Math.max(2.1, tamano * 0.46)
  let y = inicioY

  const dibujarRegla = () => {
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.15)
    doc.line(xInterior, y, xInterior + anchoInterior, y)
    y += 3.2 * escala
  }

  const envolver = (texto, tamano, estilo = 'normal', maximo = anchoInterior) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    return doc.splitTextToSize(String(texto ?? ''), Math.max(2, maximo))
  }

  const nuevaPagina = () => {
    doc.addPage()
    y = Math.max(12, inicioY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fuente)
    doc.setTextColor(35, 35, 35)
    doc.text(`CONTINUACIÓN · VENTA ${dato(venta.ventaId)}`, x + ancho / 2, y, { align: 'center' })
    y += altoLinea(fuente) + 1
    dibujarRegla()
  }

  const asegurarEspacio = (altoNecesario) => {
    if (!permitirPaginas || y + altoNecesario <= altoPagina - margenInferior) return false
    nuevaPagina()
    return true
  }

  const textoEnvuelto = (texto, {
    tamano = fuente,
    estilo = 'normal',
    alineacion = 'left',
    posicionX = xInterior,
    anchoMaximo = anchoInterior,
    color = [25, 25, 25],
    espacioDespues = 0,
    revisarEspacio = true
  } = {}) => {
    const lineas = envolver(texto, tamano, estilo, anchoMaximo)
    const alto = lineas.length * altoLinea(tamano)
    if (revisarEspacio) asegurarEspacio(alto + espacioDespues)
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    doc.setTextColor(...color)
    lineas.forEach((linea) => {
      doc.text(linea, posicionX, y, { align: alineacion })
      y += altoLinea(tamano)
    })
    y += espacioDespues
    return lineas.length
  }

  const textoCentrado = (texto, tamano = fuente, estilo = 'normal', opciones = {}) =>
    textoEnvuelto(texto, {
      tamano,
      estilo,
      alineacion: 'center',
      posicionX: x + ancho / 2,
      ...opciones
    })

  const tipoNumeroEmpresa = [empresa?.TipoDocumento, empresa?.NumeroDocumento]
    .filter(Boolean)
    .join(' - ')
  const telefono = [empresa?.Celular, empresa?.Telefono].filter(Boolean).join(' / ')
  const nombreTercero = dato(venta.ventaTercero)
  const documentoTercero = [venta.ventaTerceroTipoDoc, venta.ventaTerceroNumeroDoc]
    .filter(Boolean)
    .join(' ')
  const lineas = Array.isArray(venta.lineas) ? venta.lineas : []

  textoCentrado(dato(empresa?.Nombre, 'NOMBRE DE LA EMPRESA'), fuente * 1.12, 'bold')
  if (tipoNumeroEmpresa) textoCentrado(tipoNumeroEmpresa, fuentePequena)
  if (empresa?.Direccion) textoCentrado(`Dirección: ${empresa.Direccion}`, fuentePequena)
  if (telefono) textoCentrado(`Teléfono: ${telefono}`, fuentePequena)
  dibujarRegla()

  textoEnvuelto(`CÓDIGO VENTA: ${codigoVenta(venta)}`, { estilo: 'bold', espacioDespues: 0.5 * escala })
  textoEnvuelto(`FECHA GENERACIÓN: ${fechaGeneracion()}`, { tamano: fuentePequena })
  dibujarRegla()

  textoEnvuelto(`CLIENTE: ${nombreTercero}`, { estilo: 'bold' })
  textoEnvuelto(`Tipo documento: ${dato(documentoTercero)}`, { tamano: fuentePequena })
  dibujarRegla()

  const anchoArticulo = anchoInterior * 0.42
  const anchoCantidad = anchoInterior * 0.13
  const anchoValor = anchoInterior * 0.22
  const xCantidad = xInterior + anchoArticulo + anchoCantidad / 2
  const xValor = xInterior + anchoArticulo + anchoCantidad + anchoValor / 2
  const xTotal = xInterior + anchoInterior

  const dibujarEncabezadoArticulos = () => {
    asegurarEspacio(altoLinea(fuenteTabla) + 1)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fuenteTabla)
    doc.setTextColor(25, 25, 25)
    doc.text('ARTÍCULO', xInterior, y)
    doc.text('CANT', xCantidad, y, { align: 'center' })
    doc.text('VALOR', xValor, y, { align: 'center' })
    doc.text('TOTAL', xTotal, y, { align: 'right' })
    y += altoLinea(fuenteTabla) + 1
    dibujarRegla()
  }

  dibujarEncabezadoArticulos()

  lineas.forEach((linea) => {
    const cantidad = Number(linea.detCantidad) || 0
    const precio = Number(linea.detPrecioVentaUnidad) || 0
    const nombreLineas = envolver(dato(linea.detArticuloNombre), fuenteTabla, 'normal', anchoArticulo - 1)
    const propiedades = String(linea.detArticuloPropiedades || '').trim()
    const propiedadLineas = propiedades
      ? envolver(propiedades, fuenteTablaPequena, 'normal', anchoArticulo - 1)
      : []
    const altoNombre = nombreLineas.length * altoLinea(fuenteTabla)
    const altoPropiedades = propiedadLineas.length * altoLinea(fuenteTablaPequena)
    const altoFila = Math.max(altoNombre + altoPropiedades, altoLinea(fuenteTabla)) + 1.2 * escala
    const cambioPagina = asegurarEspacio(altoFila)
    if (cambioPagina) dibujarEncabezadoArticulos()

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fuenteTabla)
    doc.setTextColor(25, 25, 25)
    nombreLineas.forEach((lineaNombre, indice) => {
      const yLinea = y + indice * altoLinea(fuenteTabla)
      doc.text(lineaNombre, xInterior, yLinea)
    })
    doc.text(formatearNumero(cantidad), xCantidad, y, { align: 'center' })
    doc.setFontSize(fuenteTablaPequena)
    doc.text(formatearNumero(precio), xInterior + anchoArticulo + anchoCantidad + anchoValor - 0.5, y, { align: 'right' })
    doc.text(formatearNumero(cantidad * precio), xTotal, y, { align: 'right' })

    propiedadLineas.forEach((propiedad, indice) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fuenteTablaPequena)
      doc.setTextColor(90, 90, 90)
      doc.text(propiedad, xInterior, y + altoNombre + indice * altoLinea(fuenteTablaPequena))
    })

    y += altoFila
  })

  if (!lineas.length) {
    textoEnvuelto('Sin artículos', { tamano: fuentePequena, espacioDespues: 1 })
  }
  dibujarRegla()

  const subtotal = Number(venta.ventaSubtotal) || 0
  const descuento = Number(venta.ventaDescuento) || 0
  const totalVenta = Math.max(0, subtotal - descuento)
  const escribirTotal = (etiqueta, valor, destacado = false) => {
    asegurarEspacio(altoLinea(fuente) + 0.5 * escala)
    doc.setFont('helvetica', destacado ? 'bold' : 'normal')
    doc.setFontSize(fuente)
    doc.setTextColor(25, 25, 25)
    doc.text(etiqueta, xInterior + anchoInterior * 0.52, y)
    doc.text(formatearNumero(valor), xInterior + anchoInterior, y, { align: 'right' })
    y += altoLinea(fuente) + 0.5 * escala
  }
  escribirTotal('TOTAL:', totalVenta, true)
  escribirTotal('DESCUENTO:', descuento)
  escribirTotal('CANCELADO:', venta.ventaCancelado)
  escribirTotal('SALDO:', venta.ventaSaldo, true)
  dibujarRegla()

  textoEnvuelto('MEDIOS DE PAGO', { estilo: 'bold', espacioDespues: 1 * escala })
  const escribirMedioPago = (etiqueta, valor, negrita = false) => {
    asegurarEspacio(altoLinea(fuentePequena))
    doc.setFont('helvetica', negrita ? 'bold' : 'normal')
    doc.setFontSize(fuentePequena)
    doc.setTextColor(25, 25, 25)
    doc.text(etiqueta, xInterior, y)
    doc.text(negrita ? String(valor) : formatearNumero(valor), xInterior + anchoInterior, y, { align: 'right' })
    y += altoLinea(fuentePequena)
  }
  escribirMedioPago('Tipo', 'Valor', true)
  dibujarRegla()
  escribirMedioPago('EFECTIVO', venta.ventaEfectivo)
  escribirMedioPago('TRANSACCIÓN', venta.ventaTransaccion)
  dibujarRegla()

  textoEnvuelto(`FORMA DE PAGO: ${formaPago(venta.ventaTipoVenta)}`, {
    estilo: 'bold',
    espacioDespues: 0.5 * escala
  })
  textoEnvuelto(`VENDEDOR: ${dato(venta.ventaVendedor)}`, { tamano: fuentePequena })
  textoEnvuelto(`USUARIO: ${dato(venta.ventaUsuario)}`, { tamano: fuentePequena })

  if (estaAnulada(venta)) {
    textoCentrado('*** VENTA ANULADA ***', fuente, 'bold', { color: [198, 40, 40], espacioDespues: 1 })
  }

  asegurarEspacio(altoLinea(fuente) * 2 + 5 * escala)
  dibujarRegla()
  textoCentrado('¡Gracias por su compra!', fuente, 'bold')
  dibujarRegla()

  return y
}

export function generarTirilla({ venta, empresa, anchoMm = 80 }) {
  const ancho = Number(anchoMm) === 50 ? 50 : 80
  const opcionesDibujo = {
    venta,
    empresa,
    x: 0,
    ancho,
    inicioY: 6,
    permitirPaginas: false,
    margenInferior: 4
  }
  // jsPDF fija la coordenada Y al dibujar, medida desde el borde inferior de la página;
  // cambiar el alto después deja el contenido fuera. Primero se mide en un documento
  // temporal y luego se dibuja en uno con el alto exacto.
  const borrador = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ancho, 4800] })
  const altoFinal = dibujarContenidoTirilla(borrador, opcionesDibujo)
  const alto = Math.max(40, altoFinal + 5)

  const doc = new jsPDF({
    orientation: alto > ancho ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [ancho, alto]
  })
  dibujarContenidoTirilla(doc, opcionesDibujo)
  doc.save(`tirilla-venta-${venta.ventaId}-${ancho}mm.pdf`)
}

