// useFormTracker.js
import { reactive, toRaw } from 'vue'

// Helper deep clone yang menangani Vue Proxy, Date, Array, dan Object biasa
function safeDeepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  // Lepaskan pembungkus Vue Reactive Proxy jika ada
  const rawObj = toRaw(obj)

  if (rawObj instanceof Date) {
    return new Date(rawObj.getTime())
  }

  if (Array.isArray(rawObj)) {
    return rawObj.map((item) => safeDeepClone(item))
  }

  // Kloning Plain Object
  const clonedObj = {}
  for (const key in rawObj) {
    if (Object.prototype.hasOwnProperty.call(rawObj, key)) {
      clonedObj[key] = safeDeepClone(rawObj[key])
    }
  }
  return clonedObj
}

export function useFormTracker(initialData = {}) {
  const formData = reactive({ ...(initialData || {}) })
  const initialValues = reactive(safeDeepClone(initialData || {}))

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
      
      // Bersihkan initialValues lama lalu isi dengan hasil deep clone
      Object.keys(initialValues).forEach((key) => delete initialValues[key])
      Object.assign(initialValues, safeDeepClone(dataToCommit))
    } else {
      Object.keys(formData).forEach((key) => {
        initialValues[key] = safeDeepClone(formData[key])
      })
    }

    const refsArray = Array.isArray(componentRefs) ? componentRefs : []
    refsArray.forEach((compRef) => {
      if (compRef?.value?.resetOriginalValue) {
        compRef.value.resetOriginalValue()
      }
    })
  }

  const resetToOriginal = () => {
    console.log(initialValues['2'])
    
    // Bersihkan formData lama lalu assign kembali nilai asal
    Object.keys(formData).forEach((key) => delete formData[key])
    Object.assign(formData, safeDeepClone(initialValues))
  }

  return {
    form: formData,
    isDirty,
    commitOriginal,
    resetToOriginal
  }
}