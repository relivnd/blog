# blog

Source for [eu-central-2.ch](https://eu-central-2.ch/). Hugo, deployed to S3 +
CloudFront by `.github/workflows/publish.yml` on every push to `main`.

Theme: [`themes/eu-central-2`](themes/eu-central-2/README.md) — in-repo, not a
submodule. Read that README for front matter fields, params and shortcodes.

## Develop

```bash
hugo server -D            # http://localhost:1313
./scripts/smoke.sh        # build + assert every theme feature rendered
```

## Create content

```bash
hugo new content posts/my-post/index.md
hugo new content talks/my-talk/index.md
hugo new content tools/my-tool/index.md
```

Posts, talks and tools are all page bundles: put images next to `index.md` and
reference them by filename.

## Requirements

Hugo 0.158+. Standard build is enough — the theme deliberately avoids Sass,
PostCSS and `js.Build` so it matches the plain Hugo installed in CI.
