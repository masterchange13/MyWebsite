import request from '@/utils/request'

const login = ({ username, password }) => {
  return request({
    url: '/users/login/',
    method: 'post',
    withCredentials: true,
    data: { username, password }
  })
}

const register = ({ username, password, email }) => {
  return request.post('/users/register/', { username, password, email })
}

const getCurrentUser = () => {
  return request.get('/users/me/')
}

const getUserDetail = ({ id }) => {
  return request.get('/users/detail/', {
    params: { id },
    silentError: true
  })
}

const updateUser = (payload) => {
  return request.post('/users/update/', payload)
}

const logout = () => {
  return request.post('/users/logout/')
}

export const userApi = {
  login,
  register,
  getCurrentUser,
  getUserDetail,
  updateUser,
  logout
}
