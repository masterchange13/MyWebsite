<template>
    <div class="my">
        <h1>我的</h1>
    </div>
    <div>
        <div v-for="data in datas" :key="data.id">
            <audio :src=setUrl(data.url) controls></audio>
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
        datas.value = res.data
    }
}

onMounted(() => {
    getAllMusic()
})

const setUrl = (url) => {
    return "mp3" + url;
}


</script>