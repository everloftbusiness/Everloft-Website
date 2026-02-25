Hyperspace by HTML5 UP
html5up.net | @ajlkn
Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)


So I've had the wireframe for this particular design kicking around for some time, but with all
the other interesting (and in some cases, semi-secret) projects I've been working on it took me
a little while to get to actually designing and coding it. Fortunately, things have eased up
enough for me to finaly get around to it, so I'm happy to introduce Hyperspace: a fun, blocky,
one-page design with a lot of color, a bit of animation, and an additional "owner-program" page template
(because hey, even one-page sites usually need an interior page or two). Hope you dig it :)

Demo images* courtesy of Unsplash, a radtastic collection of CC0 (public domain) images
you can use for pretty much whatever.

(* = not included)

AJ
aj@lkn.io | @ajlkn


Credits:

	Demo Images:
		Unsplash (unsplash.com)

	Icons:
		Font Awesome (fontawesome.io)

	Other:
		jQuery (jquery.com)
		Scrollex (github.com/ajlkn/jquery.scrollex)
		Responsive Tools (github.com/ajlkn/responsive-tools)


Everloft Routing Conventions (GitHub Pages + GoDaddy)

The site uses extension-less public URLs:
- https://everloft.co.in/
- https://everloft.co.in/login/
- https://everloft.co.in/dashboard/
- https://everloft.co.in/owner-program/
- https://everloft.co.in/investor-program/
- https://everloft.co.in/elements/

Implementation pattern:
- Each page lives at folder index path:
  - /login/index.html
  - /dashboard/index.html
  - /owner-program/index.html
  - /investor-program/index.html
- Legacy root .html files are kept as redirect stubs:
  - /login.html -> /login/
  - /dashboard.html -> /dashboard/
  - /owner-program.html -> /owner-program/
  - /investor-program.html -> /investor-program/

Linking rules:
- Use absolute extension-less links in HTML/JS:
  - href="/login/"
  - href="/dashboard/"
- Keep asset/script paths root-absolute from nested pages:
  - /assets/...
  - /images/...
  - /screens/...

When adding a new page:
1. Create /<slug>/index.html
2. Add root redirect file /<slug>.html to preserve backward compatibility
3. Update sitemap.xml with extension-less URL: https://everloft.co.in/<slug>/
4. Use extension-less links everywhere
