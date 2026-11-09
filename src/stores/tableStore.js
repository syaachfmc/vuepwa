
import { ref } from 'vue'

export const TableStore = {
  // Menampung seluruh data baris terformat dari DataTable
  tableData: ref([]),

  // Cache daftar opsi unik
  optionsCache: new Map(),

  // Memuat seluruh data tabel
  setTableData(data) {
    this.optionsCache.clear()

    this.tableData.value = Array.isArray(data) ? data : []
  },

  // Memperbarui satu baris setelah Save
  updateRow(savedData) {
    if (!savedData || !savedData.__rowID) return false

    const rowID = String(savedData.__rowID)

    const index = this.tableData.value.findIndex(
      row => String(row.__rowID) === rowID
    )

    if (index === -1) return false

    // Buat array dan object baru agar Vue mendeteksi perubahan
    const updatedData = [...this.tableData.value]

    updatedData[index] = {
      ...updatedData[index],
      ...savedData
    }

    // Invalidate cache sebelum mengganti data
    this.optionsCache.clear()

    // Trigger reactivity
    this.tableData.value = updatedData

    return true
  },

  // Mengambil opsi unik berdasarkan Column ID
  getUniqueColumnOptions(columnId) {
    const keyStr = String(columnId)

    if (this.optionsCache.has(keyStr)) {
      return this.optionsCache.get(keyStr)
    }

    const rawData = this.tableData.value || []

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return []
    }

    const keyNum = Number(columnId)

    const uniqueValues = [
      ...new Set(
        rawData
          .map(row => {
            if (!row) return null

            if (row[keyStr] !== undefined) return row[keyStr]

            if (!isNaN(keyNum) && row[keyNum] !== undefined) {
              return row[keyNum]
            }

            return null
          })
          .filter(val =>
            val !== null &&
            val !== undefined &&
            String(val).trim() !== ''
          )
      )
    ]

    const result = uniqueValues.map(val => ({
      label: String(val),
      value: val
    }))

    this.optionsCache.set(keyStr, result)

    return result
  }
}

export const RSR_TableStore = {
  // Menampung seluruh data baris terformat dari DataTable
  tableData: ref([]),

  // Cache daftar opsi unik
  optionsCache: new Map(),

  // Memuat seluruh data tabel
  setTableData(data) {
    this.optionsCache.clear()

    this.tableData.value = Array.isArray(data) ? data : []
  },

  // Memperbarui satu baris setelah Save
  updateRow(savedData) {
    if (!savedData || !savedData.__rowID) return false

    const rowID = String(savedData.__rowID)

    const index = this.tableData.value.findIndex(
      row => String(row.__rowID) === rowID
    )

    if (index === -1) return false

    // Buat array dan object baru agar Vue mendeteksi perubahan
    const updatedData = [...this.tableData.value]

    updatedData[index] = {
      ...updatedData[index],
      ...savedData
    }

    // Invalidate cache sebelum mengganti data
    this.optionsCache.clear()

    // Trigger reactivity
    this.tableData.value = updatedData

    return true
  },

  // Mengambil opsi unik berdasarkan Column ID
  getUniqueColumnOptions(columnId) {
    const keyStr = String(columnId)

    if (this.optionsCache.has(keyStr)) {
      return this.optionsCache.get(keyStr)
    }

    const rawData = this.tableData.value || []

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return []
    }

    const keyNum = Number(columnId)

    const uniqueValues = [
      ...new Set(
        rawData
          .map(row => {
            if (!row) return null

            if (row[keyStr] !== undefined) return row[keyStr]

            if (!isNaN(keyNum) && row[keyNum] !== undefined) {
              return row[keyNum]
            }

            return null
          })
          .filter(val =>
            val !== null &&
            val !== undefined &&
            String(val).trim() !== ''
          )
      )
    ]

    const result = uniqueValues.map(val => ({
      label: String(val),
      value: val
    }))

    this.optionsCache.set(keyStr, result)

    return result
  }
}
