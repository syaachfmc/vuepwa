<template>
  <div class="shipment-page">
    <div class="form-container">

      <ContainerB title="Shipment">
        <div class="dataItemContainer">
          <DataField dataID="2" type="text" :reset-key="resetKey" :font="{ weight: '800' }"
            :size="{ width: '170px', height: '32px' }" @change="handleShipmentNoChange" :error="shipmentNoError"
            :errorMessage="shipmentNoErrorMessage" />
          <DataField dataID="5" type="date" :reset-key="resetKey" />
          <DataField dataID="3" type="text" :reset-key="resetKey" :size="{ width: '140px', height: '32px' }" />
        </div>
        <div class="dataItemContainer">
          <DataField dataID="9" type="dropdown" :reset-key="resetKey" editable :options="optionDataList('9').value"
            :size="{ width: '480px', height: '32px' }" />
        </div>
      </ContainerB>

      <ContainerB title="Arrange">
        <div class="dataItemContainer">
          <DataField dataID="10" type="dropdown" :reset-key="resetKey" editable :options="getGlobalDropdownOptions('9')"
            :size="{ width: '150px', height: '32px' }" @change="handleShipmentTypeChange" />
          <DataField dataID="11" type="dropdown" :reset-key="resetKey" editable
            :options="getGlobalDropdownOptions('10')" :size="{ width: '120px', height: '32px' }"
            @change="handleShipmentArrangedByChange" />
        </div>
        <div class="dataItemContainer">
          <DataField dataID="301" type="dropdown" :reset-key="resetKey" editable
            :options="getGlobalDropdownOptions('58')" :size="{ width: '150px', height: '32px' }"
            @change="handleDocumentTypeChange" />
          <DataField dataID="4" type="dropdown" :reset-key="resetKey" editable :options="optionDataList('4').value"
            :size="{ width: '120px', height: '32px' }" :font="{ weight: '800' }" />
        </div>
      </ContainerB>


      <ContainerB title="PO">
        <div class="dataItemContainer">
          <DataField dataID="12" type="dropdown" :reset-key="resetKey" :options="PODropdownList"
            editable @change="handlePOnumberChange" />
          <DataField dataID="13" type="dropdown" :reset-key="resetKey" :options="POAddendumList"
            :size="{ width: '60px', height: '32px' }" editable @change="handlePOAddendumChange" />

          <DataField dataID="16" type="text" :reset-key="resetKey" :size="{ width: '200px', height: '32px' }" readOnly
            flat />
        </div>
        <div class="dataItemContainer">
          <DataField dataID="14" type="text" :reset-key="resetKey" :size="{ width: '390px', height: '32px' }" readOnly
            flat />
          <DataField dataID="15" type="text" :reset-key="resetKey" :size="{ width: '90px', height: '32px' }" readOnly
            flat />
        </div>
      </ContainerB>
      <ContainerB title="Delivery Term">
        <div class="dataItemContainer">
          <DataField dataID="38" type="dropdown" editable :reset-key="resetKey"
            :size="{ width: '90px', height: '32px' }" :options="getGlobalDropdownOptions('5')" />
          <DataField dataID="39" type="dropdown" :reset-key="resetKey" :size="{ width: '250px', height: '32px' }"
            :options="PlacesNameList" editable @input="handleDeliveryTermLocationNameChange"
            @change="handleDeliveryTermLocationNameChange" />
        </div>
        <div class="dataItemContainer">
          <DataField dataID="40" type="dropdown" :reset-key="resetKey" :size="{ width: '300px', height: '32px' }"
            :options="PlacesCountryList" editable />
          <DataField dataID="41" type="checkbox" :reset-key="resetKey" />
        </div>

      </ContainerB>


      <div class="gridfullrow">
        <ContainerB title="RSR">
          <div class="dataItemContainer">
            <DataField dataID="6" type="text" :reset-key="resetKey" />
            <DataField dataID="7" type="date" :reset-key="resetKey" />
            <DataField dataID="8" type="date" :reset-key="resetKey" />
          </div>
          <div class="dataItemContainer">
            <DataField dataID="17" type="dropdown" :reset-key="resetKey" :size="{ width: '250px', height: '32px' }"
              :options="CompaniesNameList" editable />
            <!-- <DataField v-model:textValue="rText" type="dropdown" :reset-key="resetKey"
              :size="{ width: '250px', height: '32px' }" :options="CompaniesNameList" editable
              labelText="Shipper Countrry" /> -->
          </div>
        </ContainerB>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onBeforeUnmount, computed } from 'vue'
import DataField from '../../inputs/DataField.vue'
import ContainerB from '../../inputs/ContainerB.vue'
import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { useFormTracker } from '../../../composables/useFormTracker.js'
import { getAllDropdownData, getDropdownMappingList } from '../../../composables/getAllDropdownData.js'
import { unique } from '../../../utils/tools.js'
import { createDataFieldChangeHandlers } from './handleDataFieldChange.js'

const {
  optionDataList,
  getGlobalDropdownOptions,
  globalDropdownDataMap,
  PODropdownOptions,
  PODropdownDataMap,
  PlacesDropdownOptions,
  PlacesDropdownDataMap,
  reloadDropdownData,
  CompaniesDropdownOptions,
  CompaniesDropdownDataMap
} = getAllDropdownData()

 
const {
  shipmentNoError,
  shipmentNoErrorMessage,
  handleShipmentNoChange,
  handleShipmentTypeChange,
  handleDocumentTypeChange,
  handleShipmentArrangedByChange,
  checkValidateShipmentNo,
  parseShipmentNumber,
  handlePOnumberChange,
  handlePOAddendumChange,
  handlePONo_And_AddChange,
  handleDeliveryTermLocationNameChange
} = createDataFieldChangeHandlers({
  globalDropdownDataMap,
  PODropdownDataMap,
  PlacesDropdownDataMap
})

const POAddendumList = computed(() =>
  unique(getDropdownMappingList(PODropdownDataMap, '2', '3', SelectedRowStore.selectedRow.value?.['12'], true))
)

const PODropdownList = computed(() =>
  unique(PODropdownOptions('2').value)
)

const PlacesNameList = computed(() =>
  unique(PlacesDropdownOptions("3").value)
)

const PlacesCountryList = computed(() =>
  unique(PlacesDropdownOptions("5").value)
)

const CompaniesNameList = computed(() =>
  unique(CompaniesDropdownOptions("2").value)
)


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
  display: grid;
  grid-template-columns: repeat(2, minmax(max-content, 1fr));
  /* Membuat 2 kolom sama besar */
  overflow: auto;
  gap: 12px;
  border: 1px solid #919fa13f;
  padding: 8px;


}

.dataItemContainer {
  display: flex;
  flex-direction: row;
  gap: 10px;

}

.gridfullrow {
  grid-column: span 2;
}
</style>