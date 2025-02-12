<template>
    <el-drawer v-model="showAddIcon">
        <addIconVue v-if="showAddIcon"/>
    </el-drawer>

    <div style="font-size: 20px">
        <!-- 遍历 icons 数组 -->
        <div v-for="(icon, index) in icons" :key="index" style="display: inline-block; margin-right: 30px;">
            <img :src="icon.img" style="width: 100px; height: 100px;" @click="openLink(icon.url)"/>
        </div>
    </div>

    <!-- Add icon -->
    <div>
        <img :src="add" style="width: 100px; height: 100px; margin-right: 30px; position: absolute; right: 0; top: 100%" @click="addIcon"/>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import addIconVue from './addIcon.vue';

    // 使用 import 动态读取 src.json 文件
    import src from '../../Node/website/src.json';
    console.log(src);

    // 将 src.json 转换为图标数组
    const icons = ref(src);

    // 打开链接的函数
    const openLink = (url) => {
        window.open(url, '_blank'); // 在新标签页打开链接
    };

    // 控制添加图标的显示
    const showAddIcon = ref(false);
    const add = ref("../../public/icon/add.png");
    
    // 点击添加按钮时，显示添加图标
    const addIcon = () => {
        showAddIcon.value = true;
    };
</script>
