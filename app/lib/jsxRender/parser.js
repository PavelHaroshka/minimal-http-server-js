const env = require("./env");

const parseJSX = (input) => {
  input = input.trim();

  // Self-closing tag: <tagName .../>
  const selfClosingMatch = input.match(/^<(\w+)([^>]*)\/>$/);
  if (selfClosingMatch) {
    const [, tag, propsStr] = selfClosingMatch;
    return createElement(tag, parseProps(propsStr));
  }

  // Normal tag: <tagName ...>children</tagName>
  const tagMatch = input.match(/^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/);
  if (tagMatch) {
    const [, tag, propsStr, childrenStr] = tagMatch;
    const children = parseChildren(childrenStr);
    return createElement(tag, parseProps(propsStr), ...children);
  }

  // Plain text node
  return input;
};

const parseProps = (propsStr) => {
  const props = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(propsStr)) !== null) {
    props[match[1]] = match[2];
  }
  return Object.keys(props).length ? props : null;
};

const parseChildren = (str) => {
  const children = [];
  let rest = str.trim();

  while (rest.length) {
    // Match first tag
    const tagMatch = rest.match(/^<(\w+)([^>]*)>([\s\S]*?)<\/\1>/);
    const selfClosingMatch = rest.match(/^<(\w+)([^>]*)\/>/);

    if (tagMatch) {
      const [full, tag, propsStr, inner] = tagMatch;
      children.push(
        createElement(tag, parseProps(propsStr), ...parseChildren(inner))
      );
      rest = rest.slice(full.length).trim();
    } else if (selfClosingMatch) {
      const [full, tag, propsStr] = selfClosingMatch;
      children.push(createElement(tag, parseProps(propsStr)));
      rest = rest.slice(full.length).trim();
    } else {
      // Text node until next tag
      const textMatch = rest.match(/^[^<]+/);
      if (textMatch) {
        children.push(textMatch[0]);
        rest = rest.slice(textMatch[0].length).trim();
      }
    }
  }

  return children;
};

const createElement = (nodeName, attributes, ...args) => {
  const children = args.length ? [].concat(...args) : null;
  return { nodeName, attributes, children };
};

const renderJSXNodes = (node) => {
  if (typeof node === "string") return env.createTextNode(node);

  // create a node
  let parent = env.createElement(node.nodeName);
  // attach attributes
  const attibutes = node.attributes || {};
  Object.keys(attibutes).forEach((attribute) =>
    parent.setAttribute(attribute, attibutes[attribute])
  );
  // build and append children
  const children = node.children || [];
  children.forEach((child) => parent.appendChild(renderJSXNodes(child)));

  return parent.outerHTML;
};

module.exports = { parseJSX, renderJSXNodes };
