import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 Axios 实例
export const request = axios.create({
    baseURL: '/api', // 使用代理后的基本 URL
    timeout: 10000, // 设置请求超时为 10 秒
});

// 添加请求拦截器
// request.interceptors.request.use(
//     config => {
//         // 在请求发送之前可以做一些处理，比如添加 token
//         // config.headers['Authorization'] = 'Bearer your_token';
//         return config;
//     },
//     error => {
//         // 对请求错误做些什么
//         return Promise.reject(error);
//     }
// );

// 添加响应拦截器
request.interceptors.response.use(
    response => {
        // 对响应数据做些什么
        ElMessage(`请求成功`);
        return response.data; // 直接返回响应数据
    },
    error => {
        // 对响应错误做些什么
        const response = error.response;

        // 提取错误信息
        const status = response ? response.status : null;
        const statusText = response ? response.statusText : null;
        const message = response?.data.error || error.message || '未知错误';

        // 根据不同的错误状态码进行处理
        switch (status) {
            case 400:
                ElMessage(`请求错误: ${message}`);
                break;
            case 401:
                ElMessage(`未授权，请登录。`);
                break;
            case 403:
                ElMessage(`没有权限访问该资源。`);
                break;
            case 404:
                ElMessage(`请求的资源未找到。`);
                break;
            case 500:
                ElMessage(`服务器内部错误，请稍后重试。`);
                break;
            default:
                ElMessage(`发生错误: ${statusText || message}`);
        }

        // 返回 Promise.reject 以便后续处理
        return Promise.reject(error);
    }
);
