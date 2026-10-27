<template>
  <div class="shipment-page">
    <div class="form-container">

      <ContainerB title="Shipment">
        <div class="divrow">
          <DataField id="2" type="text" :reset-key="resetKey" :font="{ weight: '800' }" />
          <DataField id="5" type="date" :reset-key="resetKey" />
          <DataField id="3" type="text" :reset-key="resetKey" />
          <DataField id="4" type="dropdown" :reset-key="resetKey" editable :options="optionList(4)" :width="'10px'" />
        </div>
        <div class="divrow">
          <DataField id="9" type="dropdown" :reset-key="resetKey" editable :options="optionList('9')"
            :size="{ width: '780px', height: '32px' }" multiline />
        </div>
      </ContainerB>

      <div class="divrow">
        <ContainerB title="PO">
          <div class="divrow">
            <DataField id="12" type="text" :reset-key="resetKey" />
            <DataField id="13" type="text" :reset-key="resetKey" :size="{ width: '70px', height: '32px' }" />
            <DataField id="15" type="text" :reset-key="resetKey" :size="{ width: '100px', height: '32px' }" />
          </div>
          <div class="divrow">
            <DataField id="16" type="dropdown" :reset-key="resetKey" :size="{ width: '390px', height: '32px' }" editable :options="optionList('16')" />
          </div>
        </ContainerB>
        <ContainerB title="Delivery Term">
          <div class="divrow">
            <DataField id="38" type="text" :reset-key="resetKey" :size="{ width: '90px', height: '32px' }"/>
            <DataField id="39" type="text" :reset-key="resetKey" :size="{ width: '250px', height: '32px' }"/>
          </div>
          <div class="divrow">
            <DataField id="40" type="text" :reset-key="resetKey" />
          </div>
        </ContainerB>

      </div>

      <ContainerB title="RSR">
        <div class="divrow">
          <DataField id="6" type="text" :reset-key="resetKey" />
          <DataField id="7" type="date" :reset-key="resetKey" />
          <DataField id="8" type="date" :reset-key="resetKey" />
        </div>
        <div class="divrow">

          <DataField id="41" type="text" :reset-key="resetKey" />
        </div>
      </ContainerB>
    </div>

    <div class="action-buttons">
      <button @click="handleSave">Simpan</button>
      <button @click="handleReset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, computed } from 'vue'
import DataField from '../../inputs/DataField.vue'

import ContainerB from '../../inputs/ContainerB.vue'

import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { useFormTracker } from '../../../composables/useFormTracker.js'
import { useTableHelpers } from '../../../composables/useTableHelpers.js'

const { optionList } = useTableHelpers()


// Import helper
const { getDataListFromColumn } = useTableHelpers()

const isSwitchingRow = ref(false)
const resetKey = ref(0)

// Inisialisasi Tracker & Handler
const { form, isDirty, commitOriginal, resetToOriginal } = useFormTracker(
  SelectedRowStore.selectedRow.value
)

watch(
  () => SelectedRowStore.selectedRow.value,
  async (newRow) => {
    if (newRow && Object.keys(newRow).length > 0) {
      isSwitchingRow.value = true
      commitOriginal([], newRow)
      resetKey.value++

      await nextTick()
      isSwitchingRow.value = false
    }
  },
  { deep: false, immediate: true }
)

watch(
  form,
  (newForm) => {
    if (isSwitchingRow.value) return
    if (SelectedRowStore.selectedRow.value) {
      Object.assign(SelectedRowStore.selectedRow.value, newForm)
    }
  },
  { deep: true }
)

function handleSave() {
  const currentData = SelectedRowStore.selectedRow.value
  if (currentData) {
    commitOriginal([], currentData)
    resetKey.value++
    console.log('Data Shipment tersimpan:', currentData[2])
  }
}

function handleReset() {
  resetToOriginal()
  if (SelectedRowStore.selectedRow.value) {
    Object.assign(SelectedRowStore.selectedRow.value, form)
  }
  resetKey.value++
}
</script>
<style scoped>
.shipment-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;
}

.form-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 12px;
  overflow-x: auto;
  border: 1px solid #ccc;
  padding: 8px;

}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 6px 12px;
  cursor: pointer;
}

.divcolumn {
  display: flex;
  flex-direction: column;
}

.divrow {
  display: flex;
  flex-direction: row;
  gap: 10px;
 
}
</style>