import { AudioManager } from './../../framework/audioManager';
import { Constant } from './../../framework/constant';
import { _decorator, Node, Vec3, ITriggerEvent } from 'cc';
import { EnemyManager } from './enemyManager';
import { ToolManager } from '../../ui/common/toolManager';
import { combinationBase } from './combinationBase';
const { ccclass, property } = _decorator;

@ccclass('enemyAll')
export class enemyAll extends combinationBase {
    // com7
    public attack: number = 120;    // 攻击开始(从什么时候开始攻击)
    public bulletGap: number = 5;   // 子弹与子弹的间隔
    public gapMax: number = 360;
    public gapMin: number = 0;
    private _attack: number = 0;
    private _degree7: number = 0;
    public numShot: number = 0;        // 发射了多少轮子弹，用于计数用的变量

    public type: string = "";

    public degree: number = 0;    // 欧拉角
    public dx: number = 0;    // x轴部分
    public dy: number = 1;    // y轴部分

    public centerPos: Vec3 = new Vec3(0, 0, 0);
    public radius: number = 0; // 半径
    public angle: number = 180; // 角度
    public sideAngle: number = 0;   // 机身自身侧方位的倾角
    public sideSpeed: number = 0.5;
    public angle5: number = 0;
    public angle6: number = 117;   // 角度2 com6使用

    public raniusSpeed: number = 5;  // 飞机通过弧形时需要的时间
    public isRotating: boolean = false; // 标志位，是否正在旋转

    /**
     * 初始化
     */
    public init () {
        this.angle = 180;
        this.isRotating = false;
        switch (this.type) {
            case Constant.ENEMY_ALL_TYPE.COMBINATION1:
            case Constant.ENEMY_ALL_TYPE.COMBINATION2:
            case Constant.ENEMY_ALL_TYPE.COMBINATION3:
                super.init();
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION4:
                this._comInit4();
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION5:
                this._comInit4();
                this.angle5 = 0;
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION6:
                this._comInit4();
                this.angle6 = 117;
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION7:
                this._comInit7();
                break;
        }
    }

    /**
     *初始化
     */
    private _comInit4 () {
        super.init();
    }

    /**
     *初始化
     */
    private _comInit7 () {
        this._attack = 0;
        this._degree7 = this.gapMin;
        this.numShot = 0;
        super.init();
        this.enemyBulletSpeed = 2;
    }

    onDisable () {
        switch (this.type) {
            case Constant.ENEMY_ALL_TYPE.COMBINATION1:
            case Constant.ENEMY_ALL_TYPE.COMBINATION3:
                this._comDisable();
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION2:
                super.onDisable();
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION4:
            case Constant.ENEMY_ALL_TYPE.COMBINATION5:
            case Constant.ENEMY_ALL_TYPE.COMBINATION6:
                this._comDisables();
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION7:
                super.onDisable();
                break;
        }
    }

    /**
     * 回收处理1
     */
    private _comDisable () {
        super.onDisable();
        this.node.eulerAngles = new Vec3;
    }

    /**
     *回收处理2
     */
    private _comDisables () {
        super.onDisable();
        this.comDis();
    }


    /**
     * 其余共有disable
     */
    private comDis () {
        super.onDisable();
        this.node.children[0].eulerAngles = Constant.GAME_POS.POS_7;
        this.node.children[1].eulerAngles = Constant.GAME_POS.POS_6;
        this.node.children[1].setPosition(Constant.GAME_POS.POS_5);
        this.node.eulerAngles = new Vec3;

    }


    /**
     * 旋转第4组
     */
    public runRound4 () {
        // this.angle = ToolManager.instance.getAngle(this.centerPoint.getPosition(), this.node.getPosition());
        this.radius = ToolManager.instance.getDistance(this.centerPos, this.node.getPosition());

        this.isRotating = true;
    }

