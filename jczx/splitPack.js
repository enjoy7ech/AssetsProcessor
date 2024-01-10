const fs = require("fs");

const files = fs.readdirSync("./packs");

fs.rmSync("./PACKS_DEC", { recursive: true, force: true });
fs.mkdirSync("./PACKS_DEC");

files.forEach((fileName) => {
  console.log(`handle ${fileName}=====>`);
  const content = fs.readFileSync(`./packs/${fileName}`, "hex");
  const gt = content.matchAll(/556e6974794653/g);
  let n = 0;
  let fake = true;
  let isFirst = true;
  let v = gt.next();
  let pre, nxt;
  while (!v.done) {
    if (fake) {
      if (!isFirst) {
        fs.writeFileSync(
          `./PACKS_DEC/${fileName.split(".bs")[0]}_${n}.bs`,
          Buffer.from(content.substring(nxt, v.value.index), "hex")
        );
        n++;
      }
      isFirst = false;
      fake = false;
      pre = v.value.index;
    } else {
      nxt = v.value.index;
      fake = true;
    }
    v = gt.next();
  }
  fs.writeFileSync(
    `./PACKS_DEC/${fileName.split(".bs")[0]}_${n}.bs`,
    Buffer.from(content.substring(nxt), "hex")
  );

  return false;
});
