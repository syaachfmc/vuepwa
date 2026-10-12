<template>
  <main class="app-container">
    <h1>Data Table Google Sheet</h1>
    
    <!-- Menampilkan data kolom pertama dari baris yang diklik -->
    <p class="selected-info">
      Data yang di klik: <strong>{{ selectedData || '-' }}</strong>
    </p>
    
    <!-- Mengirimkan objek config dan mendengarkan event @row-selected -->
    <DataTable 
      :config="config"
      :tableDateFormat="config.tableDateFormat"
      @row-selected="handleRowSelected"
    />
  </main>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from './components/DataTable.vue';

const selectedData = ref('');

function handleRowSelected(val) {
  selectedData.value = val;
}

const config = ref({
  webAppUrl: 'https://script.google.com/macros/s/AKfycbxS25nr6J37T3EhgJPxS0X6XTJy4nnhsSp1HsG1SEGyEPASs70tMt010G13UXLDILnn/exec',
  gsheetID: '1Gzo0l_7klJHcpOCXFsxQYlI75kWSjcP5w_GmgMASkb4',
  sheetName: 'data',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:BW100',
  tableDateFormat: 'dd MMM yy'
});
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
  margin-bottom: 1.5rem;
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
</style>