import {request} from '@/utils/request'

export const musicApi = {
    // 获取音乐列表
    getMusicList: (params) => request.get('/music/list', {params}),
    // 添加音乐
    addMusic: (data) => request.post('/music/add', data),
    // 修改音乐
    updateMusic: (data) => request.post('/music/update', data),
    removeMusic: (data) => request.delete('/music/remove', { data }),
    getAllMusic: (params) => request.get('/music/get_all', { params }),
    // 用户个人音乐库
    getAllUserMusic: (params) => request.get('/music/getAllMusic', { params }),
    updateMusicStatus: (data) => request.post('/music/update_music_status', data),
    uploadMusic: (data) => request.post('/music/upload', data),
    SearchSongs: (params) => request.get('/music/search', {params}),
}
