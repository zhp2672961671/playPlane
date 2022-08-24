import { GameManager } from './../gameManager';
import { AudioManager } from './../../framework/audioManager';
import { EffectManager } from './../../framework/effectManager';
import { _decorator, Node, ITriggerEvent, Vec3, find, Quat, Collider } from 'cc';
import { EnemyManager } from './enemyManager';
import { ToolManager } from '../../ui/common/toolManager';
import { Constant } from '../../framework/constant';
import { combinationBase } from './../plane/combinationBase';
const { ccclass, property } = _decorator;

let _temp_quat = new Quat;
@ccclass('enemyRed')
export class enemyRed extends combinationBase {
    public centerPoint: Vec3 = new Vec3(0, 0, -30);
    public angle: number = 0; // 角度
    public radius: number = 0; // 半径
    public raniusSpeed: number = 5;      // 飞机通过弧形时候所需要的时间
    public sideAngle: number = 0;       // 机身自身侧方位的倾角
    public sideSpeed: number = 0.1;

    private isRotating: boolean = false; // 标志位，是否正在旋转
    private _ncircle: number = 0;       // 敌机旋转的圈数

    private _degree: number = 0;    // 欧拉角
    private _dx: number = Math.sin(this._degree * Math.PI / 180);    // x轴部分
    private _dy: number = Math.abs(Math.cos(this._degree * Math.PI / 180));    // y轴部分

    /**
     * 初始化
     */
    public init () {
        super.init();
        this.angle = 0;
        this.radius = 0;
        this._ncircle = 0;
        this.isRotating = false;
        this.sideAngle = this.node.eulerAngles.z;
        this.enemyBulletSpeed = 10;

    }

    onDisable () {
        let collider: Collider = this.getComponent(Collider);
        collider.off('onTriggerEnter', this.onTrigger, this);
        collider.off('onTriggerStay', this.onTrigger, this);
        this.node.eulerAngles = new Vec3(0, 0, 0);
        super.onDisable();
    }

    update (deltaTime: number) {
        let pos: Vec3 = this.node.position;
        if (!this.isDie) {
            // 第一阶段，敌机从上往下移动，此时的限制条件为坐标z的位置，是否旋转，圈数是否为0
            if (pos.z < -30 && !this.isRotating && this._ncircle == 0) {
                this.node.translate(new Vec3(this._dx * this.enemySpeed * GameManager.gameSpeed, 0, -(this._dy * this.enemySpeed * GameManager.gameSpeed)));
            }
            if (pos.z >= -30 && this.angle == 0) {
                this.isRotating = true;
                this.runRound();
            }
            // 第二阶段开启旋转顺时针旋转
            if (this.isRotating) {
                let radian = Math.PI / 180 * this.angle;
                // 更细节点位置
                this.node.setPosition(
                    this.centerPoint.x + (this.radius * Math.cos(radian) * GameManager.gameSpeed), 0, this.centerPoint.z + (this.radius * Math.sin(radian) * GameManager.gameSpeed)
                );

                this.node.eulerAngles = new Vec3(0, 180 - this.angle, this.sideAngle -= this.sideSpeed * GameManager.gameSpeed);

                // 计算下一帧的角度
                let anglePerFrame = deltaTime * (360 / (this.raniusSpeed * GameManager.gameSpeed));   // 这里是绕一圈所需要的时间
                this.angle += anglePerFrame;
                this._ncircle = Number((this.angle / 360).toFixed(0));  // 取绕了几圈，这里的angle会一直增加

                // ////修改子弹间隔，子弹发射数量，子弹发射状态
                // 在一个范围之间发射子弹(角度40~55之间)
                if ((this.angle >= (40 + this._ncircle * 360) && this.angle < (55 + this._ncircle * 360))) {
                    if (this.isBullet) {
                        this.bulletTime++;
                        if (this.bulletTime >= this.enemyBulletSpeed / GameManager.gameSpeed && this.enemyplane) {
                            // 发射子弹，这里注意一下，用其他类型的子弹，
                            let self_pos: Vec3 = this.node.getPosition();
                            self_pos.z = self_pos.z - 10;
                            this.enemyplane.transBulletManager(this.barrage, self_pos);
                            this.bulletTime = 0;
                        }
                    }
                }
            }
            if (this.isRotating && this.angle >= 800) {
                this.isRotating = false;

            }
            // 第三阶段，当敌机旋转了一定的圈数以后，将取消旋转，然后从屏幕的左边飞出屏幕
            if (!this.isRotating && this._ncircle > 0 && this.angle >= 800) {
                let dx = Math.sin(((this.angle - this._ncircle * 360) / 180) * Math.PI);
                let dy = Math.cos(((this.angle - this._ncircle * 360) / 180) * Math.PI);
                this.node.translate(new Vec3(-dy * this.enemySpeed * GameManager.gameSpeed, 0, -dx * this.enemySpeed * GameManager.gameSpeed));
            }

        }
        else if (this.isDie && this.crashed) {
            this.enemyCrashed();
        }

        if (pos.x <= -50) {     // 敌机飞到屏幕左侧超出屏幕后，将其删除
            if (this.enemyplane) {
                this.enemyplane.onEnemyKilled(this.node);
                this.enemyplane.enemyRandScore(false);
            }

        }
    }

