<template>
  <div class="form-page">
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
          <DataField dataID="12" type="dropdown" :reset-key="resetKey" :options="PODropdownList" editable
            @change="handlePOnumberChange" />
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
import { ref } from 'vue'
import { useSelectedRowForm } from '../../../composables/useSelectedRowForm.js'
import DataField from '../../inputs/DataField.vue'
import ContainerB from '../../inputs/ContainerB.vue'
import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { getOptionFromDataList } from '../../../composables/useTableHelpers.js'
import { getGlobalDropdownOptions } from '../../../stores/globalDropdownStore.js'
import { handleDataFieldChange } from './handleDataFieldChange.js'


const { optionDataList } = getOptionFromDataList()

const {
  shipmentNoError,
  shipmentNoErrorMessage,

  POAddendumList,
  PODropdownList,
  PlacesNameList,
  PlacesCountryList,
  CompaniesNameList,

  handleShipmentNoChange,
  handleShipmentTypeChange,
  handleDocumentTypeChange,
  handleShipmentArrangedByChange,
  checkValidateShipmentNo,
  handlePOnumberChange,
  handlePOAddendumChange,
  handleDeliveryTermLocationNameChange

} = handleDataFieldChange()


const resetKey = ref(0)

useSelectedRowForm({
  selectedRow: SelectedRowStore.selectedRow,
  resetKey,
  onRowChange: (newRow) => {
    checkValidateShipmentNo(newRow['2'])
  }
})


</script>
