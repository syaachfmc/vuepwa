<template>
  <div class="shipment-page">
    <div class="form-container">

      <ContainerB title="Shipment">
        <div class="divrow">
          <DataField id="2" type="text" :reset-key="resetKey" :font="{ weight: '800' }" />
          <DataField id="5" type="date" :reset-key="resetKey" />
          <DataField id="3" type="text" :reset-key="resetKey" />
          <DataField id="4" type="dropdown" :reset-key="resetKey" editable :options="getDropdownOptions('5')"
            :width="'10px'" />

        </div>

        <div class="divrow">
          <DataField id="9" type="dropdown" :reset-key="resetKey" editable :options="optionDataList('9')"
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
            <DataField id="16" type="dropdown" :reset-key="resetKey" :size="{ width: '390px', height: '32px' }" editable
              :options="optionDataList('16')" />
          </div>
        </ContainerB>
        <ContainerB title="Delivery Term">
          <div class="divrow">
            <DataField id="38" type="dropdown" editable :reset-key="resetKey" :size="{ width: '90px', height: '32px' }"
              :options="getDropdownOptions('5')" />
            <DataField id="39" type="text" :reset-key="resetKey" :size="{ width: '250px', height: '32px' }" />
          </div>
          <div class="divrow">
            <DataField id="40" type="text" :reset-key="resetKey" :size="{ width: '300px', height: '32px' }" />
            <DataField id="41" type="checkbox" :reset-key="resetKey" />
          </div>
        </ContainerB>

      </div>

      <ContainerB title="RSR">
        <div class="divrow">
          <DataField id="6" type="text" :reset-key="resetKey" />
          <DataField id="7" type="date" :reset-key="resetKey" />
          <DataField id="8" type="date" :reset-key="resetKey" />
        </div>

      </ContainerB>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import DataField from '../../inputs/DataField.vue'

import ContainerB from '../../inputs/ContainerB.vue'

import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { useFormTracker } from '../../../composables/useFormTracker.js'
import { useTableHelpers } from '../../../composables/useTableHelpers.js'

import { loadDropdownList, getDropdownOptions } from '../../../stores/dropdownStore.js'

onMounted(() => {
  // Ambil data dropdown saat komponen dimuat
  loadDropdownList();
});


const { optionDataList } = useTableHelpers()

const isSwitchingRow = ref(false)

// Inisialisasi Tracker & Handler
const resetKey = ref(0)

const {
  form,
  isDirty,
  commitOriginal,
  resetToOriginal,
  unregister
} = useFormTracker(SelectedRowStore.selectedRow.value, {
  refresh: () => resetKey.value++
})

onBeforeUnmount(() => {
  unregister()
})


// Snapshot untuk mendeteksi field yang benar-benar berubah
function cloneFormData(data) {
  if (data instanceof Date) return new Date(data.getTime())

  if (Array.isArray(data)) {
    return data.map(item => cloneFormData(item))
  }

  if (data && typeof data === 'object') {
    const result = {}
    Object.keys(data).forEach(key => {
      result[key] = cloneFormData(data[key])
    })
    return result
  }

  return data
}

function isSameValue(a, b) {
  if (a instanceof Date || b instanceof Date) {
    const dateA = a == null || a === '' ? null : new Date(a).getTime()
    const dateB = b == null || b === '' ? null : new Date(b).getTime()
    return dateA === dateB
  }

  if (a === b) return true

  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false
  }

  return JSON.stringify(a) === JSON.stringify(b)
}

let lastSyncedForm = {}

// Saat baris yang dipilih berubah
watch(
  () => SelectedRowStore.selectedRow.value,
  async (newRow) => {
    if (!newRow || Object.keys(newRow).length === 0) return

    isSwitchingRow.value = true

    commitOriginal([], newRow)
    lastSyncedForm = cloneFormData(newRow)
    resetKey.value++

    await nextTick()
    isSwitchingRow.value = false
  },
  { deep: false, immediate: true }
)

// Sinkronkan hanya field yang berubah
watch(
  form,
  (newForm) => {
    if (isSwitchingRow.value) return

    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow || Object.keys(selectedRow).length === 0) return

    Object.keys(newForm).forEach(key => {
      if (key.startsWith('__')) return

      if (!isSameValue(newForm[key], lastSyncedForm[key])) {
        selectedRow[key] = cloneFormData(newForm[key])
      }
    })

    lastSyncedForm = cloneFormData(newForm)
  },
  { deep: true }
)



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