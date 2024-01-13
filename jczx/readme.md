# 交错战线资源解包

## dependence

nodejs
[AssetStudio](https://github.com/Perfare/AssetStudio)

## 脚本

### decrypt

将文件夹进行批量解密

#### 使用

```
Usage: npm run decrypt '$0'
```

#### 运行

1. 运行 npm install
2. 确保 Custom 文件夹与该项目同盘，运行 npm run decrypt 'Custom 路径'
3. 解密出以下文件

   ![1704911877905](image/readme/1704911877905.png)

4. AssetStudio: File -> load folder (Custom)

   ![1704853934393](image/readme/1704853934393.png)

5. 导出 prefab

### union_bones

将多个骨骼进行合并

#### 使用

```
Usage:
npm run union <...fileList> [-- <args>]

所有数据按文件拖入顺序叠加，后面的文件则会渲染在上层

```

### ~~splitPack~~

~~将同目录 packs 文件夹进行批量分片，packs 文件夹为 apk 直接解压后得到的.bs 文件。在初次在安卓系统打开游戏后会进行文件解压，解压目录：Android/data/com.megagame.crosscore/files~~
