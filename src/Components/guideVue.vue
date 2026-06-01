<template>
  <div class="guide-page">
    <section class="guide-hero">
      <div>
        <div class="eyebrow">导航指南</div>
        <h1>快速了解网站如何使用</h1>
        <p>从顶部菜单进入各功能区；移动端点击左上角菜单按钮打开导航。计时器、倒计时和音乐播放器会在全局保持运行。你也可以在 Feedback 留言板提交需求。</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" @click="go('/navigator')">打开导航页</el-button>
        <el-button @click="go('/transfer')">上传/预览</el-button>
        <el-button @click="go('/feedback')">留言板</el-button>
      </div>
    </section>

    <section class="guide-grid">
      <article v-for="group in guideGroups" :key="group.title" class="guide-card">
        <div class="card-head">
          <div class="card-title">{{ group.title }}</div>
          <div class="card-desc">{{ group.desc }}</div>
        </div>
        <div class="guide-links">
          <button
            v-for="item in group.items"
            :key="item.path"
            type="button"
            class="guide-link"
            @click="go(item.path)"
          >
            <span class="link-title">{{ item.name }}</span>
            <span class="link-desc">{{ item.tip }}</span>
          </button>
        </div>
      </article>
    </section>

    <section class="workflow">
      <div class="section-title">常用流程</div>
      <div class="steps">
        <div class="step">
          <span class="num">1</span>
          <div>
            <div class="step-title">先从 Navigator 管理常用网站</div>
            <div class="step-text">支持添加、编辑、拖拽排序；图标留空会自动使用站点图标。</div>
          </div>
        </div>
        <div class="step">
          <span class="num">2</span>
          <div>
            <div class="step-title">写文档或博客</div>
            <div class="step-text">在 Document 创建内容，在 Blog 页面浏览发布后的文章。</div>
          </div>
        </div>
        <div class="step">
          <span class="num">3</span>
          <div>
            <div class="step-title">传文件、上传音乐、提交需求</div>
            <div class="step-text">Transfer 支持文件/音乐上传并预览历史；Feedback 留言板可提交需求并查看处理状态。</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const go = (path) => router.push(path)

const guideGroups = [
  {
    title: '媒体与文件',
    desc: '管理视频、音乐、文档和文件传输。',
    items: [
      { name: 'Video', path: '/video', tip: '查看或管理视频内容' },
      { name: 'Music', path: '/music', tip: '播放音乐，底部播放器全局保留' },
      { name: 'Document', path: '/document', tip: '创建、编辑和管理文档' },
      { name: 'Transfer', path: '/transfer', tip: '上传文件/音乐，查看历史并支持预览' }
    ]
  },
  {
    title: '效率工具',
    desc: '日常工作和辅助决策工具。',
    items: [
      { name: 'Timer', path: '/timer', tip: '倒计时、正向计时，切换页面不停止' },
      { name: 'Calculator', path: '/calculator', tip: '键盘和按钮都可输入表达式' },
      { name: 'Agent', path: '/agent', tip: '向智能助手提问' },
      { name: 'QiMenDunJia', path: '/qiMen', tip: '推盘、异步分析、查看历史推盘' }
    ]
  },
  {
    title: '沟通与个人',
    desc: '聊天、用户资料和日常事项。',
    items: [
      { name: 'Chat', path: '/chat', tip: '选择联系人聊天，收到消息会有提示音' },
      { name: 'To Do List', path: '/todoList', tip: '记录待办和完成状态' },
      { name: 'Profile', path: '/profile/me', tip: '查看或进入个人资料页' },
      { name: 'Navigator', path: '/navigator', tip: '维护常用网站入口（可编辑、拖拽排序、自动站点图标）' }
    ]
  },
  {
    title: '反馈与需求',
    desc: '提交需求、查看处理进度。',
    items: [
      { name: 'Feedback', path: '/feedback', tip: '提交新需求并查看状态/回复' }
    ]
  },
  {
    title: '阅读入口',
    desc: '快速进入站内内容和博客。',
    items: [
      { name: 'Blog', path: '/getDocument', tip: '浏览已发布的文章' },
      { name: 'Document Detail', path: '/getDocument', tip: '从文章列表进入详情页阅读' }
    ]
  }
]
</script>

<style scoped>
.guide-page {
  padding: 14px;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}
.guide-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(9, 15, 34, 0.82);
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.08);
}
.eyebrow {
  color: #8cf5ff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;
}
h1 {
  margin: 0;
  font-size: 28px;
  color: #a6f9ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
p {
  margin: 8px 0 0;
  color: #9dc5de;
  line-height: 1.7;
  max-width: 720px;
}
.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.guide-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.guide-card,
.workflow {
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(9, 15, 34, 0.72);
  padding: 14px;
}
.card-title,
.section-title {
  color: #b8f8ff;
  font-weight: 700;
  font-size: 18px;
}
.card-desc {
  color: #9dc5de;
  font-size: 13px;
  margin-top: 4px;
}
.guide-links {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}
.guide-link {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(10, 16, 35, 0.72);
  padding: 10px;
  cursor: pointer;
}
.guide-link:hover {
  border-color: rgba(0, 245, 255, 0.45);
  background: rgba(0, 245, 255, 0.1);
}
.link-title {
  display: block;
  color: #e2fbff;
  font-weight: 700;
}
.link-desc {
  display: block;
  color: #9dc5de;
  font-size: 12px;
  margin-top: 4px;
}
.workflow {
  margin-top: 12px;
}
.steps {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.step {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(10, 16, 35, 0.72);
  border: 1px solid rgba(0, 255, 255, 0.14);
}
.num {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #07101c;
  background: #8cf5ff;
  font-weight: 800;
}
.step-title {
  color: #e2fbff;
  font-weight: 700;
}
.step-text {
  color: #9dc5de;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .guide-hero {
    align-items: flex-start;
    flex-direction: column;
  }
  .quick-actions {
    justify-content: flex-start;
  }
  .guide-grid,
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>
