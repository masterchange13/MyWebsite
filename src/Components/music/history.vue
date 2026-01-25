<template>
    <div class="song-search-list">
        <div class="list-box" @scroll="ScrollPage($event)">
            <div class="list" v-for="(item, index) in searchList" :key="item.id" @click="PlayHistoryMusic(index)">
                <div class="song-index">{{ index + 1 }}</div>
                <div class="song-name">{{ item.name }}</div>
                <img class="cover" :src="item.cover" />
                <div class="song-time">{{ item.time }}</div>
                <div class="arties">{{ item.artistsName }}</div>
            </div>
        </div>
    </div>
</template>
<script>
import { reactive, onMounted, toRefs } from "vue";
import { Search } from "@element-plus/icons-vue";
export default {
    props: {
        songInfo: {
            type: Object,
            default: () => [],
        },
        lyricInfo: {
            type: Object,
            default: () => [],
        },
        activeIndex: {
            type: Number,
            default: 0,
        },
    },
    emits: ["PlayHistoryMusic"],
    setup(props, ctx) {
        console.log(props.activeIndex);
        const state = reactive({
            keyWords: "",
            pageSize: 30,
            searchList: [],
        });
        onMounted(() => {
            // GetLyric(props.songInfo.id);
            if (localStorage.getItem("historyList")) {
                state.searchList = JSON.parse(localStorage.getItem("historyList"));
            }
        });
        const PlayHistoryMusic = (index) => {
            ctx.emit("PlayHistoryMusic", state.searchList, index)
        };
        return {
            ...toRefs(state),
            Search,
            PlayHistoryMusic,
        };
    },
};
</script>
<style lang="less" scoped>
.song-search-list {
    width: 100%;
    height: 100%;
    position: relative;

    .search-box {
        width: 100%;
        padding: 6px 36px;
        height: 42px;
        box-sizing: border-box;
    }

    .list-box {
        height: calc(~"100% - 42px");
        width: 100%;
        overflow: auto;
        padding: 0px 36px;
        box-sizing: border-box;

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

            .song-index {
                width: 10%;
            }

            .song-name {
                width: 40%;
            }

            .song-time {
                width: 10%;
            }

            .cover {
                width: 36px;
                height: 36px;
                display: block;
                border-radius: 3px;
            }

            .arties {
                width: 10%;
            }
        }
    }
}
</style>
<style lang="less">
.search-box .search-input {
    width: 320px;

    input {
        background: rgba(255, 255, 255, 0.1);
        color: aliceblue;
        border: #40ce8f;
    }

    .el-input-focus-border {
        color: #40ce8f;
    }
}
</style>