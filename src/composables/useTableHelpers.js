import { TableStore } from '../stores/tableStore.js'

// export function useTableHelpers() {
//   function getDataListFromColumn(columnId) {    
//     return TableStore.getUniqueColumnOptions(columnId)
   
//   }

//   return {
//     getDataListFromColumn
//   }
// }


import { computed } from 'vue'
 

export function useTableHelpers() {

  // Cache computed berdasarkan ID kolom
  const optionCache = new Map()

  function optionList(id) {
    const key = String(id)

    // Gunakan computed yang sudah ada jika ID sama
    if (!optionCache.has(key)) {
      optionCache.set(
        key,
        computed(() => TableStore.getUniqueColumnOptions(key))
      )
    }

    return optionCache.get(key)
  }

  return {
    optionList
  }
}
