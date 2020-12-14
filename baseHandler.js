import config from './config.json';

const DEFAULT = '$default$';

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
  }

  getHandler(key) {
    let handler;
    let { type, base_url } = config[key];
    switch (type) {
      case 'querystring':
        handler = new QueryBasedHandler(base_url, config[key]['q_params']);
        break;
      case 'redirect':
        handler = new RedirectHandler(base_url);
        break;
      default:
        // we are making redirect as the default.
        handler = new RedirectHandler(base_url);
        break;
    }
    return handler;
  }

  async handle(tokens) {
    if (tokens.length > 0) {
      const [command, ...otherTokens] = tokens;
      let key = command.trim().toLowerCase();

      if (key in config) {
        return await this.getHandler(key).handle(otherTokens);
      }

      if (DEFAULT in config) {
        return await this.getHandler(DEFAULT).handle(tokens);
      }
    }

    // Prevent favicon requests
    // https://stackoverflow.com/questions/1321878
    return new Response(
      `
      <head> <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgo="> </head>
      <body> Nothing interesting here. </body>
      `,
      {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      },
    );
  }
}

export class RedirectHandler extends BaseHandler {
  constructor(redirectUrl, docstring) {
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

export class QueryBasedHandler extends BaseHandler {
  constructor(baseUrl, q_params, docstring) {
    super(docstring);
    this.baseUrl = baseUrl;
    this.q_params = q_params;
  }

  async handle(tokens = []) {
    let url = new URL(this.baseUrl);

    // attempting to merge into the last index
    if (tokens.length > this.q_params.length) {
      tokens[this.q_params.length - 1] = tokens
        .slice(this.q_params.length - 1)
        .join(' ');
    }

    this.q_params.map((param, idx) =>
      url.searchParams.append(
        param,
        tokens[idx] !== undefined ? tokens[idx] : '',
      ),
    );
    return redirect(url.href);
  }
}

const app = new MainHandler();

export default app;
