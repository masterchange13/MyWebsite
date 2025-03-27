import {request} from '@/utils/request'

export const toDoApi = {
    // 获取待办列表
    getToDoList: (params) => request.get('/todo/list', {params}),
    // 添加待办
    addTodo: (data) => request.post('/todo/add', data),
    // 修改待办
    updateTodo: (data) => request.post('/todo/update', data),
    removeTodo: (data) => request.post('/todo/remove', data),
    getAllTodo: () => request.get('/todo/getAll'),
    updateTodoStatus: (data) => request.post('/todo/updateTodoStatus', data),
    doneEdit: (data) => request.post('/todo/doneEdit', data),
    removeCompleted: () => request.post('/todo/removeCompleted'),
}