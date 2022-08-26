/* eslint-disable no-fallthrough */
/* eslint-disable no-case-declarations */
import { AudioManager } from './../../framework/audioManager';
import { ClientEvent } from './../../framework/clientEvent';
import { BulletALL } from './bulletAll';
import { _decorator, Component, Node, Prefab, Vec3, Vec2 } from 'cc';
import { GameManager } from '../gameManager';
import { Constant } from '../../framework/constant';
import { ResourceUtil } from '../../framework/resourceUtil';
import { PoolManager } from '../../framework/poolManager';
import { ToolManager } from '../../ui/common/toolManager';

const { ccclass, property } = _decorator;
@ccclass('BulletManager')
export class BulletManager extends Component {
    public player: Node = null!;    // 玩家飞机节点
    private _bullet: Node[] = new Array<Node>(0);
    private _bulletType2: Node[] = null!;   // 激光子弹类型021-023
    private _xLimit: number = 15;       // 玩家子弹3使用的大小变化
    private _xSpeed: number = 0.1;
    private _limitNumber: number = 0;   // 玩家子弹3使用的左右晃动
    private _playerBullet1: Prefab[] = new Array<Prefab>(3);
    private _playerBullet3: Prefab[] = new Array<Prefab>(3);
    private _missile: Prefab = null!;
    private _bullet01: Prefab = null!;
    private _bullet05: Prefab = null!;
    private _bullet06: Prefab = null!;
    private _bullet07: Prefab = null!;

    onEnable () {
        ClientEvent.on(Constant.EVENT_TYPE.BULLET_KILLED, this.onBulletKilled, this);
        ClientEvent.on(Constant.EVENT_TYPE.REMOVE_BULLET, this.removeBullet, this);
    }


    onDisable () {
        ClientEvent.off(Constant.EVENT_TYPE.BULLET_KILLED, this.onBulletKilled, this);
        ClientEvent.off(Constant.EVENT_TYPE.REMOVE_BULLET, this.removeBullet, this);
    }

