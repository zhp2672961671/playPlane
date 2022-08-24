import { EffectManager } from './../../framework/effectManager';
import { _decorator, find, Component, Node, ParticleSystem, MeshRenderer, Vec3, Collider, ITriggerEvent, Quat } from 'cc';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
import { ToolManager } from '../../ui/common/toolManager';
import { GameManager } from '../gameManager';
import { EnemyManager } from './enemyManager';
import { AudioManager } from '../../framework/audioManager';
const { ccclass, property } = _decorator;


let _temp_quat = new Quat;
@ccclass('combinationBase')
export class combinationBase extends Component {
    @property(Node)
    public dieEffect: Node = null!;     // 死亡特效
    @property
    public enemySpeed: number = 0.6;    // 敌机速度
    @property(Node)
    public mesh: Node = null!;      // 闪烁的组件
    @property(Node)
    public crashed: Node = null!;   // 坠毁特效（并不是每一架飞机都存在坠毁特效，后面要进行判断


    // ////////// 表中的数据
    public enemyHp: number = 7;       // 生命值
    public score: number = 20;        // 击落得分
    public starsNumber: number = 0;    // 掉落星星数量
    public props: number = 0;         // 掉落道具
    public barrage: number = 1000;        // 弹幕id
    public enemyBulletSpeed: number = 60;   // // 敌机开炮间隔
    // /////////////


    // 存储值（暂停和继续)
    public _stopValue1: number = this.enemySpeed;  // 敌机的飞行速度
    public _stopValue2: number = 2;               // 敌机身上绑定的特效播放速度


    // 自身数据，这里的数据本应该是私有的private,但是作为父类，要让子类可以读取到，这里暂时
    // 先设置成共有类，
    public emyNum: number = 0;    // 自身碰撞计数，与总生命值计算
    public enemyplane: EnemyManager;
    public isDie: boolean = false;
    public bulletTime: number = 0;
    public isBullet: boolean = true;   // 是否进行开枪
    public rad: number;

    public init () {
        this.bulletTime = 0;
        let collider: Collider = this.getComponent(Collider);
        collider.on('onTriggerEnter', this.onTrigger, this);
        collider.on('onTriggerStay', this.onTrigger, this);
        this.emyNum = 0;  // 设置被碰撞数值为0
        this.isDie = false;

    }


    onEnable () {
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_STOP, this.onGameStop, this);
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_CONTINUE, this.onGameContinue, this);
    }


    onDisable () {
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_STOP, this.onGameStop, this);
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_CONTINUE, this.onGameContinue, this);
        if (this.crashed) { this.crashed.active = false }
        this.onGameContinue();
    }

    /**
     * 坠毁效果打开时的坠落特效，这里飞机坠毁要随机往一边掉落
     */
    public enemyCrashed () {
        let pos: Vec3 = this.node.position;
        let effset: number  = ToolManager.instance.getRandomNum(-1, 1) / 5;
        if (pos.y >= -120) {
            this.node.getRotation(_temp_quat);

            this.rad = -2 * Number(Math.PI) / 180;
            Quat.rotateZ(_temp_quat, _temp_quat, this.rad);
            this.node.setRotation(_temp_quat);
            this.node.setPosition(effset + pos.x, pos.y - 1, pos.z + this.enemySpeed / 5);

        }
        if (this.node.scale.x > 0 && this.node.scale.y > 0 && this.node.scale.z > 0)
        { this.node.setScale(this.node.scale.x - 0.1, this.node.scale.y - 0.1, this.node.scale.z - 0.1) }

    }

    /**
     * 触发器碰撞检测
     * @param event 事件
     * @returns
     */
    public onTrigger (event: ITriggerEvent) {
        // 敌机1的分组上4，
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_PLANE || event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_BULLET) {
            this.attFlashing();

            // 敌机生命值判断
            this.emyNum++;
            if (this.emyNum < this.enemyHp) { return }

            if (this.enemyplane && this.emyNum >= this.enemyHp) {
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BOOM2);
                this.enemyplane.enemyRandScore(true, this.score);      // 等级记分
                EnemyManager.enemyDestroyScore(this.score);

                EffectManager.instance.loadAndPlayEffect(
                    true, find("effectManager"), Constant.LOADING_PATH.EXPLODE_SMALL, 1.5, this.node.position, null, false, true, 1, true, 2, null
                );

                if (this.crashed) { this.crashed.active = true }        // 如果有坠落，则打开坠落特效
                this.isDie = true;
                event.selfCollider.off('onTriggerEnter');   // 关闭碰撞
                event.selfCollider.off('onTriggerStay');
                this.enemyplane.creatorStars(this.node.getPosition(), this.starsNumber);
                this.enemyplane.creatorProp(this.node.getPosition(), this.props);

                if (!this.crashed) {
                    this.enemyplane.onEnemyKilled(this.node);
                    this.enemyplane.removeEnemy(this.node);

                }
                else if (this.crashed) {
                    this.scheduleOnce(() => {
                        this.enemyplane.onEnemyKilled(this.node);
                        this.enemyplane.removeEnemy(this.node);
                    }, 5);
                }

            }

        }

    }

    /**
     * 从enemyManager执行后带到这里的，带有角度信息的数据，后面则要和上面的函数重叠,有角度使用这一类调用
     * @param enemyManagerParent enemyManager
     * @param isBullet 是否发射子弹
     * @param degree 角度
     * @param enemySpeed 速度
     */
    public showManager (enemyManagerParent: EnemyManager, isBullet: boolean, degree: number, enemySpeed:number) {
        this.enemyplane = enemyManagerParent;
        this.isBullet = isBullet;
        if (enemySpeed) { this.enemySpeed = enemySpeed }
        // 给触发器设置组和mask
        const group = (1 << 2);
        const mask = (1 << 0) + (1 << 1) + (1 << 3);
        this.node.getComponent(Collider).setGroup(group);
        this.node.getComponent(Collider).setMask(mask);

        this.init();
    }


    /**
     *利用表中的数据处理的，和上面两个要整和在一起
     * @param Hp 生命值
     * @param score 分数
     * @param stars 星星数量
     * @param props 道具
     */
    public showMangerOther (Hp:number, score?:number, stars?:number, props?:number) {
        this.enemyHp = Hp;
        if (score) { this.score = score }
        if (stars) { this.starsNumber = stars }
        if (props) { this.props = props }
    }

    /**
     * 设置攻击数据
     * @param inveral 间隔，
     * @param barrageID 子弹id
     */
    public showAttackInfo (inveral:number, barrageID:number) {
        this.enemyBulletSpeed = inveral;
        if (barrageID != 0) { this.barrage = barrageID }
    }

    /**
     * 飞机被击中的闪烁效果
     */
    public attFlashing () {
        let selfM = this.mesh.getComponent(MeshRenderer).materials[0];
        let selfC = Constant.SCALE.SCALE2;
        selfM.setProperty("albedoScale", selfC);
        this.scheduleOnce(() => {
            selfC = new Vec3(1, 1, 1);
            selfM.setProperty("albedoScale", selfC);
        }, 0.2);

    }


    public onGameStop () {



    }

    public onGameContinue () {


    }

}

