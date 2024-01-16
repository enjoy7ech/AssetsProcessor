const fs = require("fs");
const path = require("path");
const { exit } = require("process");
const { nanoid } = require("nanoid");
const { exec } = require("child_process");
const iconv = require("iconv-lite");
const _ = require("lodash");

let filePathList = [];

try {
  for (let i = 2; i < process.argv.length; i++) {
    const p = process.argv[i];
    filePathList.push(p);
  }
} catch (error) {
  console.error(
    "请把需要合并的骨骼拖进命令行，并确保文件夹与该项目在同一个盘。"
  );
  exit();
}
if (filePathList.length === 0) {
  console.log(
    `Usage:
npm run union <...fileList> [-- <args>]

所有数据按文件拖入顺序叠加，后面的文件则会渲染在上层
`
  );
  exit();
}

console.log("============Use spine: 3.8.99============");
let boneRoot = "union_root_" + nanoid(10);
let order = 0;

// 由于增加了一个根节点，偏移默认为1
let boneIndexOffset = 1;

let skeleton = {
  skeleton: {
    hash: "",
    spine: "3.8.99",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    images: "",
    audio: "",
  },
  bones: [
    {
      name: boneRoot,
    },
  ],
  slots: [],
  ik: [],
  transform: [],
  path: [],
  skins: [],
  animations: {},
};

