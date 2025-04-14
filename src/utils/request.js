import axios from 'axios';
import { ElMessage, ElLoading } from 'element-plus';

let loadingInstance;

function showError(message) {
    ElMessage.error(message || '发生未知错误，请稍后重试。');
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
        try {
            const response = await axios.post('/api/auth/refresh', { refreshToken });
            const newToken = response.data.token;
            localStorage.setItem('token', newToken);
            return newToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }
    return null;
}

export const request = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        loadingInstance = ElLoading.service({
            lock: true,
            text: '加载中...',
            background: 'rgba(0, 0, 0, 0.7)'
        });
        return config;
    },
    error => {
        if (loadingInstance) loadingInstance.close();
        return Promise.reject(error);
    }
);

request.interceptors.response.use(
    response => {
        const token = localStorage.getItem('token');
        console.log(`Token: ${token}`)
        if (loadingInstance) loadingInstance.close();
        return response.data;
    },
    async error => {
        if (loadingInstance) loadingInstance.close();
        const response = error.response;
        const status = response ? response.status : null;
        const message = response?.data.error || error.message || '未知错误';

        switch (status) {
            case 401:
                const newToken = await refreshAccessToken();
                if (newToken) {
                    error.config.headers['Authorization'] = `Bearer ${newToken}`;
                    return axios.request(error.config);
                } else {
                    showError('登录已过期，请重新登录。');
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                }
                break;
            case 403:
                showError('没有权限访问该资源。');
                break;
            case 404:
                showError('请求的资源未找到。');
                break;
            case 500:
                showError('服务器内部错误，请稍后重试。');
                break;
            default:
                showError(message || '发生未知错误。');
        }

        return Promise.reject(error);
    }
);

export default request;