<template>
    <div class="net-easy-player">
        <div class="background-flitter" :style="`background-image: url(${backgroundUrl});`"></div>
        <div class="music-mask"></div>
        <audio :src="songInfo.url" id="audio"></audio>
        <div class="music-header">
            <!-- <div></div>  -->
            <!-- <div>界面</div> -->
            <!-- <div>登录</div> -->
        </div>
        <div class="music-container">
            <div class="list-main">
                <div class="menu-box">
                    <div :class="`menu-button${activeIndex === index ? ' active' : ''}`"
                        v-for="(item, index) in menuList" :key="index" @click="ChangeActive(index)">
                        {{ item }}
                    </div>
                </div>
                <div class="main-container">
                    <Playing v-show="activeIndex == 0" :songInfo="songInfo" :lyricIndex="lyricIndex"
                        :lyricInfo="lyricInfo"></Playing>
                    <Search v-show="activeIndex == 2" :playStatus="playStatus" @PlayThisMusic="PlayThisMusic">
                    </Search>
                    <History v-show="activeIndex == 3" :playStatus="playStatus" @PlayHistoryMusic="PlayHistoryMusic">
                    </History>
                </div>
            </div>
            <div class="song-info"></div>
        </div>
        <div class="music-footer">
            <div class="song-cover">
                <img class="audioCover" :src="songInfo.cover" alt="" />
            </div>
            <div class="play-icon-container">
                <img class="play-icon" src="../assets/arrow_01.png" alt="上一曲" />
                <img v-show="!playing" @click="playMusic" class="play-icon" src="../assets/play_01.png" alt="播放" />
                <img v-show="playing" @click="playMusic" class="play-icon" src="../assets/play_02.png" alt="暂停" />
                <img class="play-icon" src="../assets/arrow_02.png" alt="下一曲" />
            </div>
            <div class="music-speed">
                <div class="name-time">
                    <div>{{ songInfo.name }}</div>
                    <div>{{ currentTime }}/{{ audioTime }}</div>
                </div>
                <div class="process-container">
                    <div class="process-bar" ref="track" id="audio-bar">
                        <div class="progress-box" :style="{ width: audioProgressPercent }">
                            <div class="play-point" :style="{ transform: 'translateX(' + thumbTranslateX + 'px)' }">
                                <img src="../assets/dot_01.png" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="action-container">
                <el-dropdown>
                    <span class="el-dropdown-link"> 模式 </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item>列表循环</el-dropdown-item>
                            <el-dropdown-item>随机播放</el-dropdown-item>
                            <el-dropdown-item>单曲循环</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <div class="volume">
                    <el-slider v-model="volume"></el-slider>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { onMounted, reactive, ref, toRefs, computed } from "vue";
