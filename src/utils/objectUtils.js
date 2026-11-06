
/**
 * Membuat deep clone dari data.
 * Mendukung Date, Array, Object, dan primitive.
 */
export function cloneFormData(data) {
    if (data instanceof Date) {
      return new Date(data.getTime())
    }
  
    if (Array.isArray(data)) {
      return data.map(item => cloneFormData(item))
    }
  
    if (data && typeof data === 'object') {
      const result = {}
  
      Object.keys(data).forEach(key => {
        result[key] = cloneFormData(data[key])
      })
  
      return result
    }
  
    return data
  }
  
  /**
   * Membandingkan dua nilai.
   * Mendukung Date, Array, Object, dan primitive.
   */
  export function isSameValue(a, b) {
    if (a instanceof Date || b instanceof Date) {
      const dateA = a == null || a === ''
        ? null
        : new Date(a).getTime()
  
      const dateB = b == null || b === ''
        ? null
        : new Date(b).getTime()
  
      return dateA === dateB
    }
  
    if (a === b) return true
  
    if (
      a === null ||
      b === null ||
      typeof a !== 'object' ||
      typeof b !== 'object'
    ) {
      return false
    }
  
    return JSON.stringify(a) === JSON.stringify(b)
  }
  