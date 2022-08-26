import { AudioManager } from './../../../framework/audioManager';
import { colliderAll } from './colliderAll';
import { GameManager } from './../../gameManager';
import { EnemyManager } from './../enemyManager';

import { _decorator, Component, Node, Vec3, director, ParticleSystem, Collider } from 'cc';
import { Constant } from '../../../framework/constant';
import { ClientEvent } from '../../../framework/clientEvent';
import { EffectManager } from '../../../framework/effectManager';
import { ToolManager } from '../../../ui/common/toolManager';

const { ccclass, property } = _decorator;


@ccclass('BossPlaneMain')
export class BossPlaneMain extends Component {
    @property(Node)
    public Collider1: Node = null!;

    @property(Node)
    public Collider2: Node = null!;
    @property(Node)
    public Collider3: Node = null!;

    @property(Node)
    public Collider4: Node = null!;
    @property(Node)
    public Collider5: Node = null!;
    @property
    public gapMax: number = 30;
    @property
    public gapMix: number = -30;
    @property
    public grapeBulletGap: number = 10;       // 散射子弹的空隙(角度)
    @property
    public grapeInverse: number = 2;         // 散射子弹发射频率


    @property(Node)
    public Collider6: Node = null!;
    @property(Node)
    public bossExplode: Node = null!;
    @property(Node)
    public collider6Bullet: Node = null!;

    @property(Node)
    public otherColl: Node = null!;

    @property(Node)
    public destroyAnimate: Node = null!;

    // 机体部件
    @property([Node])
    public planeNewPart: Node[] = [];       // 飞机新的部件
    @property([Node])
    public planeOldPart: Node[] = [];       // 飞机被损毁的部件

    public colliderBulletTime: number = Constant.GAME_VALUE.BOSS_COLLIDER_BULLET_TIME;        // 两侧机翼发射子弹
    public collider3BulletTime: number = Constant.GAME_VALUE.BOSS_COLLIDER3_BULLET_TIME;        // 导弹发射的间隔 120帧、
    public attackGrapeTime: number = Constant.GAME_VALUE.BOSS_ATTACK_GRAPE_TIME;         // 攻击开始（指从何时开始攻击）激光散射时间，碰撞体4，5

    public playerNode: Node = null!;

    public barrage12: number = 1002;
    public barrage45: number = 1005;  // 弹幕id
    public barrage3: number = 1006;
    public barrage6: number = 1007;
    public isDie: boolean = false;

    public ready: boolean = false;
    // 用于判断boss处于什么阶段
    public state1: boolean = true;
    public state2: boolean = false;
    public state3: boolean = false;

    // 用于boss阶段递进时候的判断依据
    public stateToTwo: boolean = false;
    public stateToTree: boolean = false;

    public moveSpeed: number = 0.1;

    private _boss1: EnemyManager;
    private _collider1BulletTime: number = 0;   // 碰撞体1的计数
    private _collider2BulletTime: number = 0;   // 碰撞体2的计数
    private _collider3BulletTime: number = 0;   // 碰撞体3的计数

    private _collider4BulletTime: number = 0;   // 碰撞体4的计数
    private _grape4:number = 0;      // 霰弹发射计数
    private _grape4Degree: number = this.gapMax;   // 霰弹4发射范围

    private _collider5BulletTime: number = 0;   // 碰撞体5的计数
    private _grape5: number = 0;    // 霰弹发射计数
    private _grape5Degree: number = this.gapMax;   // 霰弹5发射范围

    private _collider6BulletTime: number = 0;    // 碰撞体6的计数

