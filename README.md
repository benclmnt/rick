# Rick 🐰

Rick is my personal internet navigator.

I use it as my default search engine, which defaults to a normal duckduckgo search but contain some powerups, such as

1. Directly do a website search, such as MDN doc search or youtube search
2. Store personal shortcuts for frequently-accessed links e.g. school's website, zoom links, etc.

Powerups are configurable. Some of them are listed [here](https://rick.benclmnt.com/)

Personal Note: Using this tool have saved me thousands of clicks a year from just 1 routinely-visited website (cue, school's website 😀)

## Features

- simple, query-based, path-based redirection
- mappings for long items

## How to use?

There are several environment variables to change:

1. Copy `wrangler.example.toml` to `wrangler.toml` and fill in your cloudflare account id
2. You might want to change BASE_URL in `scripts/prepare.js`
3. Create `rick.config.yml`. You can find an example in `example.rick.config.yml`
4. Run `pnpm publish` to publish.

## Config

Config are listed in `rick.config.yml`. There are 3 main redirects supported by rick: simple, query, path.

### Simple

This is the simplest form of redirection.
For example, to map `cf` to `https://dash.cloudflare.com/`, you can add the following

```
cf:
    base_url: https://dash.cloudflare.com/
    docstring: "navigates to cloudflare dashboard"
```

Docstrings are optional. If you provide them, it will be shown on the homepage.

If you only have `base_url` as the property for a mapping, you can shorten it too. So,

```
cf:
    base_url: https://dash.cloudflare.com/
```

is considered equivalent to

```
cf: https://dash.cloudflare.com/
```

### Query

You can also create shortcuts for websites that uses query, e.g. search engines.
For example, rick defaults to searching using DuckDuckGo!, but you can easily switch to google using the `g` command by adding the following to your config:

```
g:
  base_url: 'https://www.google.com/search'
  docstring: 'does a google search'
  q_params: 'q'
```

You can provide more than 1 q_params too, by specifying it as a YAML list.

### Path

You can also create shortcuts for websites with guessable-path.

A great example of this type of website is github.

1. `https://github.com/` shows your homepage
2. `https://github.com/benclmnt` shows the profile page of user `benclmnt`
3. `https://github.com/benclmnt/rick` shows the repository of this project.

To create such shortcut, you'll need to add the following

```
gh:
  base_url: 'https://github.com/{{ acc }}/{{ repo }}'
  docstring: 'does a github search.'
  acc:
    home: 'benclmnt'
```

We use double curly brackets `{{}}` to denote the changeable parts (parameters) of the url. You can use this mapping as follows `gh [acc_name] [repo_name]`.

> ⚠️ The parameters should not be named `base_url`, `docstring`, `type` or `q_params`.

By default, the parameters will be whatever you typed in. If you don't supply all parameters, rick is smart enough to remove the dangling `/`s.

You can also supply known mappings, such as `home: 'benclmnt'`! So, if you type `gh home`, it is equivalent to `gh benclmnt`. This is useful if the path is identified using a long hash / uuid.

Similar to redirects, the `type` here is optional. If rick sees `{{` in the base_url, it can infer that you'd probably want a path-type 😉.

To sum up,

- `gh` maps to `https://github.com`
- `gh home` and `gh benclmnt` maps to `https://github.com/benclmnt`
- `gh home rick` maps to `https://github.com/benclmnt/rick`

### Nesting

What if you want to support both navigating to youtube homepage `yt` and youtube search `yt v`?

Since they are not path-based, you can add a `_leaf` key, which won't be added to the command as follows.

```
yt:
  _leaf: 'https://www.youtube.com'
  v:
    base_url: 'https://www.youtube.com/results'
    q_params: 'search_query'
    docstring: 'does a youtube search'
```

There is no limits to how deep you can nest the commands. So in the following example `a b c` will redirect to youtube.

```
a:
    b:
        c: 'https://www.youtube.com'
```

### Defaults

To specify defaults / fallback for commands, use the key `$default$`.

## Stack

The project runs on the awesome [Cloudflare worker](https://developers.cloudflare.com/workers/).
