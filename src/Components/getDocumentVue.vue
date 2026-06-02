<template>
  <div class="blog-page">
    <!-- Compact top bar: title + search on one line -->
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="top-bar-icon">📝</span>
        <h1 class="top-bar-title">Blog</h1>
        <span class="top-bar-count" v-if="files">{{ displayedFiles.length }} 篇</span>
      </div>
      <div class="top-bar-right">
        <div class="search-wrap">
          <el-icon class="search-icon"><Search /></el-icon>
          <el-input
            v-model="query"
            placeholder="搜索文章..."
            clearable
            class="search-input"
            :input-style="{ color: '#d4f7ff' }"
          />
        </div>
        <el-select v-model="authorFilter" placeholder="作者" clearable class="author-select" size="small">
          <el-option v-for="a in authors" :key="a" :label="a" :value="a" />
        </el-select>
      </div>
    </div>

    <!-- Blog List -->
    <div class="blog-list-container">
      <el-scrollbar style="height: 100%">
        <div class="blog-list" v-if="displayedFiles.length > 0">
          <article
            v-for="(file, index) in displayedFiles"
            :key="file.create_time"
            class="blog-card"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="showDocument(file.id)"
          >
            <div class="card-cover">
              <img :src="getCover(file)" :alt="getTitle(file)" loading="lazy" />
              <div class="cover-overlay"></div>
              <span class="visibility-badge" :class="file.is_public ? 'public' : 'private'">
                {{ file.is_public ? '🌐 公开' : '🔒 私密' }}
              </span>
            </div>
            <div class="card-body">
              <div class="card-meta-top">
                <span class="meta-author">
                  <span class="author-avatar">{{ (file.author || '?')[0].toUpperCase() }}</span>
                  {{ file.author }}
                </span>
                <span class="meta-time">{{ formatTime(file.create_time) }}</span>
              </div>
              <h2 class="card-title">{{ getTitle(file) }}</h2>
              <p class="card-excerpt">{{ getExcerpt(file.content) }}</p>
            </div>
            <div class="card-footer">
              <span class="read-more">
                阅读全文
                <el-icon><ArrowRight /></el-icon>
              </span>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div class="empty-state" v-else-if="files">
          <div class="empty-icon">📭</div>
          <h3>暂无文章</h3>
          <p v-if="query || authorFilter">没有找到匹配的文章，试试调整搜索条件</p>
          <p v-else>还没有人发布文章，去 Document 页面创建第一篇吧</p>
        </div>

        <!-- Loading State -->
        <div class="empty-state" v-else>
          <div class="empty-icon">⏳</div>
          <h3>加载中...</h3>
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
    import { Search, ArrowRight } from '@element-plus/icons-vue'
    import dayjs from 'dayjs'

    const router = useRouter()

    const files = ref(null)
    const query = ref('')
    const authorFilter = ref('')

    onMounted(() => {
        getAllFile()
    })

    const getAllFile = async () => {
        try{
            const res = await documentApi.getAll()
            if(res.code === 200){
                files.value = res.data
                ElMessage.success(res.message)
            }else{
                ElMessage.error(res.message)
            }
        }catch(err){
            console.log(err)
            ElMessage.error(err)
        }
    }

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
      return directTitle.length > 36 ? directTitle.slice(0, 36) + '…' : directTitle
    }
    const getExcerpt = (html) => {
      const text = stripHtml(html)
      return text.length > 160 ? text.slice(0, 160) + '…' : text
    }
    const getCover = (file) => {
      const seed = encodeURIComponent(getTitle(file) || file.author || 'doc')
      return `https://picsum.photos/seed/${seed}/600/320`
    }
</script>

<style scoped>
.blog-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1000px 500px at -200px -160px, rgba(0, 245, 255, 0.06) 0%, transparent 60%),
    radial-gradient(800px 400px at 120% 0%, rgba(255, 0, 204, 0.05) 0%, transparent 60%),
    linear-gradient(180deg, #080b1a 0%, #0c1026 100%);
}

