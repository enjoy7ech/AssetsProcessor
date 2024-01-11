const fs = require("fs");
const { exit } = require("process");

let files = [];
try {
  files = fs.readdirSync(process.argv[2]);
} catch (error) {
  console.error("请把Custom文件夹拖进命令行，并确保文件夹与该项目在同一个盘。");
  exit();
}

fs.rmSync(__dirname + "/../decrypted", { recursive: true, force: true });
fs.rmSync(__dirname + "/../decrypted_failed", { recursive: true, force: true });
fs.mkdirSync(__dirname + "/../decrypted/Custom", {
  recursive: true,
  force: true,
});
fs.mkdirSync(__dirname + "/../decrypted_failed/Custom", {
  recursive: true,
  force: true,
});

console.log(`共${files.length}个文件`);

let n = 0;
files.forEach((fileName) => {
  const content = fs.readFileSync(`${process.argv[2]}/${fileName}`, "hex");
  const rg = content.match(/556e6974794653/g);
  if (rg && rg.length === 2) {
    n++;
    fs.writeFileSync(
      __dirname + `/../decrypted/Custom/${fileName}`,
      Buffer.from(
        content.replace(/556e6974794653.*556e6974794653/, "556e6974794653"),
        "hex"
      )
    );
  } else {
    fs.writeFileSync(
      __dirname + `/../decrypted_failed/Custom/${fileName}`,
      Buffer.from(content, "hex")
    );
  }
});

console.log(`共解密${n}个文件`);
