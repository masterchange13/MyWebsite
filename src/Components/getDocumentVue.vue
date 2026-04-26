<template>
  <div class="doc-page">
    <el-header class="doc-header">
      <div class="doc-title">Documents</div>
      <div class="doc-tools">
        <el-input v-model="query" placeholder="搜索内容或作者" clearable class="tool-input" />
        <el-select v-model="authorFilter" placeholder="作者" clearable class="tool-select">
          <el-option v-for="a in authors" :key="a" :label="a" :value="a" />
        </el-select>
      </div>
    </el-header>
    <div class="doc-list">
      <el-scrollbar style="height: 100%">
        <div class="doc-list-wrap">
          <el-card
            v-for="file in displayedFiles"
            :key="file.create_time"
            shadow="hover"
            class="doc-item"
            @click="showDocument(file.id)"
          >
            <div class="doc-item-left">
              <img class="thumb" :src="getCover(file)" />
            </div>
            <div class="doc-item-center">
              <div class="doc-item-title">{{ getTitle(file) }}</div>
              <div class="doc-item-meta">
                <span class="author">{{ file.author }}</span>
                <span class="dot">•</span>
                <span class="time">{{ formatTime(file.create_time) }}</span>
              </div>
              <div class="doc-item-excerpt">{{ getExcerpt(file.content) }}</div>
            </div>
            <div class="doc-item-right">
              <el-button type="primary" text @click.stop="showDocument(file.id)">查看详情</el-button>
            </div>
          </el-card>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    import {useRouter} from 'vue-router'
    import { documentApi } from '@/api/documentApi';
    import { ElMessage } from 'element-plus';
    import dayjs from 'dayjs'

    const router = useRouter()

    const files = ref(null)
    const query = ref('')
    const authorFilter = ref('')

    // 使用钩子函数，在组件加载时获取所有文件
    onMounted(() => {
        getAllFile()
    })

    const getAllFile = async () => {
        // get all the file in the server
        try{
            const res = await documentApi.getAll()
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

    // 格式化时间
    const formatTime = (time) => {
        return dayjs(time).format('YYYY-MM-DD')
    }

    const showDocument = (id) => {
        router.push({name: 'documentDetail', params: {id}})
    }

    const authors = computed(() => {
      const list = files.value || []
      return Array.from(new Set(list.map(f => f.author))).filter(Boolean)
    })

    const displayedFiles = computed(() => {
      const list = files.value || []
      const q = query.value.trim().toLowerCase()
      const af = authorFilter.value
      return list.filter(f => {
        const matchAuthor = af ? f.author === af : true
        const contentText = String(f.content || '').toLowerCase()
        const titleText = String(f.title || '').toLowerCase()
        const matchQuery = q ? (
          contentText.includes(q) ||
          titleText.includes(q) ||
          String(f.author || '').toLowerCase().includes(q)
        ) : true
        return matchAuthor && matchQuery
      })
    })

    const stripHtml = (html) => {
      return String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    }
    const getTitle = (file) => {
      const directTitle = String(file?.title || '').trim()
      if (!directTitle) return '未命名文章'
      return directTitle.length > 28 ? directTitle.slice(0, 28) + '…' : directTitle
    }
    const getExcerpt = (html) => {
      const text = stripHtml(html)
      return text.length > 140 ? text.slice(0, 140) + '…' : text
    }
    const getCover = (file) => {
      const seed = encodeURIComponent(getTitle(file) || file.author || 'doc')
      return `https://picsum.photos/seed/${seed}/300/200`
    }

</script>

<style scoped>
.doc-page {
  background:
    radial-gradient(1200px 620px at -200px -220px, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0) 62%),
    radial-gradient(900px 460px at 120% 20%, rgba(255, 0, 204, 0.10) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #090a1a 0%, #0d1022 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(90deg, rgba(0, 245, 255, 0.18) 0%, rgba(255, 0, 204, 0.16) 100%);
  color: #dffbff;
  border-bottom: 1px solid rgba(0, 255, 255, 0.24);
  box-shadow: 0 10px 24px rgba(0, 245, 255, 0.08);
}
.doc-title {
  font-size: 22px;
  font-weight: 700;
  color: #a8f8ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.doc-tools {
  display: flex;
  gap: 8px;
}
.tool-input {
  width: 300px;
}
.tool-select {
  width: 160px;
}
.doc-list {
  padding: 16px 20px;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
}
.doc-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.doc-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.24);
  background:
    linear-gradient(135deg, rgba(9, 15, 34, 0.86), rgba(17, 22, 45, 0.86));
  overflow: hidden;
  backdrop-filter: blur(6px);
}
.doc-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(0, 245, 255, 0.18), 0 0 24px rgba(255, 0, 204, 0.10);
  border-color: rgba(255, 0, 204, 0.42);
}
.doc-item-left .thumb {
  width: 160px;
  height: 110px;
  border-radius: 10px;
  object-fit: cover;
}
.doc-item-center {
  flex: 1;
  min-width: 0;
}
.doc-item-title {
  font-size: 18px;
  font-weight: 600;
  color: #d6fbff;
}
.doc-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: #8bb2ca;
}
.doc-item-excerpt {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.7;
  color: #aac6d8;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.doc-item-right {
  display: flex;
  align-items: center;
}

:deep(.doc-item-right .el-button.is-text) {
  color: #8ff4ff;
}
:deep(.doc-item-right .el-button.is-text:hover) {
  color: #ff95ec;
}
</style>
