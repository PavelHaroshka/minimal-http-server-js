const fs = require("node:fs");
const path = require("path");

const renderStrategy = (templatePath, options) => {
  const filePath = options?.templateDir
    ? path.join(options.templateDir, templatePath)
    : templatePath;

  const isFileExists = fs.existsSync(filePath);

  if (isFileExists) {
    return fs.readFileSync(filePath).toString();
  } else
    throw {
      name: "TemplateEngineError",
      message: `File: ${filePath} does not exist`,
      code: 404,
    };
};

const templateDir = path.join(process.cwd(), "app", "views");

const Router = require("../../lib/router");

const baseRouter = new Router("/").get("", (req, res) => {
  const templatePath = "main.html";
  const template = renderStrategy(templatePath, { templateDir });

  return res
    .status(200)
    .headers({
      "Content-Type": "text/html",
      "Content-Length": template.length,
    })
    .body(template)
    .send();
});

module.exports = baseRouter;
