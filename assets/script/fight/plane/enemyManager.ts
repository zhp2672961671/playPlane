import { CSVManager } from './../../framework/csvManager';
/* eslint-disable max-depth */
/* eslint-disable no-case-declarations */
import { GameManager } from './../gameManager';
import { _decorator, Component, Node, Prefab, Vec3, Collider } from 'cc';
import { combinationBase } from './combinationBase';
import { BossPlaneMain } from './boss1/bossPlaneMain';
import { BulletManager } from '../bullet/bulletManager';
import { Constant } from '../../framework/constant';
import { LocalConfig } from '../../framework/localConfig';
import { ClientEvent } from '../../framework/clientEvent';
import { ResourceUtil } from '../../framework/resourceUtil';
import { PoolManager } from '../../framework/poolManager';
import { ToolManager } from '../../ui/common/toolManager';
import { props } from '../../ui/common/props';
import { enemyAll } from './enemyAll';
import { battery1 } from './battery1';
import { enemyRed } from './enemyRed';
const { ccclass, property } = _decorator;

@ccclass('EnemyManager')
export class EnemyManager extends Component {
    public static combinationInterval: number;    // 组合间隔
    public static isGameOver: boolean = false;
    @property(Node)
    public bullet: BulletManager = null!;      // 子弹bulletManager

    public player: Node = null!;
    public difficultInfo: Array<any> = LocalConfig.instance.getTableArr(Constant.TABLENAME.DIFFICULT_MAIN);

    private _enemyTime: number;     // 创建敌机的间隔时间
    private _enemy: Node[] = new Array<Node>(0);
    private _prop: Node[] = new Array<Node>(0);
    private enemyTime: number = Constant.GAME_VALUE.ENEMY_TIME; // 敌机生成时间
    private _playerPos:Vec3 = new Vec3();       // 玩家的坐标

    private _enemyGreen: Prefab = null!;
    private _enemyYellow: Prefab = null;
    private _enemyBoss: Prefab = null!;

    onLoad () {
        this.enemyTime = Constant.GAME_VALUE.ENEMY_TIME;
        this._enemyTime = 0;
        EnemyManager.combinationInterval = 0;
        LocalConfig.instance.loadConfig(() => {
            this.difficultInfo = LocalConfig.instance.getTableArr(Constant.TABLENAME.DIFFICULT_MAIN);
        });
    }

    start () { // 资源的预加载
        ResourceUtil.loadModelRes(Constant.LOADING_PATH.ENEMY_GREEN).then((pf: Prefab) => {
            this._enemyGreen = pf;
            PoolManager.instance.prePool(this._enemyGreen, 20);
        });

        ResourceUtil.loadModelRes(Constant.LOADING_PATH.ENEMY_YELLOW).then((pf: Prefab) => {
            this._enemyYellow = pf;
            PoolManager.instance.prePool(this._enemyYellow, 20);
        });

        ResourceUtil.loadModelRes(Constant.LOADING_PATH.BOSS).then((pf: Prefab) => {
            this._enemyBoss = pf;
            PoolManager.instance.prePool(this._enemyBoss, 1);
        });

    }

