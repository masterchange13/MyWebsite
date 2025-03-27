<template>
    <div>
      <!-- 编辑器 -->
      <div v-if="isEditing" style="border: 1px solid #ccc">
        <Toolbar
          style="border-bottom: 1px solid #ccc"
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
        />
        <Editor
          style="height: 500px; overflow-y: hidden;"
          v-model="valueHtml"
          :defaultConfig="editorConfig"
          :mode="mode"
          @onCreated="handleCreated"
        />
        <el-button @click="valueHtml = '<p></p>'">清空内容</el-button>
        <el-button @click="publish()">发布</el-button>
      </div>
  
      <!-- 文章展示（阅读模式） -->
      <div v-else class="article-container" v-html="valueHtml"></div>
  
      <!-- 切换编辑模式 -->
      <el-button @click="isEditing = !isEditing">
        {{ isEditing ? "预览文章" : "返回编辑" }}
      </el-button>
    </div>
  </template>
  
  <script setup>
  import '@wangeditor/editor/dist/css/style.css'
  import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
  import { request } from '@/utils/request'
  import { ElMessage } from 'element-plus'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const id = route.params.id
  
  // 编辑器实例
  const editorRef = shallowRef()
  const valueHtml = ref('<p>加载中...</p>') // 默认文本，防止空白
  const isEditing = ref(false) // 是否处于编辑模式
  
  // 获取已发布的文章
  onMounted(async () => {
    try {
      const res = await request.get(`/document/detail?id=${id}`)
      console.log(res)
      console.log("dsadasdasd");
      if (res.code === 200) {
        valueHtml.value = res.data.content || '<p>暂无内容</p>'
      }else{
        ElMessage.error(error)
      }
    } catch (error) {
      ElMessage.error('获取文章失败，请稍后再试')
      console.log(error);
    }
  })
  
  // 配置
  const toolbarConfig = {}
  const editorConfig = { placeholder: '请输入内容...' }
  
  // 记录 editor 实例
  const handleCreated = (editor) => {
    editorRef.value = editor
  }
  
  // 组件销毁时清理
  onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor) editor.destroy()
  })
  
  // 发布方法
  const publish = async () => {
    try {
      const res = await request.post('/publish', { content: valueHtml.value })
      if (res.code === 200) {
        ElMessage.success(res.message)
      } else {
        ElMessage.error(res.message)
      }
    } catch (error) {
      ElMessage.error('发布失败，请稍后再试')
    }
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
  </style>
  