# Everloft Monolithic MVP Architecture

This project now follows a monolithic frontend structure with **MVP (Model-View-Presenter)** layering for page-level business logic.

## Structure

```
screens/
  core/
    code/
      namespace.js
      app.js
  home/
    code/
      screen/
        home.model.js
        home.view.js
        home.presenter.js
      widgets/
        contact-form.widget.js
        certificates.widget.js
  login/
    code/
      screen/
        login.model.js
        login.view.js
        login.presenter.js
      widgets/
        login-form.widget.js
  dashboard/
    code/
      screen/
        dashboard.presenter.js
      widgets/
        dashboard-shell.widget.js
```

`dashboard` logic is registered as `EverloftMVP.Presenters.dashboard` inside:

```
screens/dashboard/code/screen/dashboard.presenter.js
```

## Runtime Flow

1. `namespace.js` initializes the global app container: `window.EverloftMVP`.
2. Page-specific `Model`, `View`, and `Presenter` modules register themselves.
3. `screens/core/code/app.js` detects the active page by `body` class:
   - `home-page` -> `Presenters.home`
   - `login-page` -> `Presenters.login`
   - `dashboard-page` -> `Presenters.dashboard`
4. The selected presenter runs `init()` and controls page behavior.

## Responsibility Split

- `Model`: API calls and data rules (auth/contact submission, normalization, etc.).
- `View`: DOM querying, UI state updates, interaction rendering.
- `Presenter`: orchestration between model and view, event wiring, workflow state.
- `Widget`: reusable UI blocks scoped to a screen (form blocks, carousels, shell/header actions).
- `Screen folder`: each screen has its own `code/` folder with `screen/` and `widgets/` subfolders.

## Notes

- Inline business scripts were removed from `index.html` and `login.html`.
- Existing UI/endpoint behavior was preserved while moving initialization into MVP presenters.
