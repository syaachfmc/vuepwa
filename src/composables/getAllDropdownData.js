
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


import {
  PlacesDropdownLoadList,
  PlacesDropdownOptions,
  PlacesDropdownDataMap
} from '../stores/PlacesDropdownStore.js'

export function getAllDropdownData() {

  // Dropdown dari Data List
  const { optionDataList } = getOptionFromDataList()

  // Load seluruh global dropdown
  onMounted(() => {
    globalDropdownLoadList()
    PODropdownLoadList()
    PlacesDropdownLoadList()
    
  })

  return {
    optionDataList,
    getGlobalDropdownOptions,
    globalDropdownDataMap,
    PODropdownOptions,
    PODropdownDataMap,
    PlacesDropdownOptions,
    PlacesDropdownDataMap
  }
}



export function getDropdownMappingList(
  DataMap,
  keyColumnID,
  targetColumnID,
  keyValue,
  isList = false
) {
  const map = DataMap.value || {}

  // Normalisasi: single value maupun array
  const keyColumns = Array.isArray(keyColumnID)
    ? keyColumnID.map(String)
    : [String(keyColumnID)]

  const keyValues = Array.isArray(keyValue)
    ? keyValue
    : [keyValue]

  const targets = map[String(targetColumnID)] || []

  // Pastikan jumlah criteria sama
  if (keyColumns.length !== keyValues.length) {
    return isList ? [] : null
  }

  // Ambil source columns
  const sources = keyColumns.map(id => map[id] || [])

  // Cari baris yang memenuhi semua criteria
  const matched = []

  const rowCount = Math.min(...sources.map(source => source.length))

  for (let index = 0; index < rowCount; index++) {
    const isMatch = sources.every(
      (source, i) => source[index] === keyValues[i]
    )

    if (isMatch && targets[index] != null) {
      matched.push(targets[index])
    }
  }

  return isList
    ? matched
    : matched[0] ?? null
}
