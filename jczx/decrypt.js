const fs = require("fs");

const files = fs.readdirSync("./CUSTOM");

fs.rmSync("./CUSTOM_DEC", { recursive: true, force: true });
fs.mkdirSync("./CUSTOM_DEC");
fs.rmSync("./CUSTOM_DEC_FAIL", { recursive: true, force: true });
fs.mkdirSync("./CUSTOM_DEC_FAIL");

console.log(`共${files.length}个文件`);

let n = 0;
files.forEach((fileName) => {
  const content = fs.readFileSync(`./CUSTOM/${fileName}`, "hex");
  const rg = content.match(/556e6974794653/g);
  if (rg && rg.length === 2) {
    n++;
    fs.writeFileSync(
      `./CUSTOM_DEC/${fileName}`,
      Buffer.from(
        content.replace(/556e6974794653.*556e6974794653/, "556e6974794653"),
        "hex"
      )
    );
  } else {
    fs.writeFileSync(
      `./CUSTOM_DEC_FAIL/${fileName}`,
      Buffer.from(content, "hex")
    );
  }
});

console.log(`共解密${n}个文件`);
