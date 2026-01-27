<template>
    <div class="bg">
    <el-header class="header">documents</el-header>
    <div class="blog-container">
      <el-scrollbar height="600px">
        <div v-for="file in files" :key="file.create_time" class="blog-card">
          <el-card shadow="hover">
              <div class="blog-header">
                <el-avatar :size="40" :src="getAvatar(file.author)" />
                <div class="blog-info">
                  <span class="blog-author">{{ file.author }}</span>
                  <span class="blog-time">{{ formatTime(file.create_time) }}</span>
                </div>
              </div>
            <div class="blog-content" v-html="file.content" @click="showDocument(file.create_time)"></div>
          </el-card>
        </div>
      </el-scrollbar>
    </div>
    </div>
  </template>

<script setup>
    import { ref, onMounted } from 'vue'
    import {useRouter} from 'vue-router'
    import { request } from '@/utils/request';
    import { ElMessage } from 'element-plus';
    import dayjs from 'dayjs'

    const router = useRouter()

    const files = ref(null)

    // 使用钩子函数，在组件加载时获取所有文件
    onMounted(() => {
        getAllFile()
    })

    const getAllFile = async () => {
        // get all the file in the server
        try{
            const res = await request.get('/document/getAll/')
            if(res.code === 200){
                files.value = res.data
                ElMessage.success(res.message)
                console.log(files.value);
            }else{
                ElMessage.error(res.message)
            }
        }catch(err){
            console.log(err)
            ElMessage.error(err)
        }
    }

    // 获取头像（这里使用默认头像）
    const getAvatar = (author) => {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${author}`
    }

    // 格式化时间
    const formatTime = (time) => {
        return dayjs(time).format('YYYY-MM-DD')
    }

    const showDocument = (id) => {
        router.push({name: '/document/documentDetail/', params: {id: id}})
    }

</script>

<style scoped>
.bg{
    background-color: #afc9f0;
}

.header{
  background-color: #96c2ee;
  color: #fff;
  text-align: center;
  line-height: 60px;
}

.blog-container {
  padding: 20px;
  max-width: 1000px;
  margin: auto;
}

.blog-card {
  margin-bottom: 20px;
}

.blog-header {
  display: flex;
  align-items: center;
}

.blog-info {
  margin-left: 10px;
}

.blog-author {
  font-size: 16px;
  font-weight: bold;
}

.blog-time {
  font-size: 12px;
  color: #909399;
}

.blog-content {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.6;
}
</style>
