import { AudioManager } from './../framework/audioManager';
import { BulletManager } from './../fight/bullet/bulletManager';
import { PlayerData } from './../framework/playerData';
import { UIManager } from './../framework/uiManager';
import { movingBg } from './common/movingBg';
import { Constant } from './../framework/constant';
import { ClientEvent } from './../framework/clientEvent';
import { director, _decorator, Component, Node, Vec2, Vec3, EventTouch, CameraComponent, Quat,  Prefab, PhysicsSystem, setDisplayStats, game } from 'cc';
import { ResourceUtil } from '../framework/resourceUtil';
import { PoolManager } from '../framework/poolManager';
import { EnemyManager } from '../fight/plane/enemyManager';
import { GameManager } from '../fight/gameManager';
import { selfPlane } from '../fight/plane/selfPlane';
import { StorageManager } from '../framework/storageManager';
import { Util } from '../framework/util';
import { SdkUtil } from '../framework/sdkUtil';

const { ccclass, property } = _decorator;
let _temp_quat = new Quat;

@ccclass('Main')
export class Main extends Component {
    @property(Node)
    public game: GameManager = null!;
    @property(EnemyManager)
    public enemy: EnemyManager = null!;
    @property(Node)
    public bullet: BulletManager = null!;
    @property(Node)
    public otherNode: Node = null;

    @property
    public planeSpeed = 1;
    @property
    public bgSpeed: number = 10;
    @property(CameraComponent)
    public ceram: CameraComponent = null!;  // 世界下的相机组

    private _player: Node = null!;    // 玩家飞机
    private _bgMap: Node = null!;
    private _isRoute: boolean = false;
    private _rad: number = 0;
    private _ground1: Node = null!;
    private _ground2: Node = null!;
    private _ground3: Node = null!;



    start () {
        let frameRate = StorageManager.instance.getGlobalData("frameRate");
        if (typeof frameRate !== "number") {
            frameRate = Constant.GAME_FRAME;
            // @ts-ignore
            if (window.wx && Util.checkIsLowPhone()) {
                frameRate = 30;
            }
            StorageManager.instance.setGlobalData("frameRate", frameRate);
        }

        console.log("###frameRate", frameRate);
        game.frameRate = frameRate;
        PhysicsSystem.instance.fixedTimeStep = 1 / frameRate;

        // @ts-ignore
        if (window.wx && window.cocosAnalytics) {
            // @ts-ignore
            window.cocosAnalytics.init({
                appID: "699860099",              // 游戏ID
                version: '1.0.0',           // 游戏/应用版本号
                storeID: "cocosPlay",     // 分发渠道
                engine: "cocos",            // 游戏引擎
            });
        }

        // 开启碰撞检测
        PhysicsSystem.instance.enable = true;
        setDisplayStats(false);     // 关闭左下角的调试信息

        PlayerData.instance.loadGlobalCache();
        PlayerData.instance.loadGlobalCache();
        if (!PlayerData.instance.userId) {
            PlayerData.instance.generateRandomAccount();
            console.log("###生成随机userId", PlayerData.instance.userId);
        }

        PlayerData.instance.loadFromCache();

        if (!PlayerData.instance.playerInfo || !PlayerData.instance.playerInfo.createDate) {
            PlayerData.instance.createPlayerInfo();
        }
        SdkUtil.shareGame(Constant.GAME_NAME_CH, "");


        // 开始之前需要加载的东西
        ResourceUtil.loadModelRes(Constant.LOADING_PATH.PLAYER_PLANE).then((player: Prefab) => {
            this._player = PoolManager.instance.getNode(player, this.node.parent);
            this._player.getComponent(selfPlane).show(this.game);
            this._player.active = false;
            this._player.setPosition(Constant.GAME_POS.POS_1);
            this.game.getComponent(GameManager).player = this._player;
            this.enemy.getComponent(EnemyManager).player = this._player;
            this.bullet.getComponent(BulletManager).player = this._player;
            UIManager.instance.showDialog("choose/choosePanel", [this._player], null);
            this.init();
        });
        this.setTouch();

    }


