import { ref } from 'vue'

export const TableStore = {
  // Menampung seluruh data baris terformat dari DataTable
  tableData: ref([]),

  // Panggil fungsi ini saat data tabel selesai di-fetch
  setTableData(data) {
    this.tableData.value = Array.isArray(data) ? data : []
  },

  // Helper untuk mengambil opsi unik berdasarkan columnID (string/numeric)
  getUniqueColumnOptions(columnId) {
    const rawData = this.tableData.value || []
    if (!Array.isArray(rawData) || rawData.length === 0) return []

    const keyStr = String(columnId)
    const keyNum = Number(columnId)

    const uniqueValues = [
      ...new Set(
        rawData
          .map(row => {
            if (!row) return null
            if (row[keyStr] !== undefined) return row[keyStr]
            if (!isNaN(keyNum) && row[keyNum] !== undefined) return row[keyNum]
            return null
          })
          .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
      )
    ]

    return uniqueValues.map(val => ({
      label: String(val),
      value: val
    }))
  }
}