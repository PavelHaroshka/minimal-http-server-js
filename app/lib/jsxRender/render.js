// Convert an expression AST into executable JS code
function expressionToJS(exprNode) {
  if (!exprNode || !exprNode.parts) return "undefined";

  return exprNode.parts
    .map((part) => {
      // Raw JS parts (already code)
      if (part.type === "Raw") {
        return part.code || "";
      }
      // Nested JSX inside expressions → convert to JS object literal
      if (part.type === "JSX") {
        return jsxNodeToJS(part.node);
      }
      // Everything else → treat as string literal
      return JSON.stringify(part.value ?? "");
    })
    .join("");
}

// Convert a JSX AST node into a JS object literal string
// (this object literal is later executed inside evaluateExpression)
function jsxNodeToJS(node) {
  if (!node) return "null";

  if (node.type === "textNode") {
    return JSON.stringify(node.value);
  }

  // Expression inside JSX → wrap in parens
  if (node.type === "Expression") {
    return `(${expressionToJS(node)})`;
  }

  if (node.type !== "elementNode") {
    return JSON.stringify(node);
  }

  // Convert attributes to JS object literal array
  const attrsCode =
    "[" +
    (node.attributes || [])
      .map((attr) => {
        const name = JSON.stringify(attr.name);
        let valueCode;

        // Expression-valued attribute
        if (
          attr &&
          typeof attr.value === "object" &&
          attr.value.type === "Expression"
        ) {
          valueCode = `(${expressionToJS(attr.value)})`;
        } else {
          valueCode = JSON.stringify(attr.value);
        }

        return `{ name: ${name}, value: ${valueCode} }`;
      })
      .join(", ") +
    "]";

  // Convert children to JS
  const childrenCode =
    "[" +
    (node.children || [])
      .map((child) => {
        if (!child) return "null";
        if (child.type === "textNode") return JSON.stringify(child.value);
        if (child.type === "Expression") return `(${expressionToJS(child)})`;
        if (child.type === "elementNode") return jsxNodeToJS(child);
        return JSON.stringify(child);
      })
      .join(", ") +
    "]";

  const tagName = node.tagName === null ? "null" : JSON.stringify(node.tagName);

  // The returned JS structure is executed inside evaluateExpression
  return `({
    type: "elementNode",
    tagName: ${tagName},
    attributes: ${attrsCode},
    children: ${childrenCode}
  })`;
}

// Execute expression JS code at runtime using the context vars
function evaluateExpression(exprNode, ctx = {}) {
  if (!exprNode || !exprNode.parts) return [];

  // 1) Convert AST → JS code
  const jsCode = expressionToJS(exprNode);
  if (!jsCode || !jsCode.trim()) return [];

  try {
    // 2) Build a function with context argument names
    //    This safely injects ctx values into the evaluation scope
    const fn = new Function(...Object.keys(ctx), `return (${jsCode});`);
    const result = fn(...Object.values(ctx));

    // Expressions can return arrays or nodes → normalize
    return Array.isArray(result) ? result.flat() : [result];
  } catch (err) {
    console.error("[evaluateExpression] eval error for code:", jsCode, err);
    return [""];
  }
}

// Evaluate an expression *and* immediately transpile its output back into HTML
function evalAndTranspileExpression(exprNode, ctx) {
  let result;

  try {
    result = evaluateExpression(exprNode, ctx);
  } catch (err) {
    console.error("[Expression Eval Error]", err);
    return "";
  }

  // Converting evaluated output (JSX nodes / strings) into HTML string
  return transpileJSX(result, ctx);
}

// Convert an elementNode into final HTML
function renderElementNode(node, ctx) {
  const tag = node.tagName;

  // Evaluate attribute expressions
  const attrs = node.attributes
    .map((attr) => {
      const value =
        typeof attr.value === "object"
          ? evalAndTranspileExpression(attr.value, ctx)
          : attr.value;

      const name = attr.name === "className" ? "class" : attr.name;
      return `${name}="${value}"`;
    })
    .join(" ");

  const open = attrs.length ? `<${tag} ${attrs}>` : `<${tag}>`;

  if (node.selfClosing) return open.slice(0, -1) + " />";

  // Recursively render children
  const inner = node.children.map((child) => transpileJSX(child, ctx)).join("");

  return `${open}${inner}</${tag}>`;
}

// Normalize arbitrary JS values into transpileable nodes
function valueToNodes(value) {
  if (value == null) return [];
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return [String(value)];
  }
  if (Array.isArray(value)) return value.flatMap(valueToNodes);
  if (typeof value === "object" && value.type === "elementNode") return [value];
  if (typeof value === "object" && (value.outerHTML || value.appendChild))
    return [value];

  // Fallback → toString
  return [String(value)];
}

// Core transpiler: converts JSX AST nodes or evaluated nodes into HTML
function transpileJSX(node, ctx) {
  // Primitive nodes
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  // Nullish or boolean → empty HTML
  if (node === null || node === undefined || node === false || node === true) {
    return "";
  }

  // Arrays → flatten and transpile each
  if (Array.isArray(node)) {
    return node.map((flatNode) => transpileJSX(flatNode, ctx)).join("");
  }

  if (typeof node !== "object") {
    console.warn("[transpileJSX] Received non-object node:", node);
    return "";
  }

  // Dispatch by node type
  switch (node.type) {
    case "textNode":
      return node.value || "";

    case "elementNode":
      return renderElementNode(node, ctx);

    case "Expression":
      return evalAndTranspileExpression(node, ctx);

    default:
      console.warn("[transpileJSX] Unknown node type:", node.type, node);
      return "";
  }
}

/**
 * Render nodes to HTML string
 * Used as a final presentation step after transpileJSX
 */
function renderJSX(node) {
  if (node == null) return "";
  if (Array.isArray(node)) return node.map(renderJSX).join("");
  if (node.outerHTML) return node.outerHTML;
  if (node.children) return node.children.map(renderJSX).join("");
  return String(node);
}

module.exports = { evaluateExpression, valueToNodes, transpileJSX, renderJSX };
