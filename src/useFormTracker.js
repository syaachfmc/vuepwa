// useFormTracker.js
import { reactive } from 'vue'

export function useFormTracker(initialData = {}) {
  const formData = reactive({ ...(initialData || {}) })
  const initialValues = reactive({ ...(initialData || {}) })

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

  // Parameter dibuat default array & divalidasi dengan Array.isArray
  const commitOriginal = (componentRefs = [], newData = null) => {
    // Menggunakan optional chaining agar tidak crash saat newData bernilai null
 

    // Tentukan objek data yang akan dicommit
    const dataToCommit = (newData || (Array.isArray(componentRefs) ? null : componentRefs)) || formData

    if (dataToCommit && typeof dataToCommit === 'object' && !Array.isArray(dataToCommit)) {
      Object.assign(formData, dataToCommit)
      Object.assign(initialValues, JSON.parse(JSON.stringify(dataToCommit)))
    } else {
      Object.keys(formData).forEach((key) => {
        initialValues[key] = formData[key]
      })
    }

    // Pastikan componentRefs benar-benar array sebelum looping
    const refsArray = Array.isArray(componentRefs) ? componentRefs : []
    refsArray.forEach((compRef) => {
      if (compRef?.value?.resetOriginalValue) {
        compRef.value.resetOriginalValue()
      }
    })
  }

  const resetToOriginal = () => {
    console.log(initialValues['2'])
    Object.assign(formData, initialValues)
  }

  return {
    form: formData,
    isDirty,
    commitOriginal,
    resetToOriginal
  }
}