# SnapKey 2.0 - Quick Start Guide

## For Developers

### Prerequisites

- Node.js 20.x or higher
- npm 11.x or higher
- Git

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/cafali/SnapKey.git
   cd SnapKey
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run start
   ```

   This will:
   - Start Vite dev servers with hot reload
   - Launch the Electron app
   - Open DevTools automatically

### Development Commands

```bash
# Start development server with hot reload
npm run start

# Lint code
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Package application
npm run package

# Create installers
npm run make
```

### Project Structure

```
snapkey/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   ├── renderer/       # React UI
│   └── shared/         # Shared code
├── legacy/             # Original C++ implementation
└── forge.config.ts     # Build configuration
```

### Making Changes

1. **Main Process** (`src/main/`): Node.js code that controls the app
2. **Preload** (`src/preload/`): Secure bridge between main and renderer
3. **Renderer** (`src/renderer/`): React UI that users interact with

Changes to the renderer process will hot-reload automatically.
To restart the main process, type `rs` in the terminal.

### Building

```bash
# Create a packaged app (in out/ folder)
npm run package

# Create installers for your platform
npm run make
```

### Troubleshooting

**Issue**: Hot reload not working
- **Solution**: Make sure you're editing files in `src/renderer/`

**Issue**: TypeScript errors
- **Solution**: Run `npm run lint` to see all errors

**Issue**: Build fails
- **Solution**: Delete `.vite/` and `out/` folders and try again

## For Users

### Installation

Download the latest installer for your platform from the [Releases](https://github.com/cafali/SnapKey/releases) page.

### Usage

1. Run SnapKey
2. The app will appear in your system tray
3. Configure key mappings in the settings
4. Start gaming!

## More Information

- **Full Documentation**: See [README.electron.md](./README.electron.md)
- **Original C++ Code**: See the `legacy/` folder
- **Issues**: Report bugs on [GitHub Issues](https://github.com/cafali/SnapKey/issues)
