// src/stores/tableStore.js
import { ref } from 'vue'

export const TableStore = {
  tableData: ref([]),

  setTableData(data) {
    this.tableData.value = Array.isArray(data) ? data : []
  },

  getUniqueColumnOptions(columnId) {
    const rawData = this.tableData.value || []
    if (!Array.isArray(rawData) || rawData.length === 0) return []

    const uniqueValues = [
      ...new Set(
        rawData
          .map(row => {
            if (!row) return null
            // Coba akses sebagai string key dulu, jika undefined coba cast ke number (index)
            return row[columnId] !== undefined ? row[columnId] : row[Number(columnId)]
          })
          .filter(val => val !== null && val !== undefined && val !== '')
      )
    ]

    return uniqueValues.map(val => ({
      label: String(val),
      value: val
    }))
  }
}