    update (deltaTime: number) {
        // 从屏幕上方渐渐往下飞行，
        let pos: Vec3 = this.node.position;
        if (pos.z < -21 && !this.ready) {
            if (this.node.eulerAngles.z < 360) { this.node.eulerAngles = new Vec3(0, 0, this.node.eulerAngles.z + 2) }  // boss的入场方式
            this.node.translate(new Vec3(0, 0, 0.2));  // 以0.2的速度移动
            if (pos.z >= -21 && pos.z <= -20) { this.ready = true }
        }
        if (this.ready) {
            this._bossMove();
            if (this._boss1) {
                if (this.state1 && this.Collider1.getComponent(colliderAll).colliderDie && this.Collider2.getComponent(colliderAll).colliderDie && this.Collider3.getComponent(colliderAll).colliderDie) {
                    this.state1 = false;
                    this.state2 = true;
                }
                else if (this.state2 && this.Collider4.getComponent(colliderAll).colliderDie && this.Collider5.getComponent(colliderAll).colliderDie && this.Collider1.getComponent(colliderAll).colliderDie) {
                    this.state2 = false;
                    this.state3 = true;

                }

                // 第一阶段boss
                if (this.state1) { this._bossStage1() }
                // 第二阶段boss
                if (this.state2) { this._bossStage2() }
                // 第三阶段
                if (this.state3) { this._bossStage3() }

            }

            // 如果全部部件被摧毁，则判定为整机被摧毁,(后续再加上其他部件)
            if (!this.isDie && this.Collider1.getComponent(colliderAll).colliderDie && this.Collider2.getComponent(colliderAll).colliderDie && this.Collider3.getComponent(colliderAll).colliderDie) {
                if (this.Collider4.getComponent(colliderAll).colliderDie && this.Collider5.getComponent(colliderAll).colliderDie) {     // 碰撞体4和5的判断
                    if (this.Collider6.getComponent(colliderAll).colliderDie) {
                        this.isDie = true;
                        // 结束界面
                        if (this._boss1) {
                            EffectManager.instance.playAnimation(this.destroyAnimate, 1, Constant.Game_Animation.BOSS_FALL_ANIMATION, false, false, null, () => {
                                ClientEvent.dispatchEvent(Constant.GAMEOVER_TYPE.GAME_WIN);
                            });
                            this.bossExplode.active = true;
                        }
                    }

                }
            }

        }
        const num = 3; // 间隔num帧执行一次方法
        if (director.getTotalFrames() % num === 0) { this._bossPart() }

    }


    /**
     * 部件损坏判断
     */
    private _bossPart () {
        if (this.Collider1.getComponent(colliderAll).colliderDie) {     // 部件1左侧红子弹
            this.planeOldPart[0].active = true;
            this.planeNewPart[0].active = false;
            this.planeOldPart[5].active = true;
            this.planeNewPart[5].active = false;
        }
        if (this.Collider2.getComponent(colliderAll).colliderDie) {     // 部件2右侧红子弹
            this.planeOldPart[1].active = true;
            this.planeNewPart[1].active = false;
            this.planeOldPart[6].active = true;
            this.planeNewPart[6].active = false;
        }
        if (this.Collider4.getComponent(colliderAll).colliderDie) {     // 部件3左侧散射子弹
            this.planeOldPart[2].active = true;
            this.planeNewPart[2].active = false;
        }
        if (this.Collider5.getComponent(colliderAll).colliderDie) {     // 部件4右侧散射子弹
            this.planeOldPart[3].active = true;
            this.planeNewPart[3].active = false;
        }
        if (this.Collider3.getComponent(colliderAll).colliderDie) {     // 部件5中央口导弹子弹
            this.planeOldPart[4].active = true;
            this.planeNewPart[4].active = false;
        }
        if (this.Collider1.getComponent(colliderAll).colliderDie && this.Collider4.getComponent(colliderAll).colliderDie) { // 左侧机翼部件

        }
        if (this.Collider2.getComponent(colliderAll).colliderDie && this.Collider5.getComponent(colliderAll).colliderDie) { // 右侧机翼部件

        }

    }

