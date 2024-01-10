const fs = require("fs");

const files = fs.readdirSync("./files/Custom");

fs.rmSync("./decrypted", { recursive: true, force: true });
fs.rmSync("./decrypted_failed", { recursive: true, force: true });
fs.mkdirSync("./decrypted/Custom", { recursive: true, force: true });
fs.mkdirSync("./decrypted_failed/Custom", { recursive: true, force: true });

console.log(`共${files.length}个文件`);

let n = 0;
files.forEach((fileName) => {
  const content = fs.readFileSync(`./files/Custom/${fileName}`, "hex");
  const rg = content.match(/556e6974794653/g);
  if (rg && rg.length === 2) {
    n++;
    fs.writeFileSync(
      `./decrypted/Custom/${fileName}`,
      Buffer.from(
        content.replace(/556e6974794653.*556e6974794653/, "556e6974794653"),
        "hex"
      )
    );
  } else {
    fs.writeFileSync(
      `./decrypted_failed/Custom/${fileName}`,
      Buffer.from(content, "hex")
    );
  }
});

console.log(`共解密${n}个文件`);
