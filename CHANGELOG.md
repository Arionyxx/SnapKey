# Changelog

All notable changes to SnapKey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Electron Edition

### Added

#### Build System & Distribution
- **Multiple Windows Installer Formats**
  - Squirrel.Windows installer with auto-update support (recommended for general distribution)
  - WiX MSI installer for enterprise deployment and GPO support
  - Portable ZIP distribution (no installation required)
- **Code Signing Support**
  - Environment variable configuration for certificate-based signing
  - Automatic signing of both installers and executables when certificate is available
  - Supports both Squirrel and MSI signing workflows
- **Resource Bundling**
  - Automatic inclusion of application icons and tray icons in build output
  - Proper resource path resolution for both development and production
  - Icons accessible via `process.resourcesPath` in packaged builds
- **Build Scripts**
  - `npm run make` - Create all installers for current platform
  - `npm run make:win` - Create all Windows installers
  - `npm run make:squirrel` - Create Squirrel installer only
  - `npm run make:wix` - Create MSI installer only
  - `npm run make:zip` - Create portable ZIP only
- **Native Module Rebuild**
  - Automatic rebuild of `uiohook-napi` for Electron during installation
  - Forced rebuild configuration in forge.config.ts
  - postinstall script for reliable native module compilation

#### Application Features
- **Auto-Launch on System Startup**
  - Configurable auto-launch setting in UI
  - Cross-platform support via `auto-launch` package
  - Automatic registry/startup folder management
  - Setting persists across application restarts
- **Production Security**
  - DevTools automatically disabled in production builds
  - Strict context isolation in preload scripts
  - Proper sandboxing configuration

#### Documentation
- **Comprehensive Build Guide (BUILD.md)**
  - Detailed prerequisite installation instructions
  - Visual Studio Build Tools setup guide
  - Windows SDK configuration
  - Python environment setup
  - Step-by-step build process
  - Code signing instructions
  - Extensive troubleshooting section covering:
    - Native module compilation errors
    - uiohook-napi build failures
    - koffi FFI binding issues
    - Windows SDK detection problems
    - Python configuration
    - MSI/WiX build errors
    - Code signing certificate issues
    - Memory and Electron version mismatch issues
- **Enhanced README.md**
  - Quick start guide for developers
  - Troubleshooting section for common issues
  - Links to comprehensive documentation
  - Build output location information
- **Updated README.electron.md**
  - References to new build scripts
  - Links to BUILD.md for detailed instructions

### Changed
- **Icon Path Resolution**
  - Updated main window icon path to use `process.resourcesPath` in production
  - Updated TrayManager to properly locate icons in packaged builds
  - Maintains backward compatibility with development paths
- **Forge Configuration**
  - Enhanced `forge.config.ts` with detailed maker configurations
  - Added platform-specific options for Linux packages (DEB, RPM)
  - Improved metadata for all installers
  - Added conditional code signing based on environment variables

### Technical Details

#### Build Output Structure
```
out/
├── make/
│   ├── squirrel.windows/x64/    # Auto-updating installer
│   ├── wix/x64/                  # MSI installer
│   └── zip/win32/x64/            # Portable ZIP
└── SnapKey-<platform>-<arch>/    # Packaged application
```

#### Environment Variables for Code Signing
- `WINDOWS_CERTIFICATE_FILE` - Path to .pfx/.p12 certificate
- `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

#### Resource Bundling
Icons are automatically included in `process.resourcesPath`:
- `icon.ico` - Main application icon (enabled state)
- `icon_off.ico` - Tray icon for disabled state

#### Dependencies Added
- `auto-launch` - System startup management
- `@types/auto-launch` - TypeScript definitions
- `@electron-forge/maker-wix` - MSI installer creation

### Fixed
- Unused variable warning in KeybindEditor component (commented out future feature)
- Icon loading in production builds (resource path resolution)
- DevTools opening in production builds (security improvement)

### Development Workflow Improvements
- All native modules automatically rebuilt on `npm install`
- Type checking passes for all processes (main, preload, renderer)
- ESLint and Prettier configurations maintained
- All 59 unit tests passing
- Package command verified working with proper resource inclusion

---

## [1.x.x] - Legacy C++ Edition

The original C++ implementation has been archived in the `legacy/` folder.
For the legacy changelog, see `legacy/` directory documentation.

---

## Version History

- **2.0.0** - Complete rewrite in Electron, TypeScript, and React
  - Modern UI with Tailwind CSS and DaisyUI
  - Cross-platform support (Windows primary, Linux experimental)
  - Profile-based keybind management
  - System tray integration
  - Auto-launch support
  - Multiple installer formats
  - Comprehensive build system

- **1.x.x** - Legacy C++ implementation (archived)
  - Windows-only Win32 API application
  - Configuration file-based setup
  - Single executable deployment

---

**Note:** For detailed upgrade instructions from v1.x to v2.0, see the [Migration Guide](https://github.com/cafali/SnapKey/wiki).
