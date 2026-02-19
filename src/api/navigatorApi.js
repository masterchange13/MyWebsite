import { request } from '@/utils/request'

export const navigatorApi = {
  getAllNavigators: (params) => request.get('users/getAllNavigators/', { params }),
  addNavigator: (data) => request.post('users/save_icon/', data),
  removeNavigator: (data) => request.delete('users/remove_icon/', { data }),
}
