import { GameMap } from '/static/js/game_map/base.js';
import { Kyo } from '/static/js/player/kyo.js';

class KOF {
    // 传入一个id名称
    constructor(id) {
        // this指向当前类生成的某个的实例
        // id选择器$('#' + id)，起名$kof
        this.$kof = $('#' + id);  // 把id索引出来，jquery id选择器所以是#

        this.game_map = new GameMap(this);  // 创建地图
        this.players = [
            new Kyo(this, {  // root就是当前元素this，info是一个字典
                id: 0,
                x: 200,
                y: 0,
                width: 120,
                height: 200,
                color: 'blue',
            }),
            new Kyo(this, {
                id: 1,
                x: 900,
                y: 0,
                width: 120,
                height: 200,
                color: 'red',
            })
        ];
    }
}

// 传出去才能在外面用到
export {
    KOF
}