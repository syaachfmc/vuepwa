// getAllDropdownData.js

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

import {
  CompaniesDropdownLoadList,
  CompaniesDropdownOptions,
  CompaniesDropdownDataMap
} from '../stores/CompaniesDropdownStore.js'

// Reload seluruh global dropdown
export async function reloadDropdownData() {
  try {
    await Promise.all([
       globalDropdownLoadList(true),
      // PODropdownLoadList(true),
      // PlacesDropdownLoadList(true),
      // CompaniesDropdownLoadList(true)
    ])

    return { status: 'success' }

  } catch (err) {
    
    throw err
  }
}

export function getAllDropdownData() {

  // Dropdown dari Data List
  const { optionDataList } = getOptionFromDataList()

  // Initial load
  onMounted(() => {
    reloadDropdownData()
  })

  return {
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

  const keyColumns = Array.isArray(keyColumnID)
    ? keyColumnID.map(String)
    : [String(keyColumnID)]

  const keyValues = Array.isArray(keyValue)
    ? keyValue
    : [keyValue]

  const targets = map[String(targetColumnID)] || []

  if (keyColumns.length !== keyValues.length) {
    return isList ? [] : null
  }

  const sources = keyColumns.map(id => map[id] || [])

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
