---
title: '{{ replace .File.ContentBaseName "-" " " | title }}'
date: '{{ .Date }}'
draft: true
summary: ''

# Grouping heading on /tools. Always set this — tools without a category are
# skipped by the grouped list template. Order the groups themselves via
# params.toolCategories in config.yaml.
category: 'Coding'

# Where to get it. Named `link`, not `url`: `url` is a reserved Hugo front
# matter key that overrides the page's own permalink.
link: ''

# Optional logo, relative to this page bundle.
logo: ''

tags: []
---