import Playing from "@/Components/playing.vue";
import liricApi from "../api/liric/index";
import Search from "@/Components/search.vue";
import History from "@/Components/history.vue";
export default {
    name: "netMusic",
    components: {
        Playing,
        Search,
        History,
    },
    setup() {
        const state = reactive({
            backgroundUrl: "https://peiyinimg.qupeiyin.cn/1629950282884-288.jpg",
            menuList: ["正在播放", "推荐", "搜索", "播放历史"],
            activeIndex: 0, // 选中
            playing: false,
            songList: [
                {
                    albumId: 122397809,
                    albumTitle: "一些古风歌【2021】",
                    artistsName: "平生不晚",``
                    cover:
                        "https://p2.music.126.net/pOR45DW9BfLSQ2JDJJeUgQ==/109951165714496390.jpg",
                    id: 1820643403,
                    name: "伯虎说（纯戏腔段）",
                    url: "https://music.163.com/song/media/outer/url?id=1820643403.mp3",
                },
                {
                    albumId: 75612550,
                    albumTitle: "辞.九门回忆",
                    artistsName: "解忧草/冰幽",
                    cover:
                        "https://p1.music.126.net/pWJXXU4kbhsk1HhXCPUMag==/109951163879149420.jpg",
                    id: 557640761,
                    name: "辞.九门回忆",
                    url: "https://music.163.com/song/media/outer/url?id=1347524822.mp3",
                },
            ],
            audioProgress: 0, // 进度
            playType: 1, // 播放类型，单曲循环还是顺序播放
            playIndex: 0, // 当前播放哪一首
            thumbTranslateX: 0,
            lyricIndex: 0, // 歌词到哪一行了
            currentTime: 0, // 当前播放进度
            progressL: 0, // 进度条总长度
            songInfo: {},
            lyricInfo: [],
            audioTime: "00:00",
            volume: 80,
            playStatus: false, // 搜索或者历史播放完成后关闭播放状态按钮
        });
        let track = ref(null);
        // let rotate = ref(null);
        onMounted(() => {
            const audio = document.getElementById("audio");
            // state.progressL = track.value.offsetHeight;
            console.log(state.progressL); //取元素宽高等属性操作
            let bar = document.getElementById("audio-bar");
            console.log("bar", bar.offsetWidth);
            state.progressL = bar.offsetWidth;
            // window.addEventListener("resize", function () {
            //   // 变化后需要做的事
            //   state.progressL = track.value.offsetHeight;
            // });
            Init(); // 初始化
        });
        const PlayThisMusic = (data) => {
            state.playStatus = true;
            console.log(data);
            state.songList.push(data);
            localStorage.setItem("historyList", JSON.stringify(state.songList));
            state.songInfo = data;
            state.backgroundUrl = state.songInfo.cover;
            audioInit();
            GetLyric(state.songInfo.id);
            setTimeout(() => {
                // rotate.style.animationPlayState = "running";
                state.playing = true;
                audio.play();
            }, 100);
        };
        const PlayHistoryMusic = (data, index) => {
            // state.songList = data;
            state.playStatus = true;
            state.songInfo = data[index];
            state.backgroundUrl = state.songInfo.cover;
            audioInit();
            GetLyric(state.songInfo.id);
            setTimeout(() => {
                // rotate.style.animationPlayState = "running";
                state.playing = true;
                audio.play();
            }, 100);
        };
        const Init = () => {
            if (localStorage.getItem("historyList")) {
                state.songList = JSON.parse(localStorage.getItem("historyList"));
            }
            GetSongInfo();
        };
        const GetSongInfo = () => {
            let myList = state.songList;
            state.songInfo = myList[0];
            state.backgroundUrl = state.songInfo.cover;
            audioInit();
            GetLyric(state.songInfo.id);
        };
        const audioInit = () => {
            // let progressL = track.value.offsetWidth; // 进度条总长
            audio.addEventListener("canplay", () => {
                state.audioTime = TimeToString(audio.duration);
            });
            audio.addEventListener("timeupdate", () => {
                // 当前播放时间
                let compareTime = audio.currentTime;
                for (let i = 0; i < state.lyricInfo.length; i++) {
                    if (compareTime > parseInt(state.lyricInfo[i].time)) {
                        const index = state.lyricInfo[i].index;
                        if (i === parseInt(index)) {
                            state.lyricIndex = i;
                        }
                    }
                }
                state.currentTime = TimeToString(audio.currentTime);
                state.audioProgress = audio.currentTime / audio.duration;
                state.thumbTranslateX = (state.audioProgress * state.progressL).toFixed(
                    3
                );
            });
            audio.addEventListener("ended", () => {
                switch (parseInt(state.playType)) {
                    case 1: // 列表循环
                        state.playIndex =
                            state.playIndex + 1 >= state.songList.length
                                ? 0
                                : state.playIndex + 1;
                        break;
                    case 2: // 随机播放
                        state.playIndex = Math.floor(Math.random() * state.songList.length);
                        break;
                    case 3: // 单曲循环
                        break;
                }
                state.songInfo = state.songList[state.playIndex];
                state.backgroundUrl = state.songInfo.cover;
                GetLyric(state.songInfo.id);
                state.playStatus = false;
                setTimeout(() => {
                    // rotate.style.animationPlayState = "running";
                    audio.play();
                }, 100);
            });
        };

        const GetLyric = (id) => {
            liricApi
                .GetLiricInfo({
                    id,
                })
                .then((res) => {
                    console.log("res", res);
                    let lrc = res.lrc.lyric;
                    GetLyricList(lrc);
                });
        };
        const GetLyricList = (lrc) => {
            let lyricsObjArr = [];
            const regNewLine = /\n/;
            const lineArr = lrc.split(regNewLine); // 每行歌词的数组
            const regTime = /\[\d{2}:\d{2}.\d{2,3}\]/;
            lineArr.forEach((item) => {
                if (item === "") return;
                const obj = {};
                const time = item.match(regTime);

                obj.lyric =
                    item.split("]")[1].trim() === "" ? "" : item.split("]")[1].trim();
                obj.time = time
                    ? TimeToSeconds(time[0].slice(1, time[0].length - 1))
                    : 0;
                obj.uid = Math.random().toString().slice(-6);
                if (obj.lyric === "") {
                    console.log("这一行没有歌词");
                } else {
                    lyricsObjArr.push(obj);
                }
            });
            state.lyricInfo = lyricsObjArr.map((item, index) => {
                item.index = index;
                return {
                    ...item,
                };
            });
            console.log("state.lyricInfo", state.lyricInfo);
        };
        const TimeToSeconds = (time) => {
            // 格式化歌词的时间 转换成 sss:ms
            const regMin = /.*:/;
            const regSec = /:.*\./;
            const regMs = /\./;

            const min = parseInt(time.match(regMin)[0].slice(0, 2));
            let sec = parseInt(time.match(regSec)[0].slice(1, 3));
            const ms = time.slice(
                time.match(regMs).index + 1,
                time.match(regMs).index + 3
            );
            if (min !== 0) {
                sec += min * 60;
            }
            return Number(sec + "." + ms);
        };
        const ChangeActive = (index) => {
            if (index == 3) {
                state.songList = JSON.parse(localStorage.getItem("historyList"));
            }
            state.activeIndex = index;
        };
        const TimeToString = (seconds) => {
            let param = parseInt(seconds);
            let hh = "",
                mm = "",
                ss = "";
            if (param >= 0 && param < 60) {
                param < 10 ? (ss = "0" + param) : (ss = param);
                return "00:" + ss;
            } else if (param >= 60 && param < 3600) {
                mm = parseInt(param / 60);
                mm < 10 ? (mm = "0" + mm) : mm;
                param - parseInt(mm * 60) < 10
                    ? (ss = "0" + String(param - parseInt(mm * 60)))
                    : (ss = param - parseInt(mm * 60));
                return mm + ":" + ss;
            }
        };

        const playMusic = () => {
            if (state.playing) {
                // 播放中,点击则为暂停
                state.playing = false;
                // rotate.style.animationPlayState = "paused";
                audio.pause();
            } else {
                // 暂停中,点击则为播放
                state.playing = true;
                // rotate.style.animationPlayState = "running";
                audio.play();
            }
        };

        const audioProgressPercent = computed(() => {
            return `${state.audioProgress * 100}%`;
        });

        return {
            ...toRefs(state),
            ChangeActive,
            playMusic,
            PlayThisMusic,
            PlayHistoryMusic,
            // rotate,
            audioProgressPercent,
        };
    },
};
</script>

