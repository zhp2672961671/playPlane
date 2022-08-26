import { AudioManager } from './../../framework/audioManager';
import { _decorator, Component, Node  } from 'cc';
import { GameManager } from '../../fight/gameManager';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
import { UIManager } from '../../framework/uiManager';

const { ccclass, property } = _decorator;

@ccclass('setPanel')
export class setPanel extends Component {
    @property(Node)
    public vibrtionUp: Node = null!;
    @property(Node)
    public vibrtionDown: Node = null!;

    @property(Node)
    public musicUp: Node = null!;
    @property(Node)
    public musicDown: Node = null!;

    public player: Node = null!;

    /**
     * 初始化
     * @param player  玩家节点
     */
    public show (player: Node) {
        this.player = player;
    }

    // 音乐打开
    public openMusic () {
        this.musicUp.active = true;
        this.musicDown.active = false;
        GameManager.isMusic = true;
    }

    // 音乐关闭
    public closeMusic () {
        AudioManager.instance.stopAll();
        this.musicUp.active = false;
        this.musicDown.active = true;
        GameManager.isMusic = false;
    }

    // 震动从关闭到打开
    public openVibrtion () {
        this.vibrtionUp.active = true;
        this.vibrtionDown.active = false;
        GameManager.isVibrate = true;
    }

    // 震动从打开到关闭
    public closeVibrtion () {
        this.vibrtionUp.active = false;
        this.vibrtionDown.active = true;
        GameManager.isVibrate = false;
    }

    /**
     * 关闭设置界面
     */
    public closeSet () {
        UIManager.instance.hideDialog("set/setPanel");
    }

    /**
     * deBug界面的打开
     */
    public openDebug () {
        this.closeSet();
        UIManager.instance.showDialog("debug/debugPanel", [this.player]);

    }

    /**
     * 返回主界面
     */
    public reMain () {
        UIManager.instance.showDialog("choose/choosePanel", [this.player]);
        UIManager.instance.hideDialog("pause/pausePanel");
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_REMAIN);
        this.closeSet();

    }



}

