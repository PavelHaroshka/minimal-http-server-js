const parseJSX = (tokens) => {
  const root = [];

  let i = 0;
  const peek = (offset = 0) => tokens[i + offset];
  const consume = () => tokens[i++];
  const eof = () => i >= tokens.length;

  const parse = {
    // TAG NAME (null = fragment)
    tagName() {
      const token = peek();

      // Fragment: "<>"
      if (token.type !== "identifier") {
        return null; // fragment tag
      }

      return consume().value;
    },

    // ATTRIBUTES
    attributes() {
      const attrs = [];

      while (true) {
        let token = peek();
        if (!token) break;

        if (token.type === "closeAngleBracket" || token.type === "slash") break;
        if (token.type !== "identifier") break;

        let name = consume().value;
        let value = true; // boolean attribute

        if (peek().type === "equal") {
          consume(); // "="

          let node = peek();
          if (node.type === "string") {
            value = consume().value;
          } else if (node.type === "openCurlyBracket") {
            value = this.expressionNode();
          } else {
            value = consume().value;
          }
        }

        attrs.push({ name, value });
      }

      return attrs;
    },

    // CHECK FOR CLOSING TAG
    isClosingTag(tagName) {
      // Fragment close: </>
      if (tagName === null) {
        return (
          peek().type === "openAngleBracket" &&
          peek(1).type === "slash" &&
          peek(2).type === "closeAngleBracket"
        );
      }

      // Normal element close: </tag>
      return (
        peek().type === "openAngleBracket" &&
        peek(1).type === "slash" &&
        peek(2).type === "identifier" &&
        peek(2).value === tagName
      );
    },

    // CONSUME CLOSING TAG
    consumeClosingTag(tagName) {
      consume(); // <
      consume(); // /

      if (tagName === null) {
        // Expect "</>"
        const end = consume();
        if (end.type !== "closeAngleBracket") {
          throw new Error("Expected '</>' for fragment close");
        }
        return;
      }

      const id = consume(); // identifier
      if (id.value !== tagName) {
        throw new Error(
          `Mismatched closing tag: expected </${tagName}> but got </${id.value}>`
        );
      }

      const end = consume();
      if (end.type !== "closeAngleBracket") {
        throw new Error("Expected '>' after closing tag");
      }
    },

    // TEXT NODE
    textNode() {
      let value = consume().value;
      return { type: "textNode", value };
    },

    // FRAGMENT NODE
    fragmentNode() {
      const tagName = null;
      const attributes = [];
      const children = [];

      while (!eof()) {
        if (this.isClosingTag(null)) {
          this.consumeClosingTag(null);
          break;
        }
        children.push(this.node());
      }

      return { type: "elementNode", tagName, attributes, children };
    },

    // ELEMENT NODE
    elementNode() {
      consume(); // consume "<"

      // FRAGMENT OPEN: <>
      if (peek().type === "closeAngleBracket") {
        consume(); // ">"
        return this.fragmentNode();
      }

      let tagName = this.tagName();
      let attributes = this.attributes();
      let selfClosing = false;

      // Detect "/>"
      if (peek().type === "slash") {
        consume();
        if (peek().type == "closeAngleBracket") selfClosing = true;
        consume();
      } else {
        consume(); // >
      }

      if (selfClosing) {
        return {
          type: "elementNode",
          tagName,
          attributes,
          children: [],
          selfClosing: true,
        };
      }

      // Parse children
      const children = [];
      while (!eof()) {
        if (this.isClosingTag(tagName)) {
          this.consumeClosingTag(tagName);
          break;
        }
        children.push(this.node());
      }

      return { type: "elementNode", tagName, attributes, children };
    },

    // EXPRESSION NODE (with JSX support)
    expressionNode() {
      consume(); // "{"

      let depth = 1;
      const parts = [];
      let rawBuf = "";

      const flushRaw = () => {
        if (rawBuf.length > 0) {
          parts.push({ type: "Raw", code: rawBuf });
          rawBuf = "";
        }
      };

      while (!eof()) {
        const token = peek();

        if (token.type === "openCurlyBracket") {
          consume();
          depth++;
          rawBuf += "{";
          continue;
        }

        if (token.type === "closeCurlyBracket") {
          consume();
          depth--;
          if (depth === 0) break;
          rawBuf += "}";
          continue;
        }

        // Inline JSX: <Tag>
        if (
          token.type === "openAngleBracket" &&
          peek(1) &&
          (peek(1).type === "identifier" ||
            peek(1).type === "closeAngleBracket") // support fragments here
        ) {
          flushRaw();
          const jsxNode = this.elementNode();
          parts.push({ type: "JSX", node: jsxNode });
          continue;
        }

        const node = consume();
        rawBuf += node.value != null ? node.value : "";
      }

      flushRaw();

      return {
        type: "Expression",
        parts,
      };
    },

    // GENERIC NODE
    node() {
      const token = peek();
      if (!token) return null;

      if (token.type === "openAngleBracket") return this.elementNode();
      if (token.type === "openCurlyBracket") return this.expressionNode();
      return this.textNode();
    },
  };

  while (!eof()) {
    const node = parse.node();
    if (node) root.push(node);
  }

  return root;
};

module.exports = { parseJSX };
