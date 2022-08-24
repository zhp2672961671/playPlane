import { _decorator, Component, Node, Label, ProgressBar, director } from 'cc';
import { GameManager } from '../../fight/gameManager';
import { Constant } from '../../framework/constant';

const { ccclass, property } = _decorator;

@ccclass('integralPanel')
export class integralPanel extends Component {
    @property(Label)
    public score: Label = null!;     // 分数
    @property(ProgressBar)
    public scoreBar: ProgressBar = null!;   // 游戏进行中时分数进度条
    @property(Label)
    public txtEvaluation: Label = null!;    // 设置评价级别
    @property(ProgressBar)
    public randBar: ProgressBar = null;     // 子弹等级进度条


    public show () {

    }

    update (deltaTime: number) {
        const num = 3;       // 间隔num帧执行一次方法
        if (director.getTotalFrames() % num === 0) {        // director.getTotalFrames()获取启动以来游戏运行的总帧数
            this.score.string = GameManager.score.toString();   // 实时显示分数
            this.setScore();
            this.setRandBar();
        }

    }

    /**
     * 分数设置
     */
    public setScore () {
        let randScore: number = GameManager.randScore;
        if (randScore < Constant.GAME_SCORE_RAND.SCORE_NICE && randScore >= 0) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_NICE;       // 游戏中的评价分数进度条
            this.txtEvaluation.string = Constant.GAME_SCORE_RAND.TXT_NICE;              // 评价等级文字
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_NICE && randScore < Constant.GAME_SCORE_RAND.SCORE_GOOD) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_GOOD;
            this.txtEvaluation.string = Constant.GAME_SCORE_RAND.TXT_GOOD;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_GOOD && randScore < Constant.GAME_SCORE_RAND.SCORE_GREAT) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_GREAT;
            this.txtEvaluation.string = Constant.GAME_SCORE_RAND.TXT_GREAT;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_GREAT && randScore < Constant.GAME_SCORE_RAND.SCORE_EXCELLENT) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_EXCELLENT;
            this.txtEvaluation.string = Constant.GAME_SCORE_RAND.TXT_EXCELLENT;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_EXCELLENT && randScore < Constant.GAME_SCORE_RAND.SCORE_WONDERFUL) {
            this.scoreBar.progress = randScore / Constant.GAME_SCORE_RAND.SCORE_WONDERFUL;
            this.txtEvaluation.string = Constant.GAME_SCORE_RAND.TXT_WONDERFUL;
        }
        else if (randScore >= Constant.GAME_SCORE_RAND.SCORE_WONDERFUL) {
            this.scoreBar.progress = 1;
            this.txtEvaluation.string = Constant.GAME_SCORE_RAND.TXT_WONDERFUL;
        }

    }

    // 子弹等级进度条
    public setRandBar () {
        this.randBar.progress = GameManager.levelBulletInterval / 6;
    }

}

