import { AudioManager } from './../../framework/audioManager';
import { EffectManager } from './../../framework/effectManager';
import { ResourceUtil } from './../../framework/resourceUtil';
import { _decorator, Component, Node, Collider, ITriggerEvent, find, Prefab, Vec3, ParticleSystem } from 'cc';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
import { PoolManager } from '../../framework/poolManager';
import { GameManager } from '../gameManager';

const { ccclass, property } = _decorator;
@ccclass('selfPlane')
export class selfPlane extends Component {
    @property(Node)
    public blood: Node = null;  // 血条
    @property(Node)
    public lifeBlood: Node = null!;  // 血条实体
    @property(Node)
    public lifeBloodBg: Node = null!;    // 血条背景

    public static isDie: boolean = false;

    public lifeValue: number = Constant.EVENT_TYPE.GAME_PLANE_BLOOD;
    public collisionFrequency: number;    // 碰撞次数
    private _selfGame: GameManager;
    private lowBloodPanel: Node = null!;
    private _dieEffect: boolean = false!;  // 死亡特效



    /**
     * 初始化
     */
    public init () {
        let collider: Collider = this.getComponent(Collider);
        collider.on('onTriggerEnter', this._onTrigger, this);
        this.lifeValue = Constant.EVENT_TYPE.GAME_PLANE_BLOOD;
        selfPlane.isDie = false;
        this.blood.active = false;
        this.collisionFrequency = 0;
        this._dieEffect = false;
        // 设置血条大小
        this.lifeBlood.setScale(0.2, 1, 0.01);  // 根据自身飞机设置的大小，固定值

    }


    /**
     * 设置血量
     */
    public setBlood () {
        this.blood.active = true;
        // 当生命值小于25%的时候，即碰撞数/总生命值 >=75%的时候出发常驻，否则执行闪烁
        if ((this.collisionFrequency / this.lifeValue) < 0.7 && !this.blood.active) {
            this.scheduleOnce(() => {
                this.blood.active = false;
            }, 3);
        }

        // 碰撞次数小于最高可碰撞次数,血条设置，这里的血条是3d的
        let number = (this.lifeValue - this.collisionFrequency) / this.lifeValue;
        this.lifeBlood.setScale(this.lifeBloodBg.scale.x * number, this.lifeBlood.scale.y, this.lifeBlood.scale.z);
        let posX = (this.collisionFrequency / this.lifeValue) * this.lifeBloodBg.scale.x * 10;
        this.lifeBlood.setPosition(-posX / 2, this.lifeBlood.position.y, this.lifeBlood.position.z);

    }

    /**
     * 触发器碰撞 自身的layer为2的0次方==》即为1，组为8
     * @param event 事件
     * @returns
     */
    private _onTrigger (event: ITriggerEvent) {
        if (event.otherCollider.name == 'combination8' || event.otherCollider.name == 'combination9') { return }
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.ENEMY_BULLET || event.otherCollider.getGroup() == Constant.ITEM_GROUP.ENEMY_PLANE) {
            this.collisionFrequency++;
            // 检测碰撞次数是否为最高可碰撞次数
            if (this.collisionFrequency == this.lifeValue) { this.lifeBlood.setScale(0, this.lifeBlood.scale.y, this.lifeBlood.scale.z) }
            if (this.collisionFrequency < this.lifeValue) {
                this._selfGame.getComponent(GameManager).vibrationEffect();      // 调用震动效果
                this.setBlood();

            }
            // 如果碰撞次数等于或者超过生命值以后，就宣布死亡
            else if (this.collisionFrequency >= this.lifeValue) {
                selfPlane.isDie = true;
                if (!this._dieEffect) {
                    this._dieEffect = true;
                    AudioManager.instance.playSound(Constant.AUDIO_SOUND.BOOM);
                    let pos: Vec3 = this.node.getPosition();
                    EffectManager.instance.loadAndPlayEffect(
                        true, find("effectManager"), Constant.LOADING_PATH.EXPLODE, 1, pos, null, false, true, 1, true, 7, null
                    );
                }
                ClientEvent.dispatchEvent(Constant.GAMEOVER_TYPE.GAME_FAILURE);         // 广播游戏失败
                this._selfGame.getComponent(GameManager).closeSpecialBullet();      // 取消特殊子弹
            }

            if (this.lowBloodPanel == null) {       // /////// 玩家红血警告效果
                ResourceUtil.createUI(Constant.LOADING_PATH.LOW_BLOOD, (err, pf) => {
                    this.lowBloodPanel = pf;
                });
            }
            else { this.lowBloodPanel.active = true }
            if (this.collisionFrequency < Constant.EVENT_TYPE.GAME_PLANE_BLOOD_WARN) {
                this.scheduleOnce(() => {
                    PoolManager.instance.putNode(find(Constant.VOLUMES.VOLUMES_LOWBLOOD));
                }, 1);
            }
        }

        // 道具碰撞设置
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.PROP_FIGHT) {
            if (event.otherCollider.node.parent.name == Constant.PROPS.PROPS_HEART) {      // 回血道具
                if (this.collisionFrequency > 0) {       // 碰撞数不为0的时候，回一次碰撞次数（回血）
                    this.collisionFrequency--;
                    this.setBlood();
                    if (this.collisionFrequency >= Constant.EVENT_TYPE.GAME_PLANE_BLOOD_WARN) {
                        this.lowBloodPanel.active = false;
                    }
                    else { PoolManager.instance.putNode(find(Constant.VOLUMES.VOLUMES_LOWBLOOD)) }
                }
            }
            if (event.otherCollider.node.parent.name == Constant.PROPS.PROPS_BULLET) {     // 子弹升级道具
                GameManager.levelBulletInterval++;
                this._selfGame.getComponent(GameManager).closeSpecialBullet();      // 取消特殊子弹
            }
        }


    }

    update (deltaTime: number) {
        if (this._selfGame && !selfPlane.isDie) {
            let pos: Vec3 = this.node.position;
            if (GameManager.starting) {
                if (this.node.scale.x > 5 && this.node.scale.y > 5 && this.node.scale.z > 5) {
                    this.node.setScale(this.node.scale.x - 0.2, this.node.scale.y - 0.2, this.node.scale.z - 0.2);
                    this.node.setPosition(pos.x, pos.y, pos.z - 0.3);

                }
            }
        }
    }

    /**
     * 初始化
     * @param gameManagerParent gameManager
     */
    public show (gameManagerParent: GameManager) {
        this._selfGame = gameManagerParent;
        this.init();
    }


}

