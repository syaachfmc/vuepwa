// useFormTracker.js
import { reactive } from 'vue'

export function useFormTracker(initialData = {}) {
  const formData = reactive({ ...initialData })
  const initialValues = reactive({ ...initialData })

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

    console.log("commitOriginal terpanggil")
    // Jika parameter pertama adalah object data (seperti newRow), update formData & initialValues
    const dataToCommit = (newData || (Array.isArray(componentRefs) ? null : componentRefs)) || formData

    if (dataToCommit && typeof dataToCommit === 'object' && !Array.isArray(dataToCommit)) {
      Object.assign(formData, dataToCommit)
      Object.assign(initialValues, dataToCommit)
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

  return {
    form: formData,
    isDirty,
    commitOriginal
  }
}