import { TableStore } from '../stores/tableStore.js'


import { computed } from 'vue'
 

export function useTableHelpers() {
  const optionCache = new Map()

  function optionList(id) {
    const key = String(id)

    if (!optionCache.has(key)) {
      optionCache.set(
        key,
        computed(() => TableStore.getUniqueColumnOptions(key))
      )
    }

    return optionCache.get(key).value
  }

  return {
    optionList
  }
}
