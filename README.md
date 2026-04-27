# Elgato Light Control Web App

A Vue 3 web application for controlling Elgato LED lights over a local network. It communicates with an ESP32-based backend to adjust brightness and color temperature across individual lights or predefined groups.

## Features

- Switch between controlling individual lights or groups
- Adjust brightness (0–100%) and color temperature (145–340K)
- Auto-discovers all available lights and groups from the backend
- Auto-selects the first available light or group on load

## Tech Stack

- **Vue 3** with TypeScript
- **Vite** — build tool and dev server
- **Vitest** + **@vue/test-utils** — unit testing
- **ESLint** + **Oxlint** — linting
- **Caddy** — reverse proxy and static file server
- **Docker** — containerized deployment

## API

The app communicates with the backend via `/api/lights`, which is reverse-proxied by Caddy to `http://esp32-elgato-lights.local`.

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | `/api/lights/all`  | Fetch all lights         |
| GET    | `/api/lights/group`| Fetch all groups         |
| PUT    | `/api/lights`      | Update light(s) settings |

## Getting Started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm

### Install dependencies

```bash
npm install
```

### Development server

```bash
npm run dev
```

Runs at `http://localhost:5173`. API calls are proxied to the backend during development.

### Production build

```bash
npm run build
```

Output goes to `dist/`.

### Preview production build

```bash
npm run preview
```

## Docker

Build scripts are provided for both Windows and Unix. They build the app, create a Docker image, and run it on port 80.

**Windows:**
```cmd
build.cmd
```

**Unix/macOS:**
```bash
./build.sh
```

The container serves the static app via Caddy and proxies `/api/*` requests to `http://esp32-elgato-lights.local`.

## Testing

```bash
npm run test:unit
```

## Linting

```bash
npm run lint
```

Runs both Oxlint and ESLint with auto-fix.

## License

See [LICENSE](LICENSE).