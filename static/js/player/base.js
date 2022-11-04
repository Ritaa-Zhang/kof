import { AcGameObject } from '/static/js/ac_game_object/base.js';

export class Player extends AcGameObject {
    // root方便索引地图上每一个元素
    constructor(root, info) {
        super();

        this.root = root;
        // player需要定义的元素：坐标xy，宽高，两名角色的id，矩形的颜色
        // 判断是否可以攻击到用图形代替人物，2D用矩形，3D用圆柱或者球体，这样容易判断碰撞
        // 先用矩形代替两名角色，实现基本逻辑后再把矩形替换成角色动画
        this.id = info.id;
        this.x = info.x;
        this.y = info.y;
        this.width = info.width;
        this.height = info.height;
        this.color = info.color;

        // 游戏中位置、速度、方向，分开定义，正方向右=1，反方向=-1
        this.direction = 1;

        // 常量定义在构造函数里，以便以后修改
        // 水平方向和竖直方向当前的速度
        this.vx = 0;
        this.vy = 0;

        // 每秒钟水平移动多少像素（起跳时水平方向初始速度），竖直方向跳跃的初始速度
        // 真实游戏中最好定义成变量，因为每名角色的跳跃高度不同
        this.speedx = 400;
        this.speedy = -1000;  // 向上跳，所以速度方向是负的

        // 重力加速度
        this.gravity = 50;

        // root就是为了索引的。js/base.js的root中有一个对象game_map，game_map中有一个ctx
        this.ctx = this.root.game_map.ctx;
        // root指的是js/base.js中的kof游戏实例，中有game_map对象，中有controller对象，中有pressed_keys对象
        this.pressed_keys = this.root.game_map.controller.pressed_keys;

        // 人物7种状态，人物是从上掉下来的，所以初始的时候是跳跃状态
        // 如果以后想要扩展，状态机一定定义好
        this.status = 3;  // 0：idle，1:向前，2:向后，3:跳跃，4:攻击，5:被打，6: 死亡
        // 为了方便，把每一个状态的动作存入数组
        this.animations = new Map();  // 未来动作会很多，用数组存会分不清数字，所以需要存字符串
        // 每过一帧就记录一下，表示当前记录了多少帧
        this.frame_current_cnt = 0;

        // 设置血量，为了触发击败
        this.hp = 100;
        // 每个玩家控制自己的血槽长度，通过find找到那个玩家的血条，注意find class + .
        // 格式化字符串,字符串中填入数值,${表达式}
        // $(selector).find(filter)：在所有后代元素中查找
        // 从map中寻找，map中内容如下
        // this.root.$kof.append($(`<div class="kof-head">
        //     <div class="kof-head-hp-0"><div><div></div></div></div>
        //     <div class="kof-head-timer">60</div>
        //     <div class="kof-head-hp-1"><div><div></div></div></div>
        // </div>`));
        this.$hp = this.root.$kof.find(`.kof-head-hp-${this.id}>div`);  // 外层，红
        this.$hp_div = this.$hp.find('div');  // 内层，浅绿
    }

    start() {

    }

