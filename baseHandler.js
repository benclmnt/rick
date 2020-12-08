const DEFAULT = '_default';

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
    // console.log(tokens);

    if (tokens.length > 0) {
      const [command, ...otherTokens] = tokens;
      const commandLowerCase = command.trim().toLowerCase();

      if (commandLowerCase in this.handlers) {
        return await this.handlers[commandLowerCase].handle(otherTokens);
      }

      // pass to default handler if no matching command.
      if (DEFAULT in this.handlers) {
        return await this.handlers[DEFAULT].handle(tokens);
      }
    }

    // Prevent favicon requests
    // https://stackoverflow.com/questions/1321878
    return new Response(
      `
      <head> <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgo="> </head>
      <body> Command not supported yet. </body>
      `,
      {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      },
    );
  }
}

export class GoogleHandler extends BaseHandler {
  async handle(tokens) {
    return redirect('https://www.google.com/search?q=' + tokens.join(' '));
  }
}

export class RedirectHandler extends BaseHandler {
  constructor(docstring, redirectUrl) {
    super(docstring);
    this.redirectUrl = redirectUrl;
  }

  async handle() {
    return redirect(this.redirectUrl);
  }
}

function redirect(toUrl) {
  return Response.redirect(toUrl);
}

// import config from './config.json'
// console.log("config", config);

const app = new MainHandler();
const goog = new GoogleHandler();
app.addHandler('g', goog);
app.addHandler(DEFAULT, goog);

export default app;
