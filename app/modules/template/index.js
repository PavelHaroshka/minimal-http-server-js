const path = require("path");

const ejs = require("ejs");
const pug = require("pug");
const hbs = require("handlebars");

const Router = require("../../lib/router");
const {
  defaultRenderStrategy: renderStrategy,
} = require("../../lib/templateEngine");

const templateRouter = new Router("/template");

// setting common vars for demo pages
const templateDir = path.join(process.cwd(), "app", "views");

const ctx = (engineName) => ({
  title: `${engineName} Demo Page`,
  engine: engineName,
  links: [
    { href: "/template/ejs", label: "View EJS Template Version" },
    { href: "/template/pug", label: "View Pug Template Version" },
    { href: "/template/hbs", label: "View Handlebars Template Version" },
  ],
  renderedAt: new Date().toLocaleString(),
});

// EJS
templateRouter.get("/ejs", (req, res) => {
  const templatePath = "ejs.ejs";
  const template = renderStrategy(ejs, { templateDir })(
    templatePath,
    ctx("EJS")
  );

  return res
    .status(200)
    .headers({
      "Content-Type": "text/html",
      "Content-Length": template.length,
    })
    .body(template)
    .send();
});

// PUG
templateRouter.get("/pug", (req, res) => {
  const templatePath = "pug.pug";
  const template = renderStrategy(pug, { templateDir })(
    templatePath,
    ctx("PUG")
  );

  return res
    .status(200)
    .headers({
      "Content-Type": "text/html",
      "Content-Length": template.length,
    })
    .body(template)
    .send();
});

// Handlebars
templateRouter.get("/hbs", (req, res) => {
  const templatePath = "handlebars.handlebars";
  const template = renderStrategy(hbs, { templateDir })(
    templatePath,
    ctx("Handlebars")
  );

  return res
    .status(200)
    .headers({
      "Content-Type": "text/html",
      "Content-Length": template.length,
    })
    .body(template)
    .send();
});

module.exports = templateRouter;
