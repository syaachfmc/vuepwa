<template>
  <div class="form-container">
    <div class="form-group">
      <label>TextBox Nama Aku:</label>
      <TextBox ref="textboxAku1Ref" v-model="form.namaku" placeholder="Masukkan nama ku" />
    </div>

    <div class="form-group">
      <label>Dropdown Pilihan Kategori:</label>
      <Dropdown ref="dropdownKategoriRef" v-model="form.kategori" :options="opsiKategori" placeholder="Pilih Kategori" />
    </div>

    <div class="form-group">
      <label>TextBox Nama Mu (Readonly/Disabled):</label>
      <TextBox ref="textboxAku2Ref" v-model="form.namaku" placeholder="Masukkan nama ku" :enabled="false" />
    </div>

    <div class="form-group">
      <label>TextBox Nama Mu (Error):</label>
      <TextBox ref="textboxAku3Ref" v-model="form.namaku" placeholder="Masukkan nama ku" :enabled="true" :error="isRoleError" errorMessage="ini error message" />
    </div>

    <div class="form-group">
      <label>Dropdown Role (Validasi Error):</label>
      <Dropdown ref="dropdownRoleRef" v-model="form.role" :options="opsiRole" placeholder="Pilih Role" :error="isRoleError" errorMessage="Role harus 'Admin'" :editable="true" />
    </div>

    <div class="form-group">
      <label>Pilih Tanggal:</label>
      <div class="datepicker-wrapper">
        <!-- Dirty Badge otomatis via isDirty('date1') -->
        <span v-if="isDirty('date1')" class="dirty-badge" title="Data telah diubah"></span>
        <VueDatePicker
          v-model="form.date1"
          :formats="{ input: 'dd MMM yyyy' }"
          placeholder="Pilih Tanggal"
          :enable-time-picker="true"
          auto-apply
        />
      </div>
      <div class="datepicker-wrapper">
        <!-- Dirty Badge otomatis via isDirty('date2') -->
        <span v-if="isDirty('date2')" class="dirty-badge" title="Data telah diubah"></span>
        <VueDatePicker
          v-model="form.date2"
          :formats="{ input: 'dd MMM yyyy' }"
          placeholder="Pilih Tanggal"
          :enable-time-picker="false"
          auto-apply
        />
      </div>
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
import TextBox from './components/textbox.vue'
import Dropdown from './components/dropdown.vue'

// ---- DATE & STYLES
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import './assets/styles/datepicker.css'
import './assets/styles/dirtybadge.css'
import { APP_COLORS } from './constants/colors.js'
import { formatTanggal } from './utils/tools.js'

// ---- COMPOSABLE FORMS
import { useFormTracker } from './useFormTracker.js'

// 1. Inisialisasi Form Tracker (Semua state & status dirty terkumpul di sini)
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
const textboxAku3Ref = ref(null)
const dropdownRoleRef = ref(null)

// --- COMPUTED VALIDASI ---
const isRoleError = computed(() => {
  return form.role !== '' && form.role !== 'Admin'
})

// --- HANDLER SIMPAN / RESET ---
function handleResetOriginal() {
  // Cukup teruskan array refs komponen ke commitOriginal
  commitOriginal([
    textboxAku1Ref,
    dropdownKategoriRef,
    textboxAku2Ref,
    textboxAku3Ref,
    dropdownRoleRef
  ])
}
</script>

<style scoped>
.datepicker-wrapper {
  position: relative;
  display: inline-block;
  width: fit-content;

  --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
  --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
  --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
}

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