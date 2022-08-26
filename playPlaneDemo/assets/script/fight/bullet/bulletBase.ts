import { EffectManager } from './../../framework/effectManager';
import { _decorator, find, Component, Node, Collider, ITriggerEvent } from 'cc';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
const { ccclass, property } = _decorator;

@ccclass('bulletBase')
export class bulletBase extends Component {
    @property
    public bulletSpeed: number = 1;
    @property(Node)
    public mesh: Node = null!;

    public playerBullet: boolean = false;       // 自己玩家发射的子弹
    public enemyBullet: boolean = true;         // 敌机发射的子弹
    public type: string = "";
    public isDie: boolean = true;

    onDisable () {
        let consider: Collider = this.getComponent(Collider);
        consider.off('onTriggerEnter', this.onTrigger, this);
    }

    public init () {
        let consider: Collider = this.getComponent(Collider);
        consider.enabled = true;
        consider.on('onTriggerEnter', this.onTrigger, this);
        this.bulletSpeed = 1;
        this.isDie = false;
        this.node.getComponent(Collider).enabled = true;
    }


    /**
     *给子弹设置分组，true为自身子弹，组别为3，false为敌机子弹（其余子弹），组别为2
     * @param isSelf 是否玩家子弹或者敌机子弹,自身子弹设置组别为3,敌机子弹设置组别为2
     */
    public setBulletGroup (isSelf: boolean) {
        if (isSelf) {
            this.playerBullet = true;
            this.enemyBullet = false;
            const group = (1 << 0) + (1 << 1);  // 11 --> 3
            const mask = (1 << 0) + (1 << 2) + (1 << 3);    // 13
            this.node.getComponent(Collider).setGroup(group);
            this.node.getComponent(Collider).setMask(mask);
        }
        else {
            this.playerBullet = false;
            this.enemyBullet = true;
            const group = 1 << 1;   // 10 --> 2
            const mask = (1 << 0) + (1 << 2) + (1 << 3);    // 13
            this.node.getComponent(Collider).setGroup(group);
            this.node.getComponent(Collider).setMask(mask);
        }
    }

    /**
     * 碰撞产生
     * @param event 事件
     */
    public onTrigger (event: ITriggerEvent) {
        // 这里注意一下，在设置物理组的时候，敌机设置的是（2^2）组，即为4，玩家飞机设置的是（2^3）组，即为8组，
        let isSelf: boolean = event.selfCollider.getGroup() == Constant.ITEM_GROUP.SELF_BULLET && event.otherCollider.getGroup() == Constant.ITEM_GROUP.ENEMY_PLANE;
        let isEnemy: boolean = event.selfCollider.getGroup() == Constant.ITEM_GROUP.ENEMY_BULLET && event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_PLANE;
        if (isSelf || isEnemy) {
            this.isDie = true;
            event.selfCollider.off('onTriggerEnter');
            this.node.getComponent(Collider).enabled = false;
            EffectManager.instance.loadAndPlayEffect(
                true, find("effectManager"), Constant.LOADING_PATH.HIT, 1, this.node.position, null, false, true, 1, true, 1.5, null
            );
            ClientEvent.dispatchEvent(Constant.EVENT_TYPE.BULLET_KILLED, this.node);
            ClientEvent.dispatchEvent(Constant.EVENT_TYPE.REMOVE_BULLET, this.node);
        }
    }

    /**
     * 初始化
     * @param degree 角度
     */
    public showBulletManager (degree?: number) {
        this.init();
    }

}