    update_move() {
        // 当在跳跃的时候才会增加竖直方向才会重力，如果没有这个if，在水平移动的时候status会被判断为0，
        // 因为还在增加重力。这样vy就会增加，y也会增加，虽然人看起来在地上，但是y在地面下，所以状态是0静止
        // if (this.status === 3) {
        //     this.vy += this.gravity;  // 重力加速度 = 速度每一秒钟都要加上gravity
        // }

        // 正确的方法：什么情况下下落都要+重力，这样才会在下落被攻击/死亡时继续加速落下
        // 注意：单纯的跳跃落下后要恢复成静止状态，在被攻击状态和死亡状态，需要在落地后继续演动画，而不是停止
        this.vy += this.gravity;  // 重力加速度 = 速度每一秒钟都要加上gravity

        // 人物水平位置：每秒走一单位的距离,timedelta在ac_game_object中定义的
        // 每帧都会执行一次，timedelta存储当前帧距离上一帧的时间间隔
        // 单位是毫秒ms，所以要/ 1000。 1 s = 1000 ms
        this.x += this.vx * this.timedelta / 1000;
        this.y += this.vy * this.timedelta / 1000;

        //当两人物重叠，运动静止。原理同hitting box
        let [a, b] = this.root.players;  // 取出角色

        // 实现推人。如果a不是现在操作的角色，那就把ab互换，来确保b是对方，自己操作的是a
        if (a !== this) [a, b] = [b, a];
        // 在发生碰撞后才会产生推人效果

        // x1y1表示左上角，x2y2表示右下角
        let r1 = {
            x1: a.x,
            y1: a.y,
            x2: a.x + a.width,
            y2: a.y + a.height,
        };
        let r2 = {
            x1: b.x,
            y1: b.y,
            x2: b.x + b.width,
            y2: b.y + b.height,
        };

        // 如果发生碰撞，动作取消，即把上面的加法改成减法，动作就抵消了
        if (this.is_collision(r1, r2)) {
            // this.x -= this.vx * this.timedelta / 1000;
            // this.y -= this.vy * this.timedelta / 1000;
            // 到这里为止，如果跳到对方头上了，因为无法下落到地面，就会一直播放跳跃动画

            // 在发生碰撞后才会产生推人效果
            // 永远都是a推b，因为上面的ab互换的语句
            // a碰到b，a的每帧向正方向移动距离减半（上面this+1，这里a-0.5，a和this是一个东西）
            // b的每帧向正方向移动距离是正常距离的0.5（上面的this指的a，这里才是定义b的位移）
            b.x += this.vx * this.timedelta / 1000 / 2;
            b.y += this.vy * this.timedelta / 1000 / 2;
            a.x -= this.vx * this.timedelta / 1000 / 2;
            a.y -= this.vy * this.timedelta / 1000 / 2;

            // 加了这句判断就不会一直跳跃了
            if (this.status === 3)
                this.status = 0;  // 从高空落下后静止，状态由3变成0
            // 但是到这里为止，角色跳起的高度没有人高，所以会卡住，就很奇怪，课后自己调整
        }

        // 写到这里，两人物矩形已经会自由落体了，但是没有停下来，掉下去就消失了

        if (this.y > 450) {  // 当物体掉落到y=450时，停在450这个高度
            this.y = 450;
            this.vy = 0;

            // 注意：只在跳跃状态下，落地后恢复静止。
            // 在被攻击状态和死亡状态，需要在落地后继续演动画，而不是停止
            if (this.status === 3)
                this.status = 0;  // 从高空落下后静止，状态由3变成0
        }

        // 在移动中人物会移出屏幕，所以加一个限制
        if (this.x < 0) {
            this.x = 0;
            // this.root.game_map.$canvas.width()是屏幕宽度
        } else if (this.x + this.width > this.root.game_map.$canvas.width()) {
            this.x = this.root.game_map.$canvas.width() - this.width;
        }
    }

    update_control() {
        let w, a, d, space;
        // 两名玩家有所区别
        if (this.id === 0) {
            w = this.pressed_keys.has('w');
            a = this.pressed_keys.has('a');
            d = this.pressed_keys.has('d');
            space = this.pressed_keys.has(' ');
        } else {
            w = this.pressed_keys.has('ArrowUp');
            a = this.pressed_keys.has('ArrowLeft');
            d = this.pressed_keys.has('ArrowRight');
            space = this.pressed_keys.has('Enter');
        }

        // console.log(this.pressed_keys);  // 检查set有没有维护对

        // 在移动和静止状态是可以跳跃的
        if (this.status === 0 || this.status === 1) {
            if (space) {  // 攻击
                this.status = 4;
                this.xv = 0;  // 水平不可以移动
                this.frame_current_cnt = 0;  // 从第0帧开始渲染
                // 只写到这里会一攻击就停不下来了，需要在攻击动作结束之后停下来，所以需要在render加一个特判
            } else if (w) {  // 跳跃
                if (d) {  // 向前45度跳
                    this.vx = this.speedx;
                } else if (a) {  // 向后45度跳
                    this.vx = -this.speedx;
                } else {
                    this.vx = 0;  // 跳起来什么都不做，水平方向就没有速度
                }
                this.vy = this.speedy;  // 竖直方向上初始跳跃速度
                this.status = 3;  // 更新人物动作状态
                this.frame_current_cnt = 0;  // 跳跃开始时从第0帧开始渲染
            } else if (d) {  // 向前移动
                this.vx = this.speedx;
                this.status = 1;
            } else if (a) {  // 向后移动
                this.vx = -this.speedx;
                this.status = 1;  // 注意这里向后走也是1
            } else {
                this.vx = 0;  // 注意这里当什么都不操作的时候清空vx人物就会停下来
                this.status = 0;
            }
        }
        // console.log(this.vx, this.vy);
    }

