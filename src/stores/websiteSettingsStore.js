import { defineStore } from 'pinia'
import {
  defaultSubmenuOrders,
  defaultTopLevelOrder,
  defaultWebsiteSettings,
  normalizeOrder,
  themeMap
} from '@/utils/siteSettings'

const applyThemeVars = (themeId) => {
  if (typeof document === 'undefined') return
  const theme = themeMap[themeId] || themeMap[defaultWebsiteSettings.theme]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
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
    showPetals: defaultWebsiteSettings.showPetals,
    topLevelOrder: [...defaultTopLevelOrder],
    submenuOrders: {
      media: [...defaultSubmenuOrders.media],
      tools: [...defaultSubmenuOrders.tools]
    }
  }),
  actions: {
    applyTheme() {
      applyThemeVars(this.theme)
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
      this.showPetals = defaultWebsiteSettings.showPetals
      this.topLevelOrder = [...defaultTopLevelOrder]
      this.submenuOrders = {
        media: [...defaultSubmenuOrders.media],
        tools: [...defaultSubmenuOrders.tools]
      }
      this.applyTheme()
    }
  },
  persist: true
})
