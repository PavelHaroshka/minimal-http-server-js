const fs = require("node:fs");
const path = require("path");
const mime = require("mime-types");

const Router = require("./router");

module.exports = function (basePath, fileDir = "public") {
  const staticRouter = new Router(basePath).get(
    "",
    (req, res) => {
      const fileName = req.path.current.replace("/", "");
      const filePath = path.join(fileDir, fileName);
      const isFileExists = fs.existsSync(filePath);

      if (isFileExists) {
        const fileContent = fs.readFileSync(filePath);

        return res
          .status(200)
          .headers({
            "Content-Type": mime.lookup(filePath),
            "Content-Length": fileContent.length,
          })
          .body(fileContent)
          .send();
      } else return res.status(404).send();
    },
    {
      wildcard: true,
    }
  );
  return staticRouter;
};
