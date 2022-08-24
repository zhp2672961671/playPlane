import { Vec3 } from "cc";

export class Constant {
    public static GAME_NAME = 'template';

    public static GAME_VERSION = '1.0.1';

    public static GAME_FRAME = 60;      // 游戏当前帧率
    public static GAME_INIT_FRAME = 60; // 游戏开发基础帧率
    public static GAME_NAME_CH = "鹰击长空";// 游戏中文名称

    // 本地缓存key值
    public static LOCAL_CACHE = {
        PLAYER: 'player',               // 玩家基础数据缓存，如金币砖石等信息，暂时由客户端存储，后续改由服务端管理
        SETTINGS: 'settings',           // 设置相关，所有杂项都丢里面进去
        DATA_VERSION: 'dataVersion',    // 数据版本
        ACCOUNT: 'account',                 // 玩家账号
        // TMP_DATA: 'tmpData',             //临时数据，不会存储到云盘
        HISTORY: "history",                   // 关卡通关数据
        BAG: "bag",                         // 玩家背包，即道具列表，字典类型
    };

    // 打开奖励的方式
    public static OPEN_REWARD_TYPE = {
        AD: 0,
        SHARE: 1,
        NULL: 2
    };

    // 事件枚举
    public static EVENT_TYPE = {
        GAME_PLANE_BLOOD: 20,           // 玩家飞机血条总量
        GAME_PLANE_BLOOD_WARN: 6,        // 玩家低血量警告值
        ON_GAME_RESTART: "onGameReStart",  // 游戏重新开始
        ON_GAME_START: "onGameStart",   // 游戏开始
        ON_GAME_STOP: "onGameStop",     // 游戏暂停
        ON_GAME_REMAIN: "onGameMain",   // 重新返回主界面
        ON_GAME_STOP_FACTOR: 0.1,       // 游戏暂停时候减速的因子
        ON_GAME_CONTINUE: "onGameContinue",  // 游戏继续
        GAME_DISTANCE: "gameDistance",   // 背景移动时计时
        GAME_DISTANCE_NUMBER: 50,       // 背景地图移动的距离（每移动到这个数值会产生的变化，比如敌机出现）
        GAME_DIFFICULT: "gameDifficult",     // 难度发生改变
        GAME_PLAYER_PLANE_NUMBER: 3,  // 游戏内玩家可选择的飞机总数量
        BULLET_KILLED: "bulletKilled",  // 子弹节点回收
        REMOVE_BULLET: "removeBullet",  // 移除数组中的子弹
    };

    // 名称
    public static PLANE_NAME = {
        PLANE_YELLOW: "大黄峰",
        PLANE_BLUE: "岚麒麟",
        PLANE_RED: "红蜘蛛",
    };

    // 游戏结束类型的判断
    public static GAMEOVER_TYPE = {
        GAME_WIN: "gameWin",    // 击败boss，游戏胜利
        GAME_FAILURE: "gameFailure",    // 我放飞机被击毁，游戏失败
    };

    public static ITEM_GROUP = {
        ENEMY_BULLET: 2,    // 地方子弹组为2
        SELF_BULLET: 3,     // 我放子弹组为3
        ENEMY_PLANE: 4,     // 敌机组为4
        SELF_PLANE: 8,      // 我放机组为8
        FIGHT_BULLET: 16,    // 子弹类型道具组为16
        PROP_FIGHT: 32,      // 道具类型组为32

    };

    // 子弹枚举
    public static FIGHT_BULLET_GROUP = {
        BULLET_M: 1,        // 子弹类型M
        BULLET_S: 2,        // 子弹类型S
        BULLET_H: 3,        // 子弹类型H
    };

    // 子弹方位枚举
    public static BULLET_DIRECTION = {
        CENTRAL: 1,         // 方向中央
        LEFT: 2,            // 方向左边
        RIGHT: 3,           // 方向右边
    };