    onEnable () {
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_WIN, this.gameWin, this);      // 游戏胜利
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_FAILURE, this.gameFail, this);      // 游戏失败
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_RESTART, this.gameRestart, this);    // 重新开始
        ClientEvent.on(Constant.EVENT_TYPE.GAME_DIFFICULT, this._diffChoseBg, this);    // 难度发生改变
    }

    onDisable () {
        ClientEvent.off(Constant.GAMEOVER_TYPE.GAME_WIN, this.gameWin, this);      // 游戏胜利
        ClientEvent.off(Constant.GAMEOVER_TYPE.GAME_FAILURE, this.gameFail, this);      // 游戏失败
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_RESTART, this.gameRestart, this);    // 重新开始
        ClientEvent.off(Constant.EVENT_TYPE.GAME_DIFFICULT, this._diffChoseBg, this);    // 难度发生改变
    }

    /**
     * 初始化
     */
    public init () {
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.DUST).then((dust: Prefab) => {
            PoolManager.instance.getNode(dust, this.otherNode);
        });
        ResourceUtil.loadModelRes(Constant.LOADING_PATH.GROUND1).then((bg: Prefab) => {
            this._bgMap = PoolManager.instance.getNode(bg, this.otherNode);
            this._ground1 = this._bgMap;
            this._bgMap.getComponent(movingBg).show(this.enemy);
            this._bgMap.getComponent(movingBg).bgSpeed = 0;
        });

        AudioManager.instance.init();
        AudioManager.instance.playMusic(Constant.AUDIO_MUSIC.BG, true, 0.5);
        GameManager.starting = false;
        this._isRoute = false;
        this._rad = 0;

        // 资源预加载
        ResourceUtil.loadModelRes(Constant.LOADING_PATH.GROUND2).then((bg: Prefab) => {
            this._ground2 = PoolManager.instance.getNode(bg, this.otherNode);
            this._ground2.active = false;
        });
        ResourceUtil.loadModelRes(Constant.LOADING_PATH.GROUND3).then((bg: Prefab) => {
            this._ground3 = PoolManager.instance.getNode(bg, this.otherNode);
            this._ground3.active = false;
        });
    }

    /**
     * 哪出函数，根据难度更换背景
     * @param diff 难度
     */
    private _diffChoseBg (diff: string) {
        switch (diff) {
            case "difficult1":
                this._ground1.active = true;
                this._ground2.active = false;
                this._ground3.active = false;
                this._bgMap = this._ground1;
                this._bgMap.getComponent(movingBg).show(this.enemy);
                this._bgMap.getComponent(movingBg).bgSpeed = 0;
                break;
            case "difficult2":
                this._ground1.active = false;
                this._ground2.active = true;
                this._ground3.active = false;
                this._bgMap = this._ground2;
                this._bgMap.getComponent(movingBg).show(this.enemy);
                this._bgMap.getComponent(movingBg).bgSpeed = 0;
                break;
            case "difficult3":
                this._ground1.active = false;
                this._ground2.active = false;
                this._ground3.active = true;
                this._bgMap = this._ground3;
                this._bgMap.getComponent(movingBg).show(this.enemy);
                this._bgMap.getComponent(movingBg).bgSpeed = 0;
                break;
        }
    }

    update (dt:number) {
        const num = 250;
        if (director.getTotalFrames() % num === 170 && GameManager.isMusic) {    // 监听背景音乐
            if (AudioManager.instance.setBg() == null) {
                AudioManager.instance.playMusic(Constant.AUDIO_MUSIC.BG, true, 0.5);
            }
        }

    }

    /**
     * 游戏失败
     */
    public gameFail () {
        UIManager.instance.showDialog("settlement/settlementPanel", [this._player, false]);
        UIManager.instance.hideDialog("integral/integralPanel");
        UIManager.instance.hideDialog("pause/pausePanels");
        this._bgMap.getComponent(movingBg).bgSpeed = 0;     // 背景停止移动
    }

    /**
     * 游戏胜利
     */
    public gameWin () {
        UIManager.instance.showDialog("settlement/settlementPanel", [this._player, true]);
        UIManager.instance.hideDialog("integral/integralPanel");
        UIManager.instance.hideDialog("pause/pausePanels");
        this._bgMap.getComponent(movingBg).bgSpeed = 0;     // 背景停止移动
    }

    /**
     * 游戏界面重置
     */
    public reSet () {
        UIManager.instance.hideDialog("integral/integralPanel");
    }

    /**
     * 游戏重新开始
     */
    public gameRestart () {
        UIManager.instance.showDialog("gameStart/gameStartPanel", [this._player]);
    }

    // public static getLocalDegree (rotateValue: Vec2, rotateVector: Vec3, node: Node) {
    // 	// because input is base on engine z and x axis, so it's like
    //     /*
    //         |
    //     ____|_____\ x
    //         |     /
    //         |
    //        \ /
    //        z
    //     */
    //     // now we need to handle direction with the camera observe direction, so we need to reversal the z axis, the z is primary movement's y axis
    //     // the x and y is zero when beginning, that's mean it point to x axis, but camera point to -z direction, so need to minus 90
    //     let x = rotateValue.x;
    //     let y = rotateValue.y;
    //     let deg = Math.atan2(-y, x) - Math.PI * 0.5;
    //     let _tempVec3
    //     let _tempVec3_2
    //     Vec3.rotateY( _tempVec3, rotateVector, Vec3.ZERO, deg);
    //     node.getWorldPosition(_tempVec3_2);
    //     _tempVec3_2.add(_tempVec3);
    //     MathUtil.convertToNodeSpace(_tempVec3, _tempVec3_2, node);
    //     _tempVec3.y = 0;
    //     _tempVec3.normalize();
    //     return MathUtil.radiansToDegrees(Math.atan2(_tempVec3.x, _tempVec3.z));
    // }

    /**
     * 触摸监听
     */
    public setTouch () {
        this.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            if (GameManager.starting) {
                this.gameContinue();
                UIManager.instance.showDialog("integral/integralPanel");
                // 暂停界面关闭
                UIManager.instance.hideDialog("pause/pausePanel");
                this._bgMap.getComponent(movingBg).bgSpeed = this.bgSpeed;
            }
        }, this);

        // 手指在屏幕上移动
        this.node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            if (GameManager.starting) {
                if (selfPlane.isDie) { return }
                EventTouch.MAX_TOUCHES = 1;
                let pos_mouse: Vec2 = event.getDelta();
                this._isRoute = true;
                // 主角飞机旋
                if (this._isRoute) {
                    this._player.getRotation(_temp_quat);
                    if (pos_mouse.x > 0) {
                        if (this._player.eulerAngles.z <= -30) {
                            this._isRoute = false;
                        }
                        else {
                            this._rad = -Number(Math.PI) / 180;
                            Quat.rotateZ(_temp_quat, _temp_quat, this._rad);
                            this._player.setRotation(_temp_quat);
                        }
                    }
                    else if (pos_mouse.x < 0) {
                        if (this._player.eulerAngles.z >= 30) {
                            this._isRoute = false;
                        }
                        else {
                            this._rad = Number(Math.PI) / 180;
                            Quat.rotateZ(_temp_quat, _temp_quat, this._rad);
                            this._player.setRotation(_temp_quat);
                        }
                    }
                }

                // 飞机坐标移动
                let pos: Vec3 = this._player.position;
                let value : number = Constant.GAME_VALUE.PLAYER_MOVING_VALUE;
                this._player.setPosition(pos.x + value * this.planeSpeed * pos_mouse.x, pos.y, pos.z - value * this.planeSpeed * pos_mouse.y);
                this.playerInterface();
            }


        }, this);

        // 按下弹起
        this.node.on(Node.EventType.TOUCH_END, (event) => {
            if (GameManager.starting) {
                this._isRoute = false;
                // 飞机的复位
                this._rad = -this._player.eulerAngles.z * Number(Math.PI) / 180;
                Quat.rotateZ(_temp_quat, _temp_quat, this._rad);
                this._player.setRotation(_temp_quat);
                this.gameStop();

                // 暂停界面打开
                if (!GameManager.selfPlaneIsDie)
                { UIManager.instance.showDialog("pause/pausePanel", [this._player]) }

            }
        }, this);



    }

    /**
     * 飞机出界设置
     */
    public playerInterface () {
        let playerPos: Vec3 = this._player.getPosition();
        // let screenPos: Vec3 = this.ceram.worldToScreen(playerPos);

        // let rightPos: Vec3 = new Vec3(11, 0, 0);
        // this._posRight = this.ceram.screenToWorld(rightPos);

        // 横向放边的出界处理，
        if (playerPos.x <= -25) {
            this._player.setPosition(-25, playerPos.y, playerPos.z);
        }
        else if (playerPos.x >= 25) {
            this._player.setPosition(25, playerPos.y, playerPos.z);
        }
        // 纵向方向的出界处理
        if (playerPos.z >= 40) {
            this._player.setPosition(playerPos.x, playerPos.y, 40);
        }
        else if (playerPos.z <= -40) {
            this._player.setPosition(playerPos.x, playerPos.y, -40);
        }

    }

    /**
     * 游戏暂停
     */
    public gameStop () {
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_STOP);
    }

    /**
     * 游戏继续
     */
    public gameContinue () {
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_CONTINUE);

    }
}

