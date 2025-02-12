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
    console.log(JSON.stringify(website.value));  // 使用 website.value
    try {
        // 发送 POST 请求到后端
        const response = await fetch('http://localhost:3000/save-icon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },    
            body: JSON.stringify(website.value), // 发送实际的对象数据
        });    

        console.log(response)

        if (response.ok) {
            alert('Icon added successfully!');
        } else {
            alert('Failed to add icon!');
        }    
    } catch (error) {
        console.error('Error:', error);
        alert('Error occurred while adding icon');
    }    
    // resetForm();
    // refresh 
    window.location.reload();
};


</script>