/* ── Compact Top Bar ── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  background: rgba(8, 12, 28, 0.75);
  border-bottom: 1px solid rgba(0, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  z-index: 3;
}
.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.top-bar-icon {
  font-size: 20px;
}
.top-bar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #d6fbff;
  letter-spacing: 0.5px;
}
.top-bar-count {
  font-size: 12px;
  color: #5c8296;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.14);
  padding: 2px 10px;
  border-radius: 999px;
}
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}
.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(11, 17, 35, 0.9);
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 10px;
  padding: 0 12px;
  max-width: 360px;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-wrap:focus-within {
  border-color: rgba(0, 245, 255, 0.40);
  box-shadow: 0 0 12px rgba(0, 245, 255, 0.08);
}
.search-icon {
  color: #6abfcc;
  font-size: 16px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
}
.search-input :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
}
.search-input :deep(.el-input__inner) {
  color: #d4f7ff !important;
  font-size: 14px;
}
.search-input :deep(.el-input__inner::placeholder) {
  color: #5a8090 !important;
}
.author-select {
  width: 120px;
  flex-shrink: 0;
}

/* ── Blog List ── */
.blog-list-container {
  flex: 1;
  min-height: 0;
  padding: 20px 24px 24px;
}
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 960px;
  margin: 0 auto;
}

/* ── Blog Card ── */
.blog-card {
  display: flex;
  gap: 0;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.12);
  background: rgba(8, 12, 28, 0.65);
  backdrop-filter: blur(6px);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardSlideIn 0.35s ease-out both;
  position: relative;
}
.blog-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.22s ease;
  background:
    linear-gradient(135deg, rgba(0, 245, 255, 0.03) 0%, transparent 50%),
    linear-gradient(225deg, rgba(255, 0, 204, 0.02) 0%, transparent 50%);
  pointer-events: none;
}
.blog-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 0, 204, 0.24);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.35),
    0 0 22px rgba(255, 0, 204, 0.06);
}
.blog-card:hover::after {
  opacity: 1;
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Cover */
.card-cover {
  position: relative;
  width: 200px;
  flex-shrink: 0;
  overflow: hidden;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.blog-card:hover .card-cover img {
  transform: scale(1.05);
}
.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(7, 10, 24, 0.45) 100%);
  pointer-events: none;
}
.visibility-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
  font-weight: 600;
}
.visibility-badge.public {
  color: #8ff4ff;
  background: rgba(0, 245, 255, 0.16);
  border: 1px solid rgba(0, 245, 255, 0.26);
}
.visibility-badge.private {
  color: #ffc0f1;
  background: rgba(255, 0, 204, 0.16);
  border: 1px solid rgba(255, 0, 204, 0.26);
}

/* Card body */
.card-body {
  flex: 1;
  min-width: 0;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.card-meta-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.meta-author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8eb8cb;
  font-weight: 500;
}
.author-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.3), rgba(255, 0, 204, 0.25));
  color: #d4f7ff;
  flex-shrink: 0;
}
.meta-time {
  font-size: 12px;
  color: #5c8296;
}
.card-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: #d6fbff;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.blog-card:hover .card-title {
  color: #8ff4ff;
}
.card-excerpt {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #8eb8cb;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 14px 18px;
  flex-shrink: 0;
}
.read-more {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #6abfcc;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  background: rgba(0, 255, 255, 0.05);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.blog-card:hover .read-more {
  color: #ff95ec;
  border-color: rgba(255, 0, 204, 0.26);
  background: rgba(255, 0, 204, 0.06);
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.empty-state h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #9ebac9;
}
.empty-state p {
  margin: 6px 0 0;
  font-size: 14px;
  color: #6b8a9a;
  max-width: 340px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .top-bar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 14px;
  }
  .top-bar-right {
    width: 100%;
    justify-content: stretch;
  }
  .search-wrap {
    max-width: none;
    flex: 1;
  }
  .blog-list-container {
    padding: 14px 14px 20px;
  }
  .blog-card {
    flex-direction: column;
  }
  .card-cover {
    width: 100%;
    height: 160px;
  }
  .card-body {
    padding: 12px 14px;
  }
  .card-title {
    font-size: 17px;
  }
  .card-footer {
    padding: 0 14px 12px;
    justify-content: flex-start;
  }
}
</style>
