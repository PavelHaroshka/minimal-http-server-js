const fs = require("node:fs");
const path = require("path");

const defaultRenderStrategy =
  (templateEngine, options) => (templatePath, ctx) => {
    const filePath = options?.templateDir
      ? path.join(options.templateDir, templatePath)
      : templatePath;

    const isFileExists = fs.existsSync(filePath);

    if (isFileExists) {
      const templateFile = fs.readFileSync(filePath).toString();
      return templateEngine.compile(templateFile)(ctx);
    } else
      throw {
        name: "TemplateEngineError",
        message: `File: ${filePath} does not exist`,
        code: 404,
      };
  };

function engine(templateEngine) {
  return {
    setEngineOptions: function (options) {
      this.options = options || {};
      return this;
    },
    setRenderStrategy: function (renderStrategy) {
      this.strategy = renderStrategy || defaultRenderStrategy;
      return this;
    },
    render: function (...args) {
      if (!templateEngine) {
        throw {
          name: "TemplateEngineError",
          message: `Template engine is not registered`,
          code: 500,
        };
      } else return this.strategy(templateEngine, this.options)(...args);
    },
  };
}

module.exports = { engine, defaultRenderStrategy };
