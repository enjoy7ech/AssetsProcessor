# 交错战线资源解包

## dependence

nodejs
[AssetStudio](https://github.com/Perfare/AssetStudio)

## 脚本

### decrypt.js

将同目录 Custom 文件夹进行批量解密

### splitPack.js

将同目录 packs 文件夹进行批量分片

## 运行

1. 执行 `node decrypt.js`
2. 执行 `node splitPack.js`
3. 解包出以下文件

   ![1704853830188](/image/readme/1704853830188.png)

4. AssetStudio: File -> load folder (CUSTOM_DEC 或者 PACKS_DEC)

   ![1704853934393](image/readme/1704853934393.png)

5. 导出 prefab
