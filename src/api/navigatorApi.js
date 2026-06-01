import { request } from '@/utils/request'

export const navigatorApi = {
  getAllNavigators: (params) => request.get('users/getAllNavigators/', { params }),
  addNavigator: (data) => request.post('users/save_icon/', data),
  updateNavigator: (data) => request.post('users/update_icon/', data),
  removeNavigator: (data) => request.delete('users/remove_icon/', { data }),
  updateNavigatorOrder: (data) => request.post('users/update_navigator_order/', data),
}
