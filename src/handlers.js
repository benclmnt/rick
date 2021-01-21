import config from './config.json';

const DEFAULT_CONFIG_KEY = '$default$';

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
    switch (config[key].type) {
      case 'querystring':
        handler = new QueryBasedHandler(config[key]);
        break;
      case 'path':
        handler = new PathBasedHandler(config[key]);
        break;
      case 'redirect':
        handler = new RedirectHandler(config[key]);
        break;
      default:
        // we are making redirect as the default.
        handler = new RedirectHandler(config[key]);
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

      if (DEFAULT_CONFIG_KEY in config) {
        return await this.getHandler(DEFAULT_CONFIG_KEY).handle(tokens);
      }
    }

    // Prevent favicon requests from https://stackoverflow.com/questions/1321878
    // This part should not be reached  if `/` is set to display the list page
    // and DEFAULT_CONFIG_KEY exists in the config file
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
  constructor(config) {
    super(config.docstring);
    this.redirectUrl = config.base_url;
  }

  async handle() {
    return redirect(this.redirectUrl);
  }
}

function redirect(toUrl) {
  return Response.redirect(toUrl);
}

export class QueryBasedHandler extends BaseHandler {
  constructor(config) {
    super(config.docstring);
    this.base_url = config.base_url;
    this.q_params = config.q_params || [];
  }

  async handle(tokens = []) {
    let url = new URL(this.base_url);

    // attempting to merge any extra tokens with the last token
    if (tokens.length > this.q_params.length) {
      tokens[this.q_params.length - 1] = tokens
        .slice(this.q_params.length - 1)
        .join(' ');
    }

    // try to extract the query part from a url.
    //
    // Note: Only the last token is processed, and only the first search params is matched.
    //
    // Rationale: I don't want to iterate through all the possible URLSearchParams keys
    // since it might differ from site to site. Example: youtube uses "search_query", google uses "q" as key.
    //
    // Usage: "g https://www.youtube.com/results?search_query=rick" will search google for "rick".
    try {
      tokens[this.q_params.length - 1] = new URL(
        tokens[this.q_params.length - 1],
      ).searchParams
        .values()
        .next().value;
    } catch (err) {
      // err might be caused because there is not enough token, or the token does not form a url
      // for both cases, we ignore the result from querystringFromUrl
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

export class PathBasedHandler extends BaseHandler {
  constructor(config) {
    super(config.docstring);
    this.base_url = config.base_url;
    this.options = config.options || {};
    this.keywords = config.keywords || [];
  }

  async handle(tokens = []) {
    let urlstring = this.base_url;

    for (let i = 0; i < this.keywords.length; i++) {
      let key = this.keywords[i];
      let token = tokens[i];

      // token is undefined here meaning not enough tokens to fill in all keywords
      // so, we just take what has been substituted so far.
      if (!token) {
        urlstring = urlstring.slice(0, urlstring.search(/{{/));
        break;
      }

      let regexp = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      urlstring = urlstring.replace(
        regexp,
        this.options[key] !== undefined && token in this.options[key]
          ? this.options[key][token]
          : token,
      );
    }

    return redirect(new URL(urlstring).href);
  }
}

const app = new MainHandler();

export default app;