    onEnable () {
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_WIN, this.gameWin, this);
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_FAILURE, this.gameFail, this);      // 游戏失败

    }

    onDisable () {
        ClientEvent.off(Constant.GAMEOVER_TYPE.GAME_WIN, this.gameWin, this);
        ClientEvent.on(Constant.GAMEOVER_TYPE.GAME_FAILURE, this.gameFail, this);      // 游戏失败
    }


    update (dt: number) {
        if (GameManager.starting) {
            if (!EnemyManager.isGameOver) {     // 难度处理
                switch (GameManager.gameDifficult) {
                    case Constant.GAME_DIFFICULT.GAME_DIFFICULT_1:
                        this.difficultPoint(1);
                        break;
                    case Constant.GAME_DIFFICULT.GAME_DIFFICULT_2:
                        this.difficultPoint(2);
                        break;
                    case Constant.GAME_DIFFICULT.GAME_DIFFICULT_3:
                        this.difficultPoint(3);
                        break;
                }
            }
            // 敌机移动
            for (let index: number = 0; index < this._enemy.length; index++) {
                let emy: enemyAll = this._enemy[index].getComponent(enemyAll);
                let pos: Vec3 = this._enemy[index].position;
                let enemyBulletSpeed = emy.enemyBulletSpeed / GameManager.gameSpeed;
                let enemySpeed = emy.enemySpeed * GameManager.gameSpeed;
                let sideSpeed = emy.sideSpeed * GameManager.gameSpeed;
                switch (emy.type) {
                    case Constant.ENEMY_ALL_TYPE.COMBINATION1:
                        if (!emy.isDie) {

                            this._enemy[index].setPosition(pos.x, pos.y, pos.z + enemySpeed);
                            if (emy.isBullet) {
                                emy.bulletTime++;
                                if (emy.bulletTime >= enemyBulletSpeed) {
                                    this.transBulletManager(emy.barrage, pos);
                                    emy.bulletTime = 0;
                                }
                            }
                            if (pos.z >= 60) {
                                this.onEnemyKilled(this._enemy[index]);
                                this.enemyRandScore(false);
                                this.removeEnemy(this._enemy[index]);
                            }
                        }
                        else {
                            this.falling(emy, this._enemy[index]);
                        }

                        break;
                    case Constant.ENEMY_ALL_TYPE.COMBINATION3:
                        if (!emy.isDie) {
                            this._enemy[index].setPosition(pos.x + (emy.dx * enemySpeed), 0, pos.z + (emy.dy * enemySpeed));
                            if (emy.isBullet) {       // 发射子弹部分
                                if (emy.bulletTime >= enemyBulletSpeed) {
                                    this.transBulletManager(emy.barrage, pos);
                                    emy.bulletTime = 0;
                                }
                            }
                            if ((emy.degree > 0 && this._enemy[index].position.x >= 35) || (emy.degree < 0 && this._enemy[index].position.x <= -35) || this._enemy[index].position.z >= 50) {
                                this.onEnemyKilled(this._enemy[index]);
                                this.enemyRandScore(false);
                                this.removeEnemy(this._enemy[index]);
                            }
                        }
                        else {
                            this.falling(emy, this._enemy[index]);
                        }
                        break;
                    case Constant.ENEMY_ALL_TYPE.COMBINATION4:
                        if (!emy.isDie) {
                            if (pos.z >= 0 && this._enemy[index].eulerAngles.y == 0 && !emy.isRotating)
                            { this._enemy[index].translate(new Vec3(0, 0, -enemySpeed)) }  // 直线行走
                            if (pos.z < 0 && this._enemy[index].eulerAngles.y == 0) {
                                emy.runRound4();
                                if (emy.isBullet) {
                                    emy.bulletTime++;
                                    if (emy.bulletTime >= enemyBulletSpeed) {
                                        this.transBulletManager(emy.barrage, pos);
                                        emy.bulletTime = 0;
                                    }
                                }
                            }
                            // 到达指定地点后走弧形轨迹
                            if (emy.isRotating) {
                                let radian = Math.PI / 180 * emy.angle;
                                // 更新节点位置
                                this._enemy[index].setPosition(emy.centerPos.x + (emy.radius * Math.cos(radian)), 0, emy.centerPos.z + (emy.radius * Math.sin(radian)));
                                if (emy.angle < 270) { this._enemy[index].eulerAngles = new Vec3(0, -emy.angle + 180, emy.sideAngle -= sideSpeed) }
                                if (emy.angle >= 270) { this._enemy[index].eulerAngles = new Vec3(0, -emy.angle + 180, emy.sideAngle += sideSpeed) }
                                // 计算下一帧的角度
                                let anglePerFrame = dt * 360 / (emy.raniusSpeed / GameManager.gameSpeed); // 这里的10是绕一圈需要的时间
                                emy.angle += anglePerFrame;
                            }
                            if (emy.angle >= 360) {
                                this._enemy[index].eulerAngles = Constant.GAME_POS.POS_7;
                                emy.isRotating = false;
                                this._enemy[index].translate(new Vec3(0, 0, -enemySpeed));
                            }
                        }
                        else if (emy.isDie) {
                            this.falling(emy, this._enemy[index]);
                        }
                        // 飞机到达地图下边界60处以后，将会飞出屏幕，所以定为60未边界点
                        if (pos.z >= 130) {
                            this.onEnemyKilled(this._enemy[index]);
                            this.enemyRandScore(false);
                            this.removeEnemy(this._enemy[index]);
                        }
                        break;
                    case Constant.ENEMY_ALL_TYPE.COMBINATION5:
                        if (!emy.isDie) {
                            if (pos.z >= -1) {
                                this._enemy[index].setPosition(pos.x + emy.dx * enemySpeed, pos.y, pos.z - emy.dy * enemySpeed - 0.1);
                            }
                            if (pos.z < -1 && Number(this._enemy[index].eulerAngles.y.toFixed(2)) == -10) {
                                emy.runRound5();
                                if (emy.isBullet) {       // 是否开枪
                                    emy.bulletTime++;
                                    if (emy.bulletTime >= enemyBulletSpeed) {
                                        this.transBulletManager(emy.barrage, pos);
                                        emy.bulletTime = 0;
                                    }
                                }
                            }
                            if (emy.isRotating) {
                                let radian = Math.PI / 180 * emy.angle5;
                                // 更新节点位置
                                this._enemy[index].setPosition(emy.centerPos.x + (emy.radius * Math.cos(radian)), 0, emy.centerPos.z + (emy.radius * Math.sin(radian)));
                                // 自身朝向的设置
                                if (emy.angle5 < 270) { this._enemy[index].eulerAngles = new Vec3(0, -emy.angle5 + 180, emy.sideAngle -= sideSpeed) }

                                // 计算下一帧的角度
                                let anglePerFrame = dt * 360 / (emy.raniusSpeed / GameManager.gameSpeed); // 这里是绕一圈需要的时间
                                emy.angle5 += anglePerFrame;    // 顺时针转动
                            }
                            if (emy.angle5 >= 270) {
                                emy.isRotating = false;
                                this._enemy[index].translate(new Vec3(0, 0, -(emy.dy * enemySpeed)));
                            }

                        }
                        else if (emy.isDie) {
                            this.falling(emy, this._enemy[index]);
                        }
                        // 飞机达到地图的右边边界50处以后，将会飞出屏幕，所以定位右边的50为边界线,将其删除
                        if (pos.x >= 50) {
                            this.onEnemyKilled(this._enemy[index]);
                            this.enemyRandScore(false);
                            this.removeEnemy(this._enemy[index]);
                        }
                        break;
                    case Constant.ENEMY_ALL_TYPE.COMBINATION6:
                        if (!emy.isDie) {
                            if (pos.z < 6 && !emy.isRotating) {
                                this._enemy[index].translate(new Vec3(emy.dx * enemySpeed * 0.1, 0, emy.dy * enemySpeed));
                            }

                            if (pos.z >= 6 && emy.angle6 == 117) {
                                emy.isRotating = true;
                                emy.runRound4();      // 与4的相同
                                if (emy.isBullet) {
                                    this.transBulletManager(emy.barrage, pos);    // 传入自身的坐标
                                }
                            }

                            if (emy.isRotating) {
                                let radian = Math.PI / 180 * emy.angle6;
                                // 更新节点位置
                                this._enemy[index].setPosition(emy.centerPos.x + (emy.radius * Math.cos(radian)), 0, emy.centerPos.z + (emy.radius * Math.sin(radian)));
                                this._enemy[index].eulerAngles = new Vec3(0, -emy.angle6 + 180, 0);
                                // 计算下一帧的角度
                                let anglePerFrame = dt * 360 / (emy.raniusSpeed / GameManager.gameSpeed);
                                emy.angle6 -= anglePerFrame;        // 逆时针转动
                                if (emy.angle6 <= 0) { emy.isRotating = false }
                            }

                        }
                        else if (emy.isDie) {
                            this.falling(emy, this._enemy[index]);
                        }
                        // 飞机飞到屏幕上方超出屏幕后，将其删除
                        if (pos.z <= -40) {
                            this.onEnemyKilled(this._enemy[index]);
                            this.enemyRandScore(false);
                            this.removeEnemy(this._enemy[index]);
                        }
                        break;
                    case Constant.ENEMY_ALL_TYPE.COMBINATION7:
                        if (!emy.isDie) {
                            if (this._enemy[index].position.z < 0 && emy.numShot == 0) {
                                this._enemy[index].translate(new Vec3(0, 0, enemySpeed));
                            }
                            if (this._enemy[index].position.z >= 0 && emy.isBullet && emy.enemyplane) {
                            // 发射bullet07子弹类型
                                emy.shooting();
                                if (emy.numShot >= 3) {
                                    emy.isBullet = false;
                                }
                            }
                            if (!emy.isBullet && emy.numShot >= 3) {

                                this._enemy[index].translate(new Vec3(0, 0, -enemySpeed));
                            }
                        }
                        else if (emy.isDie) {
                            if (emy.crashed) { emy.enemyCrashed() }
                        }
                        if (this._enemy[index].position.z <= -60 && emy.numShot >= 3) {
                        // 超出屏幕的回收
                            this.onEnemyKilled(this._enemy[index]);
                            this.enemyRandScore(false);
                            this.removeEnemy(this._enemy[index]);
                        }
                        break;
                }

            }

            // 道具的移动
            for (let index: number = 0; index < this._prop.length; index++) {
                let prop =  this._prop[index];
                let pps: props = prop.getComponent(props);
                switch (pps.type) {
                    case Constant.PROPS.PROPS_STARS:
                        let pos: Vec3 = prop.children[0].getPosition();
                        prop.translate(new Vec3(0, 0, pps.speed * GameManager.gameSpeed));
                        prop.children[0].eulerAngles = new Vec3(0, 0, pps.roll++);
                        pps.blunt = pps.blunt + 0.5;
                        if (pps.blunt < 7) {
                            prop.children[0].setPosition(pos.x + pps.dx / pps.blunt, 0, pos.z + pps.dy / pps.blunt);
                        }
                        break;
                    case Constant.PROPS.PROPS_HEART:
                    case Constant.PROPS.PROPS_BULLET:
                        prop.translate(new Vec3(0, 0, pps.speed * GameManager.gameSpeed));
                        prop.eulerAngles = new Vec3(0, 0, pps.roll++);
                        break;
                }
                let dis: number = ToolManager.instance.getDistance(prop.position, this.player.position);
                if (dis <= Constant.PROPS.PEOPS_DIS) {
                    this._playerPos.set(this.player.position);
                    pps.propPos.set(prop.position);
                    Vec3.subtract(pps.offsetPos, this._playerPos, pps.propPos);     // 向量差
                    if (!pps.totalFlyTime) { pps.totalFlyTime = pps.offsetPos.length() * 2 }
                    // 速度由慢到快
                    pps.raiseTimes += dt;
                    let offset = Math.pow(pps.raiseTimes, 0.5) - 1;
                    pps.curFlyTime += dt + offset;
                    pps.curFlyTime = pps.curFlyTime >= pps.totalFlyTime ? pps.totalFlyTime : pps.curFlyTime;
                    let percent = Number((pps.curFlyTime / pps.totalFlyTime).toFixed(2));
                    pps.targetPos.set(pps.propPos.x + pps.offsetPos.x * percent, this._playerPos.y, pps.propPos.z + pps.offsetPos.z * percent);
                    prop.setPosition(pps.targetPos);
                }
                if (prop.position.z >= 60) {
                    this.onEnemyKilled(prop);
                    this.removeProp(prop);
                }

            }

        }


    }

    /**
     * 处理爆炸和坠毁
     * @param emy 脚本enemyAll
     * @param enemy 敌机节点
     */
    public falling (emy: enemyAll, enemy: Node) {
        let _scale: Vec3 = enemy.scale;
        if (emy.crashed) { emy.enemyCrashed() }
        else if (_scale.x > 0 && _scale.y > 0 && _scale.z > 0) {
            enemy.setScale(_scale.x - 0.5, _scale.y - 0.5, _scale.z - 0.5);
        }
    }


    /**
     * 拆分表格
     * @param diffieTable 难度表
     * @param index 数列
     * @returns 返回该难度下某行的值
     */
    public difficultTable (diffieTable: any, index: number) {
        let differInfo: string[] = [
            (diffieTable[index].combination).split('#'),        // 组合0
            (diffieTable[index].life).split('#'),               // 生命值1
            (diffieTable[index].score).split('#'),              // 分数2
            (diffieTable[index].location).split('#'),           // 组合出现位置,坐标3
            (diffieTable[index].speed).split('#'),              // 移动速度4
            (diffieTable[index].attacked).split('#'),           // 是否攻击5
            (diffieTable[index].barrage).split('#'),            // 弹幕id6
            (diffieTable[index].interval).split('#'),           // 攻击间隔(帧)7
            (diffieTable[index].prop).split('#'),               // 道具8
            (diffieTable[index].stars).split('#'),              // 掉落星星9
        ];
        return differInfo;
    }

    /**
     * 选择需要发射的子弹，idn 为弹幕id,enemyPos为自身的三位坐标
     */
    public transBulletManager (idn: number, enemyPos: Vec3, degree?: number) {
        if (idn == 0) { return }
        if (degree) { this.bullet.getComponent(BulletManager).chooseBullet(idn, enemyPos, degree) }
        else { this.bullet.getComponent(BulletManager).chooseBullet(idn, enemyPos) }
    }

    /**
     * 选择难度
     * @param difference 第几个难度
     * @returns 难度表不存在时返回
     */
    private difficultPoint (difference) {
        if (!this.difficultInfo) { return }
        let strSort: string = (this.difficultInfo[difference - 1].mapName);
        let diff: any = LocalConfig.instance.getTableArr(strSort);
        this._enemyTime++;
        if (this._enemyTime >= this.enemyTime / GameManager.gameSpeed) {
            if (EnemyManager.combinationInterval == 0) { return }
            for (let idn = 0; idn < diff.length; idn++) {
                if (EnemyManager.combinationInterval == diff[diff.length - 1].distance) {     // 判断是否为boss
                    EnemyManager.combinationInterval++;
                    this.creatorBoss();
                }

                if (EnemyManager.combinationInterval == diff[idn].distance) {                  // 判断这是哪个组合
                    let enemyInfo: string[] = this.difficultTable(diff, idn);      // 把该难度表和第几个值带入拆分数据中去,得到该distance下的一行数据，该行数据不包含#符号
                    for (let index = 0; index < enemyInfo[0].length; index++) {
                        this.chooseCombination(enemyInfo, index);
                    }
                    this._enemyTime = 0;
                    console.log(EnemyManager.combinationInterval, 'combinationInterval');
                }
            }
        }
    }


    /**
     * 游戏胜利
     */
    public gameWin () {
        EnemyManager.combinationInterval = 0;  // 距离变成0
        EnemyManager.isGameOver = true;

    }

    /**
     * 游戏失败
     */
    public gameFail () {
        EnemyManager.combinationInterval = 0;  // 距离变成0
        EnemyManager.isGameOver = true;
    }

    /**
     *根据背景移动距离选择组合
     * @param info  表格信息
     * @param index 组合信息，使用对应信息创建相应组合
     */
    public chooseCombination (info:string[], index:number) {
        switch (Number(info[0][index])) {
            case Constant.DIS_COMBINATOR.DIS_COMBIN0:
                this.creatorEnemyGreen(info, index);
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN1:
                this.creatorEnemyYellow(info, index);
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN2:
                this.creatorCross(this._enemyGreen, info, index);         // 绿色 一字型
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN3:
                this.creatorCross(this._enemyYellow, info, index); //  黄色一字型
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN4:
                this.creatorV(this._enemyGreen, info, index); // 绿色v字型
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN5:
                this.creatorSemicircle(this._enemyYellow, info, index); // 黄色从下方飞入，然后执行半圆飞行
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN6:
                this.creatorVertical(this._enemyGreen, info, index);//  绿色飞机竖直向下
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN7:
                this.creatorSlash(this._enemyGreen, info, index);     // 绿色斜线飞入
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN8:
                this.creatorCircle(this._enemyGreen, info, index);   // 绿色从底部飞入，飞一个圈后右侧飞出
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN9:
                this.creatorTopCircle(this._enemyGreen, info, index);  // 绿色左侧飞入，从顶部飞出
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN10:
                ResourceUtil.loadModelRes(Constant.LOADING_PATH.ENEMY_RED).then((pf: Prefab) => {
                    this.creatorRed(pf, info, index);
                });
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN11:
                this.creatorReStraight(this._enemyYellow, info, index);     // 单个黄色飞机入场，发射红色圈形子弹，卒后向上退出
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBIN12:
                ResourceUtil.loadModelRes(Constant.LOADING_PATH.COMBINATION8).then((pf: Prefab) => {
                    this.creatorTurret(pf, info, index);
                });
                break;
            case Constant.DIS_COMBINATOR.DIS_COMBINBOSS:
                this.creatorBoss();
                break;

        }
    }

    /**
     * 星星创建
     * @param pos 要创建的星星坐标
     * @param num 要创建的星星数量
     * @returns
     */
    public creatorStars (pos: Vec3, num: number) {
        if (num == 0) { return }
        let star: Node[] = new Array<Node>(num);
        ResourceUtil.loadModelRes(Constant.LOADING_PATH.STARS).then((st: Prefab) => {
            for (let idn = 0; idn < star.length; idn++) {
                star[idn] = PoolManager.instance.getNode(st, this.node);
                let degree: number = ToolManager.instance.getRandomNum(0, 360);
                star[idn].getComponent(props).showManager(this, degree, Constant.PROPS.PROPS_STARS);
                star[idn].setPosition(pos.x, 0, pos.z);
                this._prop.push(star[idn]);     // 将星星推入数组
            }
        });
    }

    /**
     * 星星收集
     */
    public collectStars () {
        GameManager.stars++;
    }

    /**
     * 新的创建道具方法,如果说0的话，不掉落任何道具,传入的pos为要掉落的位置，index为道具类型参见constant的掉落道具栏
     * @param pos 要创建的道具坐标
     * @param index 要创建的道具类型
     * @returns
     */
    public creatorProp (pos: Vec3, index: number) {
        if (index == 0) { return }
        if (index == 1) {   // 掉落血包道具
            let heartProp: Node = null!;
            ResourceUtil.loadModelRes(Constant.LOADING_PATH.HEART).then((ht: Prefab) => {
                heartProp = PoolManager.instance.getNode(ht, this.node);
                heartProp.getComponent(props).showManager(this, 0, Constant.PROPS.PROPS_HEART);
                heartProp.setPosition(pos.x, 0, pos.z);
                this._prop.push(heartProp);
            });
        }
        if (index == 2) {   // 掉落子弹道具
            let bulletProp: Node = null!;
            ResourceUtil.loadModelRes(Constant.LOADING_PATH.BULLET).then((bt: Prefab) => {
                bulletProp = PoolManager.instance.getNode(bt, this.node);
                bulletProp.getComponent(props).showManager(this, 0, Constant.PROPS.PROPS_BULLET);
                bulletProp.setPosition(pos.x, 0, pos.z);
                this._prop.push(bulletProp);
            });

        }

    }

    /**
     * 设置绿色飞机数据
     * @param enemyG 绿色飞机节点
     */
    private _setGreen (enemyG: Node) {
        enemyG.setPosition(0, 0, 0);
        enemyG.eulerAngles = new Vec3;
        enemyG.active = true;
        enemyG.setScale(Constant.SCALE.SCALE2); // 将敌机1大小设置为5
        enemyG.children[0].eulerAngles = Constant.GAME_POS.POS_7;
        enemyG.children[1].eulerAngles = Constant.GAME_POS.POS_6;
        enemyG.children[1].setPosition(Constant.GAME_POS.POS_8);
        enemyG.getComponent(Collider).enabled = true;
    }

    /**
     * 设置黄色飞机数据
     * @param enemyY 飞机黄色节点
     */
    private _setYellow (enemyY: Node) {
        enemyY.setPosition(0, 0, 0);
        enemyY.eulerAngles = new Vec3;
        enemyY.active = true;
        enemyY.setScale(Constant.SCALE.SCALE1); // 将敌机1大小设置为8
        enemyY.children[0].eulerAngles = Constant.GAME_POS.POS_7;
        enemyY.children[1].eulerAngles = Constant.GAME_POS.POS_6;
        enemyY.children[1].setPosition(Constant.GAME_POS.POS_5);
        enemyY.getComponent(Collider).enabled = true;

    }

    /**
     * 表格解析 ，hp： 生命值，score：分数，pos：坐标点，speed：速度，barrageID：子弹弹幕id，interval：间隔，props：道具，stars：星星
     * @param info 表格数据
     * @param idn 第几个数据
     * @returns
     */
    private _setAttribute (info: string[], idn: number) {
        let attribute = new Array<any>(10);
        attribute["hp"] = Number(info[1][idn]);
        attribute["score"] = Number(info[2][idn]);
        let posS: string[]  = (info[3][idn]).split(',');
        let posN: number[] = new Array<number>(3);
        for (let index = 0; index < posS.length; index++) {
            posN[index] = Number(posS[index]);
        }
        attribute["pos"] = posN;
        attribute["speed"] = Number(info[4][idn]);
        attribute["isAttack"] = Number(info[5][idn]);
        attribute["barrageID"] = Number(info[6][idn]);
        attribute["interval"] = Number(info[7][idn]);
        attribute["props"] = Number(info[8][idn]);
        attribute["stars"] = Number(info[9][idn]);
        return attribute;
    }

    /**
     *  创建绿色敌机
     * @param info 表格数据
     * @param idn 哪一个数据
     */
    public creatorEnemyGreen (info:string[], idn:number) {
        let enemy: Node = null!;
        let attribute = this._setAttribute(info, idn);
        enemy = PoolManager.instance.getNode(this._enemyGreen, this.node);
        this._setGreen(enemy);
        let com = enemy.getComponent(enemyAll);
        let isAttack = true;
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
        com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
        com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION1);
        enemy.setPosition(attribute["pos"][0], attribute["pos"][1], attribute["pos"][2]);
        this._enemy.push(enemy);
    }

    /**
     *  创建黄色敌机
     * @param info 表格数据
     * @param idn 哪一个数据
     */
    public creatorEnemyYellow (info:string[], idn:number) {
        let enemy: Node = null!;
        let attribute = this._setAttribute(info, idn);
        enemy = PoolManager.instance.getNode(this._enemyYellow, this.node);
        this._setYellow(enemy);
        let com = enemy.getComponent(enemyAll);
        let isAttack = true;
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        com.crashed = enemy.children[2];        // 坠毁效果打开
        com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
        com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
        com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION1); // 这三个有先后顺序之分，一定要吧showManager放在最后，这里会影响到在暂停状态下的子弹发射间隔
        enemy.setPosition(attribute["pos"][0], attribute["pos"][1], attribute["pos"][2]);
        this._enemy.push(enemy);
    }

    /**
     * 轨迹类型为竖直向直线性
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorVertical (combinate: Prefab, info:string[], idn:number) {
        let combination: Node[] = new Array<Node>(4);
        let isAttack = true;
        let attribute = this._setAttribute(info, idn);
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        let num: number = ToolManager.instance.getRandomNum(0, 4);     // 随机一个敌机掉落道具，而不是全部都掉

        for (let ind = 0; ind < combination.length; ind++) {
            combination[ind] = PoolManager.instance.getNode(combinate, this.node);
            let com = combination[ind].getComponent(enemyAll);
            if (ind == num) { com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]) }
            else { com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0) }

            com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
            // 这三个有先后顺序之分，一定要吧showManager放在最后，这里会影响到在暂停状态下的子弹发射间隔
            com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION2);
            combination[ind].setPosition(attribute["pos"][0], attribute["pos"][1], -(ind * 15 + 50 + attribute["pos"][2]));

            combination[ind].setScale(Constant.SCALE.SCALE2);   // 将敌机1大小设置为5
            this._enemy.push(combination[ind]);
        }
    }

    /**
     * 创建组合为一字型
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorCross (enemy: Prefab, info:string[], idn:number) {
        let enemyArray = new Array<Node>(5);
        let isAttack = false;
        let attribute = this._setAttribute(info, idn);
        let num1: number = ToolManager.instance.getRandomNum(0, 5);     // 随机两个敌机进行攻击，而不是全部
        let num2: number = ToolManager.instance.getRandomNum(0, 5);
        let num3: number = ToolManager.instance.getRandomNum(0, 5);     // 随机一个敌机掉落道具，而不是全部都掉
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        for (let ind = 0; ind < enemyArray.length; ind++) {
            enemyArray[ind] = PoolManager.instance.getNode(enemy, this.node);
            let com = enemyArray[ind].getComponent(enemyAll);
            if (enemyArray[ind].name == 'enemyGreen') { this._setGreen(enemyArray[ind]) }
            else if (enemyArray[ind].name == 'enemyYellow') { this._setYellow(enemyArray[ind]) }
            switch (ind) {
                case num1:
                case num2:
                case num3:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION1);
                    break;
                default:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, false, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION1);
                    break;
            }
            com.crashed = null;
            enemyArray[ind].setPosition(-20 + ind * 10, 0, attribute["pos"][2]);   // 位置放在-50处，在屏幕的上方出现
            this._enemy.push(enemyArray[ind]);
        }
    }

    /**
     * 创建组合,v字型
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorV (combinate: Prefab, info:string[], idn:number) {
        let combination: Node[] = new Array<Node>(7);
        let isAttack = true;
        let attribute = this._setAttribute(info, idn);
        let num1: number = ToolManager.instance.getRandomNum(0, 7);
        let num2: number = ToolManager.instance.getRandomNum(0, 7);
        let num3: number = ToolManager.instance.getRandomNum(0, 7);     // 随机一个敌机掉落道具，而不是全部都掉
        let num4: number = ToolManager.instance.getRandomNum(0, 7);
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        for (let ind = 0; ind < combination.length; ind++) {
            combination[ind] = PoolManager.instance.getNode(combinate, this.node);
            this._setGreen(combination[ind]);
            let com = combination[ind].getComponent(enemyAll);
            switch (ind) {
                case num1:
                case num2:
                case num3:
                case num4:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION1);
                    // 这三个有先后顺序之分，一定要吧showManager放在最后，这里会影响到在暂停状态下的子弹发射间隔
                    break;
                default:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, false, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION1);
                    break;
            }
            combination[ind].setPosition(-21 + ind * 7, attribute["pos"][1], -55 + 5 * ind);
            this._enemy.push(combination[ind]);
        }
        for (let ind = 4; ind < combination.length; ind++) {
            let sop: Vec3 = combination[ind].getPosition();
            combination[ind].setPosition(sop.x, sop.y, -5 * (5 + ind));
        }
    }

    /**
     * 创建黄色从下方飞入，然后执行半圆飞行
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorSemicircle (combinate: Prefab, info:string[], idn:number) {
        let combination : Node[] = new Array<Node>(4);
        let isAttack = false;
        let attribute = this._setAttribute(info, idn);
        let num3: number = ToolManager.instance.getRandomNum(0, 4);     // 随机一个敌机掉落道具，而不是全部都掉
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        let centerPos: Vec3 = new Vec3(attribute["pos"][0], attribute["pos"][1], attribute["pos"][2]);
        for (let ind = 0; ind < combination.length; ind++) {
            combination[ind] = PoolManager.instance.getNode(combinate, this.node);
            this._setYellow(combination[ind]);
            combination[ind].children[0].eulerAngles = new Vec3;
            combination[ind].children[0].eulerAngles = new Vec3;
            combination[ind].children[1].eulerAngles = new Vec3;
            combination[ind].children[1].setPosition(0, Constant.GAME_POS.POS_5.y, -Constant.GAME_POS.POS_5.z);
            let com = combination[ind].getComponent(enemyAll);

            com.crashed = combination[ind].children[2];
            switch (ind) {
                case num3:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION4);
                    break;
                default:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, false, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION4);
                    break;
            }
            combination[ind].setPosition(-20, 0, 50 + 25 * ind);
            com.setCenterPoint(centerPos);
            this._enemy.push(combination[ind]);
        }
    }

    /**
     * 创建绿色从底部飞入，飞一个圈后右侧飞出.
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorCircle (combinate: Prefab, info:string[], idn:number) {
        let combination : Node[] = new Array<Node>(5);
        let isAttack = false;
        let attribute = this._setAttribute(info, idn);
        let num3: number = ToolManager.instance.getRandomNum(0, 5);     // 随机一个敌机掉落道具，而不是全部都掉
        if (Number(info[5][idn]) == 1) { isAttack = true }
        else { isAttack = false }
        let centerPos: Vec3 = new Vec3(attribute["pos"][0], attribute["pos"][1], attribute["pos"][2]);

        for (let ind = 0; ind < combination.length; ind++) {
            combination[ind] = PoolManager.instance.getNode(combinate, this.node);
            this._setGreen(combination[ind]);
            let com = combination[ind].getComponent(enemyAll);
            combination[ind].eulerAngles = new Vec3(0, -10, 0);
            combination[ind].children[0].eulerAngles = new Vec3;
            combination[ind].children[0].eulerAngles = new Vec3;
            combination[ind].children[1].eulerAngles = new Vec3;
            combination[ind].children[1].setPosition(0, Constant.GAME_POS.POS_8.y, -Constant.GAME_POS.POS_8.z);
            switch (ind) {
                case num3:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, 10, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION5);
                    break;
                default:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, false, 10, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION5);
                    break;
            }
            combination[ind].setPosition(-20 - 4 * ind, 0, 40 + 20 * ind);
            com.setCenterPoint(centerPos);
            this._enemy.push(combination[ind]);
        }
    }

    /**
     * 创建左侧飞入，从顶部飞出
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorTopCircle (combinate: Prefab, info:string[], idn:number) {
        let combination : Node[] = new Array<Node>(5);
        let isAttack = true;
        let attribute = this._setAttribute(info, idn);
        let num1: number = ToolManager.instance.getRandomNum(0, 5);
        let num2: number = ToolManager.instance.getRandomNum(0, 5);
        let num3: number = ToolManager.instance.getRandomNum(0, 5);     // 随机一个敌机掉落道具，而不是全部都掉

        if (Number(info[5][idn]) == 1) { isAttack = true }
        else { isAttack = false }
        let centerPos: Vec3 = new Vec3(attribute["pos"][0], attribute["pos"][1], attribute["pos"][2]);
        for (let ind = 0; ind < combination.length; ind++) {
            combination[ind] = PoolManager.instance.getNode(combinate, this.node);
            this._setGreen(combination[ind]);
            let com = combination[ind].getComponent(enemyAll);
            switch (ind) {
                case num1:
                case num2:
                case num3:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, 30, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION6);
                    break;
                default:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, false, 30, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION6);
                    break;
            }
            combination[ind].setPosition(-24 - ind * 4, attribute["pos"][1], -13 - 8 * ind);
            combination[ind].eulerAngles = new Vec3(0, 30, 0);
            com.setCenterPoint(centerPos);
            this._enemy.push(combination[ind]);
        }
    }

    /**
     * 创建红色飞机
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorRed (combinate: Prefab, info:string[], idn:number) {
        let combination: Node = null!;
        let isAttack = true;
        let attribute = this._setAttribute(info, idn);
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }

        combination = PoolManager.instance.getNode(combinate, this.node);
        let com = combination.getComponent(enemyRed);
        com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
        com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
        com.showManager(this, isAttack, 0, attribute["speed"]);
        combination.setPosition(12, attribute["pos"][1], -50);
        combination.eulerAngles = new Vec3(0, 180, -30);
    }

    /**
     * 创建单个黄色飞机入场，发射红色圈形子弹，后向上退出
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorReStraight (combinate: Prefab, info:string[], idn:number) {
        let combination: Node = null!;
        let isAttack = true;
        let attribute = this._setAttribute(info, idn);
        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }

        combination = PoolManager.instance.getNode(combinate, this.node);
        combination.setScale(Constant.SCALE.SCALE1);
        let com = combination.getComponent(enemyAll);
        com.crashed = combination.children[2];
        com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
        com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
        com.showAllManager(this, isAttack, 0, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION7);
        combination.setPosition(attribute["pos"][0], attribute["pos"][1], -55);
        this._enemy.push(combination);
    }

    /**
     * 斜线
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorSlash (combinate: Prefab, info:string[], idn:number) {
        let combination: Node[] = new Array<Node>(4);
        let attribute = this._setAttribute(info, idn);
        let degree: number = 50;     // 飞机倾斜的角度，这里先默认为正的50度，即为碟机从左边飞到右边去
        let posx: number = 1;         // 飞机是从左边进还是从右边进入，当表格数据的位置坐标值x为正时，此值为1，当坐标数据为负时，此值为-1
        // 位置和飞行方向是相反的
        if (attribute["pos"][0] <= 0) {
            degree = 50;
            posx = 1;
        }
        else if (attribute["pos"][0] > 0) {
            degree = -50;
            posx = -1;
        }
        let isAttack = true;
        let num3: number = ToolManager.instance.getRandomNum(0, 5);     // 随机一个敌机掉落道具，而不是全部都掉

        if (attribute["isAttack"] == 1) { isAttack = true }
        else { isAttack = false }
        for (let ind = 0; ind < combination.length; ind++) {
            combination[ind] = PoolManager.instance.getNode(combinate, this.node);
            this._setGreen(combination[ind]);
            let com = combination[ind].getComponent(enemyAll);
            combination[ind].setPosition(-posx * (30 + 11 * ind), 0, -(10 + 9 * ind) + attribute["pos"][2]);
            combination[ind].eulerAngles = new Vec3(0, degree, 0);
            switch (ind) {
                case num3:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, degree, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION3);
                    break;
                default:
                    com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], 0);
                    com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
                    com.showAllManager(this, isAttack, degree, attribute["speed"], Constant.ENEMY_ALL_TYPE.COMBINATION3);
                    break;
            }
            this._enemy.push(combination[ind]);
        }
    }

    /**
     * 旋转炮台
     * @param combinate 组合预制体
     * @param info 表信息
     * @param idn 哪一个数据
     */
    public creatorTurret (combinate: Prefab, info: string[], idn: number) {
        let combination: Node = null!;
        let attribute = this._setAttribute(info, idn);
        let isAttack = true;
        if (Number(info[5][idn]) == 1) { isAttack = true }
        else { isAttack = false }
        combination = PoolManager.instance.getNode(combinate, this.node);
        let com = combination.getComponent(battery1);
        com.showManager(this, isAttack, attribute["speed"]);
        com.showMangerOther(attribute["hp"], attribute["score"], attribute["stars"], attribute["props"]);
        com.showAttackInfo(attribute["interval"], attribute["barrageID"]);
        combination.setPosition(attribute["pos"][0], -1.5, -50);
    }

    /**
     * 创建boss
     */
    public creatorBoss () {
        let enemyBoss: Node = null!;
        enemyBoss = PoolManager.instance.getNode(this._enemyBoss, this.node);
        enemyBoss.setScale(Constant.SCALE.SCALE4);
        enemyBoss.setPosition(Constant.GAME_POS.POS_4);
        enemyBoss.getComponent(BossPlaneMain).showManager(this, true, this.player);
    }

    /**
     * 敌机死亡后将敌机回收到池子中
     * @param enemy 敌机节点
     */
    public onEnemyKilled (enemy: Node) {
        enemy.eulerAngles = new Vec3(0, 0, 0);    // 将敌机位置恢复
        PoolManager.instance.putNode(enemy);
    }

    /**
     * 移除数组中的敌机
     * @param emy 敌机节点
     */
    public removeEnemy (emy: Node) {
        let index = this._enemy.indexOf(emy);
        if (index > -1) {
            this._enemy.splice(index, 1);
        }
    }

    /**
     * 移除数组中的道具
     * @param prop 道具节点
     */
    public removeProp (prop: Node) {
        let index = this._prop.indexOf(prop);
        if (index > -1) {
            this._prop.splice(index, 1);
        }
    }

    /**
     *  移除所有敌机
     */
    public removeAllEnemy () {
        let children: Node[] = this.node.children;
        for (let i: number = children.length - 1; i >= 0; i--) {
            if (children[i].name == 'enemy01' || children[i].name == 'enemy02' || children[i].name == 'enemyGreen' || children[i].name == 'enemyYellow') {
                PoolManager.instance.clearPool(children[i].name);
            }
            else if (children[i].name == 'enemyRed') {
                let children2: Node[] = children[i].children;
                for (let index = children2.length - 1; index >= 0; index--) {
                    if (children2[index].getComponent(enemyRed)) {
                        PoolManager.instance.clearPool(children[i].name);
                    }
                }
            }
            else if (children[i].name == 'battery1') {      // 炮台组，分开处理
                if (children[i].getComponent(battery1)) {
                    PoolManager.instance.clearPool(children[i].name);
                }
            }
            children[i].destroy();
        }
        this._enemy.splice(0, this._enemy.length);
    }

    /**
     * 移除所有道具
     */
    public removeAllItem () {
        let children: Node[] = this.node.children;
        for (let i: number = children.length - 1; i >= 0; i--) {
            if (children[i].name == "bullet" || children[i].name == "heart" || children[i].name == "stars") {
                children[i].destroy();
            }
        }
        this._prop.splice(0, this._prop.length);
    }

    /**
     * 移除boss飞机
     */
    public removeBossPlane () {
        let children: Node[] = this.node.children;
        for (let i: number = children.length - 1; i >= 0; i--) {
            let scriptEnemy: Component = children[i].getComponent(BossPlaneMain);
            if (scriptEnemy) {
                children[i].destroy();
            }
        }
    }

    /**
     * 记录总分数部分，
     * @param score 分数
     */
    public static enemyDestroyScore (score:number) {
        GameManager.score = GameManager.score + score;
    }

    /**
     * 记录等级分数。
     * @param isBool 判断是否应该加分或清零等级分数
     * @param randScore 等级分数的值
     */
    public enemyRandScore (isBool: boolean, randScore?: number) {
        if (isBool)     // 判断时候加分，true时候，执行等级积分相加
        { GameManager.randScore = GameManager.randScore + randScore }
        else { GameManager.randScore = 0 }
    }

    /**
     * 开启一个计时器,随时间改变游戏难度
     */
    public glodeDifficulty () {
        EnemyManager.combinationInterval++;
        return;
    }

}

