import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLOR_PRIMARIO = [125, 28, 28]
const COLOR_SECUNDARIO = [46, 46, 56]
const COLOR_TEXTO = [48, 48, 48]
const COLOR_SUAVE = [246, 243, 243]

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '$ 0,00'
  return `$ ${numero.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const formatearFecha = (valor) => {
  if (!valor) return '-'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 10)
  return fecha.toLocaleDateString('es-CO')
}

const dato = (valor, alternativo = '-') => {
  if (valor === null || valor === undefined || String(valor).trim() === '') return alternativo
  return String(valor)
}

export function generarPdfVenta({ venta, empresa }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const margen = 14
  const anchoUtil = ancho - margen * 2

  doc.setFillColor(...COLOR_PRIMARIO)
  doc.rect(0, 0, ancho, 5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...COLOR_PRIMARIO)
  const nombreEmpresa = dato(empresa?.Nombre, 'Empresa')
  doc.text(doc.splitTextToSize(nombreEmpresa, 112), margen, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_TEXTO)
  const documentoEmpresa = [empresa?.TipoDocumento, empresa?.NumeroDocumento]
    .filter(Boolean)
    .join(' ')
  const datosEmpresa = [
    documentoEmpresa ? `NIT / Documento: ${documentoEmpresa}` : '',
    empresa?.Direccion ? `Dirección: ${empresa.Direccion}` : '',
    empresa?.Celular || empresa?.Telefono
      ? `Teléfono: ${[empresa.Celular, empresa.Telefono].filter(Boolean).join(' / ')}`
      : '',
    empresa?.Email ? `Correo: ${empresa.Email}` : ''
  ].filter(Boolean)
  let yEmpresa = 25
  datosEmpresa.forEach((linea) => {
    const lineas = doc.splitTextToSize(linea, 112)
    doc.text(lineas, margen, yEmpresa)
    yEmpresa += lineas.length * 4
  })

  const cajaX = ancho - margen - 65
  doc.setFillColor(...COLOR_SUAVE)
  doc.setDrawColor(...COLOR_PRIMARIO)
  doc.roundedRect(cajaX, 12, 65, 35, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLOR_PRIMARIO)
  doc.text('FACTURA DE VENTA', cajaX + 32.5, 22, { align: 'center' })
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_SECUNDARIO)
  doc.text(`N.º ${dato(venta.ventaId)}`, cajaX + 32.5, 30, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Fecha: ${formatearFecha(venta.ventaFecha)}`, cajaX + 32.5, 38, { align: 'center' })

  let y = Math.max(54, yEmpresa + 5)
  doc.setFillColor(...COLOR_SUAVE)
  doc.roundedRect(margen, y, anchoUtil, 29, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_PRIMARIO)
  doc.text('DATOS DE LA VENTA', margen + 4, y + 6)

  const columnasInfo = [margen + 4, margen + 68, margen + 132]
  const anchoInfo = 58
  const datosVenta = [
    ['Cliente', dato(venta.ventaTercero)],
    ['Documento', `${dato(venta.ventaTerceroTipoDoc, '')} ${dato(venta.ventaTerceroNumeroDoc, '')}`.trim() || '-'],
    ['Tipo de venta', dato(venta.ventaTipoVenta)],
    ['Vendedor', dato(venta.ventaVendedor)],
    ['Estado', dato(venta.ventaEstado)],
    ['Usuario', dato(venta.ventaUsuario)]
  ]

  datosVenta.forEach(([etiqueta, valor], indice) => {
    const columna = indice % 3
    const fila = Math.floor(indice / 3)
    const x = columnasInfo[columna]
    const yDato = y + 13 + fila * 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(etiqueta, x, yDato)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(doc.splitTextToSize(valor, anchoInfo), x, yDato + 3.5)
  })

  y += 36
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_SECUNDARIO)
  doc.text('DETALLE DE ARTÍCULOS', margen, y)

  const lineas = Array.isArray(venta.lineas) ? venta.lineas : []
  autoTable(doc, {
    startY: y + 3,
    margin: { left: margen, right: margen, bottom: 18 },
    head: [['Artículo', 'Bodega', 'Cantidad', 'Precio unitario', 'Total']],
    body: lineas.length
      ? lineas.map((linea) => {
          const cantidad = Number(linea.detCantidad) || 0
          const precio = Number(linea.detPrecioVentaUnidad) || 0
          return [
            dato(linea.detArticuloNombre),
            dato(linea.detBodegaNombre),
            cantidad.toLocaleString('es-CO', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
            formatearMoneda(precio),
            formatearMoneda(cantidad * precio)
          ]
        })
      : [['Sin artículos', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: COLOR_TEXTO,
      cellPadding: 2.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: COLOR_PRIMARIO,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 249, 249] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 31 },
      2: { cellWidth: 23, halign: 'right' },
      3: { cellWidth: 34, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' }
    }
  })

  let yTotales = doc.lastAutoTable.finalY + 8
  const altoTotales = 54
  if (yTotales + altoTotales > alto - 18) {
    doc.addPage()
    yTotales = 18
  }

  const subtotal = Number(venta.ventaSubtotal) || 0
  const descuento = Number(venta.ventaDescuento) || 0
  const total = Math.max(0, subtotal - descuento)
  const filasTotales = [
    ['Subtotal', formatearMoneda(venta.ventaSubtotal)],
    ['Descuento', formatearMoneda(venta.ventaDescuento)],
    ['Total venta', formatearMoneda(total)],
    ['Cancelado', formatearMoneda(venta.ventaCancelado)],
    ['Efectivo', formatearMoneda(venta.ventaEfectivo)],
    ['Transacción', formatearMoneda(venta.ventaTransaccion)],
    ['Saldo', formatearMoneda(venta.ventaSaldo)]
  ]
  const anchoTotales = 77
  const xTotales = ancho - margen - anchoTotales
  doc.setDrawColor(220, 220, 220)
  doc.roundedRect(xTotales, yTotales, anchoTotales, altoTotales, 2, 2, 'S')
  filasTotales.forEach(([etiqueta, valor], indice) => {
    const yFila = yTotales + 6 + indice * 6.2
    const esTotal = etiqueta === 'Total venta'
    doc.setFont('helvetica', esTotal ? 'bold' : 'normal')
    doc.setFontSize(esTotal ? 9 : 8)
    doc.setTextColor(...(esTotal ? COLOR_PRIMARIO : COLOR_TEXTO))
    doc.text(etiqueta, xTotales + 4, yFila)
    doc.text(valor, xTotales + anchoTotales - 4, yFila, { align: 'right' })
  })

  const totalPaginas = doc.internal.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina)
    doc.setDrawColor(225, 225, 225)
    doc.line(margen, alto - 13, ancho - margen, alto - 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(110, 110, 110)
    doc.text('Gracias por su compra', margen, alto - 8)
    doc.text(`Página ${pagina} de ${totalPaginas}`, ancho - margen, alto - 8, { align: 'right' })
  }

  doc.save(`factura-venta-${venta.ventaId}.pdf`)
}
