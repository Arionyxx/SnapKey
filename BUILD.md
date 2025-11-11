# SnapKey Build Guide

This guide provides comprehensive instructions for building and packaging SnapKey for distribution.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Building for Production](#building-for-production)
- [Packaging and Distribution](#packaging-and-distribution)
- [Code Signing](#code-signing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

#### All Platforms

- **Node.js** 20.x or higher
- **npm** 11.x or higher
- **Git** (for cloning the repository)

#### Windows (Primary Platform)

SnapKey is primarily designed for Windows and requires the following for native module compilation:

1. **Windows SDK** (Windows 10 SDK or later)
   - Download from: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
   - Required for Win32 API bindings

2. **Visual Studio Build Tools** (2019 or later)
   - Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Required for compiling native Node.js modules (`uiohook-napi`, `koffi`)
   - During installation, select "Desktop development with C++"
   - Minimum required components:
     - MSVC v142+ (or v143+) build tools
     - Windows 10/11 SDK
     - C++ CMake tools for Windows

3. **Python** 3.8 or higher (for node-gyp)
   - Download from: https://www.python.org/downloads/
   - Make sure to check "Add Python to PATH" during installation

#### Verification

After installing prerequisites, verify your setup:

```bash
# Check Node.js version
node --version  # Should be 20.x or higher

# Check npm version
npm --version   # Should be 11.x or higher

# Check Python version
python --version  # Should be 3.8 or higher

# Verify Visual Studio Build Tools (Windows)
# This should list the installed Visual Studio versions
npm config get msvs_version
```

### Environment Variables (Windows)

Set the following environment variables if node-gyp has trouble finding your tools:

```bash
# Set Python path (if not in PATH)
npm config set python "C:\Path\To\Python\python.exe"

# Set MSBuild version (optional, for specific VS version)
npm config set msvs_version 2022
```

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/cafali/SnapKey.git
cd SnapKey
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install all Node.js dependencies
- Automatically rebuild native modules for Electron via the `postinstall` script
- Compile `uiohook-napi` for your Electron version

**Note:** If you encounter errors during native module compilation, see [Troubleshooting](#troubleshooting).

### 3. Start Development Server

```bash
npm run start
```

This launches:
- Vite dev server with Hot Module Replacement (HMR) for the renderer process
- Electron app with DevTools open
- File watching for automatic reloads

During development:
- Changes to React components update instantly (HMR)
- To restart the main process, type `rs` in the terminal

## Building for Production

### Package the Application

Create an executable package (no installer):

```bash
npm run package
```

Output: `out/<platform>-<arch>/` directory with the packaged application.

### Type Checking

Before building, ensure there are no TypeScript errors:

```bash
# Check all processes
npx tsc --noEmit -p tsconfig.main.json
npx tsc --noEmit -p tsconfig.preload.json
npx tsc --noEmit -p tsconfig.renderer.json
```

### Code Quality

Run linting and formatting:

```bash
npm run lint
npm run format:check

# Auto-fix issues
npm run lint:fix
npm run format
```

## Packaging and Distribution

### Create Installers

SnapKey supports multiple installer formats:

#### All Formats (Default)

```bash
npm run make
```

Creates all configured installers for the current platform.

#### Windows-Specific

```bash
# All Windows installers
npm run make:win

# Squirrel.Windows installer (auto-updating, recommended)
npm run make:squirrel

# MSI installer (enterprise-friendly, via WiX)
npm run make:wix

# Portable ZIP (no installer)
npm run make:zip
```

#### Installer Comparison

| Format | Maker | Output | Use Case | Auto-Update |
|--------|-------|--------|----------|-------------|
| **Squirrel** | `@electron-forge/maker-squirrel` | `.exe` installer | General distribution, auto-updates | ✅ Yes |
| **WiX** | `@electron-forge/maker-wix` | `.msi` installer | Enterprise, GPO deployment | ❌ No |
| **ZIP** | `@electron-forge/maker-zip` | `.zip` archive | Portable, no installation | ❌ No |

### Output Location

All installers are created in the `out/make/` directory:

```
out/
├── make/
│   ├── squirrel.windows/
│   │   └── x64/
│   │       ├── SnapKey-2.0.0 Setup.exe   (Installer)
│   │       └── RELEASES                   (Update manifest)
│   ├── wix/
│   │   └── x64/
│   │       └── SnapKey.msi                (MSI installer)
│   └── zip/
│       └── win32/
│           └── x64/
│               └── snapkey-win32-x64-2.0.0.zip  (Portable)
└── snapkey-win32-x64/                     (Packaged app)
```

### Resource Bundling

The following resources are automatically bundled with the application:

- **Application Icon**: `legacy/icon.ico` (main executable and window icon)
- **Tray Icons**: 
  - `legacy/icon.ico` (hook enabled)
  - `legacy/icon_off.ico` (hook disabled)

Resources are included via `extraResource` in `forge.config.ts` and are accessible at runtime via:

```typescript
path.join(process.resourcesPath, 'icon.ico')
```

## Code Signing

Code signing is important for:
- Avoiding "Unknown Publisher" warnings
- Enabling SmartScreen reputation building
- Professional appearance

### Setup

1. **Obtain a Code Signing Certificate**
   - Purchase from a trusted CA (DigiCert, Sectigo, GlobalSign, etc.)
   - Export as `.pfx` or `.p12` file with private key

2. **Set Environment Variables**

   ```bash
   # Windows (PowerShell)
   $env:WINDOWS_CERTIFICATE_FILE = "C:\path\to\certificate.pfx"
   $env:WINDOWS_CERTIFICATE_PASSWORD = "your-certificate-password"
   ```

   ```bash
   # Windows (Command Prompt)
   set WINDOWS_CERTIFICATE_FILE=C:\path\to\certificate.pfx
   set WINDOWS_CERTIFICATE_PASSWORD=your-certificate-password
   ```

   **Security Note:** Never commit certificates or passwords to version control.

3. **Build with Signing**

   ```bash
   npm run make
   ```

   Both Squirrel and WiX installers will be automatically signed if the environment variables are set.

### Unsigned Builds

If you don't have a certificate, you can still create unsigned installers:

```bash
npm run make
```

Unsigned installers will:
- Show "Unknown Publisher" warnings
- Require users to click "More info" → "Run anyway"
- Take longer to build SmartScreen reputation

## Troubleshooting

### Native Module Compilation Errors

#### `uiohook-napi` Build Failure

**Error:** `Cannot find module 'uiohook-napi'` or compilation errors during `npm install`

**Solutions:**

1. Ensure Visual Studio Build Tools are installed with C++ workload
2. Verify Windows SDK is installed
3. Rebuild manually:
   ```bash
   npm run postinstall
   # or
   npx electron-rebuild -f -w uiohook-napi
   ```

4. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

#### `koffi` Build Failure

**Error:** FFI binding errors or missing native module

**Solutions:**

1. Ensure you're using a supported Node.js version (20.x)
2. Verify architecture matches (x64)
3. Reinstall:
   ```bash
   npm uninstall koffi
   npm install koffi
   ```

### Windows SDK Not Found

**Error:** `error MSB8036: The Windows SDK version X.Y was not found`

**Solutions:**

1. Install the required Windows SDK version
2. Or configure to use installed version:
   ```bash
   npm config set msvs_version 2022
   ```

### Python Not Found

**Error:** `gyp ERR! find Python - Python is not set from command line or npm configuration`

**Solutions:**

1. Install Python 3.8+
2. Add Python to PATH
3. Or configure manually:
   ```bash
   npm config set python "C:\Python311\python.exe"
   ```

### MSI Build Errors (WiX)

**Error:** WiX toolset not found or compilation errors

**Solutions:**

1. WiX Toolset v3.x is required for MSI builds
2. Install WiX Toolset:
   - Download from: https://wixtoolset.org/
   - Or let `electron-wix-msi` download it automatically (default)

3. On Windows, ensure .NET Framework 3.5+ is installed

### Code Signing Errors

**Error:** `signtool.exe` not found or certificate errors

**Solutions:**

1. Ensure Windows SDK is installed (includes signtool)
2. Verify certificate file path and password
3. Check certificate validity:
   ```powershell
   certutil -dump certificate.pfx
   ```

### Memory Issues During Build

**Error:** JavaScript heap out of memory

**Solutions:**

```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096
npm run make
```

### Electron Version Mismatch

**Error:** Native modules compiled for wrong Electron version

**Solutions:**

```bash
# Rebuild native modules for current Electron version
npx electron-rebuild -f
```

### Preload Script Errors in Production

**Error:** `window.api` is undefined or IPC channels fail

**Solutions:**

1. Verify `contextIsolation: true` in `BrowserWindow` options
2. Check preload script path is correct in production
3. Ensure preload is compiled by Vite (check `forge.config.ts`)

### Tray Icon Not Loading in Production

**Error:** Tray icon appears as default or missing

**Solutions:**

1. Verify icons are in `extraResource` in `forge.config.ts`
2. Use `process.resourcesPath` to locate resources in production:
   ```typescript
   const iconPath = app.isPackaged
     ? path.join(process.resourcesPath, 'icon.ico')
     : path.join(__dirname, '../../legacy/icon.ico');
   ```

## Production Build Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Run all tests: `npm test`
- [ ] Type check all processes: `npx tsc --noEmit -p tsconfig.*.json`
- [ ] Lint and format: `npm run lint && npm run format:check`
- [ ] Test production build locally: `npm run package`
- [ ] Verify auto-launch works
- [ ] Verify system tray functionality
- [ ] Test keyboard hook with various applications
- [ ] Create signed installers: `npm run make` (with cert env vars)
- [ ] Test installers on clean Windows machine
- [ ] Verify uninstaller works correctly
- [ ] Update CHANGELOG.md
- [ ] Create GitHub release with artifacts

## Additional Resources

- [Electron Forge Documentation](https://www.electronforge.io/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [uiohook-napi](https://github.com/SpikeHD/uiohook-napi)
- [Koffi FFI Library](https://github.com/Koromix/koffi)
- [Windows Code Signing Guide](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

## Support

For build issues or questions:

- Open an issue: https://github.com/cafali/SnapKey/issues
- Check Wiki: https://github.com/cafali/SnapKey/wiki
- Review existing issues for similar problems

---

**Note:** This build guide is specific to SnapKey 2.0 (Electron edition). For the legacy C++ build process, see `legacy/Build SnapKey/`.
