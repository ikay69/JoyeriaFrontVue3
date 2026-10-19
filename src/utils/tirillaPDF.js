import { jsPDF } from 'jspdf'
import { dibujarContenidoTirilla } from './tirilla'

export function generarTirillaPDF({ venta, empresa }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const anchoPagina = doc.internal.pageSize.getWidth()
  const anchoTirilla = 100
  const x = (anchoPagina - anchoTirilla) / 2

  dibujarContenidoTirilla(doc, {
    venta,
    empresa,
    x,
    ancho: anchoTirilla,
    inicioY: 16,
    permitirPaginas: true,
    margenInferior: 16
  })

  doc.save(`tirilla-pdf-venta-${venta.ventaId}.pdf`)
}

