import { Player } from '/static/js/player/base.js';
import { GIF } from '/static/js/utils/gif.js';

export class Kyo extends Player {
    constructor(root, info) {  // 构造函数同player的构造函数
        super(root, info);

        this.init_animations();
    }

    // 初始化动画，一共有7种状态
    init_animations() {
        let outer = this;  // 想在function中用外面的this
        let offsets = [0, -22, -22, -140, 0, 0, 0];  // 设置动作偏移量数组
        for (let i = 0; i < 7; i++) {
            // 加载gif的例子
            // var myGif = GIF();
            // myGif.load("GIFurl.gif");
            let gif = GIF();
            gif.load(`/static/images/player/kyo/${i}.gif`);
            // 把GIF加到animations这个map里
            this.animations.set(i, {  // 把i对应到一个结构体里面
                gif: gif,
                frame_cnt: 0,  // 存这个gif有多少张图（总图片数），初始化为0，需要加载完之后去重新定义
                frame_rate: 5,  // 每张图片存在帧，初始化为5，老师试出来的，每5帧渲染下一动作
                offset_y: offsets[i],  // 图片加载过来竖直方向需要偏移量，水平方向不需要
                loaded: false,  // 变量存这张gif有没有被加载进来，不是瞬间加载的，有延时
                scale: 2,  // gif图片放大到两倍
            });

            // 当图片加载完之后需要一个function把图片更新一下
            gif.onload = function () {
                let obj = outer.animations.get(i);
                obj.frame_cnt = gif.frames.length;
                obj.loaded = true;  // 如果加载进来了，就可以渲染，是为渲染服务的

                // 跳跃动画和时间不一致，修改跳跃速率，每4帧播放一张，跳快一点
                if (i === 3) {
                    obj.frame_rate = 4;
                }
            }
        }
    }
}