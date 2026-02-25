# Everloft Monolithic MVP Architecture

This project now follows a monolithic frontend structure with **MVP (Model-View-Presenter)** layering for page-level business logic.

## Structure

```
assets/js/mvp/
  core/
    namespace.js
  models/
    home-model.js
    login-model.js
  views/
    home-view.js
    login-view.js
  presenters/
    home-presenter.js
    login-presenter.js
  app.js
```

`dashboard` logic is registered as `EverloftMVP.Presenters.dashboard` inside:

```
assets/js/dashboard-enhancements.js
```

## Runtime Flow

1. `namespace.js` initializes the global app container: `window.EverloftMVP`.
2. Page-specific `Model`, `View`, and `Presenter` modules register themselves.
3. `app.js` detects the active page by `body` class:
   - `home-page` -> `Presenters.home`
   - `login-page` -> `Presenters.login`
   - `dashboard-page` -> `Presenters.dashboard`
4. The selected presenter runs `init()` and controls page behavior.

## Responsibility Split

- `Model`: API calls and data rules (auth/contact submission, normalization, etc.).
- `View`: DOM querying, UI state updates, interaction rendering.
- `Presenter`: orchestration between model and view, event wiring, workflow state.

## Notes

- Inline business scripts were removed from `index.html` and `login.html`.
- Existing UI/endpoint behavior was preserved while moving initialization into MVP presenters.
