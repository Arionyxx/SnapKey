# SnapKey 2.0 - Electron Edition

This is the new Electron-based implementation of SnapKey, built with:

- **Electron 28+** - Cross-platform desktop framework
- **Electron Forge** - Complete toolchain for building and packaging
- **Vite** - Fast build tool with Hot Module Replacement (HMR)
- **TypeScript** - Type-safe development
- **React** - Modern UI framework
- **ESLint + Prettier** - Code quality and formatting

## Project Structure

```
snapkey/
├── src/
│   ├── main/           # Main process (Node.js)
│   │   └── main.ts     # Application entry point
│   ├── preload/        # Preload scripts (bridge between main and renderer)
│   │   └── index.ts    # Context bridge API
│   ├── renderer/       # Renderer process (React UI)
│   │   ├── App.tsx     # Main React component
│   │   ├── App.css     # Component styles
│   │   ├── index.tsx   # React entry point
│   │   ├── index.html  # HTML template
│   │   └── index.css   # Global styles
│   └── shared/         # Shared types and utilities
├── legacy/             # Original C++ implementation
├── forge.config.ts     # Electron Forge configuration
├── vite.*.config.ts    # Vite configuration for each process
└── tsconfig.*.json     # TypeScript configuration for each process
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 11.x or higher
- Windows 10/11 (for full functionality)

### Installation

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run start
```

This will:
1. Start Vite dev servers for the renderer process
2. Build the main and preload processes
3. Launch Electron with DevTools open
4. Enable hot module replacement for instant updates

### Building

Package the application for distribution:

```bash
npm run package
```

Create installers for your platform:

```bash
npm run make
```

This will create platform-specific installers in the `out/` directory.

### Code Quality

Run ESLint:

```bash
npm run lint
```

Auto-fix ESLint issues:

```bash
npm run lint:fix
```

Format code with Prettier:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

## TypeScript Configuration

The project uses separate TypeScript configurations for each process:

- `tsconfig.json` - Base configuration with path aliases
- `tsconfig.main.json` - Main process (Node.js environment)
- `tsconfig.preload.json` - Preload scripts
- `tsconfig.renderer.json` - Renderer process (DOM + React)

### Path Aliases

All configurations support the following path aliases:

- `@main/*` → `src/main/*`
- `@preload/*` → `src/preload/*`
- `@renderer/*` → `src/renderer/*`
- `@shared/*` → `src/shared/*`

## Electron Architecture

### Main Process (`src/main/`)

The main process runs Node.js and controls the application lifecycle. It:
- Creates and manages browser windows
- Handles system-level operations
- Manages IPC communication with renderer processes

### Preload Scripts (`src/preload/`)

Preload scripts run before the renderer process loads. They:
- Create a secure bridge between main and renderer processes
- Expose selective APIs via `contextBridge`
- Maintain security through context isolation

### Renderer Process (`src/renderer/`)

The renderer process runs the React application. It:
- Displays the UI using web technologies
- Communicates with the main process via IPC
- Has restricted access to Node.js APIs for security

## Development Tips

### Hot Reload

Vite provides instant hot module replacement for the renderer process. Changes to React components will update without restarting the app.

To restart the main process during development, type `rs` in the terminal where `npm run start` is running.

### Debugging

- **Renderer Process**: DevTools open automatically in development
- **Main Process**: Add `--inspect` flag or use VS Code debugging

### Adding Dependencies

```bash
# Production dependencies (will be bundled)
npm install package-name

# Development dependencies (for build tools)
npm install --save-dev package-name
```

## Legacy C++ Implementation

The original C++ implementation has been moved to the `legacy/` folder for reference. This includes:

- Source code (`SnapKey.cpp`)
- Build scripts (CMAKE and MSYS)
- Configuration files
- Icons and resources
- Inno Setup packaging scripts

## Next Steps

1. Implement the core keyboard hooking functionality
2. Port the configuration system
3. Add system tray integration
4. Implement the key mapping logic
5. Add profile management UI
6. Create Windows installer with Squirrel

## License

MIT License - see LICENSE file for details

## Contributing

See the main README.md for contribution guidelines.
