
import { _decorator, Component, Node, Mesh, Collider, ITriggerEvent, MeshRenderer, Vec3 } from 'cc';
import { Constant } from '../../../framework/constant';
const { ccclass, property } = _decorator;


@ccclass('colliderBase')
export class colliderBase extends Component {
    @property(Node)
    public effectMain: Node = null!;
    @property(Node)
    public Mesh: Node = null!;
    @property(Node)
    public blood: Node = null!;
    @property(Node)
    public lifeBlood: Node = null!;  // 血条实体
    @property(Node)
    public lifeBloodBg: Node = null!;    // 血条背景

    public type: string = "";
    public colliderDie: boolean = false;
    public lifeValue: number = 100;     // 血量
    public _collisionFrequency: number = 0;    // 碰撞次数

    onDisable () {
        let collider: Collider = this.getComponent(Collider);
        collider.off('onTriggerEnter', this._onTrigger, this);
        collider.off('onTriggerStay', this._onTrigger, this);
    }

    /**
     * 初始化，在敌机被创建的时候（bossPlaneMain中被初始化
     */
    public init () {
        // 给触发器设置组和mask
        const group = (1 << 2);
        const mask = (1 << 0) + (1 << 1) + (1 << 3);
        this.node.getComponent(Collider).setGroup(group);
        this.node.getComponent(Collider).setMask(mask);

    }

    public _onTrigger (event: ITriggerEvent) {
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_PLANE || event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_BULLET) {

            // /////////////非常非常重要
            let selfM = this.Mesh.getComponent(MeshRenderer).materials[0];
            let selfC =  Constant.SCALE.SCALE2;
            selfM.setProperty("albedoScale", selfC);
            this.scheduleOnce(() => {
                selfC = new Vec3(1, 1, 1);
                selfM.setProperty("albedoScale", selfC);
            }, 0.2);

            this._collisionFrequency++;
            // 血条显示后2s之后消失
            this.setBlood();
            this.scheduleOnce(() => {
                this.blood.active = false;
            }, 2);

            if (this._collisionFrequency > this.lifeValue) {
                this.effectMain.active = true;
                this.colliderDie = true;
                this.scheduleOnce(() => {
                    this.node.active = false;
                }, 2);
            }
        }
    }


    // 设置血条
    public setBlood () {
        if (!this.blood.active) { this.blood.active = true }
        // 碰撞次数小于最高可碰撞次数,血条设置，这里的血条是3d的
        let number = (this.lifeValue - this._collisionFrequency) / this.lifeValue;
        this.lifeBlood.setScale(this.lifeBloodBg.scale.x * number, this.lifeBlood.scale.y, this.lifeBlood.scale.z);
        let posX = (this._collisionFrequency / this.lifeValue) * this.lifeBloodBg.scale.x * 10;
        this.lifeBlood.setPosition(-posX / 2, this.lifeBlood.position.y, this.lifeBlood.position.z);
        this.lifeBlood.active = true;
        this.lifeBloodBg.active = true;     // 这里设置成了常驻显示，后面要改成汁显示一会
        if (this._collisionFrequency >= this.lifeValue) { this.lifeBlood.setScale(0, this.lifeBlood.scale.y, this.lifeBlood.scale.z) }
    }


}

