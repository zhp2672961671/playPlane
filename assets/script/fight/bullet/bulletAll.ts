/* eslint-disable no-case-declarations */
import { combinationBase } from './../plane/combinationBase';
import { EffectManager } from './../../framework/effectManager';
import { Constant } from './../../framework/constant';
import { _decorator, Component, Node, ITriggerEvent, Vec3, Collider, find } from 'cc';
import { bulletBase } from './bulletBase';
import { ToolManager } from '../../ui/common/toolManager';
import { GameManager } from '../gameManager';
import { ClientEvent } from '../../framework/clientEvent';
const { ccclass, property } = _decorator;


@ccclass('BulletALL')
export class BulletALL extends bulletBase {
    public bulletType: number = Constant.BULLET_DIRECTION.CENTRAL;
    public dx: number = 0;    // x轴部分
    public dz: number = 1;   // z轴的,默认为1 竖直向下
    public dy: number = 0;    // y轴部分

    private _shooting: boolean = false;      // 激光需要判断是否在射击状态中
    private scaleC: number = Constant.GAME_VALUE.BULLET3_SCALE_CHANGE;       // 子弹大小每次变化大小

    /**
     *  各个子弹的初始化
     */
    public init () {
        switch (this.type) {
            case Constant.BULLET_ALL_TYPE.BULLET1:
                super.init();
                break;
            case Constant.BULLET_ALL_TYPE.BULLET2:
                let consider: Collider = this.getComponent(Collider);
                consider.on('onTriggerEnter', this.onTrigger, this);
                consider.on('onTriggerStay', this.onTrigger, this);
                this.bulletType = Constant.BULLET_DIRECTION.CENTRAL;
                break;
            case Constant.BULLET_ALL_TYPE.BULLET3:
                this._bulInit3();
                break;
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET2:
                super.init();
                this.bulletSpeed = Constant.BULLET_SPEED.BULLET4_SPEED;
                break;
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET3:
                super.init();
                this.bulletSpeed = Constant.BULLET_SPEED.BULLET5_SPEED;
                break;
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET4:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET5:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET6:
                super.init();
                this.node.eulerAngles = Vec3.ZERO;
                this.bulletSpeed = Constant.BULLET_SPEED.BULLET6_SPEED;
                break;
            case Constant.BULLET_ALL_TYPE.MISSILE1:
                super.init();
                this.mesh.active = true;
                this.node.eulerAngles = Vec3.ZERO;
                break;
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET7:
                super.init();
                this.bulletSpeed = Constant.BULLET_SPEED.BULLET10_SPEED;
                break;
        }

    }

    private _bulInit3 () {
        super.init();
        this.node.setScale(1, 1, 1);
        this.mesh.setScale(1, 1, 1);
        let children: Node[] = this.mesh.children;
        this.scaleC = Constant.GAME_VALUE.BULLET3_SCALE_CHANGE;
        for (let i: number = children.length - 1; i >= 0; i--) {
            children[i].setScale(1, 1, 1);
        }

    }

    /**
     * 子弹3形态变化
     */
    public scaleChange () {
        let scale = this.scaleC * GameManager.gameSpeed;
        this.node.setScale(this.node.scale.x + scale, this.node.scale.y + scale, this.node.scale.z + scale);
        // this.mesh.setScale(this.mesh.scale.x + scale, this.mesh.scale.y + scale, this.mesh.scale.z + scale);
        let children: Node[] = this.mesh.children;
        for (let i: number = children.length - 1; i >= 0; i--) {
            children[i].setScale(this.node.scale.x + scale, this.node.scale.y + scale, this.node.scale.z + scale);
        }

    }

    /**
     * 触发器碰撞函数
     * @param event 事件
     */
    public onTrigger (event: ITriggerEvent) {
        switch (this.type) {
            case Constant.BULLET_ALL_TYPE.BULLET1:
            case Constant.BULLET_ALL_TYPE.BULLET3:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET2:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET3:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET4:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET5:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET6:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET7:
                super.onTrigger(event);
                break;
            case Constant.BULLET_ALL_TYPE.BULLET2:
                this._bulTrigger2(event);
                break;
            case Constant.BULLET_ALL_TYPE.MISSILE1:
                this._bulTrigger9(event);
                break;
        }

    }

    /**
     * 这里注意一下，在设置物理组的时候，敌机设置的是（2^2）组，即为4，玩家飞机设置的是（2^3）组，即为8组，激光不需要消失，但是需要
     * @param event
     */
    private _bulTrigger2 (event: ITriggerEvent) {
        if (event.selfCollider.getGroup() == Constant.ITEM_GROUP.SELF_BULLET && event.otherCollider.getGroup() == Constant.ITEM_GROUP.ENEMY_PLANE) {
            let enemyPos: number = Math.abs(event.otherCollider.node.worldPosition.z);
            let selfPos: number = Math.abs(event.selfCollider.node.position.z);
            let scalePos: number = ((enemyPos + selfPos) - (event.otherCollider.node.scale.z / 2)) / 10;    // 设置激光的长度，计算公式为，当前激光的z坐标点加上敌机的z坐标点，减去敌机自身z轴大小的一半，最后除以10，这里的10是激光单位长度。
            event.selfCollider.node.setScale(event.selfCollider.node.scale.x, event.selfCollider.node.scale.y, scalePos);
        }
    }

    /**
     * 导弹的碰撞
     * @param event 事件
     */
    private _bulTrigger9 (event: ITriggerEvent) {
        if (event.selfCollider.getGroup() == Constant.ITEM_GROUP.ENEMY_BULLET && event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_PLANE) {
            let pos: Vec3 = this.node.getPosition();
            EffectManager.instance.loadAndPlayEffect(
                true, find("effectManager"), Constant.LOADING_PATH.EXPLODE_SMALL, 1.5, pos, null, false, true, 1, true, 1.5, null
            );
            this.isDie = true;
            ClientEvent.dispatchEvent(Constant.EVENT_TYPE.REMOVE_BULLET, this.node);
            this.mesh.active = false;
            this.scheduleOnce(() => {
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.BULLET_KILLED, this.node);
            }, 2);

        }
    }

    /**
     * @param bullet bulletManager
     * @param degree 一般不用到
     * @param type 子弹属于什么类型
     * @param shooting 用于激光类子弹的判断（只有激光用到
     */
    public showBulletAll (degree?: number, type?: string, shooting?: boolean) {
        this.type = type;
        switch (this.type) {
            case Constant.BULLET_ALL_TYPE.BULLET1:
            case Constant.BULLET_ALL_TYPE.BULLET3:
                super.showBulletManager(degree);
                break;
            case Constant.BULLET_ALL_TYPE.BULLET2:
                this._shooting = shooting;
                if (this._shooting) { this.init() }
                else { ClientEvent.dispatchEvent(Constant.EVENT_TYPE.BULLET_KILLED, this.node) }
                break;
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET2:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET3:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET4:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET5:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET6:
            case Constant.BULLET_ALL_TYPE.MISSILE1:
            case Constant.BULLET_ALL_TYPE.ENEMY_BULLET7:
                this._bulShow(degree);
                break;
        }

    }

    /**
     * 这里的sin和cos使用的是欧拉角
     * @param degree 角度
     */
    private _bulShow (degree: number) {
        this.dx = ToolManager.instance.angleToSin(degree);
        this.dy = ToolManager.instance.angleToCos(degree);
        super.showBulletManager(degree);
    }


}

