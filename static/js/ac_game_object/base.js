let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);  // 存下每一个AcGameObject

        // 存完之后，每一个AcGameObject里存这几个值
        this.timedelta = 0;  // 每帧都会执行一次，存储当前帧距离上一帧的时间间隔，因为每个元素运动的速度取决于时间而不取决于帧数
        this.has_call_start = false;  // 表示当前对象有没有执行过start函数
    }

    // AcGameObject的函数
    start() {  // 初始执行一次

    }

    update() {  // 每一帧执行一次，除了第一帧

    }

    destroy() {  // 这个项目用不到但是写动画和游戏都需要比如unity，删除当前对象
        for (let i in AC_GAME_OBJECTS) {
            if (AC_GAME_OBJECTS[i] === this) {  // 等于当前元素就删掉
                AC_GAME_OBJECTS.splice(i, 1);  // 切片，从i开始删除一个元素
                break;
            }
        }
    }
}

// 为了计算两帧的时间间隔，要计算上一帧在什么时刻执行的
let last_timestamp;

// 每一帧都执行一次的可以叫frame函数，传入参数timestamp表示当前函数执行的时刻是什么时刻
let AC_GAME_OBJECTS_FRAME = (timestamp) => {
    // 枚举所有元素
    for (let obj of AC_GAME_OBJECTS) {
        if (!obj.has_call_start) {  // 如果没执行过start函数就执行，如果执行过就更新
            obj.start();
            obj.has_call_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;  // 更新时间间隔
            obj.update();
        }
    }

    last_timestamp = timestamp;  // 更新时间
    requestAnimationFrame(AC_GAME_OBJECTS_FRAME);
}

requestAnimationFrame(AC_GAME_OBJECTS_FRAME);  // 启动递归，一帧一帧无穷尽的执行下去

export {
    AcGameObject
}