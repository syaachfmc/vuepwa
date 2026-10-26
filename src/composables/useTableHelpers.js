import { TableStore } from '../stores/tableStore.js'

export function useTableHelpers() {
  function getDataListFromColumn(columnId) {    
    return TableStore.getUniqueColumnOptions(columnId)
   
  }

  return {
    getDataListFromColumn
  }
}