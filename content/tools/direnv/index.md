---
title: 'Direnv'
date: '2026-10-11T15:26:42+02:00'
summary: 'Direnv helps me manage AWS- & Kube-Configs'

category: 'Coding'

link: 'https://direnv.net/'

tags: ["Go", "Tools", "Shell", "CLI"]
---

Direnv is a sleek Go project aimed at simplifying environment variable management. I use it to manage my AWS & Kubeconfigs. When entering a folder, Direnv automatically exports all the values stored in the `.envrc` file in my project folder. My .envrc file usually looks something like this:

```sh
export AWS_CONFIG_FILE="$(pwd)/.aws/config"
export AWS_PROFILE="relivnd"
export KUBECONFIG="$(pwd)/.kube/config"
```

Notice how I override the default locations for the AWS & Kubeconfig to a local file. Consequently my project structure looks something like this:

```
.
├── .aws
│   └── config
├── .envrc
├── .kube
│   └── config
├── README.md
├── other project files...
```

This means that whenever I or my agent is doing something while being in this folder, the local configuration is used. I find it a great way to keep different accounts, customers and deployments apart. Entering and leaving folders looks something like this:


```sh
# Entering a project folder
$ cd project_folder
direnv: loading ~/project_folder/.envrc
direnv: export +AWS_CONFIG_FILE +AWS_PROFILE +KUBECONFIG

# Leaving a project folder
$ cd ..
direnv: unloading
```
