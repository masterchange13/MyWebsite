<template>
    <el-form :model="website">
        <el-form-item label="Name" prop="name">
            <el-input v-model="website.name" />
        </el-form-item>
        <el-form-item label="URL" prop="url">
            <el-input v-model="website.url" />
        </el-form-item>
        <el-form-item label="Image" prop="img">
            <el-input v-model="website.img" />
        </el-form-item>

        <el-form-item>
            <el-button @click="resetForm">Reset</el-button>
            <el-button type="primary" @click="submitForm">Add</el-button>
        </el-form-item>
    </el-form>
</template>
 
<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { request } from '@/utils/request'
import Message from '@/utils/message'

const website = ref({
    name: '',
    url: '',
    img: ''
});    

const resetForm = () => {
    website.value.name = '';
    website.value.url = '';
    website.value.img = '';
};

const submitForm = async () => {
    console.log(JSON.stringify(website.value));  

    try {
        const response = await request({
            url: 'users/save_icon/',
            method: 'post',
            data: website.value,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log(response);

        if (response.data && response.code === 200) {
            Message.success('Icon added successfully!');
            setTimeout(() => {
                window.location.reload();
            }, 1000); // 延迟 1 秒后刷新页面
        } else {
            console.error('Error response:', response.data);
            Message.error('Failed to add icon');
        }
    } catch (error) {
        console.error('Error:', error);
        Message.error('Error occurred while adding icon');
    }
};


</script>
