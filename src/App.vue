<template>

  <TextBox
    v-model="nama"
    name="txtNama"
    placeholder="Masukkan nama"
    width="200px"
    height="50px"

  />

  <p>Value: {{ nama }}</p>

</template>

<script setup>
import { ref } from 'vue'
import TextBox from './components/textbox.vue'

const nama = ref('')
</script>