<style lang="less" scoped>
.net-easy-player {
    width: 100%;
    height: 100%;
    color: #fff;
    overflow: hidden;

    /*遮罩*/
    .music-mask,
    .background-flitter {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
    }

    .music-mask {
        z-index: -1;
        background: rgba(126, 126, 126, 0.4);
    }

    .background-flitter {
        z-index: -2;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: 50%;
        filter: blur(12px);
        opacity: 0.7;
        transition: all 0.8s;
        transform: scale(1.1);
    }

    .music-header {
        width: 100%;
        height: 72px;
        line-height: 48px;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        justify-content: space-between;
        padding: 12px 24px;
        box-sizing: border-box;
    }

    .music-container {
        position: relative;
        width: 100%;
        height: calc(~"100% - 144px");
        display: flex;

        .list-main {
            width: calc(~"100% - 320px");
            height: 100%;

            .menu-box {
                width: 100%;
                display: flex;
                height: 60px;
                align-items: center;
                padding: 0 36px;
                box-sizing: border-box;

                .menu-button {
                    width: 96px;
                    border: 1px solid #dddcdc;
                    height: 36px;
                    text-align: center;
                    color: #dddcdc;
                    line-height: 36px;
                    font-size: 16px;
                    margin-right: 20px;
                    cursor: pointer;
                    border-radius: 3px;

                    // &.active {
                    //   border: 1px solid #40ce8f;
                    //   color: #fff;
                    // }
                    &.active {
                        --border-width: 3px;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        // width: 300px;
                        // height: 200px;
                        font-family: Lato, sans-serif;
                        // font-size: 2.5rem;
                        text-transform: uppercase;
                        color: white;
                        background: rgba(235, 227, 227, 0.6);
                        border-radius: var(--border-width);

                        &::after {
                            position: absolute;
                            content: "";
                            top: calc(-1 * var(--border-width));
                            left: calc(-1 * var(--border-width));
                            z-index: -1;
                            width: calc(100% + var(--border-width) * 2);
                            height: calc(100% + var(--border-width) * 2);
                            background: linear-gradient(60deg,
                                    hsl(224, 85%, 66%),
                                    hsl(269, 85%, 66%),
                                    hsl(314, 85%, 66%),
                                    hsl(359, 85%, 66%),
                                    hsl(44, 85%, 66%),
                                    hsl(89, 85%, 66%),
                                    hsl(134, 85%, 66%),
                                    hsl(179, 85%, 66%));
                            background-size: 300% 300%;
                            background-position: 0 50%;
                            border-radius: calc(2 * var(--border-width));
                            animation: moveGradient 4s alternate infinite;
                        }
                    }

                    @keyframes moveGradient {
                        50% {
                            background-position: 100% 50%;
                        }
                    }
                }
            }

            .main-container {
                width: 100%;
                height: calc(~"100% - 60px");
                position: relative;
            }
        }

        .song-info {
            width: 320px;
            height: 100%;
        }
    }

    .music-footer {
        width: 100%;
        height: 72px;
        padding: 0 24px;
        box-sizing: border-box;
        display: flex;
        box-shadow: -5px 0 20px rgb(83, 80, 80);

        .play-icon-container {
            width: 240px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            box-sizing: border-box;

            .play-icon {
                width: 42px;
                height: 42px;
                display: block;
                cursor: pointer;
            }
        }

        .song-cover {
            width: 80px;
            padding: 9px 16px 9px 10px;
            box-sizing: border-box;

            .audioCover {
                display: block;
                widows: 54px;
                height: 54px;
                border-radius: 4px;
            }
        }

        .music-speed {
            width: calc(~"100% - 520px");
            height: 100%;
            position: relative;

            .name-time {
                width: 100%;
                height: 36px;
                line-height: 36px;
                color: #fff;
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }

            .process-container {
                width: 100%;
                height: 24px;
                margin-top: 12px;
                position: relative;

                .process-bar {
                    position: absolute;
                    z-index: 10;
                    top: -5px;
                    width: 100%;
                    height: 5px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 5px;
                    cursor: pointer;

                    .progress-box {
                        height: 100%;
                        background: #40ce8f;
                        position: relative;
                        border-radius: 5px;

                        .play-point {
                            transition: -webkit-transform 0.2s linear;
                            transition: transform 0.2s linear;
                            transition: transform 0.2s linear, -webkit-transform 0.2s linear;
                            position: absolute;
                            width: 18px;
                            height: 18px;
                            border-radius: 9px;
                            top: -4px;
                            cursor: pointer;

                            img {
                                display: block;
                                position: absolute;
                                top: -2px;
                                width: 18px;
                                height: 18px;
                                background: #fff;
                                border-radius: 9px;
                                margin-left: -9px;
                            }
                        }
                    }
                }
            }
        }

        .action-container {
            width: 200px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            box-sizing: border-box;

            .el-dropdown-link {
                color: #fff;
            }

            .volume {
                width: 100px;
            }
        }
    }
}
</style>
<style>
.el-slider .el-slider__bar {
    background-color: #40ce8f !important;
}

.el-slider__button {
    border: #40ce8f;
}
</style>