
import { onMounted } from 'vue'
import { getOptionFromDataList } from './useTableHelpers.js'

import {
  globalDropdownLoadList,
  getGlobalDropdownOptions,
  globalDropdownDataMap
} from '../stores/globalDropdownStore.js'

export function getAllDropdownData() {

  // Dropdown dari Data List
  const { optionDataList } = getOptionFromDataList()

  // Load seluruh global dropdown
  onMounted(() => {
    globalDropdownLoadList()
  })

  return {
    optionDataList,
    getGlobalDropdownOptions,
    globalDropdownDataMap
  }
}
