
import { reactive, toRaw } from 'vue'

// Registry untuk semua form tracker yang aktif
const trackerRegistry = new Set()

// Deep clone untuk Vue Proxy, Date, Array, dan Object
function safeDeepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  const rawObj = toRaw(obj)

  if (rawObj instanceof Date) {
    return new Date(rawObj.getTime())
  }

  if (Array.isArray(rawObj)) {
    return rawObj.map(item => safeDeepClone(item))
  }

  const clonedObj = {}

  for (const key in rawObj) {
    if (Object.prototype.hasOwnProperty.call(rawObj, key)) {
      clonedObj[key] = safeDeepClone(rawObj[key])
    }
  }

  return clonedObj
}

export function useFormTracker(initialData = {}, options = {}) {
  const formData = reactive({ ...(initialData || {}) })
  const initialValues = reactive(safeDeepClone(initialData || {}))

  const tracker = {
    form: formData,
    initialValues
  }

  const refresh = options.refresh || (() => {})

  const isDirty = (field) => {
    const current = formData[field]
    const initial = initialValues[field]

    if (current instanceof Date || initial instanceof Date) {
      const currentTime = current ? new Date(current).getTime() : null
      const initialTime = initial ? new Date(initial).getTime() : null
      return currentTime !== initialTime
    }

    return current !== initial
  }

  const commitOriginal = (componentRefs = [], newData = null) => {
    const dataToCommit =
      (newData || (Array.isArray(componentRefs) ? null : componentRefs)) || formData

    if (dataToCommit && typeof dataToCommit === 'object' && !Array.isArray(dataToCommit)) {
      Object.assign(formData, dataToCommit)

      Object.keys(initialValues).forEach(key => delete initialValues[key])
      Object.assign(initialValues, safeDeepClone(dataToCommit))
    } else {
      Object.keys(formData).forEach(key => {
        initialValues[key] = safeDeepClone(formData[key])
      })
    }

    const refsArray = Array.isArray(componentRefs) ? componentRefs : []

    refsArray.forEach(compRef => {
      if (compRef?.value?.resetOriginalValue) {
        compRef.value.resetOriginalValue()
      }
    })
  }

  const resetToOriginal = () => {
    Object.keys(formData).forEach(key => delete formData[key])
    Object.assign(formData, safeDeepClone(initialValues))
  }

  tracker.commitOriginal = commitOriginal
  tracker.resetToOriginal = resetToOriginal

  trackerRegistry.add(tracker)

  // Menghapus tracker ketika halaman/komponen dihancurkan
  function unregister() {
    trackerRegistry.delete(tracker)
  }

  tracker.refresh = refresh

  return {
    form: formData,
    isDirty,
    commitOriginal,
    resetToOriginal,
    unregister
  }

}

// Commit semua tracker yang terdaftar
export function saveAllForms(currentData) {
  if (!currentData) return

  trackerRegistry.forEach(tracker => {
    tracker.commitOriginal([], currentData)
  })
}

// Reset semua tracker ke nilai awal masing-masing
export function resetAllForms() {
  trackerRegistry.forEach(tracker => {
    tracker.resetToOriginal()
  })
}
