import { UIManager } from './../../framework/uiManager';
import { Constant } from './../../framework/constant';
import { ClientEvent } from './../../framework/clientEvent';
import { _decorator, Component, EventTouch, Node, Vec2, Quat, Vec3, misc } from 'cc';
import { GameManager } from '../../fight/gameManager';

const { ccclass, property } = _decorator;

let _temp_quat = new Quat;

@ccclass('gameStartPanel')
export class gameStartPanel extends Component {
    @property(Node)
    public startName: Node = null!;
    public player: Node = null!;
    public planeSpeed = 1;
    private _rad: number = 0;
    private _turn1: boolean = false;
    private _turn2: boolean = false;
    private _roll1: number = 0;
    // private _roll2: number = 0;
    private _center: Vec3 = new Vec3(0, 30, 0);

    onEnable () {
        this._setTouch();
    }


    /**
     * 监听触摸，触摸则开始游戏
     */
    private _setTouch () {
        this.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            if (this._roll1 < 360) { return }
            if (!GameManager.starting) {
                this.startName.active = false;
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_START);
            }
        }, this);

    }

    update (dt: number) {
        if (this._turn1) {
            if (this.player.position.z > 0) {
                this.player.setPosition(this.player.position.x, this.player.position.y, this.player.position.z - 2);
            }
            else {
                this._turn1 = false;
                this._turn2 = true;
            }
        }
        if (this._turn2 && this._roll1 < 360) {
            this.player.eulerAngles = new Vec3(this._roll1 += 3, 0, 0);
            // this.player.children[0].eulerAngles = new Vec3(0, 0, this._roll2 += 3);
            let v3 = this.rotateByPoint(this.player.getPosition(), this._center, 3, new Vec3(1, 0, 0));
            this.player.setPosition(v3);
        }
    }

    /**
     * 初始化
     * @param player 玩家节点
     */
    public show (player: Node) {
        this.player = player;
        this._rad = 0;
        this.startName.active = true;
        this._roll1 = 0;
        // this._roll2 = 0;
        this._turn2 = false;
        this._turn1 = true;


    }

    /**
     * 内部函数
     */
    private _close () {
        UIManager.instance.hideDialog("gameStart/gameStartPanel");
    }

    /**
     * 绕着某一点旋转
     * @param target 目标点
     * @param center 中心坐标点
     * @param angle 旋转角度
     * @param axis 旋转轴
     * @returns
     */
    private rotateByPoint (target: Vec3, center: Vec3, angle: number, axis: Vec3 = Vec3.UP): Vec3 {
        let quat = new Quat();
        let dir = new Vec3();
        let rotated = new Vec3();
        // 逐元素向量减法: 目标位置 - 中心位置 = 由中心位置指向目标位置的向量
        Vec3.subtract(dir, target, center);
        // 角度转弧度
        let rad = misc.degreesToRadians(angle);
        // 根据旋转轴和旋转弧度计算四元数: 绕指定轴旋转指定弧度后的四元数
        Quat.fromAxisAngle(quat, axis, rad);
        // 向量四元数乘法: 向量 * 四元数 = 该向量按照四元数旋转后的向量
        Vec3.transformQuat(rotated, dir, quat);
        // 逐元素向量加法: 中心点 + 旋转后的向量 = 旋转后的点
        Vec3.add(rotated, center, rotated);

        return rotated;
    }

}

