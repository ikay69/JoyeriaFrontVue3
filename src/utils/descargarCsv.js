// Descarga un texto CSV como archivo desde el navegador
export function descargarCsv(nombreArchivo, contenido) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

// Nombre del archivo que manda el backend en Content-Disposition (filename*= o filename=).
// Devuelve null si no llega: el navegador la oculta si el CORS no la expone
// (Access-Control-Expose-Headers: Content-Disposition).
export function nombreDesdeContentDisposition(cabecera) {
  if (!cabecera) return null
  let nombre = null
  const extendido = /filename\*\s*=\s*(?:UTF-8|utf-8)?''([^;]+)/i.exec(cabecera)
  if (extendido) {
    try {
      nombre = decodeURIComponent(extendido[1].trim().replace(/^"|"$/g, ''))
    } catch {
      nombre = null
    }
  }
  if (!nombre) {
    const simple = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(cabecera)
    if (simple) nombre = (simple[2] ?? simple[1]).trim()
  }
  // sin rutas ni caracteres que el sistema de archivos no acepte
  nombre = String(nombre || '').replace(/[\/:*?"<>|]/g, '_').trim()
  return nombre || null
}

// "empenos_2026-09-01.csv" -> "empenos_2026-09-01_4821.csv" (4 cifras aleatorias, 1000 a 9999,
// igual que los nombres del backend)
export function conSufijoAleatorio(nombreArchivo) {
  const sufijo = Math.floor(1000 + Math.random() * 9000)
  const punto = nombreArchivo.lastIndexOf('.')
  if (punto <= 0) return `${nombreArchivo}_${sufijo}`
  return `${nombreArchivo.slice(0, punto)}_${sufijo}${nombreArchivo.slice(punto)}`
}
