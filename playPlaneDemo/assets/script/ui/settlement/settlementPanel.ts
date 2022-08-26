
import { Constant } from './../../framework/constant';
import { ClientEvent } from './../../framework/clientEvent';
import { _decorator, Component, Node, Sprite, SpriteFrame, Label, ProgressBar } from 'cc';
import { UIManager } from '../../framework/uiManager';
import { GameManager } from '../../fight/gameManager';
const { ccclass, property } = _decorator;


@ccclass('settlementPanel')
export class settlementPanel extends Component {
    @property(Label)
    public score: Label = null!;    // 结束的分数界面
    @property(Label)
    public stars: Label = null!;    // 结束的星星数量
    @property(ProgressBar)
    public scoreBar: ProgressBar = null!;   // 游戏结束时候分数进度条

    @property(Sprite)
    public settlementBg: Sprite = null!;    // 结算胜利或者失败的背景
    @property(Sprite)
    public settlementFont: Sprite = null!;  // 结算胜利或者失败的文字图片

    @property(SpriteFrame)
    public imgWin: SpriteFrame = null!;
    @property(SpriteFrame)
    public imgFail: SpriteFrame = null!;
    @property(SpriteFrame)
    public txtWin: SpriteFrame = null!;
    @property(SpriteFrame)
    public txtFail: SpriteFrame = null!;

    public winOrFail: boolean = false;
    public player: Node = null!;


    public show (player: Node, wOrF: boolean) {

        this.player = player;
        this.winOrFail = wOrF;
        if (this.winOrFail) {
            this.gameWin();
        }
        else { this.gameFail() }

    }

    // 游戏失败
    public gameFail () {
        // 更换显示失败

        this.settlementBg.spriteFrame = this.imgFail;
        this.settlementFont.spriteFrame = this.txtFail;

        this._setDate();

    }

    // 游戏胜利
    public gameWin () {
        // 更换显示胜利
        this.settlementBg.spriteFrame = this.imgWin;
        this.settlementFont.spriteFrame = this.txtWin;

        this._setDate();

    }

    // 设置分数和星星数量
    private _setDate () {
        this.score.string = GameManager.score.toString();
        this.stars.string = GameManager.stars.toString();
        let randScore: number = GameManager.randScore;
        if (randScore < Constant.GAME_SCORE_RAND.SCORE_NICE && randScore >= 0) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_NICE;       // 游戏结束后的评价分数进度条
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_NICE && randScore < Constant.GAME_SCORE_RAND.SCORE_GOOD) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_GOOD;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_GOOD && randScore < Constant.GAME_SCORE_RAND.SCORE_GREAT) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_GREAT;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_GREAT && randScore < Constant.GAME_SCORE_RAND.SCORE_EXCELLENT) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_EXCELLENT;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_EXCELLENT && randScore < Constant.GAME_SCORE_RAND.SCORE_WONDERFUL) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_WONDERFUL;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_WONDERFUL) {
            this.scoreBar.progress = 1;

        }
    }


    // 游戏重新开始
    public gameRestart () {
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_RESTART);
        UIManager.instance.hideDialog("settlement/settlementPanel");
        UIManager.instance.hideDialog("pause/pausePanels");
    }


    // 游戏回到主界面
    public gameMain () {
        UIManager.instance.showDialog("choose/choosePanel", [this.player]);
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_REMAIN);
        UIManager.instance.hideDialog("settlement/settlementPanel");
        UIManager.instance.hideDialog("pause/pausePanels");
    }



}

