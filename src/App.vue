<template>

  <TextBox v-model="namaku" placeholder="Masukkan nama ku" /> __
  <TextBox v-model="namamu" placeholder="Masukkan nama mu" />
  <TextBox v-model="namaku" placeholder="Masukkan nama ku" /> __
  <TextBox v-model="namamu" placeholder="Masukkan nama mu" />
  
  <p>Value: {{ namaku }}</p>


 

</template>

<script setup>
import { ref } from 'vue'
import TextBox from './components/textbox.vue'
 

const namaku = ref('')
const namamu = ref('')
</script>