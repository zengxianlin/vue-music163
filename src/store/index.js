import Vue from 'vue'
import Vuex from 'vuex'
import { fetchSongList, fetchSong, fetchLyric } from './api'
import _ from 'lodash'
Vue.use(Vuex)
const store = new Vuex.Store({
    state: {
        showWelcome: true,
        searchWordArr: localStorage.searchWords ? JSON.parse(localStorage.searchWords) : [],
        songs: [],
        song: null,
        lyricArr: [],
        lrcTimeArr: [],
        lrcCurIndex: 0,
        lrcLastIndex: 0,
        canPlay:false
    },
    getters: {

    },
    actions: {
        FETCH_SONG_LIST(context, options) {
            let p = fetchSongList(options);
            p.then(resp => {
                context.commit("loadSongList", { songs: resp.data.result.songs });
            });
            return p;
        },
        FETCH_SONG(context, music_id) {
            let p = fetchSong(music_id);
            p.then(resp => {
                context.commit("loadSong", { song: resp.data.songs[0] });
            });
            return p;
        },
        FETCH_LYRIC(context, music_id) {
            let p = fetchLyric(music_id);
            p.then(resp => {
                context.commit("loadLyric", { lyric: resp.data.lrc.lyric });
            });
            return p;
        },
        TIME_UPDATE({ state, commit },currentTime) {
            let curIndex=_.sortedIndex(state.lrcTimeArr, currentTime);
            if (state.lrcLastIndex == curIndex) {
                return;
            }
            state.lrcCurIndex = curIndex;
            commit("color");
            if (state.lrcLastIndex > curIndex) {
                console.log('played');
                for (var i = curIndex; i <= state.lrcLastIndex; i++) {
                    if(state.lyricArr[i])
                        state.lyricArr[i].show = true;
                }
            }
            commit("disappear");
            state.lrcLastIndex = curIndex;
        }
    },
    mutations: {
        hideWelcome(state) {
            state.showWelcome = false;
        },
        addSearchWord(state, payload) {
            if (state.searchWordArr.indexOf(payload.value) < 0) {
                state.searchWordArr.unshift(payload.value);
            }
            if (state.searchWordArr.length > 5) {
                state.searchWordArr = state.searchWordArr.slice(0, 5);
            }

            localStorage.searchWords = JSON.stringify(state.searchWordArr);
        },
        loadSongList(state, payload) {
            state.songs = payload.songs;
        },
        loadSong(state, payload) {
            state.song = payload.song;
        },
        loadLyric(state, payload) {
            let arr = payload.lyric.split('\n');
            state.lyricArr = convertLrcArr(arr);
            state.lrcTimeArr=_.map(state.lyricArr,'time');
        },
        color(state) {
            for (var i = 0; i < state.lyricArr.length; i++) {
                state.lyricArr[i].selected = false;
            }
            if (state.lrcCurIndex > 0) {
                state.lyricArr[state.lrcCurIndex - 1].selected = true;
            }
        },
        disappear(state) {
            if (state.lrcCurIndex >= 2) {
                for (var i = 2; i < state.lrcCurIndex; i++) {
                    state.lyricArr[i - 2].show = false;
                }
            }
        },
        changeCanPlay(state,canPlay){
            state.canPlay=canPlay;
        }
    }

});

function convertLrcArr(arr) {
    let lrcArr = [];
    let duration = 0;
    console.log(arr.length)
    for (let i = 0; i < arr.length - 1; i++) {
        let item = arr[i];
        let lrcObj = {};
        let timeStr = item.match("\\[(.+?)\\]")[1];

        //declude not time
        if (/[^0-9\.\:]/.test(timeStr)) {
            continue;
        }
        let timeArr = timeStr.split(":");
        let time = parseInt(timeArr[0]) * 60 + parseFloat(timeArr[1]);

        lrcObj.selected = false;
        lrcObj.show = true;

        lrcObj.time = time;
        lrcObj.lrc = item.replace(new RegExp(/(\.\d{2,3})/g), '');
        lrcArr.push(lrcObj);
    }
    return lrcArr;
}
export default store
