import { _decorator, Node, Prefab, AnimationComponent, ParticleSystemComponent, Vec3, find, AnimationClip, director, AnimationState, SkeletalAnimationComponent, isValid } from 'cc';
import { PoolManager } from './poolManager';
import { ResourceUtil } from './resourceUtil';

/**
 * Predefined variables
 * Name = EffectManager
 * DateTime = Mon Dec 06 2021 16:13:38 GMT+0800 (中国标准时间)
 * Author = yveda
 * FileBasename = effectManager.ts
 * FileBasenameNoExtension = effectManager
 * URL = db://assets/script/framework/effectManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */

const { ccclass, property } = _decorator;
// 特效管理组件
@ccclass('EffectManager')
export class EffectManager {
    private _ndParent: Node = null!;

    private static _instance: EffectManager;

    public get ndParent () {
        if (!this._ndParent) {
            let ndEffectParent = find("effectManager") as Node;

            if (ndEffectParent) {
                this._ndParent = ndEffectParent;
            } else {
                // console.warn("请在场景里添加effectManager节点");
                this._ndParent = new Node("effectManager");
                director.getScene().addChild(this._ndParent);
            }
        }

        return this._ndParent;
    }

    public static get instance () {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new EffectManager();
        return this._instance;
    }



    /**
     * 关闭节点下的粒子和动画，并回收该节点
     * @param {string} name  特效名称
     * @param {Node}} ndParent 特效父节点
     */
    public removeEffect (name: string, ndParent: Node = this.ndParent) {
        let ndEffect: Node | null = ndParent.getChildByName(name);
        if (ndEffect) {
            let arrAni: AnimationComponent[] = ndEffect.getComponentsInChildren(AnimationComponent);
            arrAni.forEach((element: AnimationComponent) => {
                element.stop();
            });

            let arrParticle: [] = ndEffect?.getComponentsInChildren(ParticleSystemComponent) as any;
            arrParticle.forEach((element: ParticleSystemComponent) => {
                element?.clear();
                element?.stop();
            });
            PoolManager.instance.putNode(ndEffect);
        }
    }

    /**
     * 重置特效节点状态
     * @param ndEffect 特效节点
     * @param aniName 动画名字
     * @returns
     */
    public resetEffectState (ndEffect: Node, aniName?: string) {
        if (!isValid(ndEffect)) {
            return;
        }

        let arrParticle: ParticleSystemComponent[] = ndEffect.getComponentsInChildren(ParticleSystemComponent);

        if (arrParticle.length) {
            arrParticle.forEach((element: ParticleSystemComponent) => {
                element?.clear();
                element?.stop();
            });
        }

        let arrAni: AnimationComponent[] = ndEffect.getComponentsInChildren(AnimationComponent);

        if (arrAni.length) {
            arrAni.forEach((element: AnimationComponent, idx: number) => {

                if (element.defaultClip.name) {
                    let aniState: any = null!;

                    if (aniName) {
                        aniState = element.getState(aniName);
                    }

                    if (!aniState) {
                        aniState = element.getState(element.defaultClip.name);
                    }

                    if (aniState) {
                        aniState.stop();
                        aniState.time = 0;
                        aniState.sample();
                    }
                }
            });
        }
    }

    /**
     * 加载特效节点并播放节点下面的动画、粒子
     *
     * @param {boolean} [isLocal=true] 是否将特效节点设置在本地坐标或者世界坐标下
     * @param {Node} ndTarget 特效的父节点
     * @param {string} effectPath 特效路径
     * @param {number} [scale=1] 缩放大小
     * @param {(Vec3 | null)} pos 坐标
     * @param {(Vec3 | null)} eulerAngles 角度
     * @param {boolean} [isPlayAnimation=true] 是否播放动画
     * @param {boolean} [isPlayParticle=true] 是否播放特效
     * @param {number} [speed=1] 播放速度
     * @param {boolean} [isRecycle=false] 是否回收
     * @param {number} [recycleTime=0] 回收时间
     * @param {(Function | null)} callback 回调函数
     * @returns
     * @memberof EffectManager
     */
    public loadAndPlayEffect (isLocal: boolean = true, ndTarget: Node, effectPath: string, scale: number = 1, pos: Vec3 | null, eulerAngles: Vec3 | null, isPlayAnimation: boolean = true, isPlayParticle: boolean = true, speed: number = 1, isRecycle: boolean = false, recycleTime: number = 0, callback: Function | null) {

        // 如果是本地坐标，父节点被回收的时候不播放
        if (isLocal && (!ndTarget || !ndTarget.parent)) {
            return;
        }
        let ndEffect: Node = null!;
        ResourceUtil.loadEffectRes(effectPath).then((prefab: any) => {
            let ndParent: Node = isLocal ? ndTarget : this.ndParent;
            ndEffect = PoolManager.instance.getNode(prefab as Prefab, ndParent);

            if (isLocal) {
                ndEffect.setScale(scale, scale, scale);

                if (pos) {
                    ndEffect.setPosition(pos);
                }

                if (eulerAngles) {
                    ndEffect.eulerAngles = eulerAngles;
                }
            } else {
                ndEffect.setWorldScale(scale, scale, scale);

                if (pos) {
                    ndEffect.setWorldPosition(pos);
                }

                if (eulerAngles) {
                    ndEffect.setWorldRotationFromEuler(eulerAngles.x, eulerAngles.y, eulerAngles.z);
                }
            }

            this.playEffect(ndEffect, isPlayAnimation, isPlayParticle, speed, isRecycle, recycleTime, callback);


        });
        return ndEffect;
    }

