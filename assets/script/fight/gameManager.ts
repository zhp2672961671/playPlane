import { AudioManager } from './../framework/audioManager';
import { _decorator, Component, Node, setDisplayStats, PhysicsSystem, Quat, sys, find } from 'cc';
import { ClientEvent } from '../framework/clientEvent';
import { Constant } from '../framework/constant';
import { PoolManager } from '../framework/poolManager';
import { Main } from '../ui/main';
import { BulletManager } from './bullet/bulletManager';
import { EnemyManager } from './plane/enemyManager';
import { selfPlane } from './plane/selfPlane';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    public bullet: BulletManager = null!;      // 子弹bulletManager
    @property(Node)
    public enemy: EnemyManager = null!;   // enemyManager
    @property(Node)
    public mainUi: Node = null!;         // mainUi的控制

    public static gameSpeed: number = 1;
    public static score: number = 0;     // 总分数
    public static stars: number = 0;     // 总星星
    public static randScore: number = 0;           // 评级分数
    public static isVibrate: boolean = true;       // 是否震动
    public static isMusic: boolean = true;         // 是否打开音乐
    public static isStop: boolean = false;         // 是否暂停
    public static selfPlaneIsDie: boolean = false; // 判断玩家飞机是否死亡
    public static starting: boolean = false;           // 游戏是否开始，操作开关在uiManin.ts中，
    public static isWhichBullet: number;    // 判断是哪种子弹
    public static levelBulletInterval: number = 1;     // 子弹等级
    public static gameDifficult = 1;       // 游戏难度，默认是1

    public player: Node = null!;    // 玩家飞机节点

    private shooting: boolean = false;      // 是否开始射击
    private shootTime: number = 0;
    private bulletSpeedTime: number = 10; // 子弹射击间隔时间


    start () {
        GameManager.isWhichBullet = Constant.FIGHT_BULLET_GROUP.BULLET_H;   // 一开始默认用m号子弹
        this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_NORMAL;   // 一开始默认等级为最初始级
        this.shootTime = 0;
        GameManager.score = 0;      // 开始时候分数置0
        GameManager.randScore = 0;
        GameManager.gameSpeed = 1;
        GameManager.gameDifficult = Constant.GAME_DIFFICULT.GAME_DIFFICULT_1;

    }

    onEnable () {
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_STOP, this._onGameStop, this);
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_CONTINUE, this._onGameContinue, this);
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_START, this._onGameStart, this);
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_WIN, this.gameWin, this);      // 游戏胜利
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_FAILURE, this.gameFail, this);      // 游戏失败
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_RESTART, this.gameRestart, this);    // 重新开始
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_REMAIN, this.gameMain, this);

    }

    onDisable () {
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_STOP, this._onGameStop, this);
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_CONTINUE, this._onGameContinue, this);
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_START, this._onGameStart, this);
        ClientEvent.off(Constant.GAMEOVER_TYPE.GAME_WIN, this.gameWin, this);      // 游戏胜利
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_FAILURE, this.gameFail, this);      // 游戏失败
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_RESTART, this.gameRestart, this);
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_REMAIN, this.gameMain, this);

    }

    /**
     * 游戏开始
     */
    private _onGameStart () {
        GameManager.starting = true;
        this.shooting = true;
        GameManager.isStop = false;
    }


    update (deltaTime: number) {
        if (GameManager.isWhichBullet == Constant.FIGHT_BULLET_GROUP.BULLET_M || GameManager.isWhichBullet == Constant.FIGHT_BULLET_GROUP.BULLET_S)// 间隔等级设置
        { this.setBulletInterval1() }
        else if (GameManager.isWhichBullet == Constant.FIGHT_BULLET_GROUP.BULLET_H)
        { this.setBulletInterval2() }

        if (!GameManager.selfPlaneIsDie) { // 当玩家没有死亡的时候执行的代码, 子弹射击,一开始子弹的类型为m,红色双列
            this.shootTime++;
            if (this.shooting && this.shootTime >= this.bulletSpeedTime) {  // 发射子弹类型的地方
                if (GameManager.isWhichBullet == Constant.FIGHT_BULLET_GROUP.BULLET_M) {    // 红色飞机
                    this.bullet.getComponent(BulletManager).creatorBulletType1(true, GameManager.levelBulletInterval);
                    this.shootTime = 0;
                }
                else if (GameManager.isWhichBullet == Constant.FIGHT_BULLET_GROUP.BULLET_S) {   // 蓝色飞机
                    this.bullet.getComponent(BulletManager).creatorBulletType2(true, GameManager.levelBulletInterval);

                }
                else if (GameManager.isWhichBullet == Constant.FIGHT_BULLET_GROUP.BULLET_H) {   // 黄色飞机
                    this.bullet.getComponent(BulletManager).creatorBulletType3(true, GameManager.levelBulletInterval);
                    this.shootTime = 0;
                }
            }
            else if (!this.shooting) {   // 用来关闭一些特殊子弹类型，比如激光
                this.closeSpecialBullet();
            }
        }
        else if (GameManager.stars && GameManager.selfPlaneIsDie)
        { this.closeSpecialBullet() }
    }

    /**
     * 关闭激光子弹
     */
    public closeSpecialBullet () {
        this.bullet.getComponent(BulletManager).closeBulletType2();
    }

    /**
     * 红，黄色飞机等级设置
     */
    public setBulletInterval1 () {
        switch (GameManager.levelBulletInterval) {
            case Constant.BULLET_LEVEL.LEVEL_1:
            case Constant.BULLET_LEVEL.LEVEL_2:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_NORMAL / GameManager.gameSpeed;
                break;
            case Constant.BULLET_LEVEL.LEVEL_3:
            case Constant.BULLET_LEVEL.LEVEL_4:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_2 / GameManager.gameSpeed;
                break;
            default:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_3 / GameManager.gameSpeed;
                break;
        }
    }

    /**
     * 蓝色飞机等级设置
     */
    public setBulletInterval2 () {
        switch (GameManager.levelBulletInterval) {
            case Constant.BULLET_LEVEL.LEVEL_1:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_NORMAL / GameManager.gameSpeed;
                break;
            case Constant.BULLET_LEVEL.LEVEL_2:
            case Constant.BULLET_LEVEL.LEVEL_3:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_2 / GameManager.gameSpeed;
                break;
            case Constant.BULLET_LEVEL.LEVEL_4:
            case Constant.BULLET_LEVEL.LEVEL_5:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_3 / GameManager.gameSpeed;
                break;
            default:
                this.bulletSpeedTime = Constant.BULLET_INTERVAL.INTERVAL_4 / GameManager.gameSpeed;
                break;
        }
    }

    /**
     * 游戏胜利
     */
    public gameWin () {
        this.shooting = false;
        // GameManager.starting = false;
        // EnemyManager.isgameOver = false;
    }

    /**
     * 游戏失败
     */
    public gameFail () {
        GameManager.selfPlaneIsDie = true;
        this.shooting = false;
        // GameManager.starting = false;
        // EnemyManager.isgameOver = false;
    }

    /**
     * 游戏重新开始
     */
    public gameRestart () {
        this.dataReSet();
        this.player.setPosition(0, 0, 15);
    }

    /**
     * 返回到主界面
     */
    public gameMain () {
        this.dataReSet();
        GameManager.isWhichBullet = Constant.FIGHT_BULLET_GROUP.BULLET_H;
        this.player.setPosition(Constant.GAME_POS.POS_1);
        this.player.setScale(10, 10, 10);
        this.player.active = false;
    }

    /**
     *数据重置
     */
    public dataReSet () {
        AudioManager.instance.stopAll();
        AudioManager.instance.playMusic(Constant.AUDIO_MUSIC.BG, true);
        this.mainUi.getComponent(Main).reSet();
        let enemyMag: EnemyManager = this.enemy.getComponent(EnemyManager);
        enemyMag.removeAllEnemy();
        enemyMag.removeAllItem();
        enemyMag.removeBossPlane();
        EnemyManager.isGameOver = false;
        EnemyManager.combinationInterval = 0;
        this.bullet.getComponent(BulletManager).removeAllBullet(); // 移除所有子弹
        GameManager.selfPlaneIsDie = false;
        PoolManager.instance.putNode(find(Constant.VOLUMES.VOLUMES_LOWBLOOD));
        this.player.getComponent(selfPlane).init();

        GameManager.levelBulletInterval = Constant.BULLET_LEVEL.LEVEL_1;
        this.player.setRotation(new Quat);
        // 或者this.playerPlane.eulerAngles = new Vec3;
        GameManager.score = 0;
        GameManager.randScore = 0;
        GameManager.stars = 0;
        this.shooting = false;
        GameManager.starting = false;

    }

    /**
     * 震动效果
     */
    public vibrationEffect () {
        if (GameManager.isVibrate) {
            if (sys.os === sys.OS.IOS) {
                // 调用苹果的方法;
            }
            else if (sys.os === sys.OS.ANDROID) {
                // eslint-disable-next-line no-undef
                if (sys.platform == sys.Platform.ANDROID) { jsb.reflection.callStaticMethod("com/cocos/game/AppActivity", "vibrator", "(I)V", 500) }
            }
        }
    }

    /**
     * 游戏暂停
     */
    private _onGameStop () {
        GameManager.isStop = true;
        GameManager.gameSpeed = 0.1;
    }

    /**
     * 游戏继续
     */
    private _onGameContinue () {
        GameManager.isStop = false;
        GameManager.gameSpeed = 1;
    }
}

