// Lee un CSV de terceros para /tercero/importarterceros.
// Columnas en este orden: tipoDocumento, numeroDocumento, nombre, apellidos, celular
// Acepta separador "," o ";" (Excel en español guarda con ";") y una fila de
// encabezado opcional. El tipo (CLIENTE, PROVEEDOR, TALLER) lo pone la vista.

export const MAX_TERCEROS_IMPORTAR = 200

function detectarSeparador(primeraLinea) {
  const puntoYComa = (primeraLinea.match(/;/g) || []).length
  const comas = (primeraLinea.match(/,/g) || []).length
  return puntoYComa > comas ? ';' : ','
}

// Separa el texto en filas y celdas respetando comillas dobles ("a, b" y "")
function leerFilas(texto, separador) {
  const filas = []
  let fila = []
  let celda = ''
  let enComillas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"'
        i++
      } else if (c === '"') {
        enComillas = false
      } else {
        celda += c
      }
    } else if (c === '"') {
      enComillas = true
    } else if (c === separador) {
      fila.push(celda)
      celda = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(celda)
      filas.push(fila)
      fila = []
      celda = ''
    } else {
      celda += c
    }
  }
  fila.push(celda)
  filas.push(fila)

  return filas.filter((f) => f.some((valor) => valor.trim() !== ''))
}

function esEncabezado(fila) {
  return fila.some((valor) => valor.trim().toLowerCase() === 'nombre')
}

export function parsearTercerosCsv(texto, tipo) {
  const limpio = texto.replace(/^﻿/, '')
  const separador = detectarSeparador(limpio.split(/\r?\n/)[0] || '')
  const filas = leerFilas(limpio, separador)
  if (filas.length && esEncabezado(filas[0])) filas.shift()

  const vacioANull = (valor) => {
    const v = (valor || '').trim()
    return v === '' ? null : v
  }

  return filas.map((fila) => ({
    tipoDocumento: vacioANull(fila[0]),
    numeroDocumento: vacioANull(fila[1]),
    nombre: (fila[2] || '').trim(),
    apellidos: (fila[3] || '').trim(),
    celular: vacioANull(fila[4]),
    tipo
  }))
}
