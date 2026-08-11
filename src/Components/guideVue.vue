<template>
  <div class="guide-page">
    <section class="guide-hero">
      <div>
        <div class="eyebrow">网站指南</div>
        <h1>关于本站 & 使用说明</h1>
        <p>本网站是一个运行在树莓派上的个人聚合空间，集成了媒体管理、效率工具、实时通讯、智能助手等功能模块。顶部菜单栏可进入各功能区，移动端点击左上角菜单按钮打开导航。计时器、音乐播放器在底部全局保持运行。底部 Footer 为迷你音乐播放器，切换页面不中断播放。</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" @click="go('/navigator')">Navigator</el-button>
        <el-button @click="go('/appLauncher')">App Launcher</el-button>
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
            <div class="step-title">配置快捷入口</div>
            <div class="step-text">在 Navigator 添加常用网站，在 App Launcher 配置桌面软件启动链接（支持协议链接 weixin:// 等和命令行）。</div>
          </div>
        </div>
        <div class="step">
          <span class="num">2</span>
          <div>
            <div class="step-title">写文档 / 传文件 / 听音乐</div>
            <div class="step-text">Document 创建内容后在 Blog 页浏览；Transfer 上传文件/音乐，底部迷你播放器全局播放。</div>
          </div>
        </div>
        <div class="step">
          <span class="num">3</span>
          <div>
            <div class="step-title">使用工具 & 个性化</div>
            <div class="step-text">Timer 计时、Calculator 计算、Decision Helper 辅助决策。Site Settings 切换主题/密度/字号等外观。</div>
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
    desc: '视频、音乐、文档编辑和文件传输。',
    items: [
      { name: 'Video', path: '/video', tip: '查看或管理视频内容' },
      { name: 'Music', path: '/music', tip: '播放音乐，底部迷你播放器全局保留，切换页面不中断' },
      { name: 'Document', path: '/document', tip: '创建、编辑和管理文档，支持富文本/Markdown' },
      { name: 'Transfer', path: '/transfer', tip: '上传文件/音乐，查看上传历史并支持预览' }
    ]
  },
  {
    title: '快捷入口',
    desc: '网站导航和应用启动器。',
    items: [
      { name: 'Navigator', path: '/navigator', tip: '常用网站快捷入口，自定义图标/名称/URL，拖拽排序，支持插入/交换模式' },
      { name: 'App Launcher', path: '/appLauncher', tip: '一键启动桌面软件，输入协议链接（如 weixin:// vscode://）或命令行，含常见软件参考表' }
    ]
  },
  {
    title: '效率工具',
    desc: '计时、计算、决策辅助和 AI 助手。',
    items: [
      { name: 'Timer', path: '/timer', tip: '倒计时与秒表双模式，切换页面不停止，到时提醒，顶部状态栏实时显示' },
      { name: 'Calculator', path: '/calculator', tip: '表达式计算器，支持四则运算和括号，键盘和按钮均可输入' },
      { name: 'Decision Helper', path: '/decision', tip: '抛硬币、掷骰子(D4-D20)、Yes/No、自定义范围随机数、多选一抽取，自动记录历史' },
      { name: 'Agent', path: '/agent', tip: 'AI 智能助手，支持多轮对话' }
    ]
  },
  {
    title: '传统文化',
    desc: '奇门遁甲排盘工具。',
    items: [
      { name: 'QiMenDunJia', path: '/qiMen', tip: '奇门遁甲排盘、异步分析、查看历史推盘结果' }
    ]
  },
  {
    title: '沟通与协作',
    desc: '实时聊天、待办事项和个人资料。',
    items: [
      { name: 'Chat', path: '/chat', tip: 'WebSocket 实时聊天，选择联系人私聊，消息提示音+桌面通知，未读角标' },
      { name: 'To Do List', path: '/todoList', tip: '记录待办事项，标记完成状态，简单高效' },
      { name: 'Profile', path: '/profile/me', tip: '查看和编辑个人资料页' }
    ]
  },
  {
    title: '站内内容',
    desc: '博客文章阅读。',
    items: [
      { name: 'Blog', path: '/getDocument', tip: '浏览已发布的文章列表，点击进入详情页阅读' }
    ]
  },
  {
    title: '个性化设置',
    desc: '网站外观和功能定制。',
    items: [
      { name: 'Site Settings', path: '/siteSettings', tip: '6 套主题切换（Cyber/Aurora/Sunset/Forest/MidnightGold/Berry/Ice），密度、圆角、字号、花瓣特效，菜单排序拖拽' },
      { name: 'Feedback', path: '/feedback', tip: '提交功能需求或问题反馈，查看处理状态和回复' }
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

@media (max-width: 768px) {
  .guide-page {
    padding: 8px;
  }
  .guide-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px;
  }
  h1 {
    font-size: 20px;
  }
  p {
    font-size: 13px;
    line-height: 1.5;
  }
  .quick-actions {
    justify-content: flex-start;
  }
  .quick-actions .el-button {
    font-size: 12px;
    padding: 6px 12px;
  }
  .guide-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 8px;
  }
  .guide-card,
  .workflow {
    padding: 10px;
  }
  .card-title,
  .section-title {
    font-size: 15px;
  }
  .link-title {
    font-size: 13px;
  }
  .link-desc {
    font-size: 11px;
  }
  .steps {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .step {
    padding: 10px;
  }
  .step-title {
    font-size: 13px;
  }
  .step-text {
    font-size: 11px;
  }
}
</style>
