<template>
    <div class="upload-container">
      <el-header class="header">请选择您的文件或文件夹</el-header>
      <div class="upload-box">
        <!-- 改用原生 input，并绑定 ref -->
        <input type="file" ref="fileInput" class="file-input" />
        <el-button @click="uploadFile" class="upload-button">上传</el-button>
      </div>
      <h4 class="message-title">上传状态</h4>
      <el-text class="message-text">{{ message }}</el-text>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { request } from "@/utils/request";
import { ElMessage } from "element-plus";
  
  const message = ref("");
  const fileInput = ref(null); // 用 ref 代替 getElementById
  
  const uploadFile = async () => {
    const file = fileInput.value.files[0]; // 直接获取文件
  
    if (!file) {
      message.value = "请选择文件";
      return;
    }
  
    message.value = "上传中...";
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await request.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.value = response.message || "上传成功！";
      console.log(response.data);
      ElMessage.success(response.message || "上传成功！");
    } catch (error) {
      const errorMessage = error.response?.data?.error || "上传失败";
      console.error(errorMessage);
      message.value = errorMessage;
    }
  };
  </script>
  
  <style scoped>
  .upload-container {
    width: 400px;
    margin: 50px auto;
    padding: 20px;
    text-align: center;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  .header {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #333;
  }
  
  .upload-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .file-input {
    width: 80%;
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }
  
  .upload-button {
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    padding: 10px 20px;
    cursor: pointer;
  }
  
  .upload-button:hover {
    background-color: #0056b3;
  }
  
  .message-title {
    margin-top: 15px;
    font-size: 16px;
    color: #666;
  }
  
  .message-text {
    font-size: 14px;
    color: #333;
  }
  </style>
  