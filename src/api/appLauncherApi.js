import { request } from '@/utils/request'

export const appLauncherApi = {
  getAllAppLaunchers: (params) => request.get('users/getAllAppLaunchers/', { params }),
  addAppLauncher: (data) => request.post('users/save_app_launcher/', data),
  updateAppLauncher: (data) => request.post('users/update_app_launcher/', data),
  removeAppLauncher: (data) => request.delete('users/remove_app_launcher/', { data }),
  insertAppLauncherOrder: (data) => request.post('users/insert_app_launcher_order/', data),
  swapAppLauncherOrder: (data) => request.post('users/swap_app_launcher_order/', data),
  launchApp: (data) => request.post('users/launch_app/', data),
}
