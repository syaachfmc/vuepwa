<template>
    <div class="form-container">
      <div class="form-group">
        <label>TextBox Nama Aku:</label>
        <TextBox ref="textboxAku1Ref" v-model="namaku" placeholder="Masukkan nama ku" 
        
        />
      </div>
  
      <div class="form-group">
        <label>Dropdown Pilihan Kategori:</label>
        <Dropdown ref="dropdownKategoriRef" v-model="kategori" :options="opsiKategori" placeholder="Pilih Kategori"
          
         />
      </div>
  
      <div class="form-group">
        <label>TextBox Nama Mu (Readonly/Disabled):</label>
        <TextBox ref="textboxAku2Ref" v-model="namaku" placeholder="Masukkan nama ku" :enabled="false" 
        
        />
      </div>
  
      <div class="form-group">
        <label>TextBox Nama Mu (Error):</label>
        <TextBox ref="textboxAku3Ref" v-model="namaku" placeholder="Masukkan nama ku" :enabled="true" :error="isRoleError"  errorMessage="ini error message" 
        
        />
      </div>
  
  
      <div class="form-group">
        <label>Dropdown Role (Validasi Error):</label>
        <Dropdown ref="dropdownRoleRef" v-model="role" :options="opsiRole" placeholder="Pilih Role" :error="isRoleError"
          
          errorMessage="Role harus 'Admin'" :editable="true" />
      </div>
  
      <div class="form-group">
        <label>Pilih Tanggal:</label>
        <div class="datepicker-wrapper">
          <!-- Dirty Badge -->
          <span v-if="isDate1Dirty" class="dirty-badge" title="Data telah diubah"></span>
          <VueDatePicker
            v-model="date1"
            :formats="{ input: 'dd MMM yyyy' }"
            placeholder="Pilih Tanggal"
            :enable-time-picker="true"
            auto-apply
           
          />
        </div>
        <div class="datepicker-wrapper">
          <!-- Dirty Badge -->
          <span v-if="isDate2Dirty" class="dirty-badge" title="Data telah diubah"></span>
          <VueDatePicker
            v-model="date2"
            :formats="{ input: 'dd MMM yyyy' }"
            placeholder="Pilih Tanggal"
            :enable-time-picker="false"
            
            auto-apply
          />
        </div>
      </div>

  
      <div class="data-preview">
        <p><strong>Value Namaku:</strong> {{ namaku }}</p>
        <p><strong>Value Kategori:</strong> {{ kategori }}</p>
        <p><strong>Value Role:</strong> {{ role }}</p>
        <p><strong>Tanggal Terpilih:</strong> {{ date1 ? formatTanggal(date1) : '-' }}</p>
        <p><strong>Tanggal Terpilih:</strong> {{ date2 ? formatTanggal(date2) : '-' }}</p>      </div>
  
      <div style="margin-top: 16px;">
        <button @click="handleResetOriginal">
          Simpan & Set Nilai Asli Baru
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import TextBox from './components/textbox.vue'
  import Dropdown from './components/dropdown.vue'
  
  // ---- DATE & STYLES
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import '@vuepic/vue-datepicker/dist/main.css'
  import './assets/styles/datepicker.css'
  import './assets/styles/dirtybadge.css' // 1. Wajib import CSS dirty badge
  import { APP_COLORS } from './constants/colors.js'
  import { formatTanggal } from './utils/tools.js'
  
  // --- STATE ---
  const namaku = ref('')
  const kategori = ref('')
  const role = ref('')
  const date1 = ref(null)
  const date2 = ref(null)
  
  // 2. State untuk menyimpan nilai awal tanggal
  const initialDate1 = ref(null)
  const initialDate2 = ref(null)
  
  onMounted(() => {
    initialDate1.value = date1.value
    initialDate2.value = date2.value
  })
  
  // 3. Computed check status dirty tanggal
  const isDate1Dirty = computed(() => {
    const current = date1.value ? new Date(date1.value).getTime() : null
    const initial = initialDate1.value ? new Date(initialDate1.value).getTime() : null
    return current !== initial
  })

  const isDate2Dirty = computed(() => {
    const current = date2.value ? new Date(date2.value).getTime() : null
    const initial = initialDate2.value ? new Date(initialDate2.value).getTime() : null
    return current !== initial
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
    return role.value !== '' && role.value !== 'Admin'
  })
  
  // --- HANDLER ---
  function handleResetOriginal() {
    textboxAku1Ref.value?.resetOriginalValue()
    dropdownKategoriRef.value?.resetOriginalValue()
    textboxAku2Ref.value?.resetOriginalValue()
    textboxAku3Ref.value?.resetOriginalValue()
    dropdownRoleRef.value?.resetOriginalValue()
    
    // 4. Reset status dirty tanggal setelah simpan
    initialDate1.value = date1.value
    initialDate2.value = date2.value
  }
  </script>

  
  <style scoped>

.datepicker-wrapper {
  position: relative;
  display: inline-block;
  width: fit-content;

  /* 2. Deklarasikan variabel CSS dirty badge menggunakan APP_COLORS */
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
  
   