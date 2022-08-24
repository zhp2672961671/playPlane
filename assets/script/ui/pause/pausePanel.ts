import { UIManager } from './../../framework/uiManager';
import { _decorator, Component, Node } from 'cc';
const { ccclass } = _decorator;

@ccclass('pausePanel')
export class pausePanel extends Component {
    public player: Node = null!;

    /**
     * 初始化
     * @param player 玩家节点
     */
    public show (player:Node) {
        this.player = player;
    }

    /**
     * 打开设置界面
     */
    public openSet () {
        UIManager.instance.showDialog("set/setPanel", [this.player]);
    }


}

