<template>
  <div>
    <!-- 顶部栏：返回按钮 + 文章标题 + 作者 -->
    <div class="header">
      <el-button text @click="goBack" type="primary" class="back-button">
        <el-icon>
          <ArrowLeft />
        </el-icon>
      </el-button>
      <div class="title-box">
        <div class="title">{{ articleTitle }}</div>
        <div class="author">作者：{{ articleAuthor }}</div>
      </div>
    </div>

    <!-- 编辑器 -->
    <div v-if="isEditing" style="border: 1px solid #ccc">
      <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
      <Editor style="height: 500px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig" :mode="mode"
        @onCreated="handleCreated" />
      <div style="margin-top: 10px;">
        <el-button @click="valueHtml = '<p></p>'">清空内容</el-button>
        <el-button type="primary" @click="publish()">发布</el-button>
      </div>
    </div>

    <!-- 文章展示（阅读模式） -->
    <div v-else class="article-container" v-html="valueHtml"></div>

    <!-- 切换编辑模式按钮 -->
    <div style="margin-top: 20px;">
      <el-button @click="isEditing = !isEditing">
        {{ isEditing ? "预览文章" : "返回编辑" }}
      </el-button>
    </div>
  </div>
</template>


<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { documentApi } from '@/api/documentApi'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue' // 引入图标

const route = useRoute()
const router = useRouter()

const id = route.params.id

const articleTitle = ref('文章标题加载中...')
const articleAuthor = ref('未知作者')

const editorRef = shallowRef()
const valueHtml = ref('<p>加载中...</p>')
const isEditing = ref(false)

onMounted(async () => {
  try {
    const res = await documentApi.detail(id)
    if (res.code === 200) {
      console.log(res.data);
      valueHtml.value = res.data.content || '<p>暂无内容</p>'
      articleTitle.value = res.data.title || '未命名文章'
      articleAuthor.value = res.data.author || '匿名'
    } else {
      ElMessage.error(res.message || '请求错误')
    }
  } catch (error) {
    ElMessage.error('获取文章失败，请稍后再试')
    console.error(error)
  }
})

const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }

const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

const publish = async () => {
  try {
    const res = await documentApi.publish({ content: valueHtml.value })
    if (res.code === 200) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后再试')
    console.error(error)
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.article-container {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  line-height: 1.8;
  font-size: 16px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  margin-right: 16px;
  font-size: 20px;
  display: flex;
  align-items: center;
}

.title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title {
  font-size: 22px;
  font-weight: bold;
  color: #333;
}

.author {
  font-size: 14px;
  color: #999;
  margin-left: 16px;
}
</style>
