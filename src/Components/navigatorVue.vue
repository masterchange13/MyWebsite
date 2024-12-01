<template>
    <div style="font-size: 20px">
      <img :src="githubIcon" style="width: 100px; height: 100px; margin-right: 30px;" @click="toGithub()"/>

      <img :src="bilibibiIcon" style="width: 100px; height: 100px; margin-right: 30px;" @click="toBilibili()"/>

      <img :src="chatGPTIcon" style="width: 100px; height: 100px; margin-right: 30px;" @click="toChatGPT()"/>

      <img :src="youTuBeIcon" style="width: 100px; height: 100px; margin-right: 30px;" @click="toYouTuBe()"/>

      <img :src="blog" style="width: 100px; height: 100px; margin-right: 30px;" @click="toBlog()"/>
    </div>
</template>
  
<script setup>
    import { ref } from 'vue';

    // 空格块

    const githubIcon = ref('../../public/icon/github.png');
    const toGithub = () => {
        window.open('https://github.com/', '_blank'); // '_blank' 确保在新标签页打开
    };

    const bilibibiIcon = ref('../../public/icon/bilibili.png');
    const toBilibili = () => {
        window.open('https://www.bilibili.com/', '_blank'); // '_blank' 确保在新标签页打开
    };

    const chatGPTIcon = ref('../../public/icon/chatGPT.png');
    const toChatGPT = () => {
        window.open('https://chatgpt.com/', '_blank'); // '_blank' 确保在新标签页打开
    }

    const youTuBeIcon = ref('../../public/icon/youTuBe.png');
    const toYouTuBe = () => {
        window.open('https://www.youtube.com/', '_blank'); // '_blank' 确保在新标签页打开
    }

    const blog = ref('../../public/icon/blog.png');
    const toBlog = () => {
        window.open('https://masterchange13.github.io/qing.github.io/', '_blank'); // '_blank' 确保在新标签页打开
    }
</script>