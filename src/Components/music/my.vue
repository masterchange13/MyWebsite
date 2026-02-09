<template>
    <div class="song-search-list">
        <div class="list-box">
            <div class="list" v-for="(item, index) in datas" :key="item.id" @click="PlayThisMusic(index)">
                <div class="song-index">{{ index + 1 }}</div>
                <div class="song-name">{{ item.name }}</div>
                <img class="cover" :src="item.cover" />
                <div class="play-icon">
                    <!-- 播放状态指示器 -->
                </div>
                <div class="song-time">{{ formatTime(item.duration) }}</div>
                <div class="arties">{{ item.artist }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import request from '@/utils/request'

const datas = ref([])

const getAllMusic = async () => {
    const res = await request.get('/music/getAllMusic')
    if (res.code === 200) {
        datas.value = res.data.map(item => ({
            ...item,
            cover: item.cover || 'https://via.placeholder.com/40x40?text=封面',
            artist: item.artist || '未知歌手',
            duration: item.duration || 0
        }))
    }
}

const formatTime = (seconds) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const PlayThisMusic = (index) => {
    const song = datas.value[index]
    // 触发播放事件
    console.log('播放音乐:', song)
}

onMounted(() => {
    getAllMusic()
})
</script>

<style scoped>
.song-search-list {
    width: 100%;
    height: 100%;
    position: relative;
}

.list-box {
    height: 100%;
    width: 100%;
    overflow: auto;
    padding: 0px 36px;
    box-sizing: border-box;
}

.list {
    width: 100%;
    padding: 4px 0px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-around;
    font-size: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    margin-bottom: 2px;
    cursor: pointer;
}

.list:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.song-index {
    width: 10%;
    text-align: center;
}

.song-name {
    width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.play-icon {
    width: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.song-time {
    width: 10%;
    text-align: center;
}

.cover {
    width: 36px;
    height: 36px;
    display: block;
    border-radius: 3px;
}

.arties {
    width: 10%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>