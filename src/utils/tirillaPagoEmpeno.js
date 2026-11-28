import { jsPDF } from 'jspdf'
import { AVISO_VALIDAR_DOCUMENTO } from './avisoDocumento'

// Tirilla (80 o 50 mm) de un pago de empeño. Mismo estilo que la tirilla de ventas.
//
// empeno:   cabecera emp* (codigo, cliente).
// pagos:    "pagos" de /getidempeno o data.pagos de /newpago, FechaPago ASC e Id ASC. La tirilla
//           es del ULTIMO pago de la lista.
// periodos: "periodos" de /getidempeno, para saber que periodos pago. Opcional.

const dato = (valor, alternativo = '-') => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return alternativo
  return String(valor)
}

const formatearNumero = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '0'
  return numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 'aaaa-mm-dd' se corta como cadena (new Date() la correria un dia)
const formatearFecha = (valor) => {
  const partes = String(valor || '').slice(0, 10).split('-')
  if (partes.length !== 3) return '-'
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

const fechaHoraActual = () => {
  const ahora = new Date()
  const hora = ahora.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${ahora.toLocaleDateString('es-CO')} ${hora}`
}

const metodoPago = (metodo) => ({ EFECTIVO: 'Efectivo', TRANSACCION: 'Transacción' }[metodo] || dato(metodo))

const centavos = (valor) => Math.round((Number(valor) || 0) * 100)

// El pago no dice que periodos cubrio (api-empenosPagos.txt): se reconstruye repartiendo los
// periodos PAGADO, en orden, entre los pagos con interes, en el orden de los pagos, hasta
// completar el interes de cada uno. Si las cuentas no cuadran devuelve null (no se adivina).
export function periodosPorPago(pagos, periodos) {
  const pagados = (Array.isArray(periodos) ? periodos : [])
    .filter((p) => p.empperEstado === 'PAGADO')
    .sort((a, b) => Number(a.empperNumero) - Number(b.empperNumero))
  const resultado = new Map()
  let siguiente = 0
  for (const pago of Array.isArray(pagos) ? pagos : []) {
    let pendiente = centavos(pago.emppagoInteres)
    const numeros = []
    while (pendiente > 0 && siguiente < pagados.length) {
      const cobrado = centavos(pagados[siguiente].empperInteresCobrado)
      if (cobrado <= 0 || cobrado > pendiente) break
      numeros.push(Number(pagados[siguiente].empperNumero))
      pendiente -= cobrado
      siguiente += 1
    }
    resultado.set(pago.emppagoId, pendiente === 0 ? numeros : null)
  }
  return resultado
}

const textoPeriodos = (numeros, interes) => {
  if (!(Number(interes) > 0)) return 'Ninguno (abono a capital)'
  if (!numeros || !numeros.length) return '-'
  return numeros.join(', ')
}

function dibujarContenido(doc, { empeno, pago, periodosPago, empresa, ancho }) {
  const escala = ancho <= 55 ? 0.72 : 0.88
  const fuente = 8.4 * escala
  const fuentePequena = 7 * escala
  const anchoInterior = ancho - 6
  const xInterior = 3
  const altoLinea = (tamano) => Math.max(2.1, tamano * 0.46)
  let y = 6

  const regla = () => {
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.15)
    doc.line(xInterior, y, xInterior + anchoInterior, y)
    y += 3.2 * escala
  }

  const texto = (contenido, { tamano = fuente, estilo = 'normal', centrado = false, espacioDespues = 0 } = {}) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    doc.setTextColor(25, 25, 25)
    const posicionX = centrado ? ancho / 2 : xInterior
    doc.splitTextToSize(String(contenido ?? ''), anchoInterior).forEach((linea) => {
      doc.text(linea, posicionX, y, { align: centrado ? 'center' : 'left' })
      y += altoLinea(tamano)
    })
    y += espacioDespues
  }

  // Etiqueta a la izquierda y valor a la derecha; si no caben juntos, el valor baja de linea
  const fila = (etiqueta, valor, { tamano = fuente, estilo = 'normal' } = {}) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamano)
    doc.setTextColor(25, 25, 25)
    const valorTexto = String(valor)
    if (doc.getTextWidth(`${etiqueta} ${valorTexto}`) > anchoInterior) {
      doc.text(etiqueta, xInterior, y)
      y += altoLinea(tamano)
    } else {
      doc.text(etiqueta, xInterior, y)
    }
    doc.splitTextToSize(valorTexto, anchoInterior).forEach((linea) => {
      doc.text(linea, xInterior + anchoInterior, y, { align: 'right' })
      y += altoLinea(tamano)
    })
    y += 0.5 * escala
  }

  const documentoEmpresa = [empresa?.TipoDocumento, empresa?.NumeroDocumento].filter(Boolean).join(' - ')
  const telefono = [empresa?.Celular, empresa?.Telefono].filter(Boolean).join(' / ')
  const documentoCliente = [empeno?.empTerceroTipoDoc, empeno?.empTerceroNumeroDoc].filter(Boolean).join(' ')

  texto(dato(empresa?.Nombre, 'NOMBRE DE LA EMPRESA'), { tamano: fuente * 1.12, estilo: 'bold', centrado: true })
  if (documentoEmpresa) texto(documentoEmpresa, { tamano: fuentePequena, centrado: true })
  if (empresa?.Direccion) texto(`Dirección: ${empresa.Direccion}`, { tamano: fuentePequena, centrado: true })
  if (telefono) texto(`Teléfono: ${telefono}`, { tamano: fuentePequena, centrado: true })
  regla()

  texto('RECIBO DE PAGO DE EMPEÑO', { estilo: 'bold', centrado: true, espacioDespues: 0.5 * escala })
  texto(`EMPEÑO N.º: ${dato(empeno?.empCodigoContrato || empeno?.empId)}`, { estilo: 'bold' })
  texto(`PAGO N.º: ${dato(pago.emppagoId)}`, { tamano: fuentePequena })
  texto(`FECHA PAGO: ${formatearFecha(pago.emppagoFechaPago)}`, { tamano: fuentePequena })
  texto(`FECHA GENERACIÓN: ${fechaHoraActual()}`, { tamano: fuentePequena })
  regla()

  texto(`CLIENTE: ${dato(empeno?.empTerceroNombre)}`, { estilo: 'bold' })
  texto(`Documento: ${dato(documentoCliente)}`, { tamano: fuentePequena })
  regla()

  fila('PERIODO(S) PAGADO(S):', textoPeriodos(periodosPago, pago.emppagoInteres), { estilo: 'bold' })
  if (Number(pago.emppagoConDescuento)) texto('Con descuento de pronto pago', { tamano: fuentePequena, espacioDespues: 1 * escala })
  fila('MÉTODO DE PAGO:', metodoPago(pago.emppagoMetodoPago))
  regla()

  fila('A INTERÉS:', formatearNumero(pago.emppagoInteres))
  fila('A CAPITAL:', formatearNumero(pago.emppagoCapital))
  fila('VALOR PAGADO:', formatearNumero(pago.emppagoMontoTotal), { estilo: 'bold' })
  fila('SALDO CAPITAL:', formatearNumero(pago.emppagoSaldoPosterior))
  regla()

  texto(`USUARIO: ${dato(pago.emppagoUsuario)}`, { tamano: fuentePequena })
  regla()
  texto('¡Gracias por su pago!', { estilo: 'bold', centrado: true })
  regla()
  texto(AVISO_VALIDAR_DOCUMENTO, { tamano: fuentePequena, estilo: 'bold', centrado: true })
  regla()

  return y
}

export function generarTirillaPagoEmpeno({ empeno, pagos, periodos = [], empresa, anchoMm = 80 }) {
  const lista = Array.isArray(pagos) ? pagos : []
  const pago = lista[lista.length - 1]
  if (!pago) throw new Error('No hay pago para imprimir')

  const ancho = Number(anchoMm) === 50 ? 50 : 80
  const periodosPago = periodosPorPago(lista, periodos).get(pago.emppagoId)
  const opciones = { empeno, pago, periodosPago, empresa, ancho }

  // jsPDF no deja cambiar el alto despues de dibujar: se mide en un borrador y luego se dibuja
  // en un documento del alto exacto (igual que la tirilla de ventas).
  const borrador = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ancho, 4800] })
  const alto = Math.max(40, dibujarContenido(borrador, opciones) + 5)
  const doc = new jsPDF({ orientation: alto > ancho ? 'portrait' : 'landscape', unit: 'mm', format: [ancho, alto] })
  dibujarContenido(doc, opciones)

  const codigo = dato(empeno?.empCodigoContrato || empeno?.empId, 'empeno')
  doc.save(`tirillapagoempeno-${codigo}-${pago.emppagoId}-${ancho}mm.pdf`)
}
