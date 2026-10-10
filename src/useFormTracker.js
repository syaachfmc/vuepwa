import { reactive, computed } from 'vue'

export function useFormTracker(initialData = {}) {
  const formData = reactive({ ...initialData })
  const initialValues = reactive({ ...initialData })

  // Pengecekan status dirty per field (termasuk tipe Date)
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

  // Commit nilai baru sebagai nilai asli
  const commitOriginal = (componentRefs = []) => {
    // 1. Update snapshot data awal
    Object.keys(formData).forEach((key) => {
      initialValues[key] = formData[key]
    })

    // 2. Panggil resetOriginalValue() pada refs komponen custom
    componentRefs.forEach((compRef) => {
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