    /**
     * boss第一阶段
     */
    private _bossStage1 () {
        let bossCollide1_pos:Vec3 = this.Collider1.getWorldPosition();
        let bossCollide2_pos:Vec3 = this.Collider2.getWorldPosition();
        let bossCollide3_pos:Vec3 = this.Collider3.getWorldPosition();

        let degree1: number  = ToolManager.instance.getAngle(this.Collider1.getWorldPosition(), this.playerNode.getWorldPosition());
        let degree2: number  = ToolManager.instance.getAngle(this.Collider2.getWorldPosition(), this.playerNode.getWorldPosition());
        this.planeNewPart[0].eulerAngles = new Vec3(0, degree1, 0);
        this.planeNewPart[1].eulerAngles = new Vec3(0, degree2, 0);

        // collider1部分，collider2部分
        if (!this.Collider1.getComponent(colliderAll).colliderDie) {
            this._collider1BulletTime++;
            if (this._collider1BulletTime >= this.colliderBulletTime / GameManager.gameSpeed) {
                this._boss1.transBulletManager(this.barrage12, bossCollide1_pos, degree1);
                this._collider1BulletTime = 0;
            }
        }

        if (!this.Collider2.getComponent(colliderAll).colliderDie) {
            this._collider2BulletTime++;
            if (this._collider2BulletTime >= this.colliderBulletTime / GameManager.gameSpeed) {
                this._boss1.transBulletManager(this.barrage12, bossCollide2_pos, degree2);
                this._collider2BulletTime = 0;
            }
        }

        // 在碰撞体存活的状态下发射导弹,collider3部分
        if (!this.Collider3.getComponent(colliderAll).colliderDie) {
            this._collider3BulletTime++;
            if (this._collider3BulletTime >= this.collider3BulletTime / GameManager.gameSpeed) {
                this._boss1.transBulletManager(this.barrage3, bossCollide3_pos);
                this._collider3BulletTime = 0;
            }
        }

    }

    /**
     * 第二阶段
     */
    private _bossStage2 () {
        if (!this.stateToTwo) {
            this.Collider4.active = true;
            this.Collider5.active = true;
            this.Collider4.getComponent(colliderAll).initAll(200, Constant.BOSS_COLLIDER.COLLIDER4);     // 碰撞体初始化
            this.Collider5.getComponent(colliderAll).initAll(200, Constant.BOSS_COLLIDER.COLLIDER5);     // 碰撞体初始化

            this.stateToTwo = true;
        }

        // 在碰撞体4存活的状态下才发射激光霰弹，collider4部分
        if (!this.Collider4.getComponent(colliderAll).colliderDie) {
            this._collider4BulletTime++;
            if (this._collider4BulletTime >= this.attackGrapeTime / GameManager.gameSpeed) {
                this._grape4++;
                if (this._grape4 >= this.grapeInverse / GameManager.gameSpeed) {
                    let self_pos: Vec3 = this.Collider4.getWorldPosition();

                    // 发射子弹
                    this._boss1.transBulletManager(this.barrage45, self_pos, this._grape4Degree);

                    if (this._grape4Degree > this.gapMix) {
                        this._grape4Degree -= this.grapeBulletGap;
                    }
                    else {
                        this._collider4BulletTime = 0;
                        this._grape4Degree = this.gapMax;
                    }
                    this._grape4 = 0;
                }
            }
        }

        // 在碰撞体5存活的状态下才发射霰弹，collider5部分
        if (!this.Collider5.getComponent(colliderAll).colliderDie) {
            this._collider5BulletTime++;
            if (this._collider5BulletTime >= ((this.attackGrapeTime / GameManager.gameSpeed) * 2) - 5) {
                this._grape5++;
                if (this._grape5 >= this.grapeInverse / GameManager.gameSpeed) {
                    let self_pos: Vec3 = this.Collider5.getWorldPosition();
                    // 发射子弹
                    this._boss1.transBulletManager(this.barrage45, self_pos, this._grape5Degree);
                    if (this._grape5Degree > this.gapMix) {
                        this._grape5Degree -= this.grapeBulletGap;
                    }
                    else {
                        this._collider4BulletTime = 0;
                        this._collider5BulletTime = 0;
                        this._grape4Degree = this.gapMax;
                        this._grape5Degree = this.gapMax;
                    }
                    this._grape4 = 0;
                    this._grape5 = 0;
                }

            }
        }
    }

