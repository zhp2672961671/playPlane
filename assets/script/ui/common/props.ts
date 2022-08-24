import { AudioManager } from './../../framework/audioManager';

import { _decorator, Component, Node, Collider, ITriggerEvent, Vec3 } from 'cc';
import { GameManager } from '../../fight/gameManager';
import { EnemyManager } from '../../fight/plane/enemyManager';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
const { ccclass, property } = _decorator;

@ccclass('props')
export class props extends Component {
    @property(Node)
    public starSon: Node = null!;
    public type: string = '';
    public turnToRun: boolean = false;     // 爆炸开来以后，星星转向正常移动
    public dx: number = 0.3;
    public dy: number = 0.7;
    public blunt: number = 1;
    public propPos: Vec3 = new Vec3();         // 道具奖励的坐标
    public offsetPos: Vec3 = new Vec3();      // 道具奖励和玩家之间的向量差
    public raiseTimes: number = 1;            // 道具奖励回收时候的速度
    public curFlyTime: number = 0;            // 道具奖励当前飞行时间
    public totalFlyTime: number = 0;        // 奖品总飞行时间
    public targetPos: Vec3 = new Vec3();//

    private _enemy: EnemyManager = null!;
    public speed: number = 0.1;
    public roll: number = 0;


    public init () {
        let consider: Collider = this.node.children[0].getComponent(Collider);
        consider.on('onTriggerEnter', this._onTrigger, this);
        consider.on('onTriggerStay', this._onTrigger, this);
        this.totalFlyTime = 0;
        this.curFlyTime = 0;
        this.raiseTimes = 1;
        this.speed = 0.1;
        switch (this.type) {
            case Constant.PROPS.PROPS_HEART:
            case Constant.PROPS.PROPS_BULLET:
                break;
            case Constant.PROPS.PROPS_STARS:
                this.turnToRun = false;
                this.blunt = 1;
                break;
        }
    }

    private _onTrigger (event: ITriggerEvent) {     // 道具的分组为32 2的5次方
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_PLANE && this._enemy) {
            AudioManager.instance.playSound(Constant.AUDIO_SOUND.EAT);
            let emy: EnemyManager = this._enemy.getComponent(EnemyManager);
            emy.collectStars();
            event.selfCollider.off('onTriggerEnter');
            event.selfCollider.off('onTriggerStay');
            this.node.children[0].setPosition(0, 0, 0);
            emy.onEnemyKilled(this.node);
            emy.removeProp(this.node);
        }
    }

    /**
     * @param enemyManagerParent enemyManager传入敌机管理器
     * @param degree 角度
     * @param type 类型
     */
    public showManager (enemyManagerParent: EnemyManager, degree: number, type: string) {
        this._enemy = enemyManagerParent;
        this.dx = Math.sin((degree / 180) * Math.PI);
        this.dy = Math.cos((degree / 180) * Math.PI);
        this.init();
        this._setGM();
        this.type = type;
    }

    /**
     * 设置分组
     */
    private _setGM () {
        const group = (1 << 5);
        const mask = (1 << 3);
        this.node.children[0].getComponent(Collider).setGroup(group);
        this.node.children[0].getComponent(Collider).setMask(mask);
    }



}

