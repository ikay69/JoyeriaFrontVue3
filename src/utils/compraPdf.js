import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Se usa la forma funcional autoTable(doc, opciones) y no doc.autoTable(opciones): la funcional
// funciona en las versiones 3, 4 y 5 del plugin, la de metodo solo si el plugin alcanzo a
// registrarse sobre el prototipo.

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor ?? '')
  return `$ ${numero.toLocaleString('es-CO')}`
}

const formatearFecha = (valor) => {
  if (!valor) return '-'
  // Se corta la cadena en vez de pasar por new Date(): el backend manda la fecha en UTC y
  // convertirla a local la corre un dia en cualquier zona al oeste de UTC.
  return String(valor).slice(0, 10)
}

const etiquetaEstadoCuota = (estado) => (estado === 'CANCELADA' ? 'Pagada' : 'Pendiente')

const MARGEN_SUPERIOR = 18
const MARGEN_INFERIOR = 20

// Los doc.text() sueltos NO paginan solos: solo autoTable pagina sus propias filas. Sin esta
// guarda, un bloque escrito justo despues de una tabla que termino al pie de la pagina se
// dibuja encima del margen o directamente fuera del papel.
const asegurarEspacio = (doc, y, altoNecesario) => {
  const limite = doc.internal.pageSize.getHeight() - MARGEN_INFERIOR
  if (y + altoNecesario <= limite) return y
  doc.addPage()
  return MARGEN_SUPERIOR
}

export function generarPdfCompra({ cabecera, lineas, cuotas, nombreEmpresa }) {
  const doc = new jsPDF()
  const margen = 14
  let y = 18

  doc.setFontSize(14)
  doc.text(nombreEmpresa || 'Comprobante', margen, y)
  y += 7

  doc.setFontSize(11)
  doc.text('Comprobante de compra', margen, y)
  y += 8

  // Una compra anulada impresa sin que el papel lo diga es la forma de que ese papel termine
  // usandose como si valiera. El banner va arriba y en rojo, antes de cualquier cifra.
  if (cabecera.compraEstado === 0) {
    doc.setFontSize(13)
    doc.setTextColor(198, 40, 40)
    doc.text('*** COMPRA ANULADA ***', margen, y)
    y += 6
    doc.setFontSize(9)
    doc.text(`Motivo: ${cabecera.compraMotivoAnulacion || '-'}`, margen, y)
    y += 6
    doc.setTextColor(0, 0, 0)
  }

  doc.setFontSize(9)
  const datos = [
    `N° de compra: ${cabecera.compraId}`,
    `Fecha: ${formatearFecha(cabecera.compraFecha)}`,
    `Documento soporte: ${cabecera.compraDocumentoSoporte || '-'}`,
    `Tipo: ${cabecera.compraTipoCompra}`,
    `Tercero: ${cabecera.compraTercero} (${cabecera.compraTerceroTipoDoc || ''} ${cabecera.compraTerceroNumeroDoc || ''})`
  ]
  datos.forEach((linea) => {
    doc.text(linea, margen, y)
    y += 5
  })
  y += 3

  autoTable(doc, {
    startY: y,
    head: [['Artículo', 'Bodega', 'Cantidad', 'Costo unidad', 'Costo total']],
    body: (lineas || []).map((linea) => {
      const total = (Number(linea.detCantidad) || 0) * (Number(linea.detCostoUnidad) || 0)
      return [
        linea.detArticuloNombre,
        linea.detBodegaNombre,
        String(linea.detCantidad),
        formatearMoneda(linea.detCostoUnidad),
        formatearMoneda(Math.round(total * 100) / 100)
      ]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [106, 122, 239] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  })

  y = doc.lastAutoTable.finalY + 8
  // Cuatro lineas al paso de 5mm que usa este bloque: si no caben las cuatro antes del margen
  // inferior, se arranca pagina nueva en vez de dibujarlas encimadas con el pie o fuera del papel.
  y = asegurarEspacio(doc, y, 20)

  const totales = [
    ['Subtotal', formatearMoneda(cabecera.compraSubtotal)],
    ['Descuento', formatearMoneda(cabecera.compraDescuento)],
    ['Cancelado', formatearMoneda(cabecera.compraCancelado)],
    ['Saldo', formatearMoneda(cabecera.compraSaldo)]
  ]
  doc.setFontSize(9)
  totales.forEach(([etiqueta, valor]) => {
    doc.text(etiqueta, 140, y)
    doc.text(valor, 196, y, { align: 'right' })
    y += 5
  })
  y += 5

  if (cabecera.compraTipoCompra === 'CREDITO') {
    // Hasta tres lineas de 5mm mas el espacio final de 3mm que deja este bloque.
    y = asegurarEspacio(doc, y, 18)
    doc.setFontSize(9)
    doc.text(`Número de cuotas: ${cabecera.compraNumeroCuotas ?? '-'}`, margen, y)
    y += 5
    const valorCuota =
      cabecera.compraValorCuota === null || cabecera.compraValorCuota === undefined
        ? 'Valores distintos (ver detalle)'
        : formatearMoneda(cabecera.compraValorCuota)
    doc.text(`Valor de la cuota: ${valorCuota}`, margen, y)
    y += 5
    if (cabecera.compraFechaCompromiso) {
      doc.text(`Fecha de compromiso: ${formatearFecha(cabecera.compraFechaCompromiso)}`, margen, y)
      y += 5
    }
    y += 3

    if ((cuotas || []).length) {
      // Espacio para el encabezado de la tabla y al menos un par de filas antes de dejar que
      // autoTable pagine el resto por su cuenta.
      y = asegurarEspacio(doc, y, 30)
      autoTable(doc, {
        startY: y,
        head: [['N°', 'Valor', 'Fecha de pago', 'Estado']],
        body: cuotas.map((cuota) => [
          String(cuota.cuoNumCuota),
          formatearMoneda(cuota.cuoValorCuota),
          formatearFecha(cuota.cuoFechaPago),
          etiquetaEstadoCuota(cuota.cuoEstado)
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [106, 122, 239] },
        columnStyles: { 1: { halign: 'right' } }
      })
      y = doc.lastAutoTable.finalY + 8
    }
  }

  // El pie se dibuja en CADA pagina, no solo en la que quedo activa al terminar: una vez que
  // asegurarEspacio puede meter un addPage(), escribirlo una sola vez deja las paginas
  // anteriores sin pie.
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina)
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(`Impreso el ${new Date().toLocaleString('es-CO')}`, margen, doc.internal.pageSize.getHeight() - 7)
    doc.text(`Página ${pagina} de ${totalPaginas}`, 196, doc.internal.pageSize.getHeight() - 7, { align: 'right' })
  }

  doc.save(`compra-${cabecera.compraId}.pdf`)
}
