---
title: "What happens if you leak AWS Credentials in GitHub?"
summary: "Mishaps can happen. An ill-considered git add . and you accidentally push your .env file containing AWS credentials into a public GitHub repository. I've conducted a small experiment with an empty account to show you what happens next."
date: '2024-06-26T00:00:00+02:00'
weight: 4
tags: ["AWS", "Security", "GitHub", "DevOps"]
author: ["relivnd"]
social:
  fediverse_creator: "@relivnd@mastodon.social"
---

![Header Image](Blog_Post_Title_Picture-1.png)

Mishaps can happen. An ill-considered `git add .` and you accidentally push your .env file containing AWS credentials into a public GitHub repository. I've conducted a small experiment with an empty account to show you what happens next.

❗**Never experiment with credentials in a production environment with productive workloads.** Serious consequences can occur. In this example, the used account was deleted after the experiment.

## Setup

To start our experiment, we need to make some preparations first and set up our AWS account, a public GitHub repository and a small application.

### Account and user

Since we're talking about AWS-specific things, let's get familiar with the AWS vocabulary first. In AWS, Accounts are containers which bundle AWS resources and services. All you need to open an account are an email address and a valid credit card. Hobbyists might use a single account and run multiple workloads in them. Businesses and professionals should segregate different workloads into different accounts for security purposes. Why this is important will be clear by the end of this article.

![](Blank-diagram---Page-1.png)

For our experiment, we start with an empty account and create an IAM User. We shall call it _careless_user_. A user is an entity in an AWS Account that has certain roles or permissions attached either directly to itself or to a user group it belongs. In our case, our user doesn't need any permissions, since we don't want it to perform any actions on AWS.

### Access Keys

To authenticate as this user, we need to create some access key. Access keys are credentials, consisting of a key name and a secret string. Creating access keys is easy. Select the user and click the _Create access keys_ button within the _Security Credentials_ tab. The AWS console then guides you through a wizard, pointing out, that for various purposes there are more secure options than static access keys.

💡**Best practice for human users is to use other authentication solutions than IAM Users and static credentials. Use an identity provider such as AWS IAM Identity Center or EntraID (AzureAD) to create temporary credentials.**

Once the credentials are created, you can either copy and paste them to a secure location or download the .csv file.

![](Screenshot-2024-06-13-at-18.21.44.png)

### Repository

To see what happens when we push AWS secrets into a public GitHub repository, we need a public GitHub repository. In our case, I created one and called it _careless_access_keys_.

![](Screenshot-2024-06-13-at-18.23.28.png)

### Application

To simulate our mistake, we need a small application. I wrote the following three lines of javascript and ran `npm install dotenv`. With dotenv, we can read values from `.env` files, which is super common when locally developing software. In our mini-application, we read the values from the .env file and print them out on the stdout/console.

```blog/content/posts/aws-credentials-github-leak/app.js#L1-4
require('dotenv').config()
console.log(process.env.KEYID)
console.log(process.env.PW)
```

The .env file looks as follows:

```blog/content/posts/aws-credentials-github-leak/.env#L1-2
KEYID=AKIA6ODU2M22LJXCTOPC
PW=aYzo2Rxoo***********xKj
```

## Experiment

With all the requirements set up, it's time to push some secrets to GitHub.

### First try

We add and commit all the files to our Git repository. If we now try to push (even with the --force flag set), GitHub won't let us. We face the following error message:

![](image-1.png)

> GH013: Repository rule violations found for refs/heads/main

This is good news. GitHub won't let us push secret-looking strings to our repository by default. Thus we follow the link presented and head over to GitHub.

![](Screenshot-2024-06-13-at-18.47.11.png)

We select one of the three options and allow us to expose the secret-looking file.

![](Screenshot-2024-06-13-at-18.46.20.png)

### Second try

We now push again and won't face the error message. Almost instantly our files become visible on GitHub.

![](Screenshot-2024-06-13-at-18.50.37.png)

But within seconds we receive three emails. Two regarding the exposition and one regarding the automatically opened support case.

![](image.png)

What has happened? Let's go through the first email and read what AWS is asking us to do:

> We have become aware that the AWS access key AKIA6ODU2M22LJXCTOPC, belonging to User careless_user, along with the corresponding secret key is publicly available online at https://github.com/relivnd/careless_access_keys/blob/cc020b7d43fd742d0df17e4f676079d05d41434a/.env.
>
> To protect your account, we have temporarily limited your ability to use some AWS services.
>
> To restore access, you must contact AWS by 2024-06-18 and follow the instructions below. If you do not contact AWS by 2024-06-18, we may suspend your account. We may terminate any suspicious resources on your account, and some resources may not be recoverable once terminated.

We automatically got restricted from our account. To free our account again, we have to follow the next steps:

**Step 1:** If your application uses the exposed access key, you need to replace the key. To replace the key, first create a second key (at that point both keys will be active). Then, modify your application to use the new key.

