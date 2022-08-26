import { Main } from './../main';
import { AudioManager } from './../../framework/audioManager';
import { _decorator, Component, Node, Sprite, resources, SpriteFrame, Vec3, MeshRenderer, Material, Animation, Label, ParticleSystem, EventTouch } from 'cc';

import { EffectManager } from '../../framework/effectManager';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
import { UIManager } from '../../framework/uiManager';
import { GameManager } from '../../fight/gameManager';
const { ccclass, property } = _decorator;

@ccclass('choosePanel')
export class choosePanel extends Component {
    @property(Node)
    public select: Node = null!;
    @property(Node)
    public imgDiff1: Node = null!;
    @property(Node)
    public imgDiff2: Node = null!;
    @property(Node)
    public imgDiff3: Node = null!;
    @property(Node)
    public plane01: Node = null!;
    @property(Node)
    public plane02: Node = null!;
    @property(Node)
    public plane03: Node = null!;
    @property(Node)
    public btnStart: Node = null!;
    @property(Node)
    public logo2: Node = null!;     // logo动画
    @property(Node)
    public difficult: Node = null!;    // 难度选择动画
    @property(Node)
    public play2: Node = null!;     // 选择飞机动画
    @property(Node)
    public btnPre: Node = null;     // 向前选择按钮
    @property(Node)
    public btnBack: Node = null;    // 向后选择按钮
    @property(Node)
    public startEffect: Node = null!;     // 点击开始的按钮特效
    @property(Label)
    public txtName: Label = null!;      // 飞机的名字

    // 材质
    @property(Material)
    public planeA: Material = null!;
    @property(Material)
    public planeB: Material = null!;
    @property(Material)
    public planeC: Material = null!;

    private _player: Node = null!;
    private _playerPlaneMesh: MeshRenderer = null!;        // 更换主飞机的材质
    private _whichPlane: number = 3;      // 默认第三架飞机
    private _chooseSpeed: number = 1.5;       // 选择界面飞机的飞行速度
    private _isChoose: boolean = false;     // 选择界面飞机飞进场内的
    private _chooseDirection: boolean = true;
    private _lastNode: Node = null!;     // 选择飞机时候的上一架飞机
    private _thisNode: Node = null!;     // 选择飞机的时候，被选择的这一架飞机
    private _turn: boolean = false;      // 移动的开关


