const esBolsa = (linea) =>
  linea.detEsBolsa === true || linea.detEsBolsa === 1 || linea.detEsBolsa === '1'

// Oculta las líneas de bolsa y suma su valor al artículo cuyo nombre queda primero en orden ascendente.
export function lineasParaImpresion(lineas) {
  const lista = Array.isArray(lineas) ? lineas : []
  const bolsas = lista.filter(esBolsa)
  const articulos = lista.filter((linea) => !esBolsa(linea))
  if (!bolsas.length || !articulos.length) return lista

  const totalBolsas = bolsas.reduce(
    (suma, linea) => suma + (Number(linea.detCantidad) || 0) * (Number(linea.detPrecioVentaUnidad) || 0),
    0
  )
  const destino = [...articulos].sort((a, b) =>
    String(a.detArticuloNombre || '').localeCompare(String(b.detArticuloNombre || ''), 'es', { sensitivity: 'base' })
  )[0]
  const cantidadDestino = Number(destino.detCantidad) || 1

  return articulos.map((linea) =>
    linea === destino
      ? {
          ...linea,
          detPrecioVentaUnidad: (Number(linea.detPrecioVentaUnidad) || 0) + totalBolsas / cantidadDestino
        }
      : linea
  )
}
