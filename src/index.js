import parse from 'url-parse';
import handler from './handlers.js';
import config from './config.json';

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const requestUrl = new URL(request.url);
  // returns list page
  if (['/', '/cmdlist'].includes(requestUrl.pathname)) {
    const { default: html } = await import('./resources/cmdlist.html');
    return new Response(html, {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  }

  /**
  if (requestUrl.pathname === '/_opensearch') {
    const { default: openSearchDescription } = await import(
      './resources/_opensearch.xml'
    );
    return new Response(openSearchDescription, {
      headers: { 'content-type': 'application/xml' },
    });
  }
  */

  const query = extractQuery(request.url);
  const tokens = tokenize(query);

  return await handler.handle(tokens);
}

/**
 * Respond with hello worker text
 * @param {String} urlString
 */
function extractQuery(urlString) {
  // https://github.com/taneliang/neh/blob/main/src/util.ts
  // Use url-parse instead of URL for pathname as double slashes in the URL will be
  // removed by Cloudflare to single slash.
  const parsedUrl = parse(urlString, true);
  const url = new URL(urlString);
  let query = decodeURIComponent(parsedUrl.pathname + url.search + url.hash);
  if (query.charAt(0) === '/') {
    query = query.substring(1);
  }
  return query;
}

/**
 *
 * @param {string} query
 * @returns {string[]}
 */
function tokenize(query) {
  // split on whitespaces and remove falsy values (empty string)
  let tokens = query.split(/\s+/).filter(c => c);

  if (tokens.length <= 1) {
    return tokens;
  }

  // attempt to merge keyword
  while (tokens.length > 1) {
    const mergedKeyword = `${tokens[0]} ${tokens[1]}`.trim();
    if (!(mergedKeyword in config)) {
      return tokens;
    }
    tokens.shift();
    tokens[0] = mergedKeyword;
  }

  return tokens;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
