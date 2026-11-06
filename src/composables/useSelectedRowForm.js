
import {
    ref,
    watch,
    nextTick,
    onBeforeUnmount
  } from 'vue'
  
  import { useFormTracker } from './useFormTracker.js'
  import { cloneFormData, isSameValue } from '../utils/objectUtils.js'
  
  export function useSelectedRowForm({
    selectedRow,
    resetKey,
    onRowChange
  }) {
  
    // ========================================
    // FORM TRACKER
    // ========================================
  
    const isSwitchingRow = ref(false)
  
    const {
      form,
      isDirty,
      commitOriginal,
      resetToOriginal,
      unregister
    } = useFormTracker(selectedRow.value, {
      refresh: () => resetKey.value++
    })
  
  
    // ========================================
    // SNAPSHOT
    // ========================================
  
    let lastSyncedForm = {}
  
  
    // ========================================
    // WATCH SELECTED ROW
    // ========================================
  
    watch(
      () => selectedRow.value,
  
      async (newRow) => {
        if (!newRow || Object.keys(newRow).length === 0) return
  
        isSwitchingRow.value = true
  
        // Callback khusus halaman, misalnya validasi Shipment No
        if (typeof onRowChange === 'function') {
          onRowChange(newRow)
        }
  
        // Tetapkan row baru sebagai baseline
        commitOriginal([], newRow)
  
        // Simpan snapshot row terbaru
        lastSyncedForm = cloneFormData(newRow)
  
        // Refresh DataField
        resetKey.value++
  
        await nextTick()
  
        isSwitchingRow.value = false
      },
  
      {
        deep: false,
        immediate: true
      }
    )
  
  
    // ========================================
    // WATCH FORM
    // ========================================
  
    watch(
      form,
  
      (newForm) => {
        if (isSwitchingRow.value) return
  
        const currentRow = selectedRow.value
  
        if (!currentRow || Object.keys(currentRow).length === 0) return
  
        Object.keys(newForm).forEach(key => {
  
          // Abaikan property internal
          if (key.startsWith('__')) return
  
          // Sinkronkan hanya field yang berubah
          if (!isSameValue(newForm[key], lastSyncedForm[key])) {
            currentRow[key] = cloneFormData(newForm[key])
          }
  
        })
  
        lastSyncedForm = cloneFormData(newForm)
      },
  
      {
        deep: true
      }
    )
  
  
    // ========================================
    // CLEANUP
    // ========================================
  
    onBeforeUnmount(() => {
      unregister()
    })
  
  
    // ========================================
    // RETURN
    // ========================================
  
    return {
      form,
      isDirty,
      commitOriginal,
      resetToOriginal,
      unregister,
      isSwitchingRow
    }
  }
  