    // 判断两名玩家谁在左谁在右，以此来确定对称性
    update_direction() {
        // 如果已经死亡，就不再掉换方向了
        if (this.status === 6) return;

        let players = this.root.players;  // 取出两名玩家
        if (players[0] && players[1]) {  // 当两名玩家都存在的时候
            // 我的id是0时，you id是1，我的id = 1时，you id = 0，所以id之和是1
            let me = this, you = players[1 - this.id];
            if (me.x < you.x) me.direction = 1;  // 如果我的坐标在对手坐标的左侧的话，我朝右
            else me.direction = -1;
        }
    }

    // 碰撞后，被攻击到了，更新状态
    is_attack() {
        // 如果已经是死亡状态，就不会再被攻击了，防止鞭尸
        if (this.status === 6) return;

        this.status = 5;
        this.frame_current_cnt = 0;  // 先是被攻击状态后，从受伤图片第0帧开始渲染
        // 注意：被攻击的动画演完之后就应该停止下来，就像挥拳动作在动画结束后，就要停下来，在render中添加

        // 被攻击后会减血，有可能血量变成负数，就和0取max
        this.hp = Math.max(this.hp - 20, 0);

        // animate() 方法执行 CSS 属性集的自定义动画。
        // 掉血的渐变效果，jquery的animate函数。代替下面那句立刻减血条
        // 该方法通过 CSS 样式将元素从一个状态改变为另一个状态。CSS属性值是逐渐改变的，这样就可以创建动画效果。
        // 只有数字值可创建动画（比如 "margin:30px"）。字符串值无法创建动画（比如 "background-color:red"）。
        // (selector).animate({styles},speed,easing,callback)
        // 里层div变得快
        this.$hp_div.animate({
            width: this.$hp.parent().width() * this.hp / 100,
        }, 300);
        // 外层变得慢
        this.$hp.animate({
            width: this.$hp.parent().width() * this.hp / 100,
        }, 600);

        // 掉血的时候改变他血槽的宽度，改为它父元素宽度的百分比
        // this.hp / 100血量剩余百分比 * 血槽宽
        // this.$hp.width(this.$hp.parent().width() * this.hp / 100);

        // 触发死亡状态
        if (this.hp <= 0) {
            this.status = 6;
            this.frame_current_cnt = 0;  // 触发死亡状态后，从死亡动作第0帧开始渲染
            // 在render中添加，死亡状态结束后就停止，不要一直播放

            // 记得死亡后清空速度，不然在走路时被击倒，在播放击倒动画时还会向前滑
            this.vx = 0;
        }
    }

    // 碰撞检测函数，检测两个矩形有没有交集
    // 当两个矩形在水平和竖直方向都有交集，则碰撞了
    // 区间ab和区间cd，max(a,c) > min(d,b)的时候没有交集
    is_collision(r1, r2) {
        if (Math.max(r1.x1, r2.x1) > Math.min(r1.x2, r2.x2))
            return false;
        if (Math.max(r1.y1, r2.y1) > Math.min(r1.y2, r2.y2))
            return false;
        return true;
    }

    // 判断什么时候拳头攻击到对方
    update_attack() {
        // 攻击状态是状态4。拳头从16帧挥出去，到20帧伸直。所以在中间18帧的时候判断方块碰撞
        if (this.status === 4 && this.frame_current_cnt === 18) {
            // 取出两人物，方法同update_direction
            let me = this, you = this.root.players[1 - this.id];
            // 找我的手臂 + 拳头区域的坐标。需要特判我的方向
            // x1y1表示左上角，x2y2表示右下角
            let r1;
            if (this.direction > 0) {
                r1 = {
                    x1: me.x + 120,
                    y1: me.y + 40,
                    x2: me.x + 120 + 100,
                    y2: me.y + 40 + 20,
                };
            } else {
                r1 = {
                    x1: me.x + me.width - 120 - 100,
                    y1: me.y + 40,
                    x2: me.x + me.width - 120 - 100 + 100,
                    y2: me.y + 40 + 20,
                };
            }
            // 找对方人物区域的坐标。不需要特判方向
            // x1y1表示左上角，x2y2表示右下角
            let r2;
            r2 = {
                x1: you.x,
                y1: you.y,
                x2: you.x + you.width,
                y2: you.y + you.height,
            };

            // 碰撞检测函数，碰撞了，对方就被攻击到了
            if (this.is_collision(r1, r2)) {
                you.is_attack();
            }
        }
    }

