import { Constant } from './../../../framework/constant';

import { _decorator, Component, Node, Collider } from 'cc';
import { colliderBase } from './colliderBase';
const { ccclass, property } = _decorator;

@ccclass('colliderAll')
export class colliderAll extends colliderBase {

    public initAll (hp: number, type: string) {
        this.type = type;
        switch (this.type) {
            case Constant.BOSS_COLLIDER.COLLIDER1:
            case Constant.BOSS_COLLIDER.COLLIDER2:
            case Constant.BOSS_COLLIDER.COLLIDER3:
            case Constant.BOSS_COLLIDER.COLLIDER4:
            case Constant.BOSS_COLLIDER.COLLIDER5:
            case Constant.BOSS_COLLIDER.COLLIDER6:
                this._colInit(hp);
                break;
        }

    }

    /**
     * 碰撞体初始化
     * @param hp 生命值
     */
    private _colInit (hp: number) {
        super.init();
        let collider: Collider = this.getComponent(Collider);
        collider.on('onTriggerEnter', this._onTrigger, this);
        collider.on('onTriggerStay', this._onTrigger, this);
        this.colliderDie = false;
        this.effectMain.active = false;
        this.lifeValue = hp;
        this.node.active = true;    // 开启此碰撞体
        this._collisionFrequency = 0;
    }


}

