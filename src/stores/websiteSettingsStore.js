import { defineStore } from 'pinia'
import { websiteSettingsApi } from '@/api/websiteSettingsApi'
import {
  cornerStyleMap,
  defaultSubmenuOrders,
  defaultTopLevelOrder,
  defaultWebsiteSettings,
  densityMap,
  fontScaleMap,
  normalizeOrder,
  surfaceStyleMap,
  themeMap
} from '@/utils/siteSettings'

const applyVars = (vars = {}) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

const applyThemeVars = (themeId) => {
  if (typeof document === 'undefined') return
  const theme = themeMap[themeId] || themeMap[defaultWebsiteSettings.theme]
  const root = document.documentElement
  applyVars(theme.vars)
  root.dataset.theme = theme.id
}

const moveItem = (list, index, direction) => {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

export const useWebsiteSettingsStore = defineStore('websiteSettings', {
  state: () => ({
    siteTitle: defaultWebsiteSettings.siteTitle,
    loginTitle: defaultWebsiteSettings.loginTitle,
    loginSlogan: defaultWebsiteSettings.loginSlogan,
    theme: defaultWebsiteSettings.theme,
    density: defaultWebsiteSettings.density,
    surfaceStyle: defaultWebsiteSettings.surfaceStyle,
    cornerStyle: defaultWebsiteSettings.cornerStyle,
    fontScale: defaultWebsiteSettings.fontScale,
    showPetals: defaultWebsiteSettings.showPetals,
    topLevelOrder: [...defaultTopLevelOrder],
    submenuOrders: {
      media: [...defaultSubmenuOrders.media],
      tools: [...defaultSubmenuOrders.tools]
    },
    loaded: false,
    saving: false
  }),
  actions: {
    applyPayload(payload = {}) {
      this.siteTitle = payload.site_title || payload.siteTitle || defaultWebsiteSettings.siteTitle
      this.loginTitle = payload.login_title || payload.loginTitle || defaultWebsiteSettings.loginTitle
      this.loginSlogan = payload.login_slogan || payload.loginSlogan || defaultWebsiteSettings.loginSlogan
      this.theme = payload.theme || defaultWebsiteSettings.theme
      this.density = payload.density || defaultWebsiteSettings.density
      this.surfaceStyle = payload.surface_style || payload.surfaceStyle || defaultWebsiteSettings.surfaceStyle
      this.cornerStyle = payload.corner_style || payload.cornerStyle || defaultWebsiteSettings.cornerStyle
      this.fontScale = payload.font_scale || payload.fontScale || defaultWebsiteSettings.fontScale
      this.showPetals = typeof payload.show_petals === 'boolean'
        ? payload.show_petals
        : (typeof payload.showPetals === 'boolean' ? payload.showPetals : defaultWebsiteSettings.showPetals)
      this.topLevelOrder = Array.isArray(payload.top_level_order)
        ? payload.top_level_order
        : (Array.isArray(payload.topLevelOrder) ? payload.topLevelOrder : [...defaultTopLevelOrder])
      const submenuOrders = payload.submenu_orders || payload.submenuOrders || {}
      this.submenuOrders = {
        media: Array.isArray(submenuOrders.media) ? submenuOrders.media : [...defaultSubmenuOrders.media],
        tools: Array.isArray(submenuOrders.tools) ? submenuOrders.tools : [...defaultSubmenuOrders.tools]
      }
      this.normalizeOrders()
      this.applyAppearance()
    },
    applyAppearance() {
      applyThemeVars(this.theme)
      applyVars((densityMap[this.density] || densityMap[defaultWebsiteSettings.density]).vars)
      applyVars((surfaceStyleMap[this.surfaceStyle] || surfaceStyleMap[defaultWebsiteSettings.surfaceStyle]).vars)
      applyVars((cornerStyleMap[this.cornerStyle] || cornerStyleMap[defaultWebsiteSettings.cornerStyle]).vars)
      applyVars((fontScaleMap[this.fontScale] || fontScaleMap[defaultWebsiteSettings.fontScale]).vars)
    },
    applyTheme() {
      this.applyAppearance()
    },
    async loadSettings() {
      try {
        const res = await websiteSettingsApi.getSettings()
        if (res?.code === 200 && res?.data) {
          this.applyPayload(res.data)
        } else {
          this.applyAppearance()
        }
      } catch (_error) {
        this.applyAppearance()
      } finally {
        this.loaded = true
      }
    },
    async saveSettings() {
      this.saving = true
      try {
        const payload = {
          site_title: this.siteTitle,
          login_title: this.loginTitle,
          login_slogan: this.loginSlogan,
          theme: this.theme,
          density: this.density,
          surface_style: this.surfaceStyle,
          corner_style: this.cornerStyle,
          font_scale: this.fontScale,
          show_petals: this.showPetals,
          top_level_order: this.topLevelOrder,
          submenu_orders: this.submenuOrders
        }
        const res = await websiteSettingsApi.saveSettings(payload)
        if (res?.code === 200 && res?.data) {
          this.applyPayload(res.data)
        }
        return res
      } finally {
        this.saving = false
      }
    },
    setTheme(themeId) {
      this.theme = themeMap[themeId] ? themeId : defaultWebsiteSettings.theme
      this.applyTheme()
    },
    moveTopLevelItem(index, direction) {
      this.topLevelOrder = moveItem(this.topLevelOrder, index, direction)
    },
    moveSubmenuItem(groupId, index, direction) {
      const current = Array.isArray(this.submenuOrders[groupId]) ? this.submenuOrders[groupId] : []
      this.submenuOrders = {
        ...this.submenuOrders,
        [groupId]: moveItem(current, index, direction)
      }
    },
    normalizeOrders() {
      this.topLevelOrder = normalizeOrder(this.topLevelOrder, defaultTopLevelOrder)
      this.submenuOrders = {
        media: normalizeOrder(this.submenuOrders?.media, defaultSubmenuOrders.media),
        tools: normalizeOrder(this.submenuOrders?.tools, defaultSubmenuOrders.tools)
      }
    },
    resetDefaults() {
      this.siteTitle = defaultWebsiteSettings.siteTitle
      this.loginTitle = defaultWebsiteSettings.loginTitle
      this.loginSlogan = defaultWebsiteSettings.loginSlogan
      this.theme = defaultWebsiteSettings.theme
      this.density = defaultWebsiteSettings.density
      this.surfaceStyle = defaultWebsiteSettings.surfaceStyle
      this.cornerStyle = defaultWebsiteSettings.cornerStyle
      this.fontScale = defaultWebsiteSettings.fontScale
      this.showPetals = defaultWebsiteSettings.showPetals
      this.topLevelOrder = [...defaultTopLevelOrder]
      this.submenuOrders = {
        media: [...defaultSubmenuOrders.media],
        tools: [...defaultSubmenuOrders.tools]
      }
      this.applyAppearance()
    }
  }
})
