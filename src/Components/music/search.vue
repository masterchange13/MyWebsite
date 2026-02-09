<template>
    <div class="song-search-list">
        <div class="search-box">
            <el-input v-model="keyWords" @change="SearchSongs" class="search-input" placeholder="请输入"
                :suffix-icon="Search" />
        </div>
        <div class="list-box" @scroll="ScrollPage($event)">
            <div class="list" v-for="(item, index) in searchList" :key="item.id" @click="PlayThisMusic(index)">
                <div class="song-index">{{ index + 1 }}</div>
                <div class="song-name">{{ item.name }}</div>
                <img class="cover" :src="item.cover" />
                <div class="play-icon">
                    <!-- 暂时有错误，先注释保证构建通过 -->
                    <!-- <img class="wava" v-show="(clickIndex == index) && playStatus" src="../assets/wave.gif" alt=""> -->
                </div>
                <div class="song-time">{{ item.time }}</div>
                <div class="arties">{{ item.artistsName }}</div>
            </div>
        </div>
    </div>
</template>
<script>
import { reactive, ref, computed, onMounted, toRefs } from "vue";
import { Search } from "@element-plus/icons-vue";
import requestApi from "../../api/search/index";
import { TimeToString } from "@/utils/musicUtil";
export default {
    props: {
        songInfo: {
            type: Object,
            default: () => [],
        },
        playStatus: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["PlayThisMusic"],
    setup(props, ctx) {
        const state = reactive({
            clickIndex: null,
            keyWords: "",
            pageSize: 30,
            searchList: [],
        });
        onMounted(() => {
            // GetLyric(props.songInfo.id);
        });
        const SearchSongs = (num) => {
            console.log('是否有：', typeof (num))
            if (typeof (num) == 'string') {
                state.pageSize = 30
            }
            requestApi
                .SearchSongs({
                    pageSize: state.pageSize,
                    start: 0,
                    keywords: state.keyWords,
                })
                .then((res) => {
                    console.log("res", res);
                    state.searchList = res.result.songs.map((item) => {
                        return {
                            name: item.name,
                            cover: "",
                            time: TimeToString(item.duration / 1000),
                            artistsName: item.artists[0].name,
                            albumTitle: "",
                            id: item.id,
                            url: '',
                            albumId: item.album.id
                        }
                    })
                    res.result.songs.forEach((item, index) => {
                        GetCover(item.album.id, index, item.id);
                    });
                    console.log(state.searchList)
                });
        };
        const GetCover = (id, index, urlId) => {
            requestApi
                .GetAlbumInfo({
                    id: id,
                })
                .then((res) => {
                    state.searchList[index].cover = res.album.picUrl;
                    state.searchList[index].albumTitle = res.album.alias[0];
                    state.searchList[index].url = `https://music.163.com/song/media/outer/url?id=${urlId}.mp3`
                });
        };
        const PlayThisMusic = (index) => {
            state.clickIndex = index;
            ctx.emit("PlayThisMusic", state.searchList[index]);
        };
        const ScrollPage = (e) => {
            let list = e.target;
            let offestScroll = list.scrollHeight - list.offsetHeight;
            let num = parseInt(offestScroll) - parseInt(list.scrollTop)
            // 差不多滚到底了就刷新
            if (num <= 2) {
                state.pageSize = state.pageSize + 10
                SearchSongs(state.pageSize)
            }
            console.log(num)
        };
        return {
            ...toRefs(state),
            Search,
            SearchSongs,
            PlayThisMusic,
            ScrollPage,
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
        height: calc(100% - 42px);
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

            .play-icon {
                width: 72px;
                display: flex;
                align-items: center;
                justify-content: center;

                .wave {
                    width: 32px;
                    height: 32px;
                    display: block;
                }
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
        color: #3184ce;
        border: #40ce8f;
    }

    .el-input-focus-border {
        color: #40ce8f;
    }
}
</style>