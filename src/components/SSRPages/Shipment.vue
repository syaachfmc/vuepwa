<template>
  <div class="form-container">
    <div class="form-group">
      <label id="2">Label sesuai judul kolom di datatable yg id kolom nya sesuai</label>
      <Textbox sama dengan id label sesuai judul kolom datatable />
    </div>
  </div>
</template>

<script setup>

import Textbox from '../textbox.vue'
</script>

<style scoped>
 
 


.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-direction: row;
  /* Diubah dari column ke row agar berjejer ke kanan */
  flex-wrap: wrap;
  overflow-x: auto;
  border: 1px;
  border-style: solid;
  padding: 5px;
}

.form-group {
  display: flex;
  flex-direction: column;


  gap: 6px;
  border: 1px;
  border-style: solid;
  border-color: rgba(0, 0, 255, 0);
}

 
</style>