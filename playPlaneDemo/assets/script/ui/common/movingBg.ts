import { _decorator, Component, Node } from 'cc';
import { GameManager } from '../../fight/gameManager';
import { EnemyManager } from '../../fight/plane/enemyManager';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';

const { ccclass, property } = _decorator;

@ccclass('movingBg')
export class movingBg extends Component {
    @property(Node)
    public bg1: Node = null!;
    @property(Node)
    public bg2: Node = null!;

    public bgSpeed: number = 10;

    private _enemy: EnemyManager = null!;
    private _bgLimit: number = Constant.GAME_VALUE.BG_MOVE_TIME;
    private _isMoving: boolean = false;
    private _dislimn: number = 0;
    private _triggerZ: number = 0;

    onEnable () {
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_RESTART, this._reSetDate, this);
    }

    onDisable () {
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_RESTART, this._reSetDate, this);
    }

    public show (enemy: EnemyManager) {
        this._enemy = enemy;
        this._init();
        this._isMoving = true;
    }

    private _init () {
        this._dislimn = 0;
        this._bgLimit = Constant.GAME_VALUE.BG_MOVE_TIME;
        this._setBgNode();
        // 第一张图从正中心移动到屏幕末端的时候，而后要衔接第二张图
        this._triggerZ = 858;
    }

    update (deltaTime: number) {
        if (this._isMoving) {
            this._moveBackground(deltaTime);
        }
        if (GameManager.starting) {
            this._dislimn++;
            if (this._dislimn >= this._bgLimit / GameManager.gameSpeed) {
                this._dislimn = 0;
                this._enemy.getComponent(EnemyManager).glodeDifficulty();

            }
        }
    }

    /**
     *将第二个地图背景放在第一个的上放
     */
    private _setBgNode () {
        this.bg1.setPosition(0, this.bg1.position.y, 0);
        this.bg2.setPosition(this.bg1.position.x, this.bg1.position.y, -855);
    }

    /**
     * 背景移动部分
     * @param dt update中的帧
     */
    private _moveBackground (dt: number) {
        this.bg1.setPosition(this.bg1.position.x, this.bg1.position.y, this.bg1.position.z + dt * this.bgSpeed * GameManager.gameSpeed);
        this.bg2.setPosition(this.bg2.position.x, this.bg2.position.y, this.bg2.position.z + dt * this.bgSpeed * GameManager.gameSpeed);
        // 背景衔接部分
        if (this.bg1.position.z >= this._triggerZ) {
            this.bg1.setPosition(this.bg1.position.x, this.bg1.position.y, -932);
        }
        else if (this.bg2.position.z >= this._triggerZ) {
            this.bg2.setPosition(this.bg2.position.x, this.bg2.position.y, -932);
        }
    }

    /**
     * 数据重置
     */
    private _reSetDate () {
        this._init();
    }


}

