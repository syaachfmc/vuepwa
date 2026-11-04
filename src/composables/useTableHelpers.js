
import { computed } from 'vue'
import { TableStore } from '../stores/tableStore.js'

export function getOptionFromDataList() {
  const optionCache = new Map()

  function optionDataList(id) {
    const key = String(id)

    if (!optionCache.has(key)) {
      optionCache.set(
        key,
        computed(() => TableStore.getUniqueColumnOptions(key))
      )
    }

    // Return array terbaru, bukan snapshot array saat pertama dipanggil.
    return optionCache.get(key)
  }

  return {
    optionDataList
  }
}
