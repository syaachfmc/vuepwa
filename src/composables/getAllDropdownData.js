
import { onMounted } from 'vue'
import { getOptionFromDataList } from './useTableHelpers.js'

import {
  globalDropdownLoadList,
  getGlobalDropdownOptions,
  globalDropdownDataMap
} from '../stores/globalDropdownStore.js'

import {
  PODropdownLoadList,
  PODropdownOptions,
  PODropdownDataMap
} from '../stores/PODropdownStore.js'


export function getAllDropdownData() {

  // Dropdown dari Data List
  const { optionDataList } = getOptionFromDataList()

  // Load seluruh global dropdown
  onMounted(() => {
    globalDropdownLoadList()
    PODropdownLoadList()
  })

  return {
    optionDataList,

    getGlobalDropdownOptions,
    globalDropdownDataMap,

    PODropdownOptions,
    PODropdownDataMap
  }
}


// Mengembalikan satu data target pertama yang cocok
export function getDropdownMapping(DataMap, sourceID, targetID, value) {
  const source = DataMap.value[String(sourceID)] || []
  const target = DataMap.value[String(targetID)] || []

  const index = source.indexOf(value)

  return index !== -1 ? target[index] ?? null : null
}


// Mengembalikan seluruh data target yang cocok
export function getDropdownMappingList(DataMap, sourceID, targetID, value) {
  const source = DataMap.value[String(sourceID)] || []
  const target = DataMap.value[String(targetID)] || []

  return source.reduce((result, item, index) => {
    if (item === value && target[index] !== undefined && target[index] !== null) {
      result.push(target[index])
    }

    return result
  }, [])
}
