
import { reactive, toRaw } from 'vue'

const trackerRegistry = new Set()

// Snapshot data terakhir yang sudah tersimpan, berdasarkan RowID.
const savedRows = new Map()

function safeDeepClone(value) {
  const raw = toRaw(value)

  if (raw instanceof Date) {
    return new Date(raw.getTime())
  }

  if (Array.isArray(raw)) {
    return raw.map(item => safeDeepClone(item))
  }

  if (raw && typeof raw === 'object') {
    const result = {}

    Object.keys(raw).forEach(key => {
      result[key] = safeDeepClone(raw[key])
    })

    return result
  }

  return raw
}

function getRowKey(row) {
  if (!row || typeof row !== 'object') return null

  if (row.__rowID !== undefined && row.__rowID !== '') {
    return String(row.__rowID)
  }

  return null
}

function ensureSavedRow(row) {
  const rowKey = getRowKey(row)

  if (rowKey === null) {
    return safeDeepClone(row || {})
  }

  if (!savedRows.has(rowKey)) {
    savedRows.set(rowKey, safeDeepClone(row))
  }

  return savedRows.get(rowKey)
}

function valuesEqual(a, b) {
  if (a instanceof Date || b instanceof Date) {
    const timeA = a == null || a === '' ? null : new Date(a).getTime()
    const timeB = b == null || b === '' ? null : new Date(b).getTime()

    return timeA === timeB
  }

  if (a === b) return true

  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false
  }

  return JSON.stringify(a) === JSON.stringify(b)
}

function getCurrentSavedRow(row) {
  const rowKey = getRowKey(row)

  if (rowKey === null) {
    return safeDeepClone(row || {})
  }

  return ensureSavedRow(row)
}

/**
 * Membuat tracker untuk sebuah form.
 */
export function useFormTracker(initialData = {}, options = {}) {
  const initialRow = safeDeepClone(initialData || {})
  const formData = reactive({ ...initialRow })

  const initialValues = reactive({
    ...safeDeepClone(ensureSavedRow(initialRow))
  })

  const refresh = options.refresh || (() => { })

  function isDirty(field) {
    return !valuesEqual(formData[field], initialValues[field])
  }

  /**
   * Mengganti snapshot lokal form.
   * Tidak menulis data ke Google Sheets.
   */
  function commitOriginal(componentRefs = [], newData = null) {
    const data =
      newData ||
      (Array.isArray(componentRefs) ? null : componentRefs) ||
      formData

    Object.keys(formData).forEach(key => {
      delete formData[key]
    })

    Object.assign(formData, safeDeepClone(data))

    Object.keys(initialValues).forEach(key => {
      delete initialValues[key]
    })

    Object.assign(initialValues, safeDeepClone(data))
    const rowKey = getRowKey(data)

    if (rowKey !== null) {
      savedRows.set(rowKey, safeDeepClone(data))
    }

    const refsArray = Array.isArray(componentRefs) ? componentRefs : []

    refsArray.forEach(compRef => {
      if (compRef?.value?.resetOriginalValue) {
        compRef.value.resetOriginalValue()
      }
    })
  }

  /**
   * Mengembalikan form ke snapshot lokal.
   */
  function resetToOriginal() {
    Object.keys(formData).forEach(key => {
      delete formData[key]
    })

    Object.assign(formData, safeDeepClone(initialValues))
  }

  const tracker = {
    form: formData,
    initialValues,
    isDirty,
    commitOriginal,
    resetToOriginal,
    refresh
  }

  trackerRegistry.add(tracker)

  function unregister() {
    trackerRegistry.delete(tracker)
  }

  return {
    form: formData,
    isDirty,
    commitOriginal,
    resetToOriginal,
    unregister
  }
}

/**
 * Mengumpulkan perubahan berdasarkan data baris dan snapshot tersimpan.
 * Hasilnya berbentuk { ColumnID: value }.
 */
export function collectDirtyChanges(currentData) {
  if (!currentData || typeof currentData !== 'object') {
    return {}
  }

  const savedData = getCurrentSavedRow(currentData)
  const changes = {}

  Object.keys(currentData).forEach(key => {
    // Metadata internal bukan kolom Google Sheets.
    if (key.startsWith('__')) return

    if (!valuesEqual(currentData[key], savedData[key])) {
      
      const value = formatLocalDate(currentData[key])

      changes[key] = safeDeepClone(value)


      console.log(`Perubahan terdeteksi pada kolom ${key}:`, {
        oldValue: savedData[key],
        newValue: currentData[key]
      })
    }
  })

  return changes
}

//********* chek format data  */
function formatLocalDate(value) {
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    return value;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}



/**
 * Dipanggil HANYA setelah GAS mengonfirmasi penyimpanan berhasil.
 */
export function markRowSaved(currentData) {
  if (!currentData || typeof currentData !== 'object') return

  const rowKey = getRowKey(currentData)
  const newSnapshot = safeDeepClone(currentData)

  if (rowKey !== null) {
    savedRows.set(rowKey, newSnapshot)
  }

  trackerRegistry.forEach(tracker => {
    tracker.commitOriginal([], newSnapshot)
    tracker.refresh?.()
  })
}

/**
 * Reset global ke snapshot terakhir yang tersimpan.
 * Tidak melakukan request ke GAS.
 */
export function resetAllForms(currentData) {
  if (!currentData || typeof currentData !== 'object') return

  const savedData = getCurrentSavedRow(currentData)

  // Pulihkan data bersama agar form lain membaca nilai yang sama.
  Object.keys(currentData).forEach(key => {
    if (!(key in savedData)) {
      delete currentData[key]
    }
  })

  Object.assign(currentData, safeDeepClone(savedData))

  trackerRegistry.forEach(tracker => {
    tracker.commitOriginal([], savedData)
    tracker.refresh?.()
  })
}

/**
 * Kompatibilitas dengan pemanggilan lama.
 *
 * Fungsi ini hanya memperbarui snapshot lokal.
 * Untuk penyimpanan server, gunakan collectDirtyChanges()
 * lalu markRowSaved() setelah GAS sukses.
 */
export function saveAllForms(currentData) {
  markRowSaved(currentData)
}
