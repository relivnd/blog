---
title: 'Homebrew'
date: '2026-10-11T15:26:30+02:00'
summary: 'Certainly no hidden gem anymore, but Homebrew is the best package manager for macOS'

category: 'Coding'

link: 'https://brew.sh/'


tags: ["macOS"]
---

Certainly no hidden gem anymore, but Homebrew is my preferred package manager for macOS. Did you know that you can export all your taps, casks and formulae to a Brewfile and back it up?

```sh
brew bundle dump --force --file .Brewfile
brew bundle install --file .Brewfile
```

I keep a backup of my Brewfile using [chezmoi](/tools/chezmoi).
