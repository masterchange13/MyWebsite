<template>
  <div class="page">

    <!-- 普通文件上传 -->
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header">📁 文件上传</div>
      </template>

      <div class="upload-box">
        <input type="file" ref="fileInput" class="file-input" />
        <el-button type="primary" @click="uploadFile">上传文件</el-button>
      </div>

      <el-alert v-if="message" :title="message" type="success" show-icon class="msg" />
    </el-card>

    <!-- 音乐上传 -->
    <el-card class="card music-card" shadow="hover">
      <template #header>
        <div class="card-header">🎵 上传音乐</div>
      </template>

      <div class="music-form">
        <el-input v-model="musicForm.title" placeholder="歌曲名" />
        <el-input v-model="musicForm.artist" placeholder="歌手" />
        <el-input v-model="musicForm.album_title" placeholder="专辑名" />
        <el-input v-model="musicForm.album_id" placeholder="专辑ID" />

        <div class="file-row">
          <label>封面：</label>
          <input type="file" @change="handleCover" accept="image/*" />
        </div>

        <div class="file-row">
          <label>音乐文件：</label>
          <input type="file" @change="handleAudio" accept=".mp3" />
        </div>

        <el-button type="success" size="large" @click="uploadMusic" class="music-btn">
          🎧 上传音乐
        </el-button>
      </div>
    </el-card>

  </div>
</template>

<script setup>
import { ref } from "vue";
import { request } from "@/utils/request";
import { ElMessage } from "element-plus";
import { musicApi } from "@/api/musicApi";

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
    const response = await musicApi.uploadMusic(formData);
    message.value = response.message || "上传成功！";
    console.log(response.data);
    ElMessage.success(response.message || "上传成功！");
  } catch (error) {
    const errorMessage = error.response?.data?.error || "上传失败";
    console.error(errorMessage);
    message.value = errorMessage;
  }
};

const musicForm = ref({
  title: "",
  album_id: "",
  album_title: "",
  artist: "",
  cover: null,
  audio: null,
});

const handleCover = (e) => {
  musicForm.value.cover = e.target.files[0];
};

const handleAudio = (e) => {
  musicForm.value.audio = e.target.files[0];
};

const uploadMusic = async () => {
  const formData = new FormData();

  for (let key in musicForm.value) {
    formData.append(key, musicForm.value[key]);
  }

  try {
    const res = await musicApi.uploadMusic(formData);
    ElMessage.success(res.message);
  } catch (err) {
    ElMessage.error("上传失败");
  }
};

</script>

<style scoped>
body {
  background: linear-gradient(135deg, #f5f7fa, #e4ecf5);
}

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

.page {
  max-width: 720px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.card {
  border-radius: 12px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.upload-box {
  display: flex;
  gap: 15px;
  align-items: center;
}

.file-input {
  flex: 1;
}

.msg {
  margin-top: 15px;
}

.music-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.music-btn {
  margin-top: 10px;
  width: 100%;
  border-radius: 8px;
  font-size: 16px;
}

</style>