    /**
     * 播放节点下面的动画、粒子
     *
     * @param {Node} ndEffect 特效节点
     * @param {boolean} [isPlayAnimation=true] 是否播放动画
     * @param {boolean} [isPlayParticle=true] 是否播放特效
     * @param {number} [speed=1] 播放速度
     * @param {boolean} [isRecycle=false] 是否回收
     * @param {number} [recycleTime=0] 回收时间
     * @param {(Function | null)} callback 回调函数
     * @returns
     * @memberof EffectManager
     */
    public playEffect (ndEffect: Node, isPlayAnimation: boolean = true, isPlayParticle: boolean = true, speed: number = 1, isRecycle: boolean = false, recycleTime: number | null, callback: Function | null) {
        // 特效最长持续时间
        let maxDuration: number = 0;

        if (isPlayAnimation) {
            let duration = this.playAnimation(ndEffect, speed, null, false, false, null, null);
            maxDuration = duration > maxDuration ? duration : maxDuration;

        }

        if (isPlayParticle) {
            let duration = this.playParticle(ndEffect, speed, false, null, null);
            maxDuration = duration > maxDuration ? duration : maxDuration;
        }

        maxDuration = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;

        if (callback || isRecycle) {
            setTimeout(() => {
                if (ndEffect.parent) {
                    callback && callback();

                    if (isRecycle) {
                        PoolManager.instance.putNode(ndEffect);
                    } else {
                        ndEffect.destroy();
                    }
                }
            }, maxDuration * 1000);
        }
    }

    /**
     * 播放节点上的默认动画特效
     *
     * @param {Node} ndEffect 特效节点
     * @param {number} [speed=1] 动画播放速度
     * @param {(string | null)} animationName 动画名称（当节点下只有一个动画组件，并指定播放动画的时候才会使用这个参数，否则都使用默认动画）
     * @param {boolean} [isLoop=false] 是否循环播放
     * @param {boolean} [isRecycle=false] 是否回收
     * @param {(number | null)} recycleTime 回收时间,如果为null则使用maxDuration
     * @param {(Function | null)} callback 回调函数
     * @returns
     * @memberof EffectManager
     */
    public playAnimation (ndEffect: Node, speed: number = 1, animationName: string | null, isLoop: boolean = false, isRecycle: boolean = false, recycleTime: number | null, callback: Function | null) {
        // 动画播放最长时间
        let maxDuration: number = 0;
        let aniState: AnimationState = null!;

        if (!ndEffect.active) {
            ndEffect.active = true;
        }

        let arrAni: AnimationComponent[] = ndEffect.getComponentsInChildren(AnimationComponent);

        if (arrAni.length) {
            arrAni.forEach((element: AnimationComponent, idx: number) => {
                let aniName = animationName ? animationName : element?.defaultClip?.name;

                if (aniName) {
                    aniState = element.getState(aniName);
                    if (aniState) {
                        aniState.time = 0;
                        aniState.speed = speed;
                        aniState.sample();

                        let duration = aniState.duration;
                        maxDuration = duration > maxDuration ? duration : maxDuration;

                        if (isLoop) {
                            aniState.wrapMode = AnimationClip.WrapMode.Loop;
                        } else {
                            aniState.wrapMode = AnimationClip.WrapMode.Normal;
                        }

                        element?.play(aniName);
                    }
                }
            });

            maxDuration = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;

            let cb = () => {
                if (ndEffect && ndEffect.parent) {
                    callback && callback();

                    if (isRecycle) {
                        PoolManager.instance.putNode(ndEffect);
                    }
                }
            };

            if (callback || isRecycle) {
                if (arrAni.length === 1) {
                    arrAni[0].once(AnimationComponent.EventType.FINISHED, () => {
                        cb();
                    });
                } else {
                    setTimeout(() => {
                        cb();
                    }, maxDuration * 1000);
                }
            }

            return maxDuration;
        } else {
            console.warn(`###${ndEffect.name}节点下没有动画特效`);
            return 0;
        }
    }

    /**
     * 播放节点上的粒子特效
     * @param ndEffect 特效节点
     * @param speed 粒子播放速度
     * @param isRecycle 是否需要回收特效节点
     * @param recycleTime 回收时间, 如果为null则使用maxDuration
     * @param callback 回调函数
     * @returns 返回播放完成所需秒数
     */
    public playParticle (ndEffect: Node, speed: number = 1, isRecycle: boolean = false, recycleTime: number | null, callback: Function | null) {
        // 粒子播放最长时间
        let maxDuration: number = 0;

        if (!ndEffect.active) {
            ndEffect.active = true;
        }

        let arrParticle: ParticleSystemComponent[] = ndEffect.getComponentsInChildren(ParticleSystemComponent);

        if (arrParticle.length) {
            arrParticle.forEach((element: ParticleSystemComponent) => {
                element.simulationSpeed = speed;
                element?.clear();
                element?.stop();
                element?.play();

                let duration: number = element.duration;
                maxDuration = duration > maxDuration ? duration : maxDuration;
            });

            // 使用传进来的回收时间，否则设置为时长最长
            maxDuration = recycleTime && recycleTime > 0 ? recycleTime : maxDuration;

            if (callback || isRecycle) {
                setTimeout(() => {
                    if (ndEffect && ndEffect.parent) {
                        callback && callback();

                        if (isRecycle) {
                            PoolManager.instance.putNode(ndEffect);
                        }
                    }
                }, maxDuration * 1000);
            }

            return maxDuration;
        } else {
            console.warn(`###${ndEffect.name}节点下没有粒子特效`);
            return 0;
        }
    }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.3/manual/zh/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.3/manual/zh/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.3/manual/zh/scripting/life-cycle-callbacks.html
 */
