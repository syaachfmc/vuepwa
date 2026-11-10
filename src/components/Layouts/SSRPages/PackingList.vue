<!-- PackingList.vue -->
<template>
  <div class="packing-list-table-container">
    <GenericDataTable
      ref="tableRef"
      :config="PackingListConfig"
      :store="PackingList_SelectedRowStore"
      :tableStore="PackingList_TableStore"
      :filterFn="filterByShipment"
      @row-selected="handleRowSelected"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import GenericDataTable from '../../Data/GenericDataTable.vue';
import { PackingListConfig } from '../../../config/ssrConfig.js';
import { SelectedRowStore, PackingList_SelectedRowStore } from '../../../stores/selectedRowStore.js';
import { PackingList_TableStore } from '../../../stores/tableStore.js';

const emit = defineEmits(['row-selected']);
const tableRef = ref(null);

function filterByShipment(rows) {
  const selectedShipment = SelectedRowStore.selectedRow.value;
  const selectedShipmentID = selectedShipment?.__rowID || selectedShipment?.rowID;

  if (!selectedShipmentID) return [];
  
  return rows.filter(row => 
    String(row.ShipmentRowID) === String(selectedShipmentID)
  );
}

watch(
  () => SelectedRowStore.selectedRow.value?.__rowID || SelectedRowStore.selectedRow.value?.rowID,
  () => {
    if (tableRef.value && typeof tableRef.value.refreshTableData === 'function') {
      tableRef.value.refreshTableData();
    }
  }
);

function handleRowSelected(payload) {
  emit('row-selected', payload);
}

defineExpose({
  loadData: () => tableRef.value?.loadData(),
  addAndSelectRow: (...args) => tableRef.value?.addAndSelectRow(...args),
  refreshTableData: () => tableRef.value?.refreshTableData()
});
</script>

<style scoped>
.packing-list-table-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>