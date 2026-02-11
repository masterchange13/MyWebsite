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
            @click="showDocument(file.create_time)"
          >
            <div class="doc-item-left">
              <el-avatar :size="48" :src="getAvatar(file.author)" />
            </div>
            <div class="doc-item-center">
              <div class="doc-item-title">{{ getTitle(file.content) }}</div>
              <div class="doc-item-meta">
                <span class="author">{{ file.author }}</span>
                <span class="dot">•</span>
                <span class="time">{{ formatTime(file.create_time) }}</span>
              </div>
              <div class="doc-item-excerpt">{{ getExcerpt(file.content) }}</div>
            </div>
            <div class="doc-item-right">
              <el-button type="primary" text @click.stop="showDocument(file.create_time)">查看详情</el-button>
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
    import { request } from '@/utils/request';
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
        const matchQuery = q ? (contentText.includes(q) || String(f.author || '').toLowerCase().includes(q)) : true
        return matchAuthor && matchQuery
      })
    })

    const stripHtml = (html) => {
      return String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    }
    const getTitle = (html) => {
      const text = stripHtml(html)
      const first = text.split(/[\r\n]+/).find(s => s && s.trim()) || text
      return first.length > 28 ? first.slice(0, 28) + '…' : first || '无标题'
    }
    const getExcerpt = (html) => {
      const text = stripHtml(html)
      return text.length > 140 ? text.slice(0, 140) + '…' : text
    }

</script>

<style scoped>
.doc-page {
  background: linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background-color: #96c2ee;
  color: #fff;
}
.doc-title {
  font-size: 18px;
  font-weight: 600;
}
.doc-tools {
  display: flex;
  gap: 8px;
}
.tool-input {
  width: 240px;
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
  border: 1px solid #edf2f7;
}
.doc-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  border-color: #dfe7f3;
}
.doc-item-center {
  flex: 1;
  min-width: 0;
}
.doc-item-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}
.doc-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: #657788;
}
.doc-item-excerpt {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: #4a5568;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.doc-item-right {
  display: flex;
  align-items: center;
}
</style>