    // 更新当前帧状态，先计算当前帧状态是什么，再渲染
    update() {
        this.update_control();  // 每一帧都需要判断一下按的是什么键
        this.update_move();
        this.update_direction();
        this.update_attack();

        this.render();
    }

    render() {
        // 碰撞盒子开始
        // 为了方便就先渲染成矩形
        // this.ctx.fillStyle = this.color;
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);

        // if (this.direction > 0) {
        //     // 绘制正方向挥拳到最远处的拳头方块
        //     this.ctx.fillStyle = 'red';
        //     // 正方向坐标系在左上角
        //     this.ctx.fillRect(this.x + 200, this.y + 40, 20, 20);  // 以人物方块左上角向右延伸了200
        // } else {
        //     // 绘制负方向挥拳到最远处的拳头方块
        //     this.ctx.fillStyle = 'red';
        //     // 负方向坐标系也在左上角
        //     this.ctx.fillRect(this.x + this.width - 200 - 20, this.y + 40, 20, 20);
        // }

        // if (this.direction > 0) {
        //     // 绘制正方向挥拳到最远处的拳头 + 胳膊方块
        //     this.ctx.fillStyle = 'red';
        //     // 正方向坐标系在左上角
        //     this.ctx.fillRect(this.x + 120, this.y + 40, 100, 20);
        // } else {
        //     // 绘制负方向挥拳到最远处的拳头 + 胳膊方块
        //     this.ctx.fillStyle = 'red';
        //     // 负方向坐标系也在左上角
        //     this.ctx.fillRect(this.x + this.width - 120 - 100, this.y + 40, 100, 20);
        // }
        // 碰撞盒子结束


        // 根据当前的status来渲染
        let status = this.status;

        // 判断当前角色是在前进还是后退，用不同的gif
        // 当人物朝向和前进速度是同一方向的就表示前进，不同方向表示后退
        if (this.status === 1 && this.direction * this.vx < 0) status = 2;

        // 为什么可以在这里直接取出animations的值？是从哪里传进去的？
        // kyo中继承了父类player的成员变量this.animations = new Map();，将值set进去
        // 此处obj是animations中的一个对象，有kyo中定义的属性
        let obj = this.animations.get(status);  // 取出gif图片对象
        if (obj && obj.loaded) {  // 如果存在gif图并且被加载出来了，就进行渲染
            if (this.direction > 0) {  // 当朝向右的时候不需要翻转，渲染过程同以前
                // 不可以每一帧直接渲染，需要定义一个计数器frame_current_cnt，表示当前记录了多少帧（循环渲染）
                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;  // k存当前渲染到第几帧了
                let image = obj.gif.frames[k].image;  // 网页例子myGif.frames[0].image找到gif中第一帧图片
                this.ctx.drawImage(image, this.x, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);  // 把图片渲染到canvas上
            } else {
                this.ctx.save();  // 在变化坐标系之前先保存配置
                // 翻转x轴
                this.ctx.scale(-1, 1);  // 关于y轴进行左右翻转，所有x坐标 * 系数-1，y轴不变，就完成了翻转
                // 但在翻转完成后，xy轴内区域不在画布内，所以要向右平移坐标轴，在画布内渲染人物
                this.ctx.translate(-this.root.game_map.$canvas.width(), 0);  // 向x轴的负方向平移

                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;
                let image = obj.gif.frames[k].image;
                this.ctx.drawImage(image, this.root.game_map.$canvas.width() - this.width - this.x, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);

                this.ctx.restore();  // 最后把坐标系复原
            }
        }

        // 停止攻击动作的特殊判断，当播放到最后一帧了，就把状态更新成静止
        // 如果==obj.frame_cnt，会在播放完最后一张之后，又播放1帧第一张图
        // 注意：我们想要每5帧播放一张图片，所以 总帧数 === 一张图5帧 * 图片总数
        if (status === 4 || status === 5 || status === 6) {  // 挥拳动作和被打动作
            if (this.frame_current_cnt === obj.frame_rate * (obj.frame_cnt - 1)) {
                // 当触发死亡状态，就应该倒地不起
                if (status === 6) {
                    // 这里--，下面++，就会抵消，无法进入下一帧，就一直是死亡的最后一帧
                    this.frame_current_cnt--;
                } else {
                    this.status = 0;
                }
            }
        }

        // 显示完当前帧之后记得++，一帧图片动一次相当于1s动60次，5帧动一次相当于1s 12次
        this.frame_current_cnt++;
    }
}