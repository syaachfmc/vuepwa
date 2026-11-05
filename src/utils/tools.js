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
  
  export function unique(data) {
    if (Array.isArray(data)) {
      return [...new Set(data)].sort();
    }  
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          data[key] = [...new Set(data[key])].sort();
        }
      });
      return data;
    }  
    return data;
  }