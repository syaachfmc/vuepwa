// src/utils/theme.js
import { APP_COLORS } from '../constants/colors.js'

export function applyThemeColors() {
  const root = document.documentElement
  root.style.setProperty('--dirty-badge-bg', APP_COLORS.dirtyBadgeBg)
  root.style.setProperty('--dirty-badge-border', APP_COLORS.dirtyBadgeBorder)
  root.style.setProperty('--dirty-badge-glow', APP_COLORS.dirtyBadgeGlow)

  // Tambahkan warna lain jika dibutuhkan di file CSS lain
  root.style.setProperty('--bg-primary', APP_COLORS.bgPrimary)
  root.style.setProperty('--text-primary', APP_COLORS.textPrimary)
  root.style.setProperty('--border-error', APP_COLORS.borderError)
}