<template>
        <h4 style="text-align: center;">please select your file or folder</h4>
        <input type="file" id="file" name="file" />
        <button @click="uploadFile()">upload</button>
        <h4 style="text-align: center;">message</h4>
        <p>{{ message }}</p>    
</template>

<script setup>
import { ref } from 'vue'
import { request } from '@/utils/request'
import { ElMessage } from 'element-plus';

const message = ref('');

const uploadFile = async () => {
    const fileInput = document.getElementById('file')
    const file = fileInput.files[0]

    if (!file) {
        message.value = 'Please select a file';
        return;
    }

    message.value = 'Uploading...';
    const formData = new FormData();
    formData.append('file', file);

    try {
        // 使用 await 获取响应
        const response = await request.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        message.value = response.message; // 假设后端返回的消息在 response.message 中
        console.log(response.data);
    } catch (error) {
        // 在这里提取错误信息
        const errorResponse = error.response.data.error; // 访问 Axios 响应错误对象
        // console.log(errorResponse)

        // 确保 error.response 存在并提取错误信息
        const errorMessage = errorResponse || 'Upload failed'; // 根据实际情况提取
        console.error(errorMessage);
        message.value = errorMessage; // 显示错误信息
    }
}

</script>