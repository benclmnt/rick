import parse from 'url-parse';
import handler from './baseHandler.js';

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  // const requestUrl = new URL(request.url);

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

function tokenize(query) {
  // split on whitespaces and remove falsy values (empty string)
  return query.split(/\s+/).filter(c => c);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});