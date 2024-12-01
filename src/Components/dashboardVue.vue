<template>
    <el-container>
        <el-head style="display: flex; align-items: center; justify-content: center;">
            <h1 style="text-align: center">raspberrypi</h1>
            <p style="posititon: fixed; margin-left: 600px">hello : {{ username }}</p>
            <button @click="router.push('/')">logout</button>
        </el-head>


        <el-row class="tac">
            <el-col :span="2">
                <!-- <h5 class="mb-2">raspberryp</h5> -->
                <el-menu default-active="2" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose">
                    <el-sub-menu index="1">
                        <template #title>
                            <el-icon>
                                <location />
                            </el-icon>
                            <span>Navigator One</span>
                        </template>
                        <el-menu-item-group title="Group One">
                            <el-menu-item index="1-1" @click="toVideo()">video</el-menu-item>
                            <el-menu-item index="1-2" @click="toDocument()">document</el-menu-item>
                        </el-menu-item-group>
                        <el-menu-item-group title="Group Two">
                            <el-menu-item index="1-3" @click="toTransfer()">transfer</el-menu-item>
                        </el-menu-item-group>
                        <el-sub-menu index="1-4">
                            <template #title>item four</template>
                            <el-menu-item index="1-4-1">item one</el-menu-item>
                        </el-sub-menu>
                    </el-sub-menu>
                    <el-menu-item index="2">
                        <el-icon><icon-menu /></el-icon>
                        <span>Navigator Two</span>
                    </el-menu-item>
                    <el-menu-item index="3" disabled>
                        <el-icon>
                            <document />
                        </el-icon>
                        <span>Navigator Three</span>
                    </el-menu-item>
                    <el-menu-item index="4">
                        <el-icon>
                            <setting />
                        </el-icon>
                        <span @click="toNavigator()">Navigator Four</span>
                    </el-menu-item>
                </el-menu>
            </el-col>

            <!-- 右侧内容区域 -->
            <el-col :span="22">
                <el-main>
                    <router-view></router-view>
                </el-main>
            </el-col>
        </el-row>
        <!-- Footer -->
        <el-footer
            style="position: fixed; bottom: 0; left: 0; right: 0; text-align: center; background-color: #f5f5f5; color: #333; padding: 20px 0; border-top: 1px solid #eaeaea;">
            <div>Welcome to my website</div>
            <div>&copy; 2024 </div>
        </el-footer>
    </el-container>
</template>
  
<script lang="ts" setup>
import { computed } from 'vue'; // 使用 computed 而不是 ref
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

// 获取 Pinia store 实例
const userStore = useUserStore();
const username = computed(() => userStore.getUsername()); // 创建响应式的计算属性


import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
} from '@element-plus/icons-vue'
const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}

const router = useRouter()

const toVideo = () => {
    router.push("/video")
}

const toDocument = () => {
    router.push("/document")
}

const toNavigator = () => {
    router.push("/navigator")
}

const toTransfer = () => {
    router.push("/transfer")
}
</script>