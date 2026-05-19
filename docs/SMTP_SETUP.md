# SMTP Setup

This app sends email by acting as an SMTP client. It does not include a production mail server.

For ablaut, that is the recommended setup:

- local development: use the included mail catcher (`maildev`)
- production: use an external SMTP provider

This document is written for people who have never set up SMTP before.

## What SMTP means here

ablaut needs SMTP for:

- account verification emails
- password reset emails
- invite emails later
- assignment and notification emails later

You do not need to run your own public mail server for that.
You only need an SMTP provider that will send emails for your domain.

## Recommended beginner choice

If you want the easiest setup, start with Brevo.

Why:

- straightforward dashboard
- free plan exists
- SMTP credentials are easy to find
- good fit for transactional app email

## Free options

Free plans and limits can change. Check the provider pages before promising anything to users.

As checked on 2026-05-16:

1. Brevo
   - free plan
   - 300 emails per day
   - no credit card required according to their help docs

2. Mailgun
   - free plan
   - 100 messages per day
   - no credit card required according to their help docs

3. Resend
   - free plan
   - 100 emails per day and 3,000 per month
   - SMTP relay supported

4. Postmark
   - free developer tier
   - 100 emails per month
   - best for testing or very low volume

5. Amazon SES
   - usually the cheapest at scale
   - more setup complexity
   - AWS says new free-tier customers get up to 3,000 free message charges per month for the first 12 months

## Which provider should I pick?

Use this rule:

- easiest for non-technical teams: Brevo
- cheapest serious production option: Amazon SES
- developer-friendly alternative: Resend
- okay for very small projects: Mailgun free plan
- not really a free production option: Postmark

## General setup steps

No matter which provider you choose, the flow is usually:

1. Create an account with the provider.
2. Add your sending domain, such as `example.com`.
3. Add the DNS records they ask for.
   - usually SPF
   - usually DKIM
   - sometimes a tracking or verification record
4. Wait for the provider to show the domain as verified.
5. Create or reveal SMTP credentials.
6. Put those credentials into ablaut `.env`.
7. Restart the app.
8. Trigger a password reset or verification email and confirm delivery.

## ablaut environment variables

Put these in `.env`:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com
```

Notes:

- `SMTP_FROM` should be an address from your verified sending domain
- prefer port `587`
- if your provider explicitly tells you to use SSL/TLS on connect, use `465`

## Brevo step by step

Official docs:

- pricing/help: https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans
- SMTP setup: https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP
- SMTP relay docs: https://developers.brevo.com/docs/smtp-integration

Steps:

1. Create a Brevo account.
2. Go to the transactional email / SMTP area.
3. Add your sending domain.
4. In your DNS provider, add the records Brevo gives you.
5. Wait until Brevo shows the domain as authenticated.
6. Create or reveal your SMTP credentials.
7. Use these values in ablaut:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-login
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM=noreply@yourdomain.com
```

8. Restart ablaut.
9. Test a password-reset email.

## Amazon SES step by step

Official docs:

- pricing: https://aws.amazon.com/ses/pricing/
- SMTP credentials: https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html
- SMTP connection: https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html

SES is excellent, but it is less beginner-friendly than Brevo.

Steps:

1. Create an AWS account.
2. Open Amazon SES in one AWS region, for example `eu-central-1` or `us-east-1`.
3. Verify your sending domain in SES.
4. Add the DNS records AWS gives you.
5. Create SMTP credentials from the SES console.
6. Copy the SMTP username and password immediately.
7. Use the SES SMTP endpoint for your region.
8. Set ablaut `.env` like this:

```env
SMTP_HOST=email-smtp.<your-region>.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

9. Restart ablaut.
10. Test email delivery.

Important:

- SES SMTP credentials are region-specific
- do not use normal AWS access keys as the SMTP password

## Mailgun step by step

Official docs:

- free plan: https://help.mailgun.com/hc/en-us/articles/203068914-What-does-the-Free-plan-offer
- SMTP credentials: https://help.mailgun.com/hc/en-us/articles/203380100-Where-can-I-find-my-API-keys-and-SMTP-credentials
- SMTP sending docs: https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-smtp

Steps:

1. Create a Mailgun account.
2. Add a sending domain.
3. Add the Mailgun DNS records to your DNS provider.
4. Wait for domain verification.
5. Open the domain settings and locate SMTP credentials.
6. Reset or create the SMTP password and save it.
7. Put the values into ablaut:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-domain-smtp-username
SMTP_PASS=your-domain-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

8. Restart ablaut.
9. Test email delivery.

## Resend step by step

Official docs:

- pricing: https://www.resend.com/pricing
- quotas: https://resend.com/docs/knowledge-base/resend-sending-limits

At the time of writing, Resend supports SMTP relay and has a free tier, but check their current dashboard docs before setup because product details evolve quickly.

Typical steps:

1. Create a Resend account.
2. Add and verify your sending domain.
3. Create SMTP credentials in the Resend dashboard.
4. Put them into ablaut `.env`.
5. Restart the app and test email.

## Postmark step by step

Official docs:

- pricing: https://postmarkapp.com/pricing/
- SMTP details: https://postmarkapp.com/support/article/811-what-are-the-smtp-details-api-tokens-i-should-be-using

Typical values:

```env
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=<server-api-token-or-smtp-token-user>
SMTP_PASS=<server-api-token-or-smtp-token-secret>
SMTP_FROM=noreply@yourdomain.com
```

Postmark is excellent, but the free tier is mostly for testing.

## Local development

For local development with Docker Compose, you can use `maildev`.

Example local `.env` values:

```env
SMTP_HOST=maildev
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@ablaut.local
```

Then open the Maildev UI:

```text
http://localhost:1080
```

## Troubleshooting

If email does not arrive:

1. Confirm the app restarted after `.env` changes.
2. Confirm your domain is verified in the provider dashboard.
3. Confirm `SMTP_FROM` matches your verified domain.
4. Try port `587` first.
5. Check provider activity logs.
6. Check spam/junk folders.
7. Trigger a password reset and review app logs.

## Recommendation for ablaut deploys

Use this as the default guidance:

- local or staging: `maildev`
- simple production: Brevo
- advanced or high-volume production: Amazon SES
