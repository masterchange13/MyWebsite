import { request } from '@/utils/request'

export const timetableApi = {
  // 获取课表课程列表
  getList: () => request.get('/timetable/list'),
  // 添加课程
  addEntry: (data) => request.post('/timetable/add', data),
  // 修改课程
  updateEntry: (data) => request.post('/timetable/update', data),
  // 删除课程
  removeEntry: (data) => request.delete('/timetable/remove', { data }),
  // 获取节次时间配置
  getConfig: () => request.get('/timetable/config'),
  // 保存节次时间配置
  saveConfig: (data) => request.post('/timetable/config/save', data),
}
