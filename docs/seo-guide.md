# SEO Configuration

SkillBridge includes a basic SEO settings page inside the admin dashboard under
`/dashboard/admin/settings/seo`. From there you can update meta tags, manage the
sitemap and edit the content of `robots.txt`.

## Serving robots.txt

Next.js automatically serves any files placed in `frontend/public` at the site
root. To expose a `robots.txt` file, create or upload it to
`frontend/public/robots.txt`. After rebuilding the frontend the file will be
available at `https://yourdomain.com/robots.txt`.

A recommended starting point is:

```txt
User-agent: *
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /delete-account
Disallow: /error/
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

Replace `yourdomain.com` with your real domain name.
