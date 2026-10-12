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
            <th v-for="(header, index) in sheetData.columnHeaders" :key="index">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in sheetData.data" :key="rowIndex">
            <td v-for="(_, colIndex) in sheetData.columnHeaders" :key="colIndex">
              <!-- Penggunaan method .get(rowIndex, colIndex) -->
              {{ sheetData.get(rowIndex, colIndex) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  // Sesuaikan relative path dengan posisi file DataTable.js Anda
  import { fetchGSheetData } from './components/DataTable.js';
  
  // State reaktif
  const loading = ref(false);
  const sheetData = ref({
    status: '',
    error: '',
    columnHeaders: [],
    columnTypes: [],
    data: [],
    get: () => null
  });
  
  // Parameter konfigurasi GSheet
  const config = {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbxS25nr6J37T3EhgJPxS0X6XTJy4nnhsSp1HsG1SEGyEPASs70tMt010G13UXLDILnn/exec',
    gsheetID: '1dShkxc4N8wvekcJt8gP3XvFCqPPu6gcWdhy79YVOjmE',
    sheetName: 'data',
    columnRow: 1,
    columnTypeRow: 2,
    dataRange: 'A5:Z'
  };
  
  const loadData = async () => {
    loading.value = true;
    try {
      const result = await fetchGSheetData(
        config.webAppUrl,
        config.gsheetID,
        config.sheetName,
        config.columnRow,
        config.columnTypeRow,
        config.dataRange
      );
      
      // Menyimpan hasil fetch ke state reactive
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
  }
  
  .error {
    color: red;
    font-weight: bold;
  }
  </style>