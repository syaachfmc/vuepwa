<template>
  <div class="shipment-page">
    <div class="form-container">

      <ContainerB title="Shipment">
        <div class="divrow">
         
          <DataField id="5" type="date" :reset-key="resetKey" /> 
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