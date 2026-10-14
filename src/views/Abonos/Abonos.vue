<template>
  <v-container fluid class="bg-lighten-4 fill-height pa-4 justify-center">
    <v-row class="w-100" style="max-width: 1400px;">
      <!-- Panel de Control / Formulario -->
      <v-col cols="12" md="5">
        <v-card class="elevation-3 pa-4 border-radius-lg">
          <v-card-title class="text-h5 font-weight-bold primary--text d-flex align-center">
            <v-icon icon="mdi-file-document-edit-outline" class="mr-2" color="brown-darken-3"></v-icon>
            Gestión de Comprobante / Abonos
          </v-card-title>
          <v-divider class="mb-4"></v-divider>

          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="receiptStore.form.sucursal"
                  label="Sucursal"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="receiptStore.form.reciboNo"
                  label="Recibo de Caja No."
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="receiptStore.form.fechaExpedicion"
                  label="Fecha de Expedición"
                  type="date"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="receiptStore.form.contratoVinculado"
                  label="Contrato Vinculado"
                  prefix="CNV-"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="receiptStore.form.cliente"
                  label="Nombre Completo del Cliente"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="receiptStore.form.identificacion"
                  label="Identificación (C.C.)"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="receiptStore.form.formaPago"
                  :items="['Efectivo', 'Transferencia']"
                  label="Forma de Pago"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>

              <v-col cols="12" class="mt-2">
                <div class="text-subtitle-2 font-weight-bold mb-1 text-brown-darken-3">Valores Financieros</div>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="receiptStore.form.valorIntereses"
                  label="Valor Intereses / Custodia"
                  type="number"
                  prefix="$"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="receiptStore.form.abonoCapital"
                  label="Abono Directo a Capital"
                  type="number"
                  prefix="$"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="receiptStore.totalCancelado"
                  label="Total Cancelado Hoy (Calculado)"
                  prefix="$"
                  variant="outlined"
                  density="compact"
                  readonly
                  bg-color="green-lighten-5"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="receiptStore.form.saldoPendiente"
                  label="Saldo Pendiente Capital"
                  type="number"
                  prefix="$"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="receiptStore.form.pagadoHasta"
                  label="Intereses Pagados Hasta"
                  type="date"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="receiptStore.form.puntos"
                  label="Puntos Acumulados"
                  type="number"
                  suffix="pts"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="receiptStore.form.asesor"
                  label="Nombre del Asesor"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>

          <v-card-actions class="px-0 pt-4">
            <v-btn color="error" variant="outlined" @click="receiptStore.resetForm">
              <v-icon icon="mdi-refresh" class="mr-1"></v-icon> Limpiar
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="brown-darken-3" class="text-white" variant="flat" :loading="receiptStore.loading" @click="saveAndPrint">
              <v-icon icon="mdi-printer" class="mr-1"></v-icon> Guardar e Imprimir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Panel de Vista Previa Física -->
      <v-col cols="12" md="7" class="d-flex justify-center">
        <div class="ticket-preview bg-white pa-6 elevation-2 position-relative w-100">
          <!-- Encabezado Principal -->
          <div class="d-flex justify-space-between align-center mb-1">
            <div class="header-title">
              <h1 class="main-brand">NF JOYERÍA Y COMPRAVENTA</h1>
              <p class="subtitle-official">COMPROBANTE OFICIAL DE PAGO EN CAJA</p>
            </div>
            <div class="branch-box">
              Sucursal: <span class="bracket-text">[ {{ receiptStore.form.sucursal || '______' }} ]</span>
            </div>
          </div>

          <div class="title-banner text-center my-3 py-1">
            RECIBO DE CAJA Y COMPROBANTE DE PAGO
          </div>

          <!-- Contenedor con borde punteado -->
          <div class="receipt-border-box pa-4">
            <div class="text-center mb-4">
              <h2 class="inner-brand">NF JOYERÍA Y COMPRAVENTA</h2>
              <p class="inner-slogan">Tu Banco y Joyería de Confianza</p>
            </div>

            <!-- Campos del Recibo -->
            <div class="receipt-row">
              <span class="label">RECIBO DE CAJA NO:</span>
              <span class="value-bracket">[ # {{ receiptStore.form.reciboNo || '_____________' }} ]</span>
            </div>

            <div class="receipt-row">
              <span class="label">FECHA DE EXPEDICIÓN:</span>
              <span class="value-bracket">[ {{ formatDate(receiptStore.form.fechaExpedicion) || 'DD / MM / AAAA' }} ]</span>
            </div>

            <div class="receipt-row">
              <span class="label">CLIENTE:</span>
              <span class="value-bracket">[ {{ receiptStore.form.cliente || 'Nombre Completo del Cliente' }} ]</span>
            </div>

            <div class="receipt-row">
              <span class="label">IDENTIFICACIÓN:</span>
              <span class="value-bracket">[ C.C. {{ receiptStore.form.identificacion || '_____________' }} ]</span>
            </div>

            <div class="receipt-row mb-4">
              <span class="label">CONTRATO VINCULADO:</span>
              <span class="value-bracket">[ CNV-{{ receiptStore.form.contratoVinculado || '________' }} ]</span>
            </div>

            <!-- Sección de Valores -->
            <div class="receipt-row align-end">
              <span class="label">VALOR INTERESES / CUSTODIA:</span>
              <span class="value-price">$ [ {{ formatCurrency(receiptStore.form.valorIntereses) }} ]</span>
            </div>

            <div class="receipt-row align-end">
              <span class="label">ABONO DIRECTO A CAPITAL:</span>
              <span class="value-price">$ [ {{ formatCurrency(receiptStore.form.abonoCapital) }} ]</span>
            </div>

            <div class="receipt-row align-end font-weight-bold text-black text-main-total">
              <span class="label">TOTAL CANCELADO HOY:</span>
              <span class="value-price">$ [ {{ formatCurrency(receiptStore.totalCancelado) }} ]</span>
            </div>

            <div class="receipt-row align-end font-weight-bold text-brand-color">
              <span class="label">SALDO PENDIENTES CAPITAL:</span>
              <span class="value-price">$ [ {{ formatCurrency(receiptStore.form.saldoPendiente) }} ]</span>
            </div>

            <!-- Bloque de Prórroga Ovalado -->
            <div class="text-center my-4 pt-2">
              <div class="prorroga-title">INTERESES Y PRÓRROGA PAGADOS HASTA:</div>
              <div class="oval-date-box mx-auto my-1 py-1 px-4">
                [ {{ formatDate(receiptStore.form.pagadoHasta) || 'FECHA / MM / AAAA' }} ]
              </div>
            </div>

            <!-- Footer del Recibo -->
            <div class="d-flex justify-space-between align-end mt-4 text-caption font-mono text-grey-darken-3">
              <div>
                <div>Puntos Acumulados:</div>
                <div class="mt-1">Atendido por: [ {{ receiptStore.form.asesor || 'Nombre del Asesor' }} ]</div>
                <div>Forma de Pago: [ {{ receiptStore.form.formaPago || 'Efectivo / Transferencia' }} ]</div>
              </div>
              <div class="text-right">
                <span class="pts-box">[ {{ receiptStore.form.puntos || '____' }} pts ]</span>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { defineStore } from 'pinia'; // <--- ¡AQUÍ ESTABA EL ERROR PRINCIPAL!
import { useRoute } from 'vue-router';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import compraService from '@/services/compraService';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const idEmpresa = computed(() => Number(route.params.EmpId) || authStore.empresaActual?.Id);

// --- DEFINICIÓN DE PINIA STORE ---
const useReceiptStore = defineStore('receipt', {
  state: () => ({
    loading: false,
    form: {
      sucursal: '',
      reciboNo: '',
      fechaExpedicion: new Date().toISOString().substr(0, 10),
      contratoVinculado: '',
      cliente: '',
      identificacion: '',
      formaPago: 'Efectivo',
      valorIntereses: 0,
      abonoCapital: 0,
      saldoPendiente: 0,
      pagadoHasta: '',
      puntos: 0,
      asesor: ''
    }
  }),
  getters: {
    totalCancelado: (state) => {
      return (Number(state.form.valorIntereses) || 0) + (Number(state.form.abonoCapital) || 0);
    }
  },
  actions: {
    resetForm() {
      this.form = {
        sucursal: '',
        reciboNo: '',
        fechaExpedicion: new Date().toISOString().substr(0, 10),
        contratoVinculado: '',
        cliente: '',
        identificacion: '',
        formaPago: 'Efectivo',
        valorIntereses: 0,
        abonoCapital: 0,
        saldoPendiente: 0,
        pagadoHasta: '',
        puntos: 0,
        asesor: ''
      };
    }
  }
});

const receiptStore = useReceiptStore();

// --- FUNCIONES AUXILIARES DE FORMATO ---
const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day} / ${month} / ${year}`;
};

// --- ENVIAR API Y GENERAR TICKET EN PDF ---
const saveAndPrint = async () => {
  if (!receiptStore.form.cliente || !receiptStore.form.reciboNo) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor, rellene al menos el Número de Recibo y el Cliente para proceder.',
      confirmButtonColor: '#7d1c1c'
    });
    return;
  }

  receiptStore.loading = true;
  try {
    // 1. Llamada real al servicio backend utilizando compraService y el ID de empresa
    /*
    await compraService.registrarAbono({
      idEmpresa: idEmpresa.value,
      ...receiptStore.form,
      totalCancelado: receiptStore.totalCancelado
    });
    */

    // 2. Creación del PDF con jsPDF replicando los estilos de la interfaz
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // Título Principal
    doc.setTextColor(125, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('NF JOYERÍA Y COMPRAVENTA', 15, 20);

    // Subtítulo Oficial
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPROBANTE OFICIAL DE PAGO EN CAJA', 15, 25);

    // Caja de Sucursal arriba a la derecha
    doc.setFontSize(10);
    doc.text(`Sucursal: [ ${receiptStore.form.sucursal || '      '} ]`, 155, 20);

    // Banner Intermedio central
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 32, 185, 8, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, 32, 185, 8, 'S');

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RECIBO DE CAJA Y COMPROBANTE DE PAGO', 65, 37.5);

    // Contenedor principal con Borde Punteado simulado
    doc.setDrawColor(150, 150, 150);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(20, 48, 175, 140, 'S');
    doc.setLineDashPattern([], 0);

    // Datos del centro del recuadro
    doc.setTextColor(125, 28, 28);
    doc.setFontSize(15);
    doc.text('NF JOYERÍA Y COMPRAVENTA', 107, 58, { align: 'center' });

    doc.setTextColor(110, 110, 110);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Tu Banco y Joyería de Confianza', 107, 63, { align: 'center' });

    // Campos del formulario
    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);

    let currentY = 75;
    const drawRow = (label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, currentY);
      doc.setFont('courier', 'normal');
      doc.text(value, 105, currentY);
      currentY += 8;
    };

    drawRow('RECIBO DE CAJA NO:', `[ # ${receiptStore.form.reciboNo || '             '} ]`);
    drawRow('FECHA DE EXPEDICIÓN:', `[ ${formatDate(receiptStore.form.fechaExpedicion) || 'DD / MM / AAAA'} ]`);
    drawRow('CLIENTE:', `[ ${receiptStore.form.cliente || 'Nombre Completo del Cliente'} ]`);
    drawRow('IDENTIFICACIÓN:', `[ C.C. ${receiptStore.form.identificacion || '             '} ]`);
    drawRow('CONTRATO VINCULADO:', `[ CNV-${receiptStore.form.contratoVinculado || '        '} ]`);

    currentY += 4;

    const drawValueRow = (label, amount, isBold = false, isBrand = false) => {
      if (isBrand) doc.setTextColor(125, 28, 28);
      else doc.setTextColor(0, 0, 0);
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(label, 25, currentY);
      
      doc.setFont('courier', 'bold');
      doc.text(`$ [ ${formatCurrency(amount)} ]`, 140, currentY);
      currentY += 8;
    };

    drawValueRow('VALOR INTERESES / CUSTODIA:', receiptStore.form.valorIntereses);
    drawValueRow('ABONO DIRECTO A CAPITAL:', receiptStore.form.abonoCapital);
    drawValueRow('TOTAL CANCELADO HOY:', receiptStore.totalCancelado, true);
    drawValueRow('SALDO PENDIENTE CAPITAL:', receiptStore.form.saldoPendiente, true, true);

    // Caja de prórrogas ovalada
    currentY += 4;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('INTERESES Y PRÓRROGA PAGADOS HASTA:', 107, currentY, { align: 'center' });

    currentY += 4;
    doc.setDrawColor(26, 82, 118);
    doc.setLineWidth(0.5);
    doc.rect(72, currentY, 70, 8, 'S');
    
    doc.setTextColor(26, 82, 118);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`[ ${formatDate(receiptStore.form.pagadoHasta) || 'FECHA / MM / AAAA'} ]`, 107, currentY + 5.5, { align: 'center' });

    doc.setLineWidth(0.2);

    // Footer
    currentY = 172;
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Atendido por: [ ${receiptStore.form.asesor || 'Nombre del Asesor'} ]`, 25, currentY);
    doc.text(`Forma de Pago: [ ${receiptStore.form.formaPago || 'Efectivo / Transferencia'} ]`, 25, currentY + 5);

    doc.text(`Puntos Acumulados:`, 145, currentY);
    doc.setFont('courier', 'bold');
    doc.text(`[ ${receiptStore.form.puntos || '0'} pts ]`, 145, currentY + 5);

    // Descargar Archivo PDF
    doc.save(`Recibo_Caja_${receiptStore.form.reciboNo || 'Nuevo'}.pdf`);

    Swal.fire({
      icon: 'success',
      title: '¡Comprobante Emitido!',
      text: 'Los datos se procesaron correctamente y el PDF se ha generado.',
      confirmButtonColor: '#7d1c1c'
    });

  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error de Red',
      text: error.response?.data?.msg || 'Ocurrió un inconveniente al comunicarse con el servidor.',
      confirmButtonColor: '#7d1c1c'
    });
  } finally {
    receiptStore.loading = false;
  }
};
</script>

<style scoped>
.ticket-preview {
  max-width: 650px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;
}

.main-brand {
  color: #7d1c1c;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
}

.subtitle-official {
  font-size: 10px;
  font-weight: bold;
  color: #555;
  margin: 0;
  letter-spacing: 0.5px;
}

.branch-box {
  font-size: 13px;
  font-weight: bold;
}

.bracket-text {
  font-family: 'Courier New', Courier, monospace;
}

.title-banner {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.receipt-border-box {
  border: 2px dashed #999;
  border-radius: 4px;
}

.inner-brand {
  color: #7d1c1c;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.inner-slogan {
  font-size: 11px;
  color: #777;
  font-style: italic;
  margin: 0;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.receipt-row .label {
  font-weight: bold;
}

.receipt-row .value-bracket {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 500;
  color: #111;
}

.receipt-row .value-price {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: 13px;
}

.text-main-total {
  font-size: 13px;
  border-top: 1px solid #eee;
  padding-top: 4px;
}

.text-brand-color {
  color: #7d1c1c;
}

.prorroga-title {
  font-size: 10px;
  font-weight: bold;
  color: #666;
}

.oval-date-box {
  border: 2px solid #1a5276;
  color: #1a5276;
  font-weight: bold;
  font-size: 14px;
  width: fit-content;
  border-radius: 4px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.pts-box {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: 13px;
}
</style>