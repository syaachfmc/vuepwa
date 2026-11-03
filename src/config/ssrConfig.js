import { ref } from 'vue'

export const config = ref({
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw4ARc71H-V0lIBwp1ijTUiuzZnts0bzBXh30pcy-iaIqa-rYrLW7xsb9hlnpuqDPUI/exec',
              
  gsheetID: '1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo',
  sheetName: 'Data',
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: 'B5:BY',
  RowIDColumn: 'A',
  ProjectID: '',
  ProjectIDColumn: 'B',
  FrozenColumnIndex: ['2'],
  tableDateFormat: 'dd MMM yy',
  MainIDColumnID: '2',
})