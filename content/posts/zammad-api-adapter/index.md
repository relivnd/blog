---
title: "Zammad API Adapter"
summary: "❗Disclaimer: This blog text was initially written for the blog of my former employer TEQLY. It has been translated and reposted here. Organized thanks to Zammad - To record and manage support requests, we at TEQLY use an open-source software called Zammad. If a customer has a support request, they can send a message to our support email and a ticket is opened in Zammad."
date: '2023-07-31T00:00:00+02:00'
weight: 6
tags: ["JavaScript", "API", "Projects", "Open Source"]
author: ["relivnd"]
social:
  fediverse_creator: "@relivnd@mastodon.social"
cover-image: "//posts/zammad-api-adapter/cover.png"
---

❗**Disclaimer:** This blog text was initially written for the blog of my former employer TEQLY. It has been translated and reposted here.

## Organized thanks to Zammad

To record and manage support requests, we at TEQLY use an open-source software called Zammad. If a customer has a support request, they can send a message to our support email and a ticket is opened in Zammad. This is incredibly practical for us. Everyone can always see which requests need to be answered and we can distribute the tasks among us according to expertise. Zammad also offers the option of entering tickets yourself or creating them via API. My colleague Andreas described what an API is in a blog article a few weeks ago. (Article is not available anymore)

## It all started with EASIT.rent

A few weeks ago, we launched our rental service "EASIT - IT simply simple". For this, we wrote a website with Gatsby, a static website generator framework based on React. Gatsby has the advantage that it creates particularly fast, secure and scalable websites. The fact that we at TEQLY are already pretty good at using React also played a role. Now the following question has arisen: How do potential customers get in touch with us? Of course, the answer is a contact form. But where should these inquiries go? To Zammad, of course. But how do we integrate Zammad into our website?

## Lack of official support

Unfortunately, Zammad does not officially support Javascript. Javascript is the programming language in which websites are built with Gatsby. Only Ruby & PHP are officially supported. There are also third-party clients for Python, .NET, Android and Golang. However, there is no mention of Javascript on the website. But that doesn't necessarily mean anything. After all, it is not impossible that there was a developer before us who has already solved the problem for us. The first port of call for software packages in Javascript is the NPM directory. NPM stands for Node Package Manager and is also the source from which we obtained Gastsby and React. The Node Package Manager manages and versions software dependencies.

## Profit from the work of others...

Indeed! Someone seems to have already solved the problem. On npmjs.com there is a package with the name Zammad JS API Implementation. But there are two problems: The package was last updated 2 years ago. This does not necessarily mean anything bad, but it does not really inspire confidence. The package is also rather poorly documented and attracts two more dependencies. Ultimately, we don't need a full Zammad JS API client. We just want to be able to create tickets. That has to be easier! So we write the adapter ourselves. There are a few approaches on the Internet. However, it takes almost a whole afternoon for the first ticket to appear in Zammad via the API. But that's the breakthrough.

## Reuse in the security check

For a marketing campaign, we decided to write a security check for SMEs. This project was also implemented with Gatsby. To create surveys quickly and easily, we also used the SurveyJS framework this time. The result is impressive:

The results of the check do not leave the browser. If you would like advice at the end, you can enter your contact details so that we can contact you. So that the answers do not disappear into nirvana, a ticket should be created again. With a small adjustment, the EASIT adapter will soon be adapted for the new project and in operation.

## Release as a package

So that we can also use the adapter in future projects, we have rewritten it a little more generically. It can now be integrated into any Javascript project. A new object of the ZammadTicketCreator class is created and initialized with the server URL of the Zammad instance, a fingerprint (for security reasons) and a source (this determines the title of the Zammad ticket created). The created object has a send() method, which creates a ticket. In practice, this looks like this:

```blog/content/posts/zammad-api-adapter/example.js#L1-4
const ZammadTicketCreator = new ZammadTicketCreator(serverUrl, fingerprint, source)

ZammadTicketCreator.send("Customer Name","test@email.com", {this: "test"})
```

At TEQLY we mainly work with open-source projects. We are happy to be able to benefit from the intellectual property of others. For this reason, we would like to give something back from time to time. Perhaps in the near future someone else will encounter the same problem or want to develop the adapter further. The adapter is free to download in the NPM directory.
