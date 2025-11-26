const nodeBuilder = () => ({
  node: null,

  create(tagName) {
    this.node = { tagName, attributes: {}, children: [] };
    return this;
  },

  setAttribute(name, value) {
    this.node.attributes[name] = value;
    return this;
  },

  appendChild(child) {
    this.node.children.push(child);
    return this;
  },

  _compose(node) {
    if (typeof node === "string") return node;

    const attrs = Object.entries(node.attributes || [])
      .map(([attr, val]) => `${attr}="${val}"`)
      .join(" ");

    const open = attrs ? `<${node.tagName} ${attrs}>` : `<${node.tagName}>`;

    const children = (node.children || [])
      .map((c) => (typeof c === "string" ? c : this._compose(c.node || c)))
      .join("");

    return `${open}${children}</${node.tagName}>`;
  },

  get outerHTML() {
    return this._compose(this.node);
  },

  toString() {
    return this.outerHTML;
  },

  [Symbol.toPrimitive](hint) {
    return this.outerHTML;
  },
});

const createEnv = () => ({
  createTextNode: (data) => data,
  createElement: (nodeName) => nodeBuilder().create(nodeName),
});

const env = createEnv();

module.exports = env;
