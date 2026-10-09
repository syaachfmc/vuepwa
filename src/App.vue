<template>
  <TextBox 
    ref="textboxAku1Ref"
    v-model="namaku" 
    placeholder="Masukkan nama ku" 
  /> __
  
  <TextBox 
    ref="textboxMu1Ref"
    v-model="namamu" 
    placeholder="Masukkan nama mu" 
  />
  
  <TextBox 
    ref="textboxAku2Ref"
    v-model="namaku" 
    placeholder="Masukkan nama ku"
    :enabled="false"
  /> __
  
  <TextBox 
    ref="textboxMu2Ref"
    v-model="namamu" 
    placeholder="Ketik 'aku' agar tidak error" 
    :error="isNamamuError"
    errorMessage="Nama harus berisi 'aku'"
  />

  <p>Value Namaku: {{ namaku }}</p>
  <p>Value Namamu: {{ namamu }}</p>

  <div style="margin-top: 16px;">
    <button @click="handleResetOriginal">
      Simpan & Set Nilai Asli Baru
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TextBox from './components/textbox.vue'

const namaku = ref('')
const namamu = ref('')

// Daftarkan Ref untuk keempat Textbox
const textboxAku1Ref = ref(null)
const textboxMu1Ref = ref(null)
const textboxAku2Ref = ref(null)
const textboxMu2Ref = ref(null)

const isNamamuError = computed(() => {
  return namamu.value !== 'aku'
})

function handleResetOriginal() {
  // Riset nilai asli ke semua instance textbox
  textboxAku1Ref.value?.resetOriginalValue()
  textboxMu1Ref.value?.resetOriginalValue()
  textboxAku2Ref.value?.resetOriginalValue()
  textboxMu2Ref.value?.resetOriginalValue()
}
</script>