    // 游戏中用到的数值，
    public static GAME_VALUE = {
        PLAYER_MOVING_VALUE: 0.07,  // 玩家移动时的衰减速度
        ENEMY_TIME: 180,        // 敌机出现的间隔，指背景移动一段距离后出现敌机的时间
        BG_MOVE_TIME: 179,      // 背景移动的距离时间，要和敌机出现的时间（上方）
        ENEMYBULLET_SPEED: 60,   // 敌机开炮间隔
        BULLET3_SCALE_CHANGE: 0.02,     // 我放黄色飞机子弹大小每次变化大小
        // boss部分
        BOSS_COLLIDER_BULLET_TIME: 180, // boss第一阶段两侧子弹发射间隔
        BOSS_COLLIDER3_BULLET_TIME: 180,    // boss导弹发射的间隔
        BOSS_ATTACK_GRAPE_TIME: 120,        // 第二阶段，散射的攻击间隔
        PLAYER_ADSORB: 7            // 玩家吸附道具的范围

    };

    // 组合类型选择
    public static DIS_COMBINATOR = {
        DIS_COMBIN0: 0,      //
        DIS_COMBIN1: 1,
        DIS_COMBIN2: 2,
        DIS_COMBIN3: 3,
        DIS_COMBIN4: 4,
        DIS_COMBIN5: 5,
        DIS_COMBIN6: 6,
        DIS_COMBIN7: 7,
        DIS_COMBIN8: 8,
        DIS_COMBIN9: 9,
        DIS_COMBIN10: 10,
        DIS_COMBIN11: 11,
        DIS_COMBIN12: 12,
        DIS_COMBIN13: 13,
        DIS_COMBIN14: 14,
        DIS_COMBIN15: 15,

        DIS_COMBINBOSS: 999,
    };

    // 敌机子弹类型选择
    public static BULLET_COMBINATOR = {
        BULLET_1000: 1000,      // 弹幕id：1000
        BULLET_1001: 1001,
        BULLET_1002: 1002,
        BULLET_1003: 1003,
        BULLET_1004: 1004,
        BULLET_1005: 1005,
        BULLET_1006: 1006,
        BULLET_1007: 1007,
        BULLET_1008: 1008,
        BULLET_1009: 1009,
    };



    // 道具
    public static PROPS = {
        PROPS_HEART: 'heart',
        PROPS_BULLET: 'bullet',
        PROPS_STARS: 'stars',
        PEOPS_DIS: 20,
    };

    // 子弹发射间隔
    public static BULLET_INTERVAL = {
        INTERVAL_NORMAL: 12,   // 间隔12帧
        INTERVAL_2: 10,         // 间隔10帧
        INTERVAL_3: 8,         // 间隔8帧
        INTERVAL_4: 5,         // 间隔5帧
    };

    // 子弹等级（通用） 6个等级
    public static BULLET_LEVEL = {
        LEVEL_1: 1,
        LEVEL_2: 2,
        LEVEL_3: 3,
        LEVEL_4: 4,
        LEVEL_5: 5,
        LEVEL_6: 6,
    };

    // 放大比例
    public static SCALE = {
        SCALE1: new Vec3(8, 8, 8),
        SCALE2: new Vec3(5, 5, 5),
        SCALE3: new Vec3(1, 1, 10),
        SCALE4: new Vec3(20, 20, 20),

    };



