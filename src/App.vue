<template>
  <div class="form-container">
    <div class="form-group">
      <label>TextBox Nama Aku:</label>
      <TextBox ref="textboxAku1Ref" v-model="namaku" placeholder="Masukkan nama ku" />
    </div>

    <div class="form-group">
      <label>Dropdown Pilihan Kategori:</label>
      <Dropdown ref="dropdownKategoriRef" v-model="kategori" :options="opsiKategori" placeholder="Pilih Kategori" />
    </div>

    <div class="form-group">
      <label>TextBox Nama Mu (Readonly/Disabled):</label>
      <TextBox ref="textboxAku2Ref" v-model="namaku" placeholder="Masukkan nama ku" :enabled="false" />
    </div>

    <div class="form-group">
      <label>Dropdown Role (Validasi Error):</label>
      <Dropdown ref="dropdownRoleRef" v-model="role" :options="opsiRole" placeholder="Pilih Role" :error="isRoleError"
        errorMessage="Role harus 'Admin'" :editable="true" />
    </div>

    <!-- Datepicker -->
    <div class="form-group">
      <label>Pilih Tanggal:</label>
      <VueDatePicker
        v-model="date"
        :formats="{ input: 'dd MMM yyyy' }"
        placeholder="Pilih Tanggal"
        :enable-time-picker="false"
        auto-apply
          
      />


</div>

    <div class="data-preview">
      <p><strong>Value Namaku:</strong> {{ namaku }}</p>
      <p><strong>Value Kategori:</strong> {{ kategori }}</p>
      <p><strong>Value Role:</strong> {{ role }}</p>
      <p><strong>Tanggal Terpilih:</strong> {{ date ? formatTanggal(date) : '-' }}</p>
    </div>

    <div style="margin-top: 16px;">
      <button @click="handleResetOriginal">
        Simpan & Set Nilai Asli Baru
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TextBox from './components/textbox.vue'
import Dropdown from './components/dropdown.vue'

//---- DATE
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import './assets/styles/datepicker.css'

import { formatTanggal } from './utils/tools.js'
const date = ref(null)


// --- STATE ---
const namaku = ref('')
const kategori = ref('')
const role = ref('')

// Data Opsi Dropdown
const opsiKategori = ref([
  { label: 'Elektronik', value: 'elektronik' },
  { label: 'Pakaian', value: 'pakaian' },
  { label: 'Makanan', value: 'makanan' }
])

const opsiRole = ref([
  { label: 'Administrator', value: 'Admin' },
  { label: 'User Biasa', value: 'User' },
  { label: 'Guest', value: 'Guest' }
])

// --- REFS KOMPONEN ---
const textboxAku1Ref = ref(null)
const dropdownKategoriRef = ref(null)
const textboxAku2Ref = ref(null)
const dropdownRoleRef = ref(null)

// --- COMPUTED VALIDASI ---
const isRoleError = computed(() => {
  return role.value !== '' && role.value !== 'Admin'
})

// --- HANDLER ---
function handleResetOriginal() {
  textboxAku1Ref.value?.resetOriginalValue()
  dropdownKategoriRef.value?.resetOriginalValue()
  textboxAku2Ref.value?.resetOriginalValue()
  dropdownRoleRef.value?.resetOriginalValue()
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-preview {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}



</style>

 