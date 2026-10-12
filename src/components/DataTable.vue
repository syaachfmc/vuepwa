<template>
    <div class="data-table-container">
      <!-- State Loading -->
      <div v-if="loading" class="loading">
        Memuat data...
      </div>
  
      <!-- State Error -->
      <div v-else-if="sheetData.status === 'error'" class="error">
        {{ sheetData.error }}
      </div>
  
      <!-- Display Tabel -->
      <table v-else class="table">
        <thead>
          <tr>
            <!-- Menampilkan Header dari columnTitles -->
            <th 
              v-for="(title, index) in sheetData.columnTitles" 
              :key="index"
              :title="sheetData.columnDescriptions[index] || ''"
            >
              {{ title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in sheetData.data" :key="rowIndex">
            <td v-for="(_, colIndex) in sheetData.columnTitles" :key="colIndex">
              <!-- Penggunaan method .get(rowIndex, colIndex) -->
              {{ sheetData.get(rowIndex, colIndex) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { fetchGSheetData } from './DataTable.js';
  
  // Menerima parameter konfigurasi lewat props
  const props = defineProps({
    config: {
      type: Object,
      required: true,
      default: () => ({
        webAppUrl: '',
        gsheetID: '',
        sheetName: 'data',
        columnIDRow: 1,
        columnTitleRow: 2,
        columnTitleDescriptionRow: 3,
        columnTypeRow: 4,
        dataRange: 'A5:Z'
      })
    }
  });
  
  const loading = ref(false);
  const sheetData = ref({
    status: '',
    error: '',
    columnIDs: [],
    columnTitles: [],
    columnDescriptions: [],
    columnTypes: [],
    data: [],
    get: () => null
  });
  
  const loadData = async () => {
    if (!props.config.webAppUrl || !props.config.gsheetID) return;
    
    loading.value = true;
    try {
      const result = await fetchGSheetData(
        props.config.webAppUrl,
        props.config.gsheetID,
        props.config.sheetName,
        props.config.columnIDRow,
        props.config.columnTitleRow,
        props.config.columnTitleDescriptionRow,
        props.config.columnTypeRow,
        props.config.dataRange
      );
  
      sheetData.value = result;
    } catch (err) {
      console.error('Error fetching sheet data:', err);
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(() => {
    loadData();
  });
  
  // Re-fetch jika props config berubah
  watch(() => props.config, () => {
    loadData();
  }, { deep: true });
  </script>
  
  <style scoped>
  .data-table-container {
    padding: 1rem;
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table th, .table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  .table th {
    background-color: #f4f4f4;
  }
  
  .error {
    color: red;
    font-weight: bold;
  }
  
  .loading {
    font-style: italic;
    color: #666;
  }
  </style>