    /**
     * 第三阶段
     */
    private _bossStage3 () {
        if (!this.stateToTree) {
            this.Collider6.active = true;
            this.Collider6.getComponent(colliderAll).initAll(400, Constant.BOSS_COLLIDER.COLLIDER6);     // 碰撞体初始化
            const group = (1 << 1);
            const mask = (1 << 0) + (1 << 2) + (1 << 3);    // 13
            this.collider6Bullet.getComponent(Collider).setGroup(group);
            this.collider6Bullet.getComponent(Collider).setMask(mask);
            this.stateToTree = true;
        }

        // 在碰撞体6存在的状态下才发射激光，collider6部分
        if (!this.Collider6.getComponent(colliderAll).colliderDie) {
            this._collider6BulletTime++;
            if (this._collider6BulletTime >= 150 && this._collider6BulletTime < 260) {  // 发射子弹;
                this.collider6Bullet.active = true;
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.BULLET3);
            }
            else if (this._collider6BulletTime >= 260) {
            // 关闭激光子弹
                this.collider6Bullet.active = false;
                this._collider6BulletTime = 0;
                let bullet: Node = this.collider6Bullet.children[0];
                for (let idn = 0; idn < bullet.children.length; idn++) {
                    bullet.children[idn].getComponent(ParticleSystem).stop();
                }

            }

        }
    }

    /**
     * boss的移动效果
     */
    private _bossMove () {
        this.node.translate(new Vec3(this.moveSpeed, 0, this.moveSpeed / 5));
        this.node.eulerAngles = new Vec3(0, 0, this.node.eulerAngles.z + this.moveSpeed);
        if (this.node.position.x <= -25 || this.node.position.x >= 25) { this.moveSpeed = -this.moveSpeed }
    }

    /**
     * 初始化boss，并初始化各个数据
     * @param enemyManagerParent
     * @param isBullet
     * @param target
     */
    public showManager (enemyManagerParent: EnemyManager, isBullet: boolean, target: Node) {
        this._boss1 = enemyManagerParent;
        this._grape4Degree = this.gapMax;
        this._grape5Degree = this.gapMax;
        this.Collider1.getComponent(colliderAll).initAll(100, Constant.BOSS_COLLIDER.COLLIDER1);     // 碰撞体初始化
        this.Collider2.getComponent(colliderAll).initAll(100, Constant.BOSS_COLLIDER.COLLIDER2);     // 碰撞体初始化
        this.Collider3.getComponent(colliderAll).initAll(200, Constant.BOSS_COLLIDER.COLLIDER3);     // 碰撞体初始化

        this.Collider4.active = false;
        this.Collider5.active = false;
        this.Collider6.active = false;
        this.playerNode = target;

        // 给多余的碰撞体设置组，这些碰撞体并不参与boss伤害计算
        for (let idn = 0; idn < this.otherColl.children.length; idn++) {
            const group = (1 << 2);
            const mask = (1 << 0) + (1 << 1) + (1 << 3);
            this.otherColl.children[idn].getComponent(Collider).setGroup(group);
            this.otherColl.children[idn].getComponent(Collider).setMask(mask);
        }

        for (let idn = 0; idn < this.planeNewPart.length; idn++) {
            this.planeNewPart[idn].active = true;
            this.planeOldPart[idn].active = false;
        }

        this.isDie = false;
        this.bossExplode.active = false;
        EffectManager.instance.resetEffectState(this.destroyAnimate, Constant.Game_Animation.BOSS_FALL_ANIMATION);
        this.ready = false;
        this.state1 = true;
        this.state2 = false;
        this.state3 = false;
        this.stateToTwo = false;
        this.stateToTree = false;

    }
}