    start () {      // 子弹的预加载
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_011).then((bt: Prefab) => {
            this._playerBullet1[0] = bt;
            PoolManager.instance.prePool(this._playerBullet1[0], 40);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_012).then((bt: Prefab) => {
            this._playerBullet1[1] = bt;
            PoolManager.instance.prePool(this._playerBullet1[1], 40);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_013).then((bt: Prefab) => {
            this._playerBullet1[2] = bt;
            PoolManager.instance.prePool(this._playerBullet1[2], 40);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_031).then((bt: Prefab) => {
            this._playerBullet3[0] = bt;
            PoolManager.instance.prePool(this._playerBullet3[0], 40);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_032).then((bt: Prefab) => {
            this._playerBullet3[1] = bt;
            PoolManager.instance.prePool(this._playerBullet3[1], 40);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_033).then((bt: Prefab) => {
            this._playerBullet3[2] = bt;
            PoolManager.instance.prePool(this._playerBullet3[2], 40);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.MISSILE_BULLET1).then((emt: Prefab) => {
            this._missile = emt;
            PoolManager.instance.prePool(this._missile, 4);
        });

        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET1).then((emt: Prefab) => {
            this._bullet01 = emt;
            PoolManager.instance.prePool(this._bullet01, 10);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET5).then((emt: Prefab) => {
            this._bullet05 = emt;
            PoolManager.instance.prePool(this._bullet05, 10);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET6).then((emt: Prefab) => {
            this._bullet06 = emt;
            PoolManager.instance.prePool(this._bullet06, 10);
        });
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET7).then((emt: Prefab) => {
            this._bullet07 = emt;
            PoolManager.instance.prePool(this._bullet07, 10);
        });
    }

    /**
     * 选择子弹
     * @param idn 子弹id
     * @param enemyPos 敌机的坐标点
     * @param degree 设置子弹的角度
     */
    public chooseBullet (idn: number, enemyPos: Vec3, degree?: number) {
        switch (idn) {
            case Constant.BULLET_COMBINATOR.BULLET_1000:
                this.enemyBullet(enemyPos);
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1001:
                this.enemyBullet02(enemyPos, this.player.getPosition());
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1002:
                this.enemyBullet03(enemyPos, degree);
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1003:
                this.enemyBullet04(enemyPos, this.player.getPosition());
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1004:       // 圈型的红色的转圈子弹
                this.enemyBullet05(enemyPos, degree);
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1005:       // boss第二阶段两侧的散射子弹
                this.enemyBullet06(enemyPos, degree);
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1006:
                this.enemyMissile1(enemyPos, this.player.getPosition());
                break;
            case Constant.BULLET_COMBINATOR.BULLET_1008:       // 四面散射
                this.enemyBullet7(enemyPos);
                break;
        }
    }

    update (dt: number) {
        if (this._bullet.length <= 0) { return }
        for (let index: number = 0; index < this._bullet.length; index++) {
            let bul: BulletALL = this._bullet[index].getComponent(BulletALL);
            if (bul.playerBullet && !bul.isDie) {
                let pos: Vec3 = this._bullet[index].position;
                switch (bul.type) {
                    case Constant.BULLET_ALL_TYPE.BULLET1:
                        switch (bul.bulletType) {
                            case Constant.BULLET_DIRECTION.CENTRAL:
                                this._bullet[index].setPosition(pos.x, pos.y, pos.z - bul.bulletSpeed * GameManager.gameSpeed);
                                break;
                            case Constant.BULLET_DIRECTION.LEFT:
                                this._bullet[index].setPosition(pos.x - 0.2 * bul.bulletSpeed, pos.y, pos.z - bul.bulletSpeed * GameManager.gameSpeed);
                                break;
                            case Constant.BULLET_DIRECTION.RIGHT:
                                this._bullet[index].setPosition(pos.x - 0.2 * bul.bulletSpeed, pos.y, pos.z - bul.bulletSpeed * GameManager.gameSpeed);
                                break;
                        }
                        if (pos.z <= -55) {
                            this.onBulletKilled(this._bullet[index]);
                            this.removeBullet(this._bullet[index]);
                        }
                        break;
                    case Constant.BULLET_ALL_TYPE.BULLET3:      // 球形闪电子弹
                        this._limitNumber++;
                        switch (bul.bulletType) {
                            case Constant.BULLET_DIRECTION.CENTRAL:
                                if (this._limitNumber >= this._xLimit) {
                                    this._limitNumber = 0;
                                    this._xSpeed = -this._xSpeed;
                                }
                                this._bullet[index].setPosition(pos.x + this._xSpeed * GameManager.gameSpeed, pos.y, pos.z - bul.bulletSpeed * GameManager.gameSpeed);
                                break;
                            case Constant.BULLET_DIRECTION.LEFT:
                            case Constant.BULLET_DIRECTION.RIGHT:
                                if (this._limitNumber >= this._xLimit) {
                                    this._limitNumber = 0;
                                    this._xSpeed = -this._xSpeed;
                                }
                                let posX = bul.bulletType == Constant.BULLET_DIRECTION.LEFT ? -(0.2 * bul.bulletSpeed * GameManager.gameSpeed) : (0.2 * bul.bulletSpeed * GameManager.gameSpeed);
                                this._bullet[index].setPosition(pos.x + posX + this._xSpeed, pos.y, pos.z - bul.bulletSpeed * GameManager.gameSpeed);
                                break;
                        }
                        bul.scaleChange();      // 子弹变大
                        if (pos.z <= -55) {     // 地图边界值为-100，即子弹到达屏幕外以后
                            this.onBulletKilled(this._bullet[index]);
                            this.removeBullet(this._bullet[index]);
                        }
                        break;
                }
            }
            else if (bul.enemyBullet && !bul.isDie) {
                let pos: Vec3 = this._bullet[index].position;
                let speed = bul.bulletSpeed * GameManager.gameSpeed;
                switch (bul.type) {
                    case Constant.BULLET_ALL_TYPE.BULLET1:
                        this._bullet[index].setPosition(pos.x, pos.y, pos.z + speed);
                        if (pos.z >= 100) {
                            this.onBulletKilled(this._bullet[index]);
                            this.removeBullet(this._bullet[index]);
                        }
                        break;
                    case Constant.BULLET_ALL_TYPE.ENEMY_BULLET2:
                    case Constant.BULLET_ALL_TYPE.ENEMY_BULLET3:
                    case Constant.BULLET_ALL_TYPE.ENEMY_BULLET4:
                    case Constant.BULLET_ALL_TYPE.ENEMY_BULLET6:
                        this._bullet[index].setPosition(pos.x + bul.dx * speed, pos.y, pos.z + bul.dz * speed);
                        if (pos.z >= 100) {     // 子弹超出屏幕以后将其销毁
                            this.onBulletKilled(this._bullet[index]);
                            this.removeBullet(this._bullet[index]);
                        }
                        break;
                    case Constant.BULLET_ALL_TYPE.ENEMY_BULLET5:   // 粉红子弹圈形散射
                        this._bullet[index].setPosition(pos.x + bul.dx * speed, 0, pos.z + bul.dy * speed);
                        if (pos.z >= 100 || pos.z <= -100 || pos.x >= 100 || pos.x <= -100) {
                            this.onBulletKilled(this._bullet[index]);
                            this.removeBullet(this._bullet[index]);
                        }
                        break;
                    case Constant.BULLET_ALL_TYPE.MISSILE1:
                        if (!bul.isDie) {
                            this._bullet[index].setPosition(pos.x + (bul.dx * speed), pos.y, pos.z + (Math.abs(bul.dy) * speed));
                            if (pos.z >= 100) {     // 导弹超出屏幕后消失;
                                this.onBulletKilled(this._bullet[index]);
                                this.removeBullet(this._bullet[index]);
                            }
                        }
                        break;
                    case Constant.BULLET_ALL_TYPE.ENEMY_BULLET7:
                        this._bullet[index].setPosition(pos.x + bul.dx * speed, pos.y, pos.z + bul.dy * speed);
                        if (pos.z >= 60 || pos.z <= -60 || pos.x >= 40 || pos.x <= -40) {   // 子弹超出屏幕以后将其销毁
                            this.onBulletKilled(this._bullet[index]);
                            this.removeBullet(this._bullet[index]);
                        }
                        break;
                }
            }
        }
    }

    /**
     * 移除数组中的子弹节点
     * @param bul 子弹节点
     */
    public removeBullet (bul: Node) {
        let index = this._bullet.indexOf(bul);
        if (index > -1) {
            this._bullet.splice(index, 1);
        }
    }

    /**
     * 创建玩家红色飞机子弹
     * @param IsPlayer 判断是否为玩家
     * @param Level 子弹等级
     */
    public creatorBulletType1 (IsPlayer: boolean, Level: number) {
        let pos: Vec3 = this.player.getPosition();
        let bulletArray: Node[];
        switch (Level) {
            case Constant.BULLET_LEVEL.LEVEL_1:     // 等级1，等级2
            case Constant.BULLET_LEVEL.LEVEL_2:
                if (Level == Constant.BULLET_LEVEL.LEVEL_1) { bulletArray = new Array<Node>(2) }
                else { bulletArray = new Array<Node>(4) }
                this._bulletPos1(this._playerBullet1[0], IsPlayer, Level, bulletArray, pos);
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET1, false, 0.7);
                break;
            case Constant.BULLET_LEVEL.LEVEL_3:     // 等级3，4
            case Constant.BULLET_LEVEL.LEVEL_4:
                if (Level == Constant.BULLET_LEVEL.LEVEL_3) { bulletArray = new Array<Node>(2) }
                else { bulletArray = new Array<Node>(4) }
                this._bulletPos1(this._playerBullet1[1], IsPlayer, Level, bulletArray, pos);

                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET1, false, 0.7);
                break;
            default:     // 等级5,6等
                if (Level == Constant.BULLET_LEVEL.LEVEL_5) { bulletArray = new Array<Node>(2) }
                else { bulletArray = new Array<Node>(4) }
                this._bulletPos1(this._playerBullet1[2], IsPlayer, Level, bulletArray, pos);
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET1, false, 0.7);
                break;
        }
    }

    /**
     * @param pf   预制体
     * @param IsPlayer   是否玩家
     * @param IsEnemy   是否敌方
     * @param num   等级
     * @param bulletArray   子弹数组
     * @param pos   飞机位置
     */
    private _bulletPos1 (pf: Prefab, IsPlayer: boolean, num: number, bulletArray: Node[], pos: Vec3) {
        for (let index = 0; index < bulletArray.length; index++) {
            bulletArray[index] = PoolManager.instance.getNode(pf, this.node);
            let bullet: BulletALL = bulletArray[index].getComponent(BulletALL);
            bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.BULLET1);
            this._setJudgeGroup(bullet, IsPlayer);
            bullet.bulletType = Constant.BULLET_DIRECTION.CENTRAL;
            this._bullet.push(bulletArray[index]);
        }
        switch (num) {
            case Constant.BULLET_LEVEL.LEVEL_1:
            case Constant.BULLET_LEVEL.LEVEL_3:
            case Constant.BULLET_LEVEL.LEVEL_5:
                bulletArray[0].setPosition(pos.x - 1.5, pos.y, pos.z - 4.5);
                bulletArray[1].setPosition(pos.x + 1.5, pos.y, pos.z - 4.5);
                break;
            default:
                bulletArray[0].setPosition(pos.x - 1.5, pos.y, pos.z - 4.5);
                bulletArray[1].setPosition(pos.x - 2.7, pos.y, pos.z - 3);
                bulletArray[2].setPosition(pos.x + 1.5, pos.y, pos.z - 4.5);
                bulletArray[3].setPosition(pos.x + 2.7, pos.y, pos.z - 3);
                break;
        }
    }

    /**
     * 创建子弹类型021，022，023(激光类型子弹)
     * @param IsPlayer 是否为玩家子弹
     * @param Level 子弹等级
     */
    public creatorBulletType2 (IsPlayer: boolean, Level: number) {
        let pos: Vec3 = this.player.getPosition();
        if (this._bulletType2 == null) {
            switch (Level) {
                case Constant.BULLET_LEVEL.LEVEL_1:
                    AudioManager.instance.playSound(Constant.AUDIO_SOUND.LASER1, true, 0.5);
                case Constant.BULLET_LEVEL.LEVEL_2:
                    if (Level == Constant.BULLET_LEVEL.LEVEL_1) { this._bulletType2 = new Array<Node>(1) }
                    else { this._bulletType2 = new Array<Node>(2) }
                    ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_021).then((bt1: Prefab) => {
                        for (let index = 0; index < this._bulletType2.length; index++) {
                            this._bulletType2[index] = PoolManager.instance.getNode(bt1, this.node);
                        }
                    });
                    break;
                case Constant.BULLET_LEVEL.LEVEL_3:
                    AudioManager.instance.playSound(Constant.AUDIO_SOUND.LASER2, true, 0.7);
                case Constant.BULLET_LEVEL.LEVEL_4:
                    if (Level == Constant.BULLET_LEVEL.LEVEL_3) { this._bulletType2 = new Array<Node>(1) }
                    else { this._bulletType2 = new Array<Node>(2) }
                    ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_022).then((bt2: Prefab) => {
                        for (let index = 0; index < this._bulletType2.length; index++) {
                            this._bulletType2[index] = PoolManager.instance.getNode(bt2, this.node);
                        }
                    });
                    break;
                case Constant.BULLET_LEVEL.LEVEL_5:
                    AudioManager.instance.stop(Constant.AUDIO_SOUND.LASER2);
                    AudioManager.instance.playSound(Constant.AUDIO_SOUND.LASER3, true, 0.9);
                default:
                    if (Level == Constant.BULLET_LEVEL.LEVEL_5) { this._bulletType2 = new Array<Node>(1) }
                    else { this._bulletType2 = new Array<Node>(2) }
                    ResourceUtil.loadEffectRes(Constant.LOADING_PATH.SELF_BULLET_023).then((bt3: Prefab) => {
                        for (let index = 0; index < this._bulletType2.length; index++) {
                            this._bulletType2[index] = PoolManager.instance.getNode(bt3, this.node);
                        }
                    });

                    break;
            }
        }
        this._bullet2Move(IsPlayer);
    }

    /**
     * 激光的移动
     * @param IsPlayer 是否为玩家子弹
     */
    private _bullet2Move (IsPlayer: boolean) {
        let pos: Vec3 = this.player.getPosition();
        if (this._bulletType2[0] != null) {
            if (this._bulletType2.length == 1) {
                let bullet: BulletALL = this._bulletType2[0].getComponent(BulletALL);
                bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.BULLET2, true);
                this._setJudgeGroup(bullet, IsPlayer);
                this._bulletType2[0].setScale(Constant.SCALE.SCALE3);
                this._bulletType2[0].setPosition(pos.x, pos.y, pos.z - 4.5);
            }
            else if (this._bulletType2.length == 2) {
                for (let idn = 0; idn < this._bulletType2.length; idn++) {
                    let bullet: BulletALL = this._bulletType2[idn].getComponent(BulletALL);
                    bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.BULLET2, true);
                    this._setJudgeGroup(bullet, IsPlayer);
                    this._bulletType2[idn].setScale(Constant.SCALE.SCALE3);
                }
                this._bulletType2[0].setPosition(pos.x - 2.75, pos.y, pos.z - 2.5);
                this._bulletType2[1].setPosition(pos.x + 2.75, pos.y, pos.z - 2.5);
            }
        }
    }

    /**
     * 创建子弹类型031，032，033（球形类型子弹）
     * @param IsPlayer 是否玩家子弹
     * @param Level 子弹等级
     */
    public creatorBulletType3 (IsPlayer: boolean, Level: number) {
        let pos: Vec3 = this.player.getPosition();
        let bulletArray: Node[];
        switch (Level) {
            case Constant.BULLET_LEVEL.LEVEL_1:     // 等级1 ，2
            case Constant.BULLET_LEVEL.LEVEL_2:
                bulletArray = new Array<Node>(1);
                bulletArray[0] = PoolManager.instance.getNode(this._playerBullet3[0], this.node);
                this._selfBullet3(bulletArray[0], IsPlayer);
                bulletArray[0].setPosition(pos.x, pos.y, pos.z - 4);
                this._bullet.push(bulletArray[0]);
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET4, false, 0.7);
                break;
            case Constant.BULLET_LEVEL.LEVEL_3:     // 等级3，4
            case Constant.BULLET_LEVEL.LEVEL_4:
                bulletArray = new Array<Node>(2);
                for (let index = 0; index < bulletArray.length; index++) {
                    bulletArray[index] = PoolManager.instance.getNode(this._playerBullet3[1], this.node);
                    let bullet = this._selfBullet3(bulletArray[index], IsPlayer);
                    bullet.bulletType = index == 0 ? Constant.BULLET_DIRECTION.RIGHT : Constant.BULLET_DIRECTION.LEFT;
                    this._bullet.push(bulletArray[index]);
                    let posX = index == 0 ? pos.x + 2.5 : pos.x - 2.5;
                    bulletArray[index].setPosition(posX, pos.y, pos.z - 4);
                }
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET4, false, 0.7);
                break;
            default:     // 等级5，6
                bulletArray = new Array<Node>(3);
                for (let index = 0; index < bulletArray.length; index++) {
                    bulletArray[index] = PoolManager.instance.getNode(this._playerBullet3[2], this.node);
                    let bullet = this._selfBullet3(bulletArray[index], IsPlayer);
                    bullet.bulletType = index == 0 ? Constant.BULLET_DIRECTION.RIGHT : (index == 1 ? Constant.BULLET_DIRECTION.LEFT : Constant.BULLET_DIRECTION.CENTRAL);
                    this._bullet.push(bulletArray[index]);
                    let posX = index == 0 ? pos.x + 2.5 : (index == 1 ? pos.x - 2.5 : pos.x);
                    bulletArray[index].setPosition(posX, pos.y, pos.z - 4);
                }
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET4, false, 0.7);
                break;
        }
    }

    /**
     * 内部函数
     * @param bulletArray 子弹组
     * @param IsPlayer 判断是玩家子弹还是敌方子弹
     * @returns
     */
    private _selfBullet3 (bulletArray: Node, IsPlayer: boolean) {
        let bullet: BulletALL = bulletArray.getComponent(BulletALL);
        bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.BULLET3);
        bulletArray.setScale(1, 1, 1);
        bullet.mesh.setScale(1, 1, 1);
        this._setJudgeGroup(bullet, IsPlayer);
        return bullet;
    }

    /**
     * 关闭子弹类型021,022,033(激光类型子弹)
     */
    public closeBulletType2 () {
        if (this._bulletType2 != null) {
            if (this._bulletType2[0] == null) { return }
            for (let index = 0; index < this._bulletType2.length; index++) {
                let bullet: BulletALL = this._bulletType2[index].getComponent(BulletALL);
                bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.BULLET2, false);
            }
            this._bulletType2 = null;
        }
    }

    // //////////////////////////////////////////////////////////敌机子弹//////////////////////////////////////////////////////////

    /**
     *  创建正常的第一种子弹，bullet1
     * @param localPos 敌机坐标点
     */
    public enemyBullet (localPos: Vec3) {
        let enemyBullet: Node = null!;
        enemyBullet = PoolManager.instance.getNode(this._bullet01, this.node);
        let bullet: BulletALL = enemyBullet.getComponent(BulletALL);
        bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.BULLET1);
        this._setJudgeGroup(bullet, false);
        enemyBullet.setPosition(localPos.x, localPos.y, localPos.z + 5.5);
        enemyBullet.setScale(Constant.SCALE.SCALE2);
        this._bullet.push(enemyBullet);
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET1);
    }

    /**
     * 创建子弹类型02,让子弹呈现三角状飞出
     * @param localPos 敌机坐标点
     * @param targetPos 目标坐标点
     */
    public enemyBullet02 (localPos: Vec3, targetPos: Vec3) {
        let bulletArray: Node[] = new Array<Node>(3);
        let degree: number = ToolManager.instance.getAngleAxis(localPos, targetPos, new Vec2(0, 1));
        let bulletPos: Vec3 = new Vec3(localPos.x, 0, localPos.z - 6);
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET2).then((emt: Prefab) => {
            for (let index = 0; index < bulletArray.length; index++) {
                bulletArray[index] = PoolManager.instance.getNode(emt, this.node);
                let bullet: BulletALL = bulletArray[index].getComponent(BulletALL);
                this._setJudgeGroup(bullet, false);
                bulletArray[index].setPosition(bulletPos);
                let reDegree = index == 0 ? degree : (index == 1 ? degree + 30 : degree - 30);
                bullet.showBulletAll(reDegree, Constant.BULLET_ALL_TYPE.ENEMY_BULLET2);
                this._bullet.push(bulletArray[index]);
            }
        });
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET5);
    }

    /**
     *创建子弹类型03
     * @param localPos 敌机坐标点
     * @param degree 目标坐标点
     */
    public enemyBullet03 (localPos: Vec3, degree?: number) {
        let enemyBullet: Node = null!;
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET3).then((emt: Prefab) => {
            enemyBullet = PoolManager.instance.getNode(emt, this.node);
            let bullet: BulletALL = enemyBullet.getComponent(BulletALL);
            let bulletPos: Vec3;
            bulletPos = new Vec3(localPos.x, 0, localPos.z);
            if (degree) { bullet.showBulletAll(degree, Constant.BULLET_ALL_TYPE.ENEMY_BULLET3) }
            else { bullet.showBulletAll(0, Constant.BULLET_ALL_TYPE.ENEMY_BULLET3) }
            enemyBullet.eulerAngles = new Vec3(0, degree, 0);
            this._setJudgeGroup(bullet, false);
            enemyBullet.setPosition(bulletPos.x, bulletPos.y, bulletPos.z + 5);
            this._bullet.push(enemyBullet);
        });
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET5);
    }

    /**
     * 创建敌方子弹4
     * @param localPos 自身坐标点
     * @param targetPos 目标坐标点
     */
    public enemyBullet04 (localPos: Vec3, targetPos: Vec3) {
        let enemyBullet: Node = null!;
        let degree: number = ToolManager.instance.getAngleAxis(localPos, targetPos, new Vec2(0, 1));
        let bulletPos: Vec3 = new Vec3(localPos.x + 1, 0, localPos.z + 3);
        ResourceUtil.loadEffectRes(Constant.LOADING_PATH.ENEMY_BULLET4).then((emt: Prefab) => {
            enemyBullet = PoolManager.instance.getNode(emt, this.node);
            let bullet: BulletALL = enemyBullet.getComponent(BulletALL);
            bullet.showBulletAll(degree, Constant.BULLET_ALL_TYPE.ENEMY_BULLET4);
            this._setJudgeGroup(bullet, false);
            enemyBullet.setPosition(bulletPos);
            this._bullet.push(enemyBullet);
        });
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET5);
    }

    /**
     * 创建子弹类型05,需要输入一个角度，角度范围(0,360) 粉红色子弹散射圈形
     * @param localPos 自身坐标点
     * @param degree 输入的角度
     */
    public enemyBullet05 (localPos: Vec3, degree: number) {
        let enemyBullet: Node = null!;
        let bulletPos: Vec3 = new Vec3(localPos.x, 0, localPos.z + 1);
        enemyBullet = PoolManager.instance.getNode(this._bullet05, this.node);
        let bullet: BulletALL = enemyBullet.getComponent(BulletALL);
        bullet.showBulletAll(degree, Constant.BULLET_ALL_TYPE.ENEMY_BULLET5);
        this._setJudgeGroup(bullet, false);
        enemyBullet.setPosition(bulletPos);
        this._bullet.push(enemyBullet);
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET2);
    }

    /**
     * 创建子弹类型06,需要输入一个角度，角度范围(90,-90)
     * @param lcoalPos  坐标点
     * @param degree    角度（90，-90）
     */
    public enemyBullet06 (lcoalPos: Vec3, degree: number) {
        let enemyBullet: Node = null;
        let bulletPos: Vec3 = new Vec3(lcoalPos.x, 0, lcoalPos.z + 1);
        if (degree == null) { degree = 0 }
        enemyBullet = PoolManager.instance.getNode(this._bullet06, this.node);
        enemyBullet.setPosition(bulletPos);
        let bullet: BulletALL = enemyBullet.getComponent(BulletALL);
        bullet.showBulletAll(degree, Constant.BULLET_ALL_TYPE.ENEMY_BULLET6);
        this._setJudgeGroup(bullet, false);
        enemyBullet.eulerAngles = new Vec3(0, degree, 0);
        this._bullet.push(enemyBullet);
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BOSS2);
    }

    /**
     * 创建导弹子弹类
     * @param localPos  本地坐标点
     * @param targetPos 目标坐标点
     */
    public enemyMissile1 (localPos: Vec3, targetPos: Vec3) {
        let enemyBullet: Node = null!;
        let degree: number = ToolManager.instance.getAngleAxis(localPos, targetPos, new Vec2(0, 1));
        let bulletPos: Vec3 = new Vec3(localPos.x, 0, localPos.z + 3);
        enemyBullet = PoolManager.instance.getNode(this._missile, this.node);
        enemyBullet.setPosition(bulletPos);
        let bullet: BulletALL = enemyBullet.getComponent(BulletALL);
        bullet.showBulletAll(degree, Constant.BULLET_ALL_TYPE.MISSILE1);
        this._setJudgeGroup(bullet, false);
        enemyBullet.eulerAngles = new Vec3(0, degree, 0);       // 调整导弹的角度
        this._bullet.push(enemyBullet);
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BOSS1);
    }

    /**
     * 创建子弹类型7,朝四个方向移动
     * @param localPos 坐标点
     */
    public enemyBullet7 (localPos: Vec3) {
        let bulletArray = new Array<Node>(12);
        let gap: number = 15;        // 子弹之间的空隙
        for (let i = 0; i < 3; i++) {   // 向下发射的子弹
            bulletArray[i] = PoolManager.instance.getNode(this._bullet07, this.node);
            let bullet = this._bullet7(bulletArray[i], localPos);
            let reGap = i == 0 ? 0 : (i == 1 ? gap : -gap);
            bullet.showBulletAll(reGap, Constant.BULLET_ALL_TYPE.ENEMY_BULLET7);
        }
        for (let i = 3; i < 6; i++) {   // 向右发射子弹
            bulletArray[i] = PoolManager.instance.getNode(this._bullet07, this.node);
            let bullet = this._bullet7(bulletArray[i], localPos);
            let reGap = i == 3 ? 90 : (i == 4 ? 90 + gap : 90 - gap);
            bullet.showBulletAll(reGap, Constant.BULLET_ALL_TYPE.ENEMY_BULLET7);
        }
        for (let i = 6; i < 9; i++) {   // 向上发射子弹
            bulletArray[i] = PoolManager.instance.getNode(this._bullet07, this.node);
            let bullet = this._bullet7(bulletArray[i], localPos);
            let reGap = i == 6 ? 180 : (i == 7 ? 180 + gap : 180 - gap);
            bullet.showBulletAll(reGap, Constant.BULLET_ALL_TYPE.ENEMY_BULLET7);
        }
        for (let i = 9; i < 12; i++) {  // 向左发射子弹
            bulletArray[i] = PoolManager.instance.getNode(this._bullet07, this.node);
            let bullet = this._bullet7(bulletArray[i], localPos);
            let reGap = i == 9 ? 270 : (i == 8 ? 270 + gap : 270 - gap);
            bullet.showBulletAll(reGap, Constant.BULLET_ALL_TYPE.ENEMY_BULLET7);
        }
        for (let idn = 0; idn < bulletArray.length; idn++) {
            this._bullet.push(bulletArray[idn]);
        }
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET3);
    }

    /**
     * 内部函数
     * @param bulletArray 子弹组
     * @param localPos 自身坐标点
     * @returns
     */
    private _bullet7 (bulletArray: Node, localPos: Vec3) {
        let bullet: BulletALL = bulletArray.getComponent(BulletALL);
        this._setJudgeGroup(bullet, false);
        bulletArray.setPosition(localPos);
        return bullet;
    }

    /**
     * @param bullet 传入子弹的脚本
     * @param player 是否是玩家子弹，是为true,否为false
     */
    private _setJudgeGroup (bullet: BulletALL, player: boolean) {
        bullet.setBulletGroup(player);
        bullet.playerBullet = player;
        bullet.enemyBullet = !player;
    }

    /**
     * 移除子弹节点
     * @param bullet 子弹节点
     */
    public onBulletKilled (bullet: Node) {
        PoolManager.instance.putNode(bullet);
    }

    /**
     * 移除所有子弹
     */
    public removeAllBullet () {
        let children: Node[] = this.node.children;
        for (let i: number = children.length - 1; i >= 0; i--) {
            let scriptBullet: Component = children[i].getComponent(BulletALL);
            if (scriptBullet) {
                this.onBulletKilled(children[i]);
            }
        }
        this.closeBulletType2();
        this._bullet.slice(0, this._bullet.length);
    }
}

