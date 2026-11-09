<template>
  <div class="form-container">
    <div class="button-form-container">
      <Button label="Simpan" @click="simpanData" />
      <Button label="Reset" size="small" @click="resetData" />
      <Button label="Proses" size="large" :loading="sedangProses" @click="prosesData" />
    </div>

    <div class="form-group">
      <label>TextBox Nama Aku:</label>
      <textbox ref="textboxAku1Ref" v-model="form.namaku" placeholder="Masukkan nama ku" />
    </div>

    <div class="form-group">
      <label>TextBox Nama Aku:</label>
      <textbox ref="textboxAku4Ref" v-model="form.namaku2" placeholder="Masukkan nama ku" multiline />
    </div>

    <div class="form-group">
      <label>Dropdown Pilihan Kategori:</label>
      <dropdown
        ref="dropdownKategoriRef"
        v-model="form.kategori"
        :options="opsiKategori"
        placeholder="Pilih Kategori"
      />
    </div>

    <div class="form-group">
      <label>TextBox Nama Mu (Readonly/Disabled):</label>
      <textbox
        ref="textboxAku2Ref"
        v-model="form.namaku"
        placeholder="Masukkan nama ku"
        :enabled="false"
      />
    </div>

    <div class="form-group">
      <label>TextBox Nama Mu (Error):</label>
      <textbox
        ref="textboxAku3Ref"
        v-model="form.namaku"
        placeholder="Masukkan nama ku"
        :enabled="true"
        :error="isRoleError"
        errorMessage="ini error message"
      />
    </div>

    <div class="form-group">
      <label>Dropdown Role (Validasi Error):</label>
      <dropdown
        ref="dropdownRoleRef"
        v-model="form.role"
        :options="opsiRole"
        placeholder="Pilih Role"
        :error="isRoleError"
        errorMessage="Role harus 'Admin'"
        :editable="true"
      />
    </div>

    <div class="form-group">
      <label>Pilih Tanggal:</label>
      <DatePicker
        v-model="form.date1"
        :is-dirty="isDirty('date1')"
        :enable-time-picker="true"
      />
      <DatePicker
        v-model="form.date2"
        :is-dirty="isDirty('date2')"
        :enable-time-picker="false"
      />
    </div>

    <div class="data-preview">
      <p><strong>Value Namaku:</strong> {{ form.namaku }}</p>
      <p><strong>Value Kategori:</strong> {{ form.kategori }}</p>
      <p><strong>Value Role:</strong> {{ form.role }}</p>
      <p><strong>Tanggal Terpilih:</strong> {{ form.date1 ? formatTanggal(form.date1) : '-' }}</p>
      <p><strong>Tanggal Terpilih:</strong> {{ form.date2 ? formatTanggal(form.date2) : '-' }}</p>
    </div>

    <div style="margin-top: 16px;">
      <button type="button" @click="handleResetOriginal">
        Simpan & Set Nilai Asli Baru
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from '../../inputs/Button.vue'
import textbox from '../../inputs/textbox.vue'
import dropdown from '../../inputs/dropdown.vue'
import DatePicker from '../../inputs/DatePicker.vue'

import { formatTanggal } from '../../../utils/tools.js'

// ---- COMPOSABLE FORMS
import { useFormTracker } from '../../../composables/useFormTracker.js'

// 1. Inisialisasi Form Tracker
const { form, isDirty, commitOriginal } = useFormTracker({
  namaku: '',
  kategori: '',
  role: '',
  date1: null,
  date2: null
})

// Data Opsi Dropdown
const opsiKategori = ref([
  { label: 'Elektronik', value: 'elektronik' },
  { label: 'Pakaian', value: 'pakaian' },
  { label: 'Makanan', value: 'makanan' },
  { label: 'Elektronik', value: 'elektronik' },
  { label: 'Pakaian', value: 'pakaian' },
  { label: 'Makanan', value: 'makanan' },
  { label: 'Elektronik', value: 'elektronik' },
  { label: 'Pakaian', value: 'pakaian' },
  { label: 'Majjjjjjjj jjjjjjjjjjjj jjjjj jjjjjj jjjjjjjjj jjjjjjjj  jjjj jjjjjjkanan', value: 'makanan' }
])

const opsiRole = ref([
  { label: 'Administrator', value: 'Admin' },
  { label: 'User Biasa', value: 'User' },
  { label: 'Guest', value: 'Guest' },
  { label: 'Administrator', value: 'Admin' },
  { label: 'User Biasa', value: 'User' },
  { label: 'Guest', value: 'Guest' },
  { label: 'Administrator', value: 'Admin' },
  { label: 'User Biasa', value: 'User' },
  { label: 'Guest', value: 'Guest' },
  { label: 'Administrator', value: 'Admin' },
  { label: 'User Biasa', value: 'khkjhkhkjhhkjhkhkhkhkhkhkhkhkhkhkhkhkhkhkj' },
  { label: 'Guest mkmkmkmkmkmkmkmkmkmkmkmkmkmkmkm', value: 'Guest' }
])

// --- REFS KOMPONEN ---
const textboxAku1Ref = ref(null)
const dropdownKategoriRef = ref(null)
const textboxAku2Ref = ref(null)
const textboxAku3Ref = ref(null)
const dropdownRoleRef = ref(null)
const textboxAku4Ref = ref(null)

// --- COMPUTED VALIDASI ---
const isRoleError = computed(() => {
  return form.role !== '' && form.role !== 'Admin'
})

// --- HANDLER SIMPAN / RESET ---
function handleResetOriginal() {
  commitOriginal([
    textboxAku1Ref,
    dropdownKategoriRef,
    textboxAku2Ref,
    textboxAku3Ref,
    dropdownRoleRef,
    textboxAku4Ref
  ])
}

const sedangProses = ref(false)

function simpanData() {
  console.log('Simpan:', form.namaku)
}

function resetData() {
  form.namaku = ''
}

function prosesData() {
  console.log('Proses data')
}
</script>

<style scoped>
.button-form-container {
  display: flex;
  flex-direction: row;
  gap: 12px;

  max-width: 200px;
  flex-wrap: nowrap;

  border: 1px;
  border-style: solid;
  padding: 5px;
  overflow: auto;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-direction: row;
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

.data-preview {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: auto;
  min-width: 200px;
}
</style>