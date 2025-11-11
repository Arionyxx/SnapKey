[![testsnap](https://github.com/user-attachments/assets/e9a23ba9-d394-4711-abfc-994932605d86)](https://github.com/cafali/SnapKey/releases)

> **🚀 SnapKey 2.0 - Electron Edition**  
> SnapKey has been completely rebuilt with Electron, TypeScript, and React for a modern, cross-platform experience!  
> 
> **For Developers:**
> - 📖 [Development Guide](./README.electron.md) - Getting started with development
> - 🏗️ [Build Guide](./BUILD.md) - Comprehensive build and packaging instructions
> - 🔧 [Troubleshooting](#troubleshooting) - Common issues and solutions
> 
> The legacy C++ implementation is archived in the [`legacy/`](./legacy/) folder.

**About SnapKey** 
--------------------------------------------------------------------------------------------------
SnapKey provides a user-friendly alternative to the Razer Snap Tap function, making it accessible across all keyboards!

SnapKey is a lightweight, open-source tool that operates from the system tray and is designed to track inputs from the WASD keys, without interfering with any game files. Its main role is to recognize when these keys are pressed and automatically release any previously engaged commands for them. This guarantees responsive and precise input handling. SnapKey handles the WASD keys by default and lets you rebind them to your liking via the config file.

**Need More Info on SnapKey?** Visit the [**SnapKey Wiki**](https://github.com/cafali/SnapKey/wiki)

[![COMPATIBLE](https://github.com/user-attachments/assets/069a7a23-cfe4-47eb-8ac2-05872fcc2028)](https://github.com/cafali/SnapKey/wiki/Compatibility-List)



Download
--------------------------------------------------------------------------------------------------
<p align="center">
  <a href="https://github.com/cafali/SnapKey/releases">Download from GitHub</a> |
  <a href="https://sourceforge.net/projects/snapkey/">Download from SourceForge</a> |
  <a href="https://www.softpedia.com/get/Tweak/System-Tweak/SnapKey.shtml">Download from Softpedia</a>
</p>


[![latesver](https://github.com/user-attachments/assets/09694f7c-6eeb-4c80-9a02-1d777956d181)](https://github.com/cafali/SnapKey/wiki/Updates)

**SnapKey Features**
--------------------------------------------------------------------------------------------------
- Easy to use 🧩
- Detailed documentation 📖
- Lightweight and open-source 🌟
- Accessible via the system tray 🖥️
- Compatible with all keyboards ✅
- Does not interact with game files 🎮
- Activate/Deactivate via context menu ⛔
- Double-click the tray icon to disable it 👆👆
- Built‑in and custom keyboard layout profiles 🗂️
- Sticky Keys Feature: tracks the state of a pressed key ⌨️
- Enhances the precision of counter-strafing movements in games 🎯
- Allows key rebinding using ASCII codes specified in the configuration file 🛠️
- Supports unlimited amount of keys shared across groups (default AD / WS) 🔄
- Facilitates smoother transitions between left and right movements without input conflicts 🚀
- Does not use AutoHotkey or similar tools; its features rely solely on Windows API functions 🛡️

**SnapKey in Action**
--------------------------------------------------------------------------------------------------
- When you press and hold down the **"A"** key, SnapKey remembers it.
- If you then press the **"D"** key while still holding down **"A"** SnapKey automatically releases the **"A"** key for you.
- The same happens if you press **"A"** while holding **"D"** — SnapKey releases the **"D"** key.

**SnapKey prevents simultaneous movement key conflicts (AD / WS)**

- In many FPS games, pressing both the **"A"** and **"D"** keys simultaneously typically results in the game recognizing conflicting inputs. SnapKey automatically releases the previously held key when a new key input is detected.
- The keys are separated into two different groups: A/D and W/S. In each group, **"A"** cancels out **"D"** and vice versa, while the same applies to **"W"** and **"S"**. These groups do not interfere with each other and work separately.

**Sticky Keys**

- Sticky Keys is a feature that keeps track of the state of a key you've pressed down. For example, if you 
hold down the **"A"** key and tap the **"D"** key repeatedly, each press of **"D"** will temporarily override 
the **"A"** key. When you release the **"D"** key, the action associated with the **"A"** key will resume, as 
long as you're still holding it down. The same principle applies if you start with **"D"** held down and 
press **"A"** instead.

> [!NOTE]
> SnapKey and similar solutions have been disallowed in certain games; illustrations shown are for demonstrative purposes only.

![Snapkey](https://github.com/user-attachments/assets/504ffa5e-50d3-4a77-9016-70f22d143cb1)

**Enhanced precision of counter-strafing**

- Automatically releases a previously held key when a new key (A/D) & (W/S) is pressed.

<img src="https://github.com/user-attachments/assets/4453aba4-b9bc-45e8-8a80-80caad39347b" width="600" height="338" alt="STRAFE">

**Linux Support**
--------------------------------------------------------------------------------------------------
Since SnapKey isn’t natively supported on Linux, it’s recommended to check out @Dillacorn's guide on **[running SnapKey on Linux](https://github.com/cafali/SnapKey/issues/4#issuecomment-2251568839)**.

[![LINUX baner](https://github.com/user-attachments/assets/794a16ed-b0ab-4320-a680-52bda1ca0fd1)](https://github.com/cafali/SnapKey/wiki/Setup-Linux)

Looking for More Information? Got Questions or Need Help?
--------------------------------------------------------------------------------------------------
[<img src="https://github.com/user-attachments/assets/0c6d7564-6471-49f2-9367-64f7bffb7e37" alt="Wikitest" width="50%" />](https://github.com/cafali/SnapKey/wiki)

- **[About ℹ️](https://github.com/cafali/SnapKey/wiki/About)**  
  Discover SnapKey, explore its features and see how it can benefit you

- **[Code Breakdown 🧠](https://github.com/cafali/SnapKey/wiki/Code-Breakdown)**  
  Dive into the details of SnapKey’s code structure

- **[Compatibility List 🎮](https://github.com/cafali/SnapKey/wiki/Compatibility-List)**  
  Compatibility status of games with SnapKey

- **[FAQ❓](https://github.com/cafali/SnapKey/wiki/FAQ)**  
  Find answers to common questions about SnapKey

- **[License 📜](https://github.com/cafali/SnapKey/wiki/License)**  
  Overview of SnapKey’s licensing

- **[Rebinding Keys ⌨️](https://github.com/cafali/SnapKey/wiki/Rebinding-Keys)**  
  Instructions on how to rebind keys

- **[Setup 🛠️](https://github.com/cafali/SnapKey/wiki/Setup)**  
  General setup instructions for getting Snapkey up and running on your system

- **[Setup Linux 🐧](https://github.com/cafali/SnapKey/wiki/Setup-Linux)**  
  Setting up SnapKey on Linux distributions

- **[System Requirements 🖥️](https://github.com/cafali/SnapKey/wiki/System-Requirements)**  
  SnapKey System Requirements

- **[Troubleshoot 🔧](https://github.com/cafali/SnapKey/wiki/Troubleshoot)**  
  Solutions and tips for troubleshooting common issues with SnapKey

- **[Changelog 🔄](https://github.com/cafali/SnapKey/wiki/Updates)**  
  View SnapKey releases and changes

**Quick Start (For Developers)**
--------------------------------------------------------------------------------------------------

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 11.x or higher
- **Windows SDK** (for native module compilation)
- **Visual Studio Build Tools** 2019+ with C++ workload

See [BUILD.md](./BUILD.md) for detailed prerequisite installation instructions.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/cafali/SnapKey.git
cd SnapKey

# Install dependencies and rebuild native modules
npm install

# Start development server
npm run start
```

### Building for Production

```bash
# Create all installers for current platform
npm run make

# Windows-specific options
npm run make:squirrel  # Auto-updating installer (recommended)
npm run make:wix       # MSI installer (enterprise)
npm run make:zip       # Portable ZIP

# Package without installer
npm run package
```

**Output:** Installers are created in `out/make/` directory.

For comprehensive build instructions, code signing, and troubleshooting, see **[BUILD.md](./BUILD.md)**.

Troubleshooting
--------------------------------------------------------------------------------------------------

### Native Module Errors During Installation

**Problem:** `uiohook-napi` or `koffi` fails to compile during `npm install`

**Solutions:**
1. Install **Visual Studio Build Tools** with "Desktop development with C++" workload
2. Install **Windows SDK** 10 or later
3. Install **Python** 3.8+ and add to PATH
4. Rebuild native modules: `npm run postinstall`

### Application Won't Start

**Problem:** SnapKey fails to launch or crashes immediately

**Solutions:**
1. Ensure all prerequisites are installed (see above)
2. Check console for error messages: `npm run start`
3. Verify native modules are compiled: `npm run postinstall`
4. Try clean reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Keyboard Hook Not Working

**Problem:** SnapKey starts but key presses aren't intercepted

**Solutions:**
1. Run SnapKey as **Administrator** (required for global keyboard hooks)
2. Check if another keyboard utility is conflicting
3. Verify hook is enabled in the settings
4. Check that target process/fullscreen conditions are met (if configured)
5. Review diagnostics panel for errors

### System Tray Icon Not Appearing

**Problem:** Tray icon missing after startup

**Solutions:**
1. Enable "Show all icons" in Windows taskbar settings
2. Check if `minimizeToTray` is enabled in settings
3. Restart the application
4. Check resource files are present in `legacy/` folder

### Build Errors (WiX/MSI)

**Problem:** MSI creation fails during `npm run make:wix`

**Solutions:**
1. WiX Toolset will be downloaded automatically by `electron-wix-msi`
2. Ensure .NET Framework 3.5+ is installed on Windows
3. Try Squirrel installer instead: `npm run make:squirrel`

### "Unknown Publisher" Warning

**Problem:** Windows SmartScreen warns about unknown publisher

**Solutions:**
1. This is normal for unsigned builds
2. Click "More info" → "Run anyway"
3. For production releases, use **code signing certificate** (see [BUILD.md](./BUILD.md#code-signing))

For more troubleshooting help, visit the [SnapKey Wiki](https://github.com/cafali/SnapKey/wiki/Troubleshoot) or [open an issue](https://github.com/cafali/SnapKey/issues).

----

<p align="center">
  SnapKey by
</p>

<p align="center">
  <a href="https://github.com/cafali">@cafali</a> 
  <a href="https://github.com/minteeaa">@minteeaa</a> 
  <a href="https://github.com/Yaw-Dev">@Yaw-Dev</a>
</p>

<p align="center">
  <a href="https://github.com/cafali/Snapkey/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=cafali/Snapkey" />
  </a>
</p>
