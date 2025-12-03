const literals = {
  "<": "openAngleBracket",
  ">": "closeAngleBracket",
  "{": "openCurlyBracket",
  "}": "closeCurlyBracket",
  "=": "equal",
  "/": "slash",
  "(": "openParen",
  ")": "closeParen",
};

const tokenize = (code) => {
  const tokens = [];
  const src = code.replace(/\r\n/g, " ");
  const len = src.length;
  let ptr = 0;
  let mode = "TEXT"; // TEXT or TAG

  function isLiteral(c) {
    return !!literals[c];
  }

  function isWhitespace(c) {
    return c === " " || c === "\t" || c === "\n" || c === "\r";
  }

  function isIdentifierChar(c) {
    if (!c) return false;
    if (isWhitespace(c)) return false;
    if (isLiteral(c)) return false;
    if (c === '"') return false;
    return true;
  }

  while (ptr < len) {
    const current = src[ptr];

    // MODE SWITCH
    if (current === "<") mode = "TAG";
    if (current === ">") mode = "TEXT";

    // TAG MODE: ignore whitespace (DO NOT emit as text)
    if (mode === "TAG" && isWhitespace(current)) {
      ptr++;
      continue;
    }

    // LITERALS
    if (isLiteral(current)) {
      tokens.push({ type: literals[current], value: current });
      ptr++;
      continue;
    }

    // STRING
    if (current === '"') {
      let pos = ptr + 1;
      let str = "";
      while (pos < len && src[pos] !== '"') str += src[pos++];
      ptr = pos + 1;
      tokens.push({ type: "string", value: str });
      continue;
    }

    // IDENTIFIER
    if (isIdentifierChar(current)) {
      let pos = ptr;
      let str = "";
      while (pos < len && isIdentifierChar(src[pos])) str += src[pos++];
      ptr = pos;
      tokens.push({ type: "identifier", value: str });
      continue;
    }

    // TEXT MODE: whitespace becomes text, and ANYTHING that is not syntax
    if (mode === "TEXT") {
      let pos = ptr;
      let str = "";
      while (
        pos < len &&
        !isLiteral(src[pos]) &&
        src[pos] !== '"' &&
        !isIdentifierChar(src[pos])
      ) {
        str += src[pos++];
      }
      ptr = pos;
      if (str.length) tokens.push({ type: "text", value: str });
      continue;
    }

    ptr++;
  }

  return tokens;
};

module.exports = { tokenize };
