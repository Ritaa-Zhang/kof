// 读取键盘输入
// 因为事件中keydown会连续触发，所以需要手动实现一下当前按下了哪个键
// 把controller加到地图里
export class Controller {
    constructor($canvas) {  // canvas需要接收键盘输入

        this.$canvas = $canvas;

        // 开一个set用来表示当前按住了哪个键
        this.pressed_keys = new Set();  // set可以判重
        this.start();  // 初始化 ？？ 创建对象的时候执行start，不需要其他操作直接可以接收键盘输入
    }

    // 绑定两个函数
    start() {
        // 因为构造函数中构建了一个set对象pressed_keys，所以需要用outer指set对象，this指游戏中实例化的canvas对象
        let outer = this;  // 要用到外面的this，就需要用一个变量存下来
        this.$canvas.keydown(function (e) {  // 函数参数用来定义事件触发时需要执行什么函数，e是event默认传参
            outer.pressed_keys.add(e.key);  // 只要按下就加到set里
            // console.log(e.key);  // 鼠标聚焦在canvas上点击键盘就会显示点击了什么键
        });

        // 当抬起的时候就从set中删掉
        this.$canvas.keyup(function (e) {
            outer.pressed_keys.delete(e.key);
        });
    }

}