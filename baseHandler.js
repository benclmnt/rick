/**
 * Base class Handler
 *
 * @class Handler
 */
export class BaseHandler {
  constructor(doc) {
    if (this.constructor == BaseHandler) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.doc = doc;
  }

  get doc() {
    return this._doc;
  }

  set doc(value) {
    if (this.doc) {
      throw new Error('Cannot re-write doc');
    }
    this._doc = value;
  }

  async handle(tokens) {
    throw new Error("Method 'handle(tokens)' must be implemented.");
  }
}

export class MainHandler extends BaseHandler {
  constructor(doc) {
    super(doc);
    this.handlers = {};
  }

  /**
   *
   * @param {String} keyword
   * @param {BaseHandler} handler
   */
  addHandler(keyword, handler) {
    this.handlers[keyword] = handler;
  }

  async handle(tokens) {
    console.log(tokens)

    if (tokens.length > 0) {
      const [command, ...otherTokens] = tokens;
      const commandLowerCase = command.trim().toLowerCase();

      if (commandLowerCase in this.handlers) {
        return await this.handlers[lowerCommand].handle(otherTokens);
      }
    }

    return new Response('Command not supported yet.', {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  }
}
