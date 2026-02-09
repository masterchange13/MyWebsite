<template>
    <div class="song-search-list">
        <div class="list-box">
            <div class="empty-state" v-if="favoriteList.length === 0">
                <div class="empty-icon">❤️</div>
                <div class="empty-text">暂无收藏歌曲</div>
                <div class="empty-subtext">去发现喜欢的音乐吧</div>
            </div>
            <div class="list" v-for="(item, index) in favoriteList" :key="item.id" @click="PlayThisMusic(index)">
                <div class="song-index">{{ index + 1 }}</div>
                <div class="song-name">{{ item.name }}</div>
                <img class="cover" :src="item.cover" />
                <div class="play-icon">
                    <!-- 播放状态指示器 -->
                </div>
                <div class="song-time">{{ formatTime(item.duration) }}</div>
                <div class="arties">{{ item.artist }}</div>
                <div class="favorite-icon" @click.stop="removeFromFavorite(index)">
                    ❤️
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const favoriteList = ref([])

const loadFavorites = () => {
  const favorites = localStorage.getItem('musicFavorites')
  if (favorites) {
    favoriteList.value = JSON.parse(favorites)
  }
}

const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const PlayThisMusic = (index) => {
  const song = favoriteList.value[index]
  console.log('播放收藏音乐:', song)
  // 这里可以触发全局播放事件
}

const removeFromFavorite = (index) => {
  favoriteList.value.splice(index, 1)
  localStorage.setItem('musicFavorites', JSON.stringify(favoriteList.value))
}

onMounted(() => {
  loadFavorites()
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

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 18px;
    margin-bottom: 8px;
}

.empty-subtext {
    font-size: 14px;
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
    width: 8%;
    text-align: center;
}

.song-name {
    width: 35%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.play-icon {
    width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.song-time {
    width: 8%;
    text-align: center;
}

.cover {
    width: 36px;
    height: 36px;
    display: block;
    border-radius: 3px;
}

.arties {
    width: 15%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.favorite-icon {
    width: 8%;
    text-align: center;
    cursor: pointer;
    font-size: 18px;
}

.favorite-icon:hover {
    transform: scale(1.2);
}
</style>