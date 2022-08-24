import { UIManager } from './../../framework/uiManager';


import { _decorator, Component, Node, setDisplayStats, Label } from 'cc';
import { GameManager } from '../../fight/gameManager';
import { selfPlane } from '../../fight/plane/selfPlane';
const { ccclass, property } = _decorator;

@ccclass('debugPanel')
export class debugPanel extends Component {
    @property(Label)
    public bulletInfo: Label = null!;
    public player: Node = null!;
    private _info: number = 0;
    private _bulletRand: number = 1;

    public show (player:Node) {
        this.player = player;
        this._info = 0;
    }

    /**
     * 打开调试信息
     */
    public debugInfo () {
        this._info++;
        setDisplayStats((this._info % 2 == 1));     // 关闭左下角的调试信息
    }

    /**
     * 回血回满血
     */
    public replyBlood () {
        this.player.getComponent(selfPlane).collisionFrequency = 0;
        this.player.getComponent(selfPlane).setBlood();
    }

    /**
     * 子弹等级部分
     */
    public bulletRandR () {
        if (this._bulletRand < 6) { this._bulletRand++ }
        else { this._bulletRand = 1 }
        this.bulletInfo.string = this._bulletRand.toString();
    }

    /**
     * 设置子弹等级
     */
    public bulletRandL () {
        if (this._bulletRand > 1) { this._bulletRand-- }
        else { this._bulletRand = 6 }
        this.bulletInfo.string = this._bulletRand.toString();
    }

    /**
     * 确认
     */
    public btnConfirm () {
        GameManager.levelBulletInterval = this._bulletRand;
        UIManager.instance.hideDialog("debug/debugPanel");
    }


}