    onEnable () {
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_RESTART, this.gameRestart, this);    // 重新开始
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_REMAIN, this.gameMain, this);
    }

    onDisable () {
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_RESTART, this.gameRestart, this);    // 重新开始
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_REMAIN, this.gameMain, this);
    }

    /**
     * 初始化
     * @param player 玩家节点
     */
    public show (player: Node) {
        this._player = player;
        this._playerPlaneMesh = player.children[0].children[0].getComponent(MeshRenderer);
        this._init();
    }

    /**
     * 内部函数，执行初始化
     */
    private _init () {
        this._whichPlane = 3;
        this._turn = false;
        this._chooseSpeed = 1.5;
        this._isChoose = false;
        this.plane03.setWorldPosition(Constant.GAME_POS.POS_2);
        this.animationChoose();
    }

    /**
     * 动画的表现，非常重要
     */
    public animationChoose () {
        this.difficult.active = false;
        this.play2.active = false;
        this.logo2.active = true;
        EffectManager.instance.playAnimation(this.logo2, 1, "homeImgLogoInAni", false, false, null, () => {
            EffectManager.instance.playAnimation(this.logo2, 1, "homeImgLogoIdleAni", true, false, null, null);
            this.difficult.active = true;
            EffectManager.instance.playAnimation(this.difficult, 1, "homeBtnArrow02In", false, false, null, () => {
                EffectManager.instance.playAnimation(this.difficult, 1, "homeBtnArrow02Idle", true, false, null, null);
                this._isChoose = true;
                this.play2.active = true;
                EffectManager.instance.playAnimation(this.play2, 1, "homeBtnArrowInAni", false, false, null, () => {
                    EffectManager.instance.playAnimation(this.play2, 1, "homeBtnArrowIdleAni", true, false, null, null);
                    this.btnStart.active = true;
                });
            });
        });
    }

    update (deltaTime: number) {
        if (this._isChoose && this.plane03.position.z > 26) {
            this._chooseSpeed -= 0.026;
            this.plane03.setPosition(new Vec3(this.plane03.position.x, this.plane03.position.y, this.plane03.position.z - this._chooseSpeed));
        }
        // 选择飞机时候飞机的移动，只处理上一架飞机的情况
        if (this._turn && this._lastNode != null) {
            //  飞机所在的位置由choosDirection来控制,当为true时候，向右移动，为fales时候，向左移动
            if (this._chooseDirection) {  // 从左往右
                if (this._lastNode.worldPosition.x < 15) {
                    this._lastNode.setWorldPosition(this._lastNode.worldPosition.x + 1, this._lastNode.worldPosition.y, this._lastNode.worldPosition.z);
                    this._thisNode.setWorldPosition(this._thisNode.worldPosition.x + 1, this._thisNode.worldPosition.y, this._thisNode.worldPosition.z);
                    this._lastNode.eulerAngles = new Vec3(0, 0, -30);
                    this._thisNode.eulerAngles = new Vec3(0, 0, -30);
                }
                if (this._lastNode.worldPosition.x >= 15) {
                    this._lastNode.active = false;
                    if (this._lastNode.eulerAngles.z < 0) {
                        this._lastNode.eulerAngles = new Vec3(0, 0, this._lastNode.eulerAngles.z + 1.5);
                        this._thisNode.eulerAngles = new Vec3(0, 0, this._thisNode.eulerAngles.z + 1.5);
                    }
                    if (this._lastNode.eulerAngles.z >= 0) {
                        this._turn = false;
                        this._lastNode = null;
                    }
                }
            }
            else {    // 从右往左
                if (this._lastNode.worldPosition.x > -15) {
                    this._lastNode.setWorldPosition(this._lastNode.worldPosition.x - 1, this._lastNode.worldPosition.y, this._lastNode.worldPosition.z);
                    this._thisNode.setWorldPosition(this._thisNode.worldPosition.x - 1, this._thisNode.worldPosition.y, this._thisNode.worldPosition.z);
                    this._lastNode.eulerAngles = new Vec3(0, 0, 30);
                    this._thisNode.eulerAngles = new Vec3(0, 0, 30);
                }
                if (this._lastNode.worldPosition.x <= -15) {
                    this._lastNode.active = false;
                    if (this._lastNode.eulerAngles.z > 0) {
                        this._lastNode.eulerAngles = new Vec3(0, 0, this._lastNode.eulerAngles.z - 1.5);
                        this._thisNode.eulerAngles = new Vec3(0, 0, this._thisNode.eulerAngles.z - 1.5);
                    }
                    if (this._lastNode.eulerAngles.z <= 0) {
                        this._turn = false;
                        this._lastNode = null;
                    }
                }
            }
        }
    }


    /**
     * 玩家飞机向前选择飞机
     */
    public btnChoosePre () {
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.CLICK);
        this._whichPlane++;
        if (this._whichPlane > Constant.EVENT_TYPE.GAME_PLAYER_PLANE_NUMBER) { this._whichPlane = 1 }
        this._chooseDirection = true;
        this.showPlane(this._chooseDirection);
        EffectManager.instance.playAnimation(this.btnPre, 1, "homeBtnArrow01ClickEff", false, false, null, () => {
            EffectManager.instance.resetEffectState(this.btnPre, "homeBtnArrow01ClickEff");
        });
    }

    /**
     * 玩家飞机向后选择飞机
     */
    public btnChooseBack () {
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.CLICK);
        this._whichPlane--;
        if (this._whichPlane < 1) { this._whichPlane = Constant.EVENT_TYPE.GAME_PLAYER_PLANE_NUMBER }
        this._chooseDirection = false;
        this.showPlane(this._chooseDirection);
        EffectManager.instance.playAnimation(this.btnBack, 1, "homeBtnArrow01ClickEff", false, false, null, () => {
            EffectManager.instance.resetEffectState(this.btnBack, "homeBtnArrow01ClickEff");
        });
    }

    /**
     * 显示玩家选择的飞机
     * @param LorR 向左或者向右移动
     * @returns
     */
    public showPlane (LorR?: boolean) {
        if (this._whichPlane == 1) {
            this.plane01.active = true;
            this.plane02.active = false;
            this.plane03.active = false;
            this.showWorldPosition();
            if (LorR == null) { return }
            this._thisNode = this.plane01;
            this._showPosition(LorR, this.plane03, this.plane02);
            this.txtName.string = Constant.PLANE_NAME.PLANE_RED;
            this._playerPlaneMesh.setMaterial(this.planeA, 0);       // 更换飞机（用更换材质的方式更改)
            GameManager.isWhichBullet = Constant.FIGHT_BULLET_GROUP.BULLET_M;   // 更换子弹类型s
        }
        else if (this._whichPlane == 2) {
            this.plane01.active = false;
            this.plane02.active = true;
            this.plane03.active = false;
            this.showWorldPosition();
            if (LorR == null) { return }
            this._thisNode = this.plane02;
            this._showPosition(LorR, this.plane01, this.plane03);
            this.txtName.string = Constant.PLANE_NAME.PLANE_BLUE;
            this._playerPlaneMesh.setMaterial(this.planeB, 0);       // 更换飞机（用更换材质的方式更改)
            GameManager.isWhichBullet = Constant.FIGHT_BULLET_GROUP.BULLET_S;   // 更换子弹类型
        }
        else if (this._whichPlane == 3) {
            this.plane01.active = false;
            this.plane02.active = false;
            this.plane03.active = true;
            this.showWorldPosition();
            if (LorR == null) { return }
            this._thisNode = this.plane03;
            this._showPosition(LorR, this.plane02, this.plane01);
            this.txtName.string = Constant.PLANE_NAME.PLANE_YELLOW;
            this._playerPlaneMesh.setMaterial(this.planeC, 0);
            GameManager.isWhichBullet = Constant.FIGHT_BULLET_GROUP.BULLET_H;        // 更换子弹类型
        }
    }

    /**
     * 切换飞机时候的变换
     * @param LorR 往右还是往左
     * @param NodeR 往右时候的上一架飞机
     * @param NodeL 往左时候的上一架飞机
     */
    private _showPosition (LorR: boolean, NodeR: Node, NodeL: Node) {
        if (LorR) {
            this._lastNode = NodeR;
            this._thisNode.setWorldPosition(-15, 0, this._thisNode.worldPosition.z);
        }
        else {
            this._lastNode = NodeL;
            this._thisNode.setWorldPosition(15, 0, this._thisNode.worldPosition.z);
        }
        this._lastNode.active = true;
        this._turn = true;
    }

    /**
     * 设置玩家飞机到世界坐标下的某店坐标，（适用于不同分辨率的情况）
     */
    public showWorldPosition () {
        this.plane01.setWorldPosition(Constant.GAME_POS.POS_1);     // 用于使用不同分辨率的情况，在选择飞机的时候，飞机的世界坐标点是此，
        this.plane02.setWorldPosition(Constant.GAME_POS.POS_1);
        this.plane03.setWorldPosition(Constant.GAME_POS.POS_1);
    }

    /**
     * @param diff 按钮点击后传入的点击事件
     * @param data 点击后传入的参数
     */
    public showDifficult (diff, data) {
        switch (data) {
            case "difficult1":
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.CLICK);
                this.select.setPosition(this.imgDiff1.position.x, this.select.position.y, this.select.position.z);
                GameManager.gameDifficult = Constant.GAME_DIFFICULT.GAME_DIFFICULT_1;       // 更改难度为1
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.GAME_DIFFICULT, "difficult1");
                break;
            case "difficult2":
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.CLICK);
                this.select.setPosition(this.imgDiff2.position.x, this.select.position.y, this.select.position.z);
                GameManager.gameDifficult = Constant.GAME_DIFFICULT.GAME_DIFFICULT_2;       // 更改难度为2
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.GAME_DIFFICULT, "difficult2");
                break;
            case "difficult3":
                AudioManager.instance.playSound(Constant.AUDIO_SOUND.CLICK);
                this.select.setPosition(this.imgDiff3.position.x, this.select.position.y, this.select.position.z);
                GameManager.gameDifficult = Constant.GAME_DIFFICULT.GAME_DIFFICULT_3;        // 更改难度为3
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.GAME_DIFFICULT, "difficult3");
                break;
        }
    }

    /**
     * 游戏开始
     */
    public gameStart () {
        AudioManager.instance.playSound(Constant.AUDIO_SOUND.CLICK_MAIN);
        this.startEffect.active = true;
        this._player.active = true;
        this.plane01.active = false;
        this.plane02.active = false;
        this.plane03.active = false;
        let logoAnimate =  this.logo2.getComponent(Animation);
        logoAnimate.play(logoAnimate.clips[2].name);
        let playAnimate = this.play2.getComponent(Animation);
        playAnimate.play(playAnimate.clips[2].name);
        this.scheduleOnce(() => {
            this.startEffect.active = false;
            this.startEffect.children[0].getComponent(ParticleSystem).stop();
            this.startEffect.children[1].getComponent(ParticleSystem).stop();
            this.btnStart.active = false;
            UIManager.instance.hideDialog("choose/choosePanel");
            UIManager.instance.showDialog("gameStart/gameStartPanel", [this._player]);
        }, 0.8);

    }

    /**
     * 重新开始
     */
    public gameRestart () {
        this.btnStart.active = false;
    }

    /**
     * 返回主界面
     */
    public gameMain () {
        this._playerPlaneMesh.setMaterial(this.planeC, 0);
        this.showPlane();
        this._init();
    }

}

