<template>
    <div class="net-easy-player">
        <div class="background-flitter" :style="`background-image: url(${backgroundUrl});`"></div>
        <div class="music-mask"></div>
        <audio ref="audioRef" :src="songInfo.url"></audio>
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
                    <Playing v-show="activeIndex == 0" :songInfo="songInfo" :lyricIndex="lyricIndex" :lyricInfo="lyricInfo"></Playing>
                    <Search v-show="activeIndex == 2" :playStatus="playStatus" @PlayThisMusic="PlayThisMusic"></Search>
                    <History v-show="activeIndex == 3" :playStatus="playStatus" @PlayHistoryMusic="PlayHistoryMusic"></History>
                    <MyMusic v-show="activeIndex == 4" :playStatus="playStatus" @PlayThisMusic="PlayThisMusic"></MyMusic>
                    <LoveMusic v-show="activeIndex == 5" :playStatus="playStatus" @PlayThisMusic="PlayThisMusic"></LoveMusic>
                </div>
            </div>
            <div class="song-info"></div>
        </div>
        <div class="music-footer">
            <div class="song-cover">
                <img class="audioCover" :src="songInfo.cover" alt="" />
            </div>
            <div class="play-icon-container">
                <img class="play-icon" src="../assets/arrow_01.png" alt="上一曲" @click="prevSong"/>
                <img v-show="!playing" @click="playMusic" class="play-icon" src="../assets/play_01.png" alt="播放" />
                <img v-show="playing" @click="playMusic" class="play-icon" src="../assets/play_02.png" alt="暂停" />
                <img class="play-icon" src="../assets/arrow_02.png" alt="下一曲" @click="nextSong"/>
            </div>
            <div class="music-speed">
                <div class="name-time">
                    <div>{{ songInfo.name }}</div>
                    <div>{{ currentTime }}/{{ audioTime }}</div>
                </div>
                <div class="process-container">
                    <div class="process-bar" ref="trackRef" @click="clickProgress">
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

<script setup>
import { ref, reactive, onMounted, computed, toRefs, nextTick } from "vue";
import Playing from "@/Components/music/playing.vue";
import Search from "@/Components/music/search.vue";
import History from "@/Components/music/history.vue";
import LoveMusic from "@/Components/music/love.vue";
import liricApi from "../api/liric/index";
import { musicApi } from '@/api/musicApi'
import { watch } from 'vue'

/* refs */
const audioRef = ref(null);
const trackRef = ref(null);

/* 状态 */
const state = reactive({
  backgroundUrl: "",
  menuList: ["正在播放", "推荐", "搜索", "播放历史", "我的", "收藏"],
  activeIndex: 0,
  playing: false,
  playIndex: 0,
  audioProgress: 0,
  thumbTranslateX: 0,
  lyricIndex: 0,
  currentTime: "00:00",
  audioTime: "00:00",
  progressL: 0,
  volume: 50,
  playStatus: false,
  songInfo: {},
  lyricInfo: [],
  songList: [
    {
      name: "辞·九门回忆",
      cover: "https://p1.music.126.net/pWJXXU4kbhsk1HhXCPUMag==/109951163879149420.jpg",
      url: "https://music.163.com/song/media/outer/url?id=1347524822.mp3",
      id: 1347524822,
    },
  ],
});

const {
  backgroundUrl,
  menuList,
  activeIndex,
  playing,
  songInfo,
  lyricInfo,
  lyricIndex,
  currentTime,
  audioTime,
  thumbTranslateX,
  volume,
  playStatus,
} = toRefs(state);

const getAllMusic = async () => {
  const res = await musicApi.getAllMusic();
  state.songList = res.data;
  console.log("all music's res.data", res.data);
};

// /* 播放 */
const PlayThisMusic = (song) => {
  state.playIndex = state.songList.findIndex((item) => item.id == song.id);
  loadSong(song);
};

const PlayHistoryMusic = (song) => {
  state.playIndex = state.songList.findIndex((item) => item.id == song.id);
  loadSong(song);
}

/* 初始化 */
onMounted(async () => {
  await getAllMusic();
  state.progressL = trackRef.value.offsetWidth;
  loadSong(state.songList[0]);
  initAudioEvents();
});

/* 音频事件 */
watch(() => state.volume, (val) => {
  audioRef.value.volume = val / 100
})

const clickProgress = (e) => {
  const rect = trackRef.value.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  audioRef.value.currentTime = percent * audioRef.value.duration
}

const initAudioEvents = () => {
  const audio = audioRef.value;

//   audio.oncanplay = () => {
//     state.audioTime = TimeToString(audio.duration);
//   };
  audio.onloadedmetadata = () => {
    state.audioTime = TimeToString(audio.duration);
    state.progressL = trackRef.value.offsetWidth; // 这里再获取宽度更安全
  };


  audio.ontimeupdate = () => {
    state.currentTime = TimeToString(audio.currentTime);
    state.audioProgress = audio.currentTime / audio.duration;
    state.thumbTranslateX = state.audioProgress * state.progressL;
    updateLyric(audio.currentTime);
  };

  audio.onended = () => nextSong();
};

/* 播放 */
const playMusic = () => {
  const audio = audioRef.value;
  state.playing ? audio.pause() : audio.play();
  state.playing = !state.playing;
};

/* 切歌 */
const prevSong = () => {
  state.playIndex =
    (state.playIndex - 1 + state.songList.length) % state.songList.length;
  loadSong(state.songList[state.playIndex]);
};

const nextSong = () => {
  state.playIndex = (state.playIndex + 1) % state.songList.length;
  loadSong(state.songList[state.playIndex]);
};

const loadSong = async (song) => {
  state.songInfo = song;
  state.backgroundUrl = song.cover;
  await nextTick();
  audioRef.value.load();
  audioRef.value.play();
  state.playing = true;
  GetLyric(song.id);
};

/* 歌词 */
const GetLyric = async (id) => {
  try {
    const res = await liricApi.GetLiricInfo({ id });
    parseLyric(res.lrc.lyric);
  } catch {}
};

const parseLyric = (lrc) => {
  state.lyricInfo = lrc.split("\n").map((line, i) => {
    const m = line.match(/\[(\d+):(\d+\.\d+)\]/);
    return m ? { time: +m[1] * 60 + +m[2], lyric: line.split("]")[1], index: i } : null;
  }).filter(Boolean);
};

const updateLyric = (time) => {
  const i = state.lyricInfo.findIndex(l => time < l.time);
  state.lyricIndex = i > 0 ? i - 1 : 0;
};

/* 工具 */
const TimeToString = s => {
  s = Math.floor(s || 0);
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
};

const audioProgressPercent = computed(() => `${state.audioProgress * 100}%`);

const ChangeActive = i => state.activeIndex = i;
</script>


<style lang="less" scoped>
.net-easy-player {
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: #fff;

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