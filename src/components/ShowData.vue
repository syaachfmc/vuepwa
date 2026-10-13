<template>
  <main class="app-container">
    <h1>Data Table Google Sheet</h1>

    <p class="selected-info">
      Row ID: <strong>{{ selectedRowID || '-' }}</strong>
    </p>

    <p class="selected-info">
      Data yang diklik:
      <strong>{{ selectedData || '-' }}</strong>
    </p>

    <p class="selected-info">
      Data dari GAS kedua:
      <strong class="multiline-data">{{ selectedDataGSheet || '-' }}</strong>
    </p>

    <DataTable
      :config="config"
      :tableDateFormat="config.tableDateFormat"
      @row-selected="handleRowSelected"
    />
  </main>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from './DataTable.vue'; // Diperbaiki: sesuaikan path ke folder yang sama

const selectedData = ref('');
const selectedRowID = ref('');
const selectedDataGSheet = ref('');

const config = ref({
  webAppUrl: 'https://script.google.com/macros/s/AKfycbwbHySzlHbZilvbVXIftPTofF3zQ-wdgGC8huC0Bv0Vcckre3cXUagNoglYrOIyCiirsg/exec',
  gsheetID: '1Gzo0l_7klJHcpOCXFsxQYlI75kWSjcP5w_GmgMASkb4',
  sheetName: 'data',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:BW20',
  RowIDColumn: 'A',
  tableDateFormat: 'dd MMM yy'
});

const rowDataApiUrl = 'https://script.google.com/macros/s/AKfycbw_AtiTMHIDxBw0cwuBjdJ6Jc55pL8dm2WojJNPSoV_haUAXGCtuS7V48PvJcKObbfB4A/exec';

const rowDataApiConfig = {
  GSheetID: '1Gzo0l_7klJHcpOCXFsxQYlI75kWSjcP5w_GmgMASkb4',
  sheetName: 'data',
  columnIDRow: '1',
  columnTitleRow: '2',
  columnTitleDescriptionRow: '3',
  columnTypeRow: '4',
  dataRange: 'B5:Z100',
  RowIDColumn: 'A',
  columnIDs: ['1', '5', '8']
};

async function getSelectedDataGSheet(rowID) {
  if (!rowID) {
    selectedDataGSheet.value = '';
    return;
  }

  selectedDataGSheet.value = 'Loading...';

  try {
    const params = new URLSearchParams({
      ...rowDataApiConfig,
      RowID: String(rowID),
      columnIDs: JSON.stringify(rowDataApiConfig.columnIDs)
    });

    const response = await fetch(
      `${rowDataApiUrl}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(result.error || 'Gagal mengambil data GAS.');
    }

    selectedDataGSheet.value = (result.data || [])
      .map(row => [row['1'], row['8']].filter(
        value => value !== undefined && value !== null && value !== ''
      ).join(' '))
      .join('\r\n');

    if (!selectedDataGSheet.value) {
      selectedDataGSheet.value = '';
    }
  } catch (error) {
    console.error('Error mengambil data GAS kedua:', error);
    selectedDataGSheet.value = `Error: ${error.message}`;
  }
}

function handleRowSelected(payload) {
  selectedData.value = payload?.value ?? '';
  selectedRowID.value = payload?.rowID ?? '';

  getSelectedDataGSheet(selectedRowID.value);
}
</script>

<style scoped>
.app-container {
  font-family: Arial, sans-serif;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 0.5rem;
  color: #333;
}

.selected-info {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: #555;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-left: 4px solid #1a73e8;
  border-radius: 4px;
}

.selected-info strong {
  color: #1a73e8;
}

.multiline-data {
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>