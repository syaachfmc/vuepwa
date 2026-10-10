// Custom Formatter Function
export function formatTanggal  (date)  {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
  
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const year = d.getFullYear()
  
    return `${day} ${month} ${year}`
  }
  