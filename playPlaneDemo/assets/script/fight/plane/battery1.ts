import { GameManager } from './../gameManager';
import { combinationBase } from './combinationBase';

import { _decorator, ParticleSystem, Vec3, ITriggerEvent, Collider } from 'cc';

import { EnemyManager } from './enemyManager';
import { Constant } from '../../framework/constant';


const { ccclass } = _decorator;

@ccclass('battery1')
export class battery1 extends combinationBase {
    public eurSpeed: number = 0.05;  // 视觉上的旋转速度，如果调整了下落速度的话，这个速度也要跟着环

    onDisable () {
        let collider: Collider = this.getComponent(Collider);
        collider.off('onTriggerEnter', this.onTrigger, this);
        collider.off('onTriggerStay', this.onTrigger, this);
        this.node.eulerAngles = new Vec3(0, 0, 0);
        super.onDisable();

    }

    public init () {
        this.node.getComponent(Collider).enabled = true;
        super.init();

    }

    update (dt: number) {
        let pos: Vec3 = this.node.position;
        this.node.setPosition(pos.x, pos.y, pos.z + dt * this.enemySpeed * GameManager.gameSpeed);
        this.node.eulerAngles = new Vec3(this.node.eulerAngles.x + this.eurSpeed * GameManager.gameSpeed, this.node.eulerAngles.y, this.node.eulerAngles.z);

        if (!this.isDie) {
            if (this.isBullet && this.enemyplane) {
                this.bulletTime++;
                if (this.bulletTime >= this.enemyBulletSpeed / GameManager.gameSpeed) {
                    let self_pos: Vec3 = this.node.getWorldPosition();
                    self_pos.y = 0;
                    this.enemyplane.transBulletManager(this.barrage, self_pos);
                    this.bulletTime = 0;
                }
            }
        }
        if (this.node.worldPosition.z >= 60) {
            if (this.enemyplane) { this.enemyplane.onEnemyKilled(this.node) }
        }
    }

    public onTrigger (event: ITriggerEvent) {
        // 敌机1的分组4
        if (event.otherCollider.getGroup() == Constant.ITEM_GROUP.SELF_BULLET) {
            this.attFlashing();

            this.emyNum++;
            if (this.emyNum >= this.enemyHp) {
                // 击落得分
                EnemyManager.enemyDestroyScore(this.score);
                this.enemyplane.enemyRandScore(true, this.score);
                this.isDie = true;
                this.dieEffect.active = true;

                event.selfCollider.off('onTriggerEnter');
                event.selfCollider.off('onTriggerStay');
                this.enemyplane.creatorStars(this.node.getPosition(), this.starsNumber);
                this.enemyplane.creatorProp(this.node.getWorldPosition(), this.props);
                event.selfCollider.enabled = false;

            }
        }
    }

    /**
     * 从enemyManager执行后带到这里的，带有角度信息的数据，后面则要和上面的函数重叠,有角度使用这一类调用
     * @param enemyManagerParent enemyManager
     * @param isBullet 是否发射子弹
     * @param enemySpeed 速度
     */
    public showManager (enemyManagerParent: EnemyManager, isBullet: boolean, enemySpeed?:number) {
        this.enemyplane = enemyManagerParent;
        this.isBullet = isBullet;
        if (enemySpeed) { this.enemySpeed = enemySpeed * 100 }
        this.init();
    }



}

