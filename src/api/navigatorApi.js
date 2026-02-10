import { request } from '@/utils/request'

export const navigatorApi = {
  getAllNavigators: () => request.get('users/getAllNavigators/'),
  addNavigator: (data) => request.post('users/save_icon/', data),
  removeNavigator: (data) => request.delete('users/remove_icon/', { data }),
}
