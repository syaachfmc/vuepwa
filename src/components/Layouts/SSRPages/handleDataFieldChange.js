import { ref, computed } from 'vue'
import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { getDropdownMappingList } from '../../../composables/getAllDropdownData.js'
import { unique } from '../../../utils/tools.js'

// Global Dropdown
import { globalDropdownDataMap } from '../../../stores/globalDropdownStore.js'

// PO Dropdown
import {
  PODropdownDataMap,
  PODropdownOptions
} from '../../../stores/PODropdownStore.js'

// Places Dropdown
import {
  PlacesDropdownDataMap,
  PlacesDropdownOptions
} from '../../../stores/PlacesDropdownStore.js'

// Companies Dropdown
import {
  CompaniesDropdownOptions
} from '../../../stores/CompaniesDropdownStore.js'

export function handleDataFieldChange() {

  // ========================================
  // SHIPMENT NUMBER
  // ========================================

  const shipmentNoError = ref(false)
  const shipmentNoErrorMessage = ref('')

  const authProject = JSON.parse(
    sessionStorage.getItem('authProject') || '{}'
  )

  const projectPrefix = authProject.shipmentNoPrefix || ''

  const shipmentPattern = new RegExp(
    `^(${projectPrefix})-(S[IR][ILEO])-(\\d{5})([A-Z])?$`
  )

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

  function handleShipmentNoChange(newValue) {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    if (!checkValidateShipmentNo(newValue)) return

    const r = parseShipmentNumber(newValue)

    selectedRow['10'] =
      getDropdownMappingList(globalDropdownDataMap, '59', '9', r.shipmentType)

    selectedRow['301'] =
      getDropdownMappingList(globalDropdownDataMap, '60', '58', r.docType)

    selectedRow['11'] =
      getDropdownMappingList(globalDropdownDataMap, '60', '10', r.docType)
  }

  function handleShipmentTypeChange(newValue) {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    if (!checkValidateShipmentNo(selectedRow['2'])) return

    const r = parseShipmentNumber(selectedRow['2'])

    const typeCode = getDropdownMappingList(
      globalDropdownDataMap,
      '9',
      '59',
      newValue
    )

    if (!typeCode) return

    const newShipmentNo =
      r.projectSuffix +
      '-S' +
      r.docType +
      typeCode +
      '-' +
      r.sequence +
      r.grouping

    selectedRow['2'] = newShipmentNo
  }

  function handleDocumentTypeChange(newValue) {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    if (!checkValidateShipmentNo(selectedRow['2'])) return

    const r = parseShipmentNumber(selectedRow['2'])

    const docCode = getDropdownMappingList(
      globalDropdownDataMap,
      '58',
      '60',
      newValue
    )

    const arrangedBy = getDropdownMappingList(
      globalDropdownDataMap,
      '58',
      '10',
      newValue
    )

    if (!docCode) return

    const newShipmentNo =
      r.projectSuffix +
      '-S' +
      docCode +
      r.shipmentType +
      '-' +
      r.sequence +
      r.grouping

    selectedRow['2'] = newShipmentNo
    selectedRow['11'] = arrangedBy
  }

  function handleShipmentArrangedByChange(newValue) {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    if (!checkValidateShipmentNo(selectedRow['2'])) return

    const r = parseShipmentNumber(selectedRow['2'])

    const docCode = getDropdownMappingList(
      globalDropdownDataMap,
      '10',
      '60',
      newValue
    )

    const arrangedBy = getDropdownMappingList(
      globalDropdownDataMap,
      '10',
      '58',
      newValue
    )

    if (!docCode) return

    const newShipmentNo =
      r.projectSuffix +
      '-S' +
      docCode +
      r.shipmentType +
      '-' +
      r.sequence +
      r.grouping

    selectedRow['2'] = newShipmentNo
    selectedRow['301'] = arrangedBy
  }


  // ========================================
  // PURCHASE ORDER
  // ========================================

  function handlePOnumberChange() {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    selectedRow['13'] =
      getDropdownMappingList(
        PODropdownDataMap,
        '2',
        '3',
        selectedRow['12'],
        true
      )[0]

    handlePONo_And_AddChange()
  }

  function handlePOAddendumChange() {
    handlePONo_And_AddChange()
  }

  function handlePONo_And_AddChange() {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    selectedRow['16'] =
      getDropdownMappingList(
        PODropdownDataMap,
        ['2', '3'],
        '6',
        [selectedRow['12'], selectedRow['13']]
      )

    selectedRow['14'] =
      getDropdownMappingList(
        PODropdownDataMap,
        ['2', '3'],
        '4',
        [selectedRow['12'], selectedRow['13']]
      )

    selectedRow['15'] =
      getDropdownMappingList(
        PODropdownDataMap,
        ['2', '3'],
        '7',
        [selectedRow['12'], selectedRow['13']]
      )
  }


  // ========================================
  // DELIVERY TERM
  // ========================================

  function handleDeliveryTermLocationNameChange() {
    const selectedRow = SelectedRowStore.selectedRow.value
    if (!selectedRow) return

    selectedRow['40'] =
      getDropdownMappingList(
        PlacesDropdownDataMap,
        '3',
        '5',
        selectedRow['39']
      )
  }


  // ========================================
  // DROPDOWN OPTIONS
  // ========================================

  const POAddendumList = computed(() =>
    unique(
      getDropdownMappingList(
        PODropdownDataMap,
        '2',
        '3',
        SelectedRowStore.selectedRow.value?.['12'],
        true
      )
    )
  )

  const PODropdownList = computed(() =>
    unique(PODropdownOptions('2').value)
  )

  const PlacesNameList = computed(() =>
    unique(PlacesDropdownOptions('3').value)
  )

  const PlacesCountryList = computed(() =>
    unique(PlacesDropdownOptions('5').value)
  )

  const CompaniesNameList = computed(() =>
    unique(CompaniesDropdownOptions('2').value)
  )


  // ========================================
  // RETURN
  // ========================================

  return {
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
    parseShipmentNumber,

    handlePOnumberChange,
    handlePOAddendumChange,
    handlePONo_And_AddChange,

    handleDeliveryTermLocationNameChange
  }
}
