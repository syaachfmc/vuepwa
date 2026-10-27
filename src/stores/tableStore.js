import { ref } from 'vue'

export const TableStore = {
  // Menampung seluruh data baris terformat dari DataTable
  tableData: ref([]),

  // Cache internal untuk menyimpan daftar opsi unik yang sudah dihitung
  optionsCache: new Map(),

  // Panggil fungsi ini saat data tabel selesai di-fetch
  setTableData(data) {
    this.tableData.value = Array.isArray(data) ? data : []
    // Reset cache setiap kali data tabel baru dimuat
    this.optionsCache.clear()
  },

  // Helper untuk mengambil opsi unik berdasarkan columnID (string/numeric)
  getUniqueColumnOptions(columnId) {
    console.log('Fetching unique options for columnId:', columnId)
    const keyStr = String(columnId)

    // Kembalikan dari cache jika sudah pernah dihitung sebelumnya
    if (this.optionsCache.has(keyStr)) {
      return this.optionsCache.get(keyStr)
    }

    const rawData = this.tableData.value || []
    if (!Array.isArray(rawData) || rawData.length === 0) return []

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

    const result = uniqueValues.map(val => ({
      label: String(val),
      value: val
    }))

    // Simpan hasil kalkulasi ke dalam cache
    this.optionsCache.set(keyStr, result)

    return result
  }
}