filePathList.forEach((filePath, i) => {
  try {
    const basename = path.basename(filePath);
    const sk = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const boneId = `_${basename}_bone_${nanoid(10)}`;
    const slotId = `_${basename}_slot_${nanoid(10)}`;
    const ikId = `_${basename}_ik_${nanoid(10)}`;
    const transformId = `_${basename}_transform_${nanoid(10)}`;
    const pathId = `_${basename}_path_${nanoid(10)}`;
    const boneMap = new Map();
    const slotMap = new Map();
    const ikMap = new Map();
    const transformMap = new Map();
    const pathMap = new Map();
    const attachmentMap = new Map();

    // bones
    if (sk.bones && sk.bones[0]) {
      boneMap.set(sk.bones[0].name, sk.bones[0].name + boneId);
      sk.bones[0].name += boneId;
      sk.bones[0].parent = boneRoot;

      skeleton.bones.push(sk.bones[0]);
      _.forEach(sk.bones.slice(1), (b) => {
        //1. 处理parent
        b.parent = boneMap.get(b.parent) || b.parent;

        boneMap.set(b.name, b.name + boneId);
        b.name += boneId;
        skeleton.bones.push(b);
      });
    }
    // slots
    // name: 槽位名称. 该名称在skeleton上唯一.
    // bone: 该槽位所在骨骼的名称.
    // color: setup pose时槽位的颜色. 它是一个长度为8的字符串, 包含4个按RGBA顺序排列的两位十六进制数字. 若省略alpha, 则alpha默认为 "FF". 若省略该属性则默认为 "FFFFFFF".
    // dark: 设置setup pose时槽位用于双色tinting的dark color. 这是一个6个字符的字符串, 包含3个按RGB顺序排列的两位十六进制数字. 当不使用双色tinting时则省略.
    // attachment: setup pose时槽位中附件的名称. 若省略则默认setup pose没有附件.
    // blend: 在绘制槽位中可见附件时要使用的blend类别: normal, additive, multiply, 或screen.
    if (sk.slots) {
      _.forEach(sk.slots, (s) => {
        slotMap.set(s.name, s.name + slotId);
        if (s.attachment) {
          attachmentMap.set(s.attachment, s.attachment);
        }
        if (!boneMap.get(s.bone)) {
          console.error(
            `Warn: the bone ${s.bone} is not found in bones definition`
          );
        }
        skeleton.slots.push({
          ...s,
          name: s.name + slotId,
          bone: boneMap.get(s.bone) || s.bone,
        });
      });
    }

    // ik
    // name: 约束名称. 该名称在skeleton上唯一.
    // order: 约束生效(applied)的顺序序数.
    // skin: 若为true, 则只有当活动皮肤包含该约束时该约束才生效. 若省略则默认为false.
    // bones: 一个包含1到2个骨骼名称的列表, 这些骨骼的旋转将被IK约束限制.
    // target: 目标(target)骨骼的名称.
    // mix: 一个介于0到1区间的值, 表示约束对骨骼的影响, 其中0表示只有FK, 1表示只有IK, 而中间值表示混合了FK和IK. 若省略则默认为1.
    // softness: 对于双骨骼IK, 表示目标骨骼到旋转减缓前骨骼的最大活动范围的距离. 若省略则默认为0.
    // bendPositive: 若为true, 则骨骼的弯曲方向为正的旋转方向. 若省略则默认为false.
    // compress: 若为true且只有一个骨骼被约束, 则当目标太近时会缩放骨骼以保持连接. 若省略则默认为false.
    // stretch: 若为true且如果目标超出了范围, 将缩放父骨骼以保持连接. 若约束了多个骨骼且父骨骼的局部缩放比例非均匀(nonuniform), 则不应用拉伸(stretch). 若省略则默认为false.
    // uniform: 若为true且只约束了一个骨骼, 而且使用了压缩或拉伸, 则该骨骼将在X和Y方向上缩放. 若省略则默认为false.
    if (sk.ik) {
      _.forEach(sk.ik, (i) => {
        ikMap.set(i.name, i.name + ikId);
        skeleton.ik.push({
          ...i,
          order: order++,
          name: i.name + ikId,
          bones: i.bones.map((o) => boneMap.get(o)),
          target: boneMap.get(i.target) || i.target,
        });
      });
    }

    // path
    //   {
    //     "name": "constraintName",
    //     "order": 0,
    //     "bones": [ "boneName1", "boneName2" ],
    //     "target": "slotName",
    //     "positionMode": "fixed",
    //     "spacingMode": "length",
    //     "rotateMode": "tangent",
    //     "rotation": "45",
    //     "position": "204",
    //     "spacing": "10",
    //     "rotateMix": "0",
    //     "translateMix": "1"
    //  }
    if (sk.path) {
      _.forEach(sk.path, (p) => {
        pathMap.set(p.name, p.name + pathId);

        skeleton.path.push({
          ...p,
          order: order++,
          name: p.name + pathId,
          bones: p.bones.map((o) => boneMap.get(o)),
          target: slotMap.get(p.target),
        });
      });
    }

    // transform
    // name: 约束名称. 该名称在skeleton上唯一.
    // order: 约束生效(applied)的顺序序数.
    // skin: 若为true, 则只有当活动皮肤包含该约束时该约束才生效. 若省略则默认为false.
    // bones: 将被约束控制transform的骨骼.
    // target: 目标(target)骨骼的名称.
    // rotation: 相对于目标骨骼的旋转角度偏移量. 若省略则默认为0.
    // x: 相对于目标骨骼的X方向距离偏移量. 若省略则默认为0.
    // y: 相对于目标骨骼的Y方向距离偏移量. 若省略则默认为0.
    // scaleX: 相对于目标骨骼的X方向缩放偏移量. 若省略则默认为0.
    // scaleY: 相对于目标骨骼的Y方向缩放偏移量. 若省略则默认为0.
    // shearY: 相对于目标骨骼的Y方向斜切角度偏移量. 若省略则默认为0.
    // rotateMix: 一个介于0到1区间的值, 表示约束对骨骼的影响, 其中0表示无影响, 1表示只有约束, 而中间值表示正常pose和约束的混合. 若省略则默认为1.
    // translateMix: 参见 rotateMix.
    // scaleMix: 参见 rotateMix.
    // shearMix: 参见 rotateMix.
    // local: 如果需要影响目标的局部transform则设置为True, 反之则影响全局transform. 若省略则默认为false.
    // relative: 如果目标的transform为相对的则设置为True, 反之则其transform为绝对的. 若省略则默认为false.
    if (sk.transform) {
      _.forEach(sk.transform, (t) => {
        transformMap.set(t.name, t.name + transformId);

        skeleton.transform.push({
          ...t,
          order: order++,
          bones: t.bones.map((o) => boneMap.get(o)),
          target: boneMap.get(t.target),
          name: t.name + transformId,
        });
      });
    }

    // skins []
    //   {
    //     "name": "skinName",
    //     "attachments": {
    //        "slotName": {
    //           "attachmentName": { "x": -4.83, "y": 10.62, "width": 63, "height": 47 },
    //           ...
    //        },
    //        ...
    //     }
    //  }

    function handleAttachment(item) {
      // type: 附件类型. 若省略则默认为"region".
      if (item.type === undefined) {
        return item;
      }
      // mesh附件属性:
      // path: 指定后, 将使用该值查找texture区域而非附件名称.
      // uvs: 一个坐标列表, 表示每个顶点的texture坐标.
      // triangles: 一个顶点索引列表, 定义了网格中的每个三角形.
      // vertices: 包含每个顶点的x,y对, 影响该顶点的骨骼数量(用于加权网格), 以及用于这些骨骼的: 骨骼索引, 绑定位置X坐标, 绑定位置Y坐标, 权重. 若顶点数量 > UV数量, 则该网格为加权网格.
      // mesh-vertices数据格式: [影响该点的bone数量, ...(bone1的索引, 该点的绑定位置X坐标, 该点的绑定位置Y坐标, 权重)]
      // hull: 构成多边形壳的顶点数量. 壳顶点保持在vertices列表首位.
      // edges: 一个顶点索引对的列表, 定义了连接顶点之间的边. 非必要数据.
      // color: 用于附件tint(染色)的颜色. 若省略则默认为FFFFFFF RGBA.
      // width: 网格所用图像的宽度, 非必要数据.
      // height: 网格所用图像的高度, 非必要数据.
      if (item.type === "mesh") {
        if (item.vertices.length > item.uvs.length) {
          let preIndex;
          let nxtIndex = 0;
          _.forEach(item.vertices, (o, i) => {
            if (i === nxtIndex) {
              preIndex = nxtIndex - 1;
              nxtIndex = nxtIndex + o * 4 + 1;
            }
            // 取第二位
            if ((i - preIndex) % 4 === 2) {
              // 加上偏移索引
              item.vertices[i] += boneIndexOffset;
            }
          });

          return item;
        } else {
          return item;
        }
      }
      if (item.type === "path") {
        if (item.vertices.length > +item.vertexCount * 2) {
          let preIndex = 0;
          let nxtIndex = 0;
          _.forEach(item.vertices, (o, i) => {
            if (i === nxtIndex) {
              preIndex = nxtIndex;
              nxtIndex += o * 4;
            }
            // 取第二位
            if ((i - preIndex) % 4 === 2) {
              // 加上偏移索引
              item.vertices[i] += boneIndexOffset;
            }
          });

          return item;
        } else {
          return item;
        }
      }
      // clipping附件属性:
      // end: 裁剪停止时的槽位名称.
      // vertexCount: 裁剪多边形的顶点数量.
      // vertices: 包含每个顶点的x,y对, 影响该顶点的骨骼数量(用于加权裁剪多边形), 以及用于这些骨骼的: 骨骼索引, 绑定位置X坐标, 绑定位置Y坐标, 权重. 若顶点数量 > 顶点总数, 则该多边形为加权裁剪多边形.
      // color: Spine中裁剪附件的颜色. 若省略则默认为CE3A3AFF RGBA. 非必要数据.
      if (item.type === "clipping") {
        if (item.vertices.length > +item.vertexCount) {
          let preIndex;
          let nxtIndex = 0;
          _.forEach(item.vertices, (o, i) => {
            if (i === nxtIndex) {
              preIndex = nxtIndex - 1;
              nxtIndex = nxtIndex + o * 4 + 1;
            }
            // 取第二位
            if ((i - preIndex) % 4 === 2) {
              // 加上偏移索引
              item.vertices[i] += boneIndexOffset;
            }
          });

          item.end = slotMap.get(item.end);
          return item;
        } else {
          return item;
        }
      }
      console.error("无法处理的attachment:", item);
      exit();
    }

    if (sk.skins) {
      _.forEach(sk.skins, (skin) => {
        const target = _.find(skeleton.skins, (o) => o.name === skin.name);
        if (target) {
          _.forEach(skin.attachments, (attachments, slotName) => {
            if (!target.attachments[slotMap.get(slotName)]) {
              target.attachments[slotMap.get(slotName)] = {};
            }
            _.forEach(attachments, (attachment, attachmentName) => {
              target.attachments[slotMap.get(slotName)][
                attachmentMap.get(attachmentName) || attachmentName
              ] = handleAttachment(attachment);
            });
          });
        } else {
          const base = {
            name: skin.name,
            attachments: {},
          };
          _.forEach(skin.attachments, (attachments, slotName) => {
            base.attachments[slotMap.get(slotName)] = {};
            _.forEach(attachments, (attachment, attachmentName) => {
              base.attachments[slotMap.get(slotName)][
                attachmentMap.get(attachmentName) || attachmentName
              ] = handleAttachment(attachment);
            });
          });
          skeleton.skins.push(base);
        }
      });
    }

    // animations
    //   "animations": {
    //     "name": {
    //        "bones": {
    //          "boneName": {
    //             "timelineType": [
    //                { "time": 0, "angle": -26.55 },
    //                { "time": 0.1333, "angle": -8.78 },
    //                ...
    //             ],
    //             ...
    //          }
    //        },
    //        "slots": {
    //          "slotName": {
    //            "timelineType": [
    //              { "time": 0.2333, "name": "eyes closed" },
    //              { "time": 0.6333, "name": "eyes open" },
    //              ...
    //            ],
    //            ...
    //        },
    //        "ik": { ... },
    //        "deform": {
    //          "skinName": {
    //            "slotName": {
    //               "meshName": [
    //                  {
    //                     "time": 0,
    //                     "curve": [ 0.25, 0, 0.75, 1 ]
    //                  },
    //                  {
    //                     "time": 1.5,
    //                     "offset": 12,
    //                     "vertices": [ -0.75588, -3.68987, -1.01898, -2.97404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //                     -1.01898, -2.97404, -0.75588, -3.68987, 0, 0, -0.75588, -3.68987, -0.75588, -3.68987,
    //                     -1.01898, -2.97404, -1.01898, -2.97404, -1.01898, -2.97404, -0.75588, -3.68987 ],
    //                     "curve": [ 0.25, 0, 0.75, 1 ]
    //                  },
    //                  ...
    //               ],
    //               ...
    //            },
    //            ...
    //         },
    //        "events": { ... },
    //        "draworder": { ... },
    //     },
    //     ...
    //  }
    if (sk.animations) {
      _.forEach(sk.animations, (anim, animName) => {
        let target = _.find(skeleton.animations, (o, key) => key === animName);

        if (!target) {
          target = skeleton.animations[animName] = {};
        }

        if (anim.bones) {
          if (!target.bones) target.bones = {};
          _.forEach(anim.bones, (param, boneName) => {
            if (!target.bones[boneMap.get(boneName)]) {
              target.bones[boneMap.get(boneName)] = param;
            }
          });
        }
        // attachment: 改变槽位内附件的关键帧.
        if (anim.slots) {
          if (!target.slots) target.slots = {};
          _.forEach(anim.slots, (param, slotName) => {
            if (!target.slots[slotMap.get(slotName)]) {
              if (param.attachment) {
                param.attachment = _.map(param.attachment, (o) => {
                  return {
                    ...o,
                    name: attachmentMap.get(o.name) || o.name,
                  };
                });
              }
              target.slots[slotMap.get(slotName)] = param;
            }
          });
        }
        if (anim.ik) {
          if (!target.ik) target.ik = {};
          _.forEach(anim.ik, (param, ikName) => {
            if (!target.ik[ikMap.get(ikName)]) {
              target.ik[ikMap.get(ikName)] = param;
            }
          });
        }
        if (anim.transform) {
          if (!target.transform) target.transform = {};
          _.forEach(anim.transform, (param, transformName) => {
            if (!target.transform[transformMap.get(transformName)]) {
              target.transform[transformMap.get(transformName)] = param;
            }
          });
        }
        if (anim.path) {
          if (!target.path) target.path = {};
          _.forEach(anim.path, (param, pathName) => {
            if (!target.path[pathMap.get(pathName)]) {
              target.path[pathMap.get(pathName)] = param;
            }
          });
        }
        if (anim.deform) {
          if (!target.deform) target.deform = {};
          _.forEach(anim.deform, (skin, skinName) => {
            if (!target.deform[skinName]) {
              target.deform[skinName] = {};
            }
            _.forEach(skin, (param, slotName) => {
              target.deform[skinName][slotMap.get(slotName)] = param;
            });
          });
        }

        if (anim.events) {
          if (!target.events) {
            target.events = [];
          }
          target.events.push(...anim.events);
        }

        if (anim.draworder) {
          if (!target.draworder) {
            target.draworder = [];
          }
          target.draworder.push(
            ...anim.draworder.map((o) => ({
              ...o,
              offsets: o.offsets.map((x) => {
                x.slot = slotMap.get(x.slot);
                return x;
              }),
            }))
          );
        }
      });
    }

    // 最后加上bones索引偏移
    boneIndexOffset += sk.bones.length;
  } catch (error) {
    console.log(error);
    console.log(`合并骨骼${filePath}失败`);
    exit();
  }
});

exec("clip").stdin.end(iconv.encode(JSON.stringify(skeleton), "gbk"));
console.log("已导入剪贴板");
