const fs = require("fs");
const path = require("path");
const { exit } = require("process");
const { nanoid } = require("nanoid");
const { exec } = require("child_process");
const iconv = require("iconv-lite");
const _ = require("lodash");

let filePathList = [];
let boneIndex = [];

try {
  for (let i = 2; i < process.argv.length; i++) {
    const p = process.argv[i];
    if (p === "-bone" && process.argv[i + 1]) {
      boneIndex = process.argv[i + 1].split(",");
      ++i;
    } else {
      filePathList.push(p);
    }
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

Options:
[-bones] 拖入文件的层级，如321，则第一个文件的bones会放在后面而不是按拖入次序叠加
`
  );
  exit();
}

console.log("============Use spine: 3.8.99============");

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
  bones: [],
  slots: [],
  ik: [],
  path: [],
  skins: [],
  animations: {},
};

let bones = [];

filePathList.forEach((filePath, i) => {
  try {
    const basename = path.basename(filePath);
    const sk = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const id = `_${basename}_${nanoid(10)}`;
    const groupMap = new Map();
    let _bones;
    if (boneIndex[i]) {
      _bones = bones[boneIndex[i]] = [];
    } else {
      _bones = bones[bones.length] = [];
    }

    // bones
    // 丢掉根节点

    if (sk.bones && sk.bones[0]) {
      groupMap.set(sk.bones[0].name, sk.bones[0].name + id);
      sk.bones[0].name += id;

      _bones.push(sk.bones[0]);
      _.forEach(sk.bones.slice(1), (b) => {
        //1. 处理parent
        b.parent = groupMap.get(b.parent) || b.parent;
        // 是个分组，加上id
        if (!b.x && !b.y) {
          groupMap.set(b.name, b.name + id);
          b.name += id;
        }

        _bones.push(b);
      });
    }
    // slots
    if (sk.slots) skeleton.slots.push(...sk.slots);
    // path
    if (sk.path) skeleton.path.push(...sk.path);
    // ik
    if (sk.ik) skeleton.ik.push(...sk.ik);
    // skins
    _.forEach(sk.skins, (skin) => {
      const target = _.find(skeleton.skins, (o) => o.name === skin.name);
      if (target) {
        target.attachments = { ...target.attachments, ...skin.attachments };
      } else {
        skeleton.skins.push(skin);
      }
    });
    // animations
    _.forEach(sk.animations, (anim, key) => {
      if (skeleton.animations[key]) {
        skeleton.animations[key] = _.merge(skeleton.animations[key], anim);
        // 替换可能已经重命名的name
        _.forEach(skeleton.animations[key].bones, (v, k) => {
          const bone = skeleton.animations[key].bones[k];
          if (groupMap.get(k)) {
            skeleton.animations[key].bones[groupMap.get(k)] = _.cloneDeep(bone);
            delete skeleton.animations[key].bones[k];
          }
        });
      } else {
        skeleton.animations[key] = anim;
      }
    });
  } catch (error) {
    console.log(error);
    console.log(`合并骨骼${filePath}失败`);
  }
});

// flatten按层级排布的bones
skeleton.bones.push(..._.flatten(_.filter(bones, (o) => o)));

exec("clip").stdin.end(iconv.encode(JSON.stringify(skeleton), "gbk"));
console.log("已导入剪贴板");
