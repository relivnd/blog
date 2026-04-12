---
title: "Tools"
summary: "search"
placeholder: "placeholder text in search input box"
---

## Coding
Writing code is a big part of everyday life. Here are the tools I recommend.

### Zed
I'm a huge fan of Zed. At first it was just the speed that amazed me. Written in Rust, there's no comparison in speed to bulky editors like VSCode or heavy IDEs like IntelliJ. Although I've worked with both before and I think they're both great in their own way, my personal choice is Zed. But Zed isn't just blazingly fast. Zed offers features that make it stand out. The [remote development](/posts/develop-remotely-with-zed-aws) feature makes it easy to connect to development servers (e.g. a simple EC2 instance) and the AI capabilities are just on point. With their assistant features, LLMs facilitate your work exactly how and where you would expect it.

Download Zed: [zed.dev](https://zed.dev)

### Kiro
My AI agent of choice is called Kiro. More precisely the Kiro CLI. While the Kiro IDE does me good service when creating demos or PoCs, I prefer using Kiro in combination with Zed. Thanks to its [Agent Client Protocol](https://kiro.dev/docs/cli/acp/) implementation, integrating it with Zed is a breeze. You might ask: why are there two Kiro products? That's simple. In 2023, AWS acquired a startup called [fig](https://web.archive.org/web/20230605000718/https://fig.io/) and rebranded the product to Amazon Q for Developers CLI. With the announcement of the Kiro IDE, the Amazon Q for Developers CLI was renamed to Kiro CLI. Their different paths also explain the differences in features. The Kiro CLI is - like Zed - written in Rust and highly performant.
