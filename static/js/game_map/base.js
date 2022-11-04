// 引入刚才定义的对象
import { AcGameObject } from '/static/js/ac_game_object/base.js';
import { Controller } from '/static/js/controller/base.js';

// 游戏地图在这里被定义，需要在主类js/base.js中创建出来
export class GameMap extends AcGameObject {
    constructor(root) {
        super();

        this.root = root;
        // 在游戏地图中一般首先初始化一个canvas，用jQuery定义
        // 这里需要读取键盘输入，就要让canvas聚焦（input可以聚焦，因为可以输入），使用tabindex=0属性让canvas聚焦
        // 构造一个jQuery对象，起名$canvas
        this.$canvas = $('<canvas width="1280" height="720" tabindex=0></canvas>');
        // 取出canvas对象,jQuery的canvas的上一句函数是一个数组，所以取出第0个元素
        // canvas 起初是空白的。为了展示，首先脚本需要找到渲染上下文，然后在它的上面绘制。
        //<canvas> 元素有一个叫做 getContext() 的方法，这个方法是用来获得渲染上下文和它的绘画功能。
        //getContext()接受一个参数，即上下文的类型。通过使用它的 getContext() 方法来访问绘画上下文。
        // ctx是cavas的对象，canvas所有的操作函数都在ctx这个对象上
        this.ctx = this.$canvas[0].getContext('2d');
        // 将canvas加到<div id="kof"></div>div中，打开js/base.js发现root有一个$kof
        // 将$canvas添加到$kof的末尾
        this.root.$kof.append(this.$canvas);  // 将canvas加到root的$kof中
        // 为了让canvas获取输入，就让他聚焦focus()，被聚焦的东西才可以接受键盘输入
        this.$canvas.focus();

        this.controller = new Controller(this.$canvas);

        // 把原可以定义在html里的两人物血条和计时器放在js的map中，用jQuery初始化
        // $() 可以作为选择器，也可以用来构造一个标签
        // 构造一个jQuery对象 $('html内容')
        // 里面再包一层div为了做双段掉血渐变效果
        this.root.$kof.append($(`<div class="kof-head">
            <div class="kof-head-hp-0"><div><div></div></div></div>
            <div class="kof-head-timer">60</div>
            <div class="kof-head-hp-1"><div><div></div></div></div>
        </div>`));

        // 初始化剩余时间60s
        this.time_left = 60000;  // 毫秒ms，因为AcGameObject的timedelta是ms
        // 构造一个jQuery对象，起名$timer
        this.$timer = this.root.$kof.find(".kof-head-timer");
    }

    // GameMap是一个游戏对象需要定义两个函数
    start() {  // 初始的时候执行一次

    }

    // update中一般不直接写逻辑，除非逻辑短，通常把逻辑封装成函数，在update中调用函数
    update() {  // 每一帧都执行一次
        // 更新剩余时间
        this.time_left -= this.timedelta;  // timedelta定义在AcGameObject里表示当前这帧，距离上一帧的时间间隔
        if (this.time_left < 0) {
            this.time_left = 0;

            // 比赛时间结束，如果都没被KO，就都倒地
            let [a, b] = this.root.players;  // 取出两名玩家
            if (a.status !== 6 && b.status !== 6) {
                a.status = b.status = 6;
                a.frame_current_cnt = b.frame_current_cnt = 0;  // 从第0祯开始渲染倒地动画
                a.vx = b.vx = 0;  // 出现倒地之后继续滑动的bug，倒地后清空速度
            }
        }

        // 把剩余时间渲染到timer里，记得转化成秒
        // $A.text()：获取、修改文本信息
        this.$timer.text(parseInt(this.time_left / 1000));

        this.render();  // 每一帧里执行一次渲染函数
    }

    // 地图每一帧都需要清空一遍，如果不清空就会显示物体移动的轨迹
    render() {
        // 清除指定矩形区域，让清除部分完全透明。从左上角开始整个画布的宽高
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)  // 注意这里的canvas不加$
        // 把背景刷成黑色
        // this.ctx.fillStyle = 'black';
        // this.ctx.fillRect(0, 0, this.$canvas.width(), this.$canvas.height());
    }
}