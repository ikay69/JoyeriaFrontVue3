// Lee un CSV de inventario para /existencia/importarinventario.
// Columnas en este orden: bodega, categoria, tipoProducto, producto, tipoSeguimiento, articulo,
// existencia, cantidad, costoUnidad, precio, vender, tipoDocumento, numeroDocumento, nombre, apellido
// Acepta separador "," o ";" y una fila de encabezado opcional. Las celdas vacias viajan como null:
// el backend decide que es obligatorio segun la bolsa y valida cada fila.

import { detectarSeparador, leerFilas } from '@/utils/tercerosCsv'

export const MAX_ARTICULOS_IMPORTAR = 200

const COLUMNAS = [
  'bodega', 'categoria', 'tipoProducto', 'producto', 'tipoSeguimiento', 'articulo', 'existencia',
  'cantidad', 'costoUnidad', 'precio', 'vender', 'tipoDocumento', 'numeroDocumento', 'nombre', 'apellido'
]

// Encabezado + un ejemplo DISPONIBLE y uno RESERVADO (con propietario por documento).
// Separador ";" y BOM para que Excel en español lo abra en columnas y con tildes.
export function plantillaInventarioCsv() {
  const ejemplos = [
    ['Vitrina', 'Anillos', 'Joyeria', 'Anillo oro 18k', 'UNIDAD', 'Anillo solitario oro 18k', 'DISPONIBLE', '1', '450000', '890000', '1', '', '', '', ''],
    ['Vitrina', '', 'Joyeria', 'Anillo oro 18k', '', 'Anillo apartado para cliente', 'RESERVADO', '1', '', '950000', '1', 'CC', '1020304050', '', '']
  ]
  return '﻿' + [COLUMNAS, ...ejemplos].map((fila) => fila.join(';')).join('\r\n') + '\r\n'
}

function esEncabezado(fila) {
  return (fila[0] || '').trim().toLowerCase() === 'bodega'
}

export function parsearInventarioCsv(texto) {
  const limpio = texto.replace(/^﻿/, '')
  const separador = detectarSeparador(limpio.split(/\r?\n/)[0] || '')
  const filas = leerFilas(limpio, separador)
  if (filas.length && esEncabezado(filas[0])) filas.shift()

  const vacioANull = (valor) => {
    const v = (valor || '').trim()
    return v === '' ? null : v
  }

  return filas.map((fila) => ({
    bodega: vacioANull(fila[0]),
    categoria: vacioANull(fila[1]),
    tipoProducto: vacioANull(fila[2]),
    producto: vacioANull(fila[3]),
    tipoSeguimiento: vacioANull(fila[4]),
    articulo: vacioANull(fila[5]),
    existencia: vacioANull(fila[6]),
    cantidad: vacioANull(fila[7]),
    costoUnidad: vacioANull(fila[8]),
    precio: vacioANull(fila[9]),
    vender: vacioANull(fila[10]),
    tipoDocumento: vacioANull(fila[11]),
    numeroDocumento: vacioANull(fila[12]),
    nombre: vacioANull(fila[13]),
    apellido: vacioANull(fila[14])
  }))
}
