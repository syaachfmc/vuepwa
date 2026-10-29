import { ref } from 'vue'

export const config = ref({
  webAppUrl: 'https://script.google.com/macros/s/AKfycbwvyT0YNOAQLVydiESiBCq-j-kWqQ-95eSnzPI69kkdl8WiOS9fnT-cHbmriUIOgIws/exec',
  gsheetID: '1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo',
  sheetName: 'Data',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:BY',
  RowIDColumn: 'A',
  ProjectID: '25-1808',
  ProjectIDColumn: 'B',
  FrozenColumnIndex: ['2'],
  tableDateFormat: 'dd MMM yy'
})