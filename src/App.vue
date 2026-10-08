<template>

<TextBox
  v-model="nama"

  :size="{
    width: '300px',
    height: '36px'
  }"

  :font="{
    family: 'Arial',
    size: '15px',
    weight: 700,
    style: 'italic',
    color: '#222'
  }"

  :background="{
    color: '#fffde7'
  }"

  :border="{
    color: '#999',
    width: '1px',
    style: 'solid',
    radius: '5px'
  }"

  :focus="{
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
    color: '#000'
  }"

  :text="{
    align: 'left',
    padding: '6px 10px'
  }"

  placeholder="Masukkan nama mu"
/>

  <p>Value: {{ nama }}</p>

</template>

<script setup>
import { ref } from 'vue'
import TextBox from './components/textbox.vue'

const nama = ref('')
</script>