    /**
     * 旋转第5组
     */
    public runRound5 () {
        this.angle5 = ToolManager.instance.getAngle(new Vec3(0, 0, 0), this.node.getPosition()) - 72;

        this.radius = ToolManager.instance.getDistance(this.centerPos, this.node.getPosition());
        this.isRotating = true;
    }



    /**
     * 发射子弹部分
     */
    public shooting () {
        this._attack++;
        if (this._attack >= this.attack) {      // 这一层是用于判断开炮时间，每次发射完一套子弹后的等待时间也是这里控制
            this.bulletTime++;
            if (this.bulletTime >= this.enemyBulletSpeed) {   // 这一层是用于控制发射频率，发射频率和下方的子弹空隙角度也密切相关，（发射频率和发射角度呈正相关）
                let self_pos: Vec3 = this.node.getPosition();
                // 取enemy中的子弹类型07

                if (this.barrage == Constant.BULLET_COMBINATOR.BULLET_1004) { this.enemyplane.transBulletManager(this.barrage, self_pos, this._degree7) }
                else { this.enemyplane.transBulletManager(this.barrage, self_pos) }
                if (this._degree7 < this.gapMax) {
                    this._degree7 += this.bulletGap;
                }
                else {
                    this._attack = 0;
                    this._degree7 = 0;
                    this.numShot++;
                }
                this.bulletTime = 0;
            }
        }

    }


    /**
     *
     * @param enemyManagerParent 敌机管理器
     * @param isBullet 是否开枪
     * @param degree 传入的角度
     * @param enemySpeed 敌机速度
     * @param type 敌机的类型
     */
    public showAllManager (enemyManagerParent: EnemyManager, isBullet: boolean, degree: number, enemySpeed:number, type?:string) {
        this.type = type;
        switch (this.type) {
            case Constant.ENEMY_ALL_TYPE.COMBINATION1:
            case Constant.ENEMY_ALL_TYPE.COMBINATION3:
            case Constant.ENEMY_ALL_TYPE.COMBINATION5:
            case Constant.ENEMY_ALL_TYPE.COMBINATION6:
                this._comShowManager(enemyManagerParent, isBullet, degree, enemySpeed);
                break;
            case Constant.ENEMY_ALL_TYPE.COMBINATION2:
            case Constant.ENEMY_ALL_TYPE.COMBINATION4:
            case Constant.ENEMY_ALL_TYPE.COMBINATION7:
                super.showManager(enemyManagerParent, isBullet, degree, enemySpeed);
                break;
        }
    }

    /**
     * 共有
     * @param enemyManagerParent enemyMANAGER
     * @param isBullet 是否发射zidan
     * @param degree 角度
     * @param enemySpeed 速度
     */
    private _comShowManager (enemyManagerParent: EnemyManager, isBullet: boolean, degree: number, enemySpeed:number) {
        this.degree = degree;
        // 这里的sin和cos使用的是欧拉角
        this.dx = Math.sin(this.degree * Math.PI / 180);
        this.dy = Math.abs(Math.cos(this.degree * Math.PI / 180));

        super.showManager(enemyManagerParent, isBullet, degree, enemySpeed);

    }

    /**
     * 共有
     * @param centerPos 中心点
     */
    public setCenterPoint (centerPos: Vec3) {
        this.centerPos = centerPos;
    }


    public onTrigger (event: ITriggerEvent) {
        switch (this.type) {
            case Constant.ENEMY_ALL_TYPE.COMBINATION1:
            case Constant.ENEMY_ALL_TYPE.COMBINATION2:
            case Constant.ENEMY_ALL_TYPE.COMBINATION3:
            case Constant.ENEMY_ALL_TYPE.COMBINATION4:
            case Constant.ENEMY_ALL_TYPE.COMBINATION5:
            case Constant.ENEMY_ALL_TYPE.COMBINATION6:
            case Constant.ENEMY_ALL_TYPE.COMBINATION7: {
                super.onTrigger(event);
                break;
            }
        }

    }



}