    // 动态加载路径组
    public static LOADING_PATH = {
        PLAYER_PLANE: "player/player",       // 玩家自身的飞机
        ENEMY_GREEN: "enemyGreen/enemyGreen",   // 绿色飞机的加载
        ENEMY_YELLOW: "enemyYellow/enemyYellow",    // 黄色的飞机
        ENEMY_RED: "enemyRed/enemyRed",   // 红色敌机
        COMBINATION8: "battery1/battery1",   // 炮台1
        BOSS: "boss/boss",      // boss敌机
        DUST: "dust/dust",      // 云的动态加载
        GROUND1: "ground/movingBg1",  // 背景1
        GROUND2: "ground/movingBg2",  // 背景2
        GROUND3: "ground/movingBg3",  // 背景3
        STARS: "stars/stars",   // 星星
        HEART: "heart/heart",   // 回血道具
        BULLET: "bullet/bullet",    // 子弹道具
        LOW_BLOOD: "lowBlood/lowBlood",  // 低血量警告

        SELF_BULLET_011: "selfBullet1/bullet011",   // 玩家第一类型子弹等级1-2
        SELF_BULLET_012: "selfBullet1/bullet012",   // 玩家第一类型子弹等级3-4
        SELF_BULLET_013: "selfBullet1/bullet013",   // 玩家第一类型子弹等级5-6

        SELF_BULLET_021: "selfBullet2/bullet021",   // 玩家第二类型子弹等级1-2
        SELF_BULLET_022: "selfBullet2/bullet022",   // 玩家第二类型子弹等级3-4
        SELF_BULLET_023: "selfBullet2/bullet023",   // 玩家第二类型子弹等级5-6

        SELF_BULLET_031: "selfBullet3/bullet031",   // 玩家第三类型子弹等级1-2
        SELF_BULLET_032: "selfBullet3/bullet032",   // 玩家第三类型子弹等级3-4
        SELF_BULLET_033: "selfBullet3/bullet033",   // 玩家第三类型子弹等级5-6

        ENEMY_BULLET1: "bullet1/bullet01",   // 敌机子弹类型1
        ENEMY_BULLET2: "bullet2/bullet02",   // 敌机子弹类型2
        ENEMY_BULLET3: "bullet3/bullet03",   // 敌机子弹类型3
        ENEMY_BULLET4: "bullet4/bullet04",   // 敌机子弹类型4
        ENEMY_BULLET5: "bullet5/bullet05",   // 敌机子弹类型5
        ENEMY_BULLET6: "bullet6/bullet06",   // 敌机子弹类型6
        ENEMY_BULLET7: "bullet7/bullet07",   // 敌机子弹类型7
        ENEMY_BULLET8: "bullet8/bullet08",   // 敌机子弹类型8


        MISSILE_BULLET1: "missile/missile01",    // 导弹类型1

        // 爆炸特效
        EXPLODE: "explode/explode",     // 普通爆炸特效
        EXPLODE_BOSS: "explode/explodeBoss",     // boss爆炸特效
        EXPLODE_SMALL: "explode/explodeSmall",     // 小型爆炸特效

        // 坠落特效
        HIT_SMOKE: "hitSmoke/hitSmoke",

        HIT: "hit/hit",     // 子弹击中特效
        HIT_BULLET3: "hitBullet03/hitBullet03",     // 特殊子弹的击中特效

    };

    // 路径组
    public static VOLUMES = {
        VOLUMES_CANVAS: "Canvas",
        VOLUMES_LOWBLOOD: "Canvas/lowBlood",


    };

    // 游戏难度
    public static GAME_DIFFICULT = {
        GAME_DIFFICULT_1: 1,    // 游戏难度1
        GAME_DIFFICULT_2: 2,    // 游戏难度2
        GAME_DIFFICULT_3: 3,    // 游戏难度3
    };


    //
    public static GAME_POS = {
        POS_1: new Vec3(0, 0, 26),
        POS_2: new Vec3(0, 0, 60),
        POS_3: new Vec3(0, 100, 60),
        POS_4: new Vec3(0, -5, -70),    // boss用的坐标
        POS_5: new Vec3(0, 0.119, -0.956), // 黄色飞机往下飞行，头朝下时候，飞机尾部的火焰位置
        POS_6: new Vec3(180, 0, 0),          // 正常飞机往下飞行时，火焰的旋转角度
        POS_7: new Vec3(0, 180, 0),         //  正常飞机往下飞行时，飞机体的旋转角度
        POS_8: new Vec3(0, 0.062, -0.509)   // 绿色飞机往下飞行时，头朝下，飞机尾部的火焰位置
    };

    // 表名
    public static TABLENAME = {
        DIFFICULT_MAIN: "difficultMain",       // 难度选择主表
        ENEMY: "enemy",                         // 敌机表
        DIFFICULT1: "difficult1",               // 难度1表
        DIFFICULT2: "difficult2",               // 难度2表
        DIFFICULT3: "difficult3",               // 难度3表

    };

