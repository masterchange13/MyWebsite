<template>
    <div style="border: 1px solid #ccc">
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
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { request } from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'

// 获取用户信息
const useStore = useUserStore()
const author = computed(() => useStore.getUsername()) // 计算属性放在 setup 作用域

// 编辑器实例
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = ref('<p></p>')

// 模拟 ajax 异步获取内容
onMounted(() => {
  setTimeout(() => {
    valueHtml.value = '<p></p>'
  }, 1500)
})

// 配置
const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }

// 组件销毁时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

// 记录 editor 实例
const handleCreated = (editor) => {
  editorRef.value = editor
}

// 发布方法
const publish = async () => {
  try {
    const res = await request.post('/document/publish', {
      author: author.value, // 取计算属性的值
      content: valueHtml.value
    })
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
