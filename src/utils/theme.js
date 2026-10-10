// src/utils/theme.js
import { APP_COLORS } from '../constants/colors.js'

export function applyThemeColors() {
 
 

Object.entries(APP_COLORS).forEach(([key, value]) => {
  document.documentElement.style.setProperty(
    `--color-${key}`,
    value
  );
});
}