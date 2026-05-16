# React + TypeScript + Vite

## Authentication

The frontend is still compatible with GitHub Pages, and authentication uses MongoDB through the API in `server/index.mjs`.

The API in `server/index.mjs` provides:

- Email/password registration and sign-in
- MongoDB-backed users and sessions collections
- Server-side password hashing with `scrypt`
- HttpOnly session cookies
- CORS configured for a single frontend origin

For this demo repo, the Atlas SRV connection string is hardcoded in `server/index.mjs`. Local development can override it with `MONGODB_URI` when needed.

### Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `CLIENT_ORIGINS` if you use different local frontend URLs.
3. Run the API with `npm run api:dev`.
4. Run the frontend with `npm run dev`.

### Deployment shape

- Deploy the React build to GitHub Pages.
- Deploy `server/index.mjs` to a separate Node host.
- Production builds use `.env.production`, which currently points `VITE_API_BASE_URL` at `https://agentic-microsystems-api.onrender.com`.
- Set `CLIENT_ORIGINS` on the API host to your GitHub Pages/site origin.
- The Render subdomain works with production cookies configured as `SameSite=None; Secure`.
- A same-site API hostname such as `api.agenticmicrosystems.com` is still the better long-term setup when the site is hosted at `agenticmicrosystems.com`.

GitHub Pages publishes static files only, so it cannot open a MongoDB driver connection by itself. A frontend-only direct MongoDB connection is not a deployable GitHub Pages architecture; the API must run somewhere that can execute server-side code.

### Render deployment

This repo includes `render.yaml` for a Render Blueprint:

1. In Render, create a new Blueprint from this GitHub repository.
2. Render will create the `agentic-microsystems-api` web service from `render.yaml`.
3. The current production frontend is already configured to use `https://agentic-microsystems-api.onrender.com`.
4. Push to `main` or rerun the Pages workflow so the frontend is rebuilt against the live API URL.

Render Blueprints are defined by `render.yaml`, and Render deploys services from linked Git branches. Render automatically provides a public service URL for web services.

The Render Blueprint pins Node to `20.19.0` and uses the Atlas SRV connection string in production.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
