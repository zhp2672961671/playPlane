
import { _decorator, Component, Node, Vec3, Vec2, v2 } from 'cc';
const { ccclass, property } = _decorator;



@ccclass('ToolManager')
export class ToolManager extends Component {
    static _instance: ToolManager;

    static get instance () {
        if (this._instance) {
            return this._instance;
        }
        this._instance = new ToolManager();
        return this._instance;
    }


    /**
    * 获取两点间的角度,利用两点在四个象限里的坐标来计算角度,(世界下的空间坐标)
    * @param p1 点1
    * @param p2 点2
    */
    public getAngle (p1: Vec3, p2: Vec3): number {
        let len_z = p2.z - p1.z;
        let len_x = p2.x - p1.x;

        let tan_yx = Math.abs(len_z) / Math.abs(len_x);
        let angle = 0;
        if (len_z > 0 && len_x < 0) {
            angle = Math.atan(tan_yx) * 180 / Math.PI - 90;
        } else if (len_z > 0 && len_x > 0) {
            angle = 90 - Math.atan(tan_yx) * 180 / Math.PI;
        } else if (len_z < 0 && len_x < 0) {
            angle = -Math.atan(tan_yx) * 180 / Math.PI - 90;
        } else if (len_z < 0 && len_x > 0) {
            angle = Math.atan(tan_yx) * 180 / Math.PI + 90;
        }
        return angle;
    }

    /**
    * 获取两点间的距离
    * @param p1 点1
    * @param p2 点2
    */
    public getDistance (p1: Vec3, p2: Vec3): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
    }

    /**
     *
     * @param min 最大值
     * @param max 最小值
     * @returns 返回一个这之间的数值
     */
    public getRandomNum (min: number, max: number): number {
        let range = max - min;
        let rand = Math.random();
        return (min + Math.round(rand * range));
    }

    /**
     * 获取两点间的角度，利用特定指定周来计算角度,一般用于导弹计算，以导弹为主体
     * @param start 起始点
     * @param end 结束点
     * @param axis 指定轴
     */
    public getAngleAxis (start: Vec3, end: Vec3, axis: Vec2) {
        let dx: number = end.x - start.x;
        let dy: number = end.z - start.z;
        // dy = Math.abs(dy);
        let dir: Vec2 = v2(dx, dy);
        let angle = dir.signAngle(axis);
        let degree = angle / Math.PI * 180;
        return degree;
    }

    /**
     * 利用角度计算sin值
     * @param degree 要计算的的角度值
     */
    public angleToSin (degree:number) {
        return Math.sin((degree / 180) * Math.PI);
    }

    /**
     * 利用角度计算cos值
     * @param degree 要计算的的角度值
     */
    public angleToCos (degree:number) {
        return Math.cos((degree / 180) * Math.PI);
    }

}