    /**
     * 飞机坠落
     */
    public enemyCrashed () {
        this.node.getRotation(_temp_quat);
        this.rad = -2 * Number(Math.PI) / 180;
        Quat.rotateZ(_temp_quat, _temp_quat, this.rad);
        this.node.setRotation(_temp_quat);
        let pos: Vec3 = this.node.position;
        this.node.setPosition(pos.x + 0.3, pos.y - 0.3, pos.z + this.enemySpeed);
    }

    /**
     * 飞机绕旋转前获取对应值
     */
    public runRound () {
        // this.angle = 180 + ToolManager.instance.getAngle(this.centerPoint.getPosition(), this.node.getWorldPosition());
        this.radius = ToolManager.instance.getDistance(this.centerPoint, this.node.getWorldPosition());
        this.isRotating = true;

    }

    /**
     * 从enemyManager执行后带到这里的，带有角度信息的数据，后面则要和上面的函数重叠,有角度使用这一类调用
     * @param enemyManagerParent enemyManager
     * @param isBullet 是否攻击
     * @param degree 角度
     * @param enemySpeed 敌机速度
     */
    public showManager (enemyManagerParent: EnemyManager, isBullet: boolean, degree: number, enemySpeed?: number) {
        this._degree = degree;
        this._dx = Math.sin(this._degree * Math.PI / 180);
        this._dy = Math.abs(Math.cos(this._degree * Math.PI / 180));
        super.showManager(enemyManagerParent, isBullet, degree, enemySpeed);
    }

    /**
     * 触发器碰撞
     * @param event 事件
     * @returns
     */
    public onTrigger (event: ITriggerEvent) {
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_PLANE || event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_BULLET) {
            this.attFlashing();
            // 敌机生命值判断
            this.emyNum++;
            if (this.emyNum < this.enemyHp) { return }

            if (this.enemyplane && this.emyNum >= this.enemyHp) {
                event.selfCollider.off('onTriggerEnter');   // 关闭碰撞
                event.selfCollider.off('onTriggerStay');
                if (!this.crashed.active) {
                    AudioManager.instance.playSound(Constant.AUDIO_SOUND.FALL);
                    this.crashed.active = true;
                    this.isDie = true;
                    this.dieEffect = EffectManager.instance.loadAndPlayEffect(
                        true, find("effectManager"), Constant.LOADING_PATH.EXPLODE, 1.5, this.node.getPosition(), null, false, true, 1, true, 5, () => {
                        }
                    );
                    this.enemyplane.creatorStars(this.node.getPosition(), this.starsNumber);
                    this.enemyplane.creatorProp(this.node.getPosition(), this.props);
                    EnemyManager.enemyDestroyScore(this.score);     // 击落敌机记分
                    this.scheduleOnce(() => {
                        this.enemyplane.onEnemyKilled(this.node);
                    }, 7);
                }
            }
        }
    }

}
