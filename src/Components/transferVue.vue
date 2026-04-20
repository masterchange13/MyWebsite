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
.page {
  height: 100%;
  max-width: 840px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border-radius: 14px;
}

.card-header {
  font-size: 20px;
  font-weight: 600;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}

.upload-box {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-input {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.24);
  background: rgba(8, 14, 32, 0.88);
  color: #d6fbff;
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
  color: #9ec2da;
}

.music-btn {
  margin-top: 10px;
  width: 100%;
  border-radius: 10px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .page {
    padding: 10px;
  }
  .upload-box {
    flex-direction: column;
    align-items: stretch;
  }
}

</style>
