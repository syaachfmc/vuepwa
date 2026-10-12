<template>
    <main class="app-container">
      <h1>Data Table Google Sheet</h1>
      <!-- Mengirimkan objek config ke komponen DataTable.vue via props -->
      <DataTable :config="config" />
    </main>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  // Mengimpor komponen DataTable.vue
  import DataTable from './components/DataTable.vue';
  
  // Konfigurasi Google Sheet yang disesuaikan dengan struktur metadata baru
  const config = ref({
    webAppUrl: 'https://script.google.com/macros/s/AKfycbxS25nr6J37T3EhgJPxS0X6XTJy4nnhsSp1HsG1SEGyEPASs70tMt010G13UXLDILnn/exec',
    gsheetID: '1FUjH8uI8XJX3yyosygUl0-Uo-0hr-oAfnBRdBzMrvfk',
    sheetName: 'data',
    columnIDRow: 1,               // Baris ID Kolom
    columnTitleRow: 2,            // Baris Judul Kolom (Header Utama Tabel)
    columnTitleDescriptionRow: 3,  // Baris Deskripsi Judul (Tooltip/Keterangan)
    columnTypeRow: 4,             // Baris Tipe Data Kolom
    dataRange: 'B5:BW'             // Range Data dimulai dari baris ke-5
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
    margin-bottom: 1rem;
    color: #333;
  }
  </style>