Fortunately, we don't run any production workload in our account. Thus we're not going to create more access keys. In reality, creating a new key first might be crucial, because as soon as you delete the compromised one, the productive application might become unusable, resulting in damages depending on the downtime.

> Next, disable (do not delete) the exposed key by clicking on the "Make inactive" option in the console. If there are any problems with your application, you can reactivate the exposed key. When your application is fully functional using the new key, please delete the exposed access key AKIA6ODU2M22LJXCTOPC.

Although rotating keys void the compromised secrets, we still have to monitor our account closely. If the leaked user had permission to create new keys or other users, we must monitor if we see any unwanted activity within our account.

**Step 2:** Check your CloudTrail log for unwanted activity.

> Check your account for any unwanted activity, such as creation of unapproved IAM users and/or associated passwords (login profile), access keys, policies, roles or temporary security credentials by checking your CloudTrail log, and immediately delete them.

Some criminals are not about gaining access to your infrastructure to steal data or information. Some just want to cause chaos. To hurt a competitor, starting up some expensive EC2 instances in far-away regions can lead to an expensive cost incident.

**Step 3:** Review your AWS account for any unwanted AWS usage.

> Check your account for any unwanted usage, such as EC2 instances, Lambda functions, or EC2 Spot bids by logging into your AWS Management Console and reviewing each service page.

Finally, to free our account again from all restrictions, we have to contact the support team of AWS. Our account might be permanently suspended if we don't reply to the automatically opened support case.

**Step 4:** You must respond to the existing Support Case or create a new one to confirm completion of steps 1-3 in order to restore access to your account, prevent suspension, and apply for a billing adjustment, if applicable.

After following these four steps, we receive the following reply from AWS:

> Dear AWS Customer,
>
> Thank you for deleting your compromised AWS Access Key(s) of account ending with ****. Please ensure that no unauthorized resources remain on your account, and we ask that you pay special attention to IAM users and EC2 instances. Please take steps to prevent any new credentials from being published in this manner again.
>
> Thank you for trusting your business to AWS. We work hard to keep you safe!
>
> Sincerely,
> Amazon Web Services

## Result

What do we learn from this experiment?

### What could've happened

There's no way of knowing who has our keys after a leak. Whoever has them can perform any action in our AWS account which our user is capable of. This could mean creating EC2 instances, new keys, users or deleting databases, buckets, etc.

### Secret Scanning

GitHub has a feature called Secret Scanning. Secret scanning is by default scanning all commits if they contain any secret-looking information. AWS secrets follow a known pattern. Thus GitHub tries to prevent us from pushing them in the first place. Since AWS is partnering up with GitHub to prevent any damage to its customers and own infrastructure, the secret-looking strings are sent to AWS where they trigger the response in the form of the account restrictions and the support case.

![](secret-scanning-flow.png)

If a business is operating a platform using secret strings you can as well partner up with GitHub to prevent your customers from leaking secrets. Find more information at the [Secret scanning partner program](https://docs.github.com/en/code-security/secret-scanning/secret-scanning-partner-program).

I haven't tried it myself, but there's a similar feature by GitLab. You can read more about it at their [Secret push protection documentation](https://docs.gitlab.com/ee/user/application_security/secret_detection/secret_push_protection/).

### Deleting the repository or making it private again

If you ever leak secrets by accident, deleting the repository or making the repository private doesn't resolve the issue and is not sufficient. The secrets might already be scraped by some fraudulent entity who's looking forward to causing you damage. Secrets and passwords should always be replaced if there's any suspicion that they might be compromised.

## What could've we done better

It's easy to say "Just be careful". Mistakes happen and we have to make sure human errors don't break our systems, since we'll never be able to fully eradicate them. Thus, here are some useful tips to make your infrastructure more secure.

### Don't use static credentials, but Identity Providers

Static credentials are an easy way to authenticate. That's why we still like to use them. One problem we face with credentials is, that we never know for sure if the entity using them matches the foreseen user. In AWS we have the option to use different Identity Providers such as EntraID or OpenID Connect (OIDC) to authenticate as users or services.

### Always use MFA when possible

Multi-Factor-Authentication or MFA is a simple but super effective way of protecting your AWS infrastructure or basically any account. If your password is ever leaked, an infiltrator can't just log into your systems, but need another sort of token.

### Account Segregation

Use different accounts for different systems, customers, teams, etc. Thanks to AWS Control Tower it has become easier than ever for organizations to manage multiple accounts within AWS. The benefit of using multiple accounts is easy. If one account gets compromised, the others are - hopefully - unaffected.

Subscribe to my newsletter to find out when I next have something exciting to tell you from the world of IT and the cloud. For inquiries regarding projects, please refer to my employer [tecRacer](https://tecracer.ch). With hundreds of certifications, years of experience and dozens of trainings we Cloud Enable your Business!
