const { tokenize } = require("./lexer");
const { parseJSX } = require("./parser");
const { renderJSX, transpileJSX } = require("./render");

const JSX = {
  compile: (template) => (ctx) => {
    const tokens = tokenize(template);
    // console.log(JSON.stringify(tokens));
    const ast = parseJSX(tokens);
    // console.log(JSON.stringify(ast));
    const jsx = transpileJSX(ast, ctx);
    // console.log(JSON.stringify(jsx));

    const output = renderJSX(jsx);
    return output;
  },
};
module.exports = { JSX };
