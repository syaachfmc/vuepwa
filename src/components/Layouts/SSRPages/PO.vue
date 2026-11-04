<template>
  <div class="shipment-page">
    <div class="form-container">

      <div class="dataItemContainer container-row">
        <ContainerB title="PO">
          <div class="dataItemContainer">
            <DataField id="12" type="text" :reset-key="resetKey" />
            <DataField id="13" type="text" :reset-key="resetKey" :size="{ width: '70px', height: '32px' }" />
            <DataField id="15" type="text" :reset-key="resetKey" :size="{ width: '100px', height: '32px' }" />
          </div>
          <div class="dataItemContainer">
            <DataField id="16" type="dropdown" :reset-key="resetKey" :size="{ width: '390px', height: '32px' }" editable
              :options="optionDataList('16').value" />
          </div>
        </ContainerB>
        <ContainerB title="Delivery Term">
          <div class="dataItemContainer">
            <DataField id="38" type="dropdown" editable :reset-key="resetKey" :size="{ width: '90px', height: '32px' }"
              :options="getGlobalDropdownOptions('5')" />
            <DataField id="39" type="text" :reset-key="resetKey" :size="{ width: '250px', height: '32px' }" />
          </div>
          <div class="dataItemContainer">
            <DataField id="40" type="text" :reset-key="resetKey" :size="{ width: '300px', height: '32px' }" />
            <DataField id="41" type="checkbox" :reset-key="resetKey" />
          </div>
        </ContainerB>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import DataField from '../../inputs/DataField.vue'

import ContainerB from '../../inputs/ContainerB.vue'

import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { useFormTracker } from '../../../composables/useFormTracker.js'
import { getOptionFromDataList } from '../../../composables/useTableHelpers.js'

import {   globalDropdownLoadList, getGlobalDropdownOptions,  globalDropdownDataMap } from '../../../stores/globalDropdownStore.js'


onMounted(() => {
  // Ambil data dropdown saat komponen dimuat
  globalDropdownLoadList();
});

function getDropdownMapping(sourceID, targetID, value) {
  const source = globalDropdownDataMap.value[String(sourceID)] || []
  const target = globalDropdownDataMap.value[String(targetID)] || []

  const index = source.indexOf(value)

  return index !== -1 ? target[index] ?? null : null
}

/***********HANDLE PERUBAHAN KODE NOMOR SHIPMENT DOM/IMP - SI/SR */
// ========================================
// PROJECT PREFIX
// ========================================
const authProject = JSON.parse(
  sessionStorage.getItem("authProject") || "{}"
);
const projectPrefix = authProject.shipmentNoPrefix || '';


// Regex untuk membaca Shipment Number

const shipmentPattern = new RegExp(
  `^(${projectPrefix})-(S[IR][ILEO])-(\\d{5})([A-Z])?$`
);

// Error state Shipment Number
const shipmentNoError = ref(false)
const shipmentNoErrorMessage = ref('')


function handleShipmentNoChange(newValue) {
  if(!SelectedRowStore.selectedRow.value)return  
  if (!checkValidateShipmentNo(newValue)) return
  const r = parseShipmentNumber(newValue)
  SelectedRowStore.selectedRow.value['10'] =
    getDropdownMapping('59', '9', r.shipmentType)
  SelectedRowStore.selectedRow.value['301'] =
    getDropdownMapping('60', '58', r.docType)
  SelectedRowStore.selectedRow.value['11'] =
    getDropdownMapping('60', '10', r.docType)
}

function handleShipmentTypeChange(newValue) {
  if(!SelectedRowStore.selectedRow.value)return  
  if (!checkValidateShipmentNo(SelectedRowStore.selectedRow.value['2'])) return
  const r = parseShipmentNumber(SelectedRowStore.selectedRow.value['2'])  
  const typeCode = getDropdownMapping('9', '59', newValue)
  if (!typeCode) return
  const newShipmentNo =
    r.projectSuffix +
    '-S' +
    r.docType +
    typeCode +
    '-' +
    r.sequence +
    r.grouping
  SelectedRowStore.selectedRow.value['2'] = newShipmentNo
}

function handleDocumentTypeChange(newValue) {
  if(!SelectedRowStore.selectedRow.value)return  
  if (!checkValidateShipmentNo(SelectedRowStore.selectedRow.value['2'])) return
  const r = parseShipmentNumber(SelectedRowStore.selectedRow.value['2'])
  const docCode = getDropdownMapping('58', '60', newValue)
  const arrangedBy = getDropdownMapping('58', '10', newValue)
  if (!docCode) return
  const newShipmentNo =
    r.projectSuffix +
    '-S' +
    docCode +
    r.shipmentType +
    '-' +
    r.sequence +
    r.grouping
  SelectedRowStore.selectedRow.value['2'] = newShipmentNo
  SelectedRowStore.selectedRow.value['11'] = arrangedBy
}

function handleShipmentArrangedByChange(newValue) {
  if(!SelectedRowStore.selectedRow.value)return  
  if (!checkValidateShipmentNo(SelectedRowStore.selectedRow.value['2'])) return
  const r = parseShipmentNumber(SelectedRowStore.selectedRow.value['2'])
  const docCode = getDropdownMapping('10', '60', newValue)
  const arrangedBy = getDropdownMapping('10', '58', newValue)
  if (!docCode) return
  const newShipmentNo =
    r.projectSuffix +
    '-S' +
    docCode +
    r.shipmentType +
    '-' +
    r.sequence +
    r.grouping
  SelectedRowStore.selectedRow.value['2'] = newShipmentNo
  SelectedRowStore.selectedRow.value['301'] = arrangedBy
}

function checkValidateShipmentNo(value) {
  const r = parseShipmentNumber(value)

  if (!r) {
    shipmentNoError.value = true
    shipmentNoErrorMessage.value = 'Shipment Number tidak valid'
    return false
  }

  shipmentNoError.value = false
  shipmentNoErrorMessage.value = ''

  return true
}

function parseShipmentNumber(value) {
  if (typeof value !== 'string') return null
  const match = value.trim().match(shipmentPattern)
  if (!match) return null
  return {
    projectSuffix: match[1] ?? '',
    docType: match[2]?.[1] ?? '',
    shipmentType: match[2]?.[2] ?? '',
    sequence: match[3] ?? '',
    grouping: match[4] ?? ''
  }
}

/****************************** */

const { optionDataList } = getOptionFromDataList()

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

    // Validasi Shipment Number dari row yang dipilih     
    checkValidateShipmentNo(newRow['2'])

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
  width: 100%;

}

.form-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid #ccc;
  padding: 8px;


}

.dataItemContainer {
  display: flex;
  flex-direction: row;
  gap: 10px;

}

.container-row {
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
  align-items: stretch;
}

.container-row>* {
  flex: 1 1 auto;
  min-width: max-content;
}
</style>