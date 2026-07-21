import request from '@/utils/request'

const getSettings = () => request.get('/site-settings/', {
  showLoading: false,
  silentError: true
})

const saveSettings = (payload) => request.post('/site-settings/save/', payload, {
  showLoading: false
})

export const websiteSettingsApi = {
  getSettings,
  saveSettings
}