    // 得分进度条信息
    public static GAME_SCORE_RAND = {
        SCORE_NICE: 100,            // 得分Good
        SCORE_GOOD: 200,
        SCORE_GREAT: 500,
        SCORE_EXCELLENT: 800,
        SCORE_WONDERFUL: 1000,
        TXT_NICE: 'NICE',
        TXT_GOOD: 'GOOD',
        TXT_GREAT: 'GREAT',
        TXT_EXCELLENT: 'EXCELLENT',
        TXT_WONDERFUL: 'WONDERFUL',

    };

    // 动画名称
    public static Game_Animation = {
        BOSS_FALL_ANIMATION: 'bossFallAnimation',
    };

    // 敌机的组合判断，用于enemyALL脚本中
    public static ENEMY_ALL_TYPE = {
        COMBINATION1: "combination1",       // 组合1，
        COMBINATION2: "combination2",       // 组合2，
        COMBINATION3: "combination3",       // 组合3，
        COMBINATION4: "combination4",       // 组合4，
        COMBINATION5: "combination5",       // 组合5，
        COMBINATION6: "combination6",       // 组合6，
        COMBINATION7: "combination7",       // 组合7，

    };

    // 敌人子弹判断，用于BulletALL脚本中
    public static BULLET_ALL_TYPE = {
        BULLET1: "Bullet1",       // 1号子弹
        BULLET2: "Bullet2",       // 2号子弹
        BULLET3: "Bullet3",       // 3号子弹
        ENEMY_BULLET2: "EnemyBullet2",       // 敌机2号子弹
        ENEMY_BULLET3: "EnemyBullet3",       // 敌机3号子弹
        ENEMY_BULLET4: "EnemyBullet4",       // 敌机4号子弹
        ENEMY_BULLET5: "EnemyBullet5",       // 敌机5号子弹
        ENEMY_BULLET6: "EnemyBullet6",       // 敌机6号子弹
        ENEMY_BULLET7: "EnemyBullet7",       // 敌机7号子弹
        MISSILE1: "Missile1",       // 导弹1
    };


    // boss碰撞体种类
    public static BOSS_COLLIDER = {
        COLLIDER1: "collider1",
        COLLIDER2: "collider2",
        COLLIDER3: "collider3",
        COLLIDER4: "collider4",
        COLLIDER5: "collider5",
        COLLIDER6: "collider6",

    };

    // 子弹速度
    public static BULLET_SPEED = {  // 除去这里特殊声明的，其余子弹默认为1
        BULLET_SPEED: 1,        // 普通子弹速度
        BULLET4_SPEED: 0.4,     // 子弹4的速度
        BULLET5_SPEED: 0.5,     // 子弹5的速度
        BULLET6_SPEED: 0.3,     // 子弹6的速度
        BULLET7_SPEED: 0.3,     // 子弹7的速度
        BULLET8_SPEED: 0.3,     // 子弹8的速度
        BULLET10_SPEED: 0.5,     // 子弹10的速度
    };

    // 音效
    public static AUDIO_SOUND = {
        CLICK: "click",     // 按钮点击声音
        CLICK_MAIN: "clickMain",    // 开始按钮点击音效
        FALL: "fall",       // 大型飞机爆炸音效
        BOOM: "boom",       // 爆炸声音
        BOOM2: "boom2",       // 爆炸声音2
        EAT: "eat",         // 吃道具的音效
        LASER1: "laser1",     // 玩家蓝色飞机子弹音效1
        LASER2: "laser2",     // 玩家蓝色飞机子弹音效2
        LASER3: "laser3",     // 玩家蓝色飞机子弹音效3

        BULLET1: "bullet1",     // 玩家红色飞机子弹,敌机普通黄色子弹音效
        BULLET2: "bullet2",     // 敌机紫红色子弹音效
        BULLET3: "bullet3",     // 敌机深蓝色陨石状子弹音效
        BULLET4: "bullet4",   // 玩家黄色飞机子弹发射音效
        BULLET5: "bullet5",     // 敌机天蓝色散射子弹音效
        BOSS1: "boss1",     // boss第一阶段导弹子弹音效
        BOSS2: "boss2",     // boss第二阶段子弹音效

    };

    public static AUDIO_MUSIC = {
        BG: "bg",       // 背景音乐
    };

}
