# Building M4B Creator

This document provides detailed instructions for building the M4B Creator executable from source.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Build Guide](#quick-build-guide)
- [Detailed Build Instructions](#detailed-build-instructions)
- [Build Configuration](#build-configuration)
- [Troubleshooting](#troubleshooting)
- [Distribution](#distribution)

## Prerequisites

### Required Software

1. **Python 3.7 or higher**
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation
   - Verify installation: `python --version`

2. **FFmpeg** (for runtime, not build)
   - Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) (Windows)
   - Or install via winget: `winget install Gyan.FFmpeg`
   - Verify installation: `ffmpeg -version`

3. **Git** (optional, for cloning)
   - Download from [git-scm.com](https://git-scm.com/)

### Python Dependencies

Install all required packages:

```bash
pip install -r requirements.txt
pip install pyinstaller
```

Or install individually:

```bash
pip install Pillow>=10.0.0
pip install windnd>=1.0.0
pip install pyinstaller>=6.0.0
```

## Quick Build Guide

For those who just want to build quickly:

```bash
# 1. Navigate to project directory
cd "C:\path\to\m4b creator"

# 2. Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# 3. Build executable
pyinstaller --name="M4B_Creator" --onefile --windowed --icon=icon.ico --add-data "README.md;." m4b_creator.py

# 4. Find executable in dist folder
# dist/M4B_Creator.exe
```

## Detailed Build Instructions

### Step 1: Prepare the Environment

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/yourusername/m4b-creator.git
   cd m4b-creator
   ```

2. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv

   # Activate on Windows
   venv\Scripts\activate

   # Activate on macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install pyinstaller
   ```

### Step 2: Verify the Application

Before building, make sure the application runs correctly:

```bash
python m4b_creator.py
```

Test basic functionality:
- Add a folder
- Check metadata display
- Verify cover art preview

### Step 3: Build with PyInstaller

#### Option A: Using Command Line (Simple)

```bash
pyinstaller --name="M4B_Creator" ^
            --onefile ^
            --windowed ^
            --icon=icon.ico ^
            --add-data "README.md;." ^
            m4b_creator.py
```

**Explanation of flags:**
- `--name="M4B_Creator"` - Name of the executable
- `--onefile` - Create a single executable file
- `--windowed` - No console window (GUI only)
- `--icon=icon.ico` - Application icon (optional)
- `--add-data` - Include additional files

#### Option B: Using Spec File (Advanced)

1. **Create the spec file**
   ```bash
   pyi-makespec --name="M4B_Creator" --onefile --windowed m4b_creator.py
   ```

2. **Edit `M4B_Creator.spec`** (see [Build Configuration](#build-configuration))

3. **Build using spec file**
   ```bash
   pyinstaller M4B_Creator.spec
   ```

### Step 4: Test the Executable

1. **Locate the executable**
   - Find it in the `dist` folder: `dist/M4B_Creator.exe`

2. **Test thoroughly**
   - Run the executable
   - Add folders with audio files
   - Edit metadata
   - Try creating an M4B file
   - Test drag & drop (if windnd is included)

3. **Check dependencies**
   - Make sure FFmpeg is in PATH
   - Verify all features work as expected

### Step 5: Clean Up

```bash
# Remove build artifacts
rmdir /s /q build
del M4B_Creator.spec
```

Keep the `dist` folder with your executable.

## Build Configuration

### Custom PyInstaller Spec File

Create or edit `M4B_Creator.spec` for advanced configuration:

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['m4b_creator.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('README.md', '.'),
    ],
    hiddenimports=[
        'PIL',
        'PIL._imagingtk',
        'PIL._tkinter_finder',
        'windnd',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='M4B_Creator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Set to True for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico'  # Optional: path to icon file
)
```

### Build Options Explained

| Option | Description | Recommended |
|--------|-------------|-------------|
| `--onefile` | Single executable file | Yes |
| `--onedir` | Folder with dependencies | No (larger) |
| `--windowed` | No console window | Yes (for GUI) |
| `--console` | Show console window | Only for debugging |
| `--icon` | Application icon | Optional |
| `--add-data` | Include additional files | If needed |
| `--hidden-import` | Force include module | If import errors occur |
| `--upx-dir` | UPX compressor path | Optional (smaller exe) |

### Including FFmpeg (Optional)

To bundle FFmpeg with the executable:

```bash
# Download FFmpeg essentials
# Copy ffmpeg.exe and ffprobe.exe to project folder

pyinstaller --name="M4B_Creator" ^
            --onefile ^
            --windowed ^
            --add-binary "ffmpeg.exe;." ^
            --add-binary "ffprobe.exe;." ^
            m4b_creator.py
```

**Note:** This will significantly increase the executable size (~100 MB).

## Troubleshooting

### Common Build Errors

#### 1. ModuleNotFoundError: No module named 'PIL'

**Problem:** Pillow not installed

**Solution:**
```bash
pip install Pillow
```

#### 2. tkinter not found

**Problem:** tkinter not included with Python installation

**Solution:**
- **Windows:** Reinstall Python with tkinter enabled
- **Linux:** `sudo apt install python3-tk`
- **macOS:** Included by default

#### 3. windnd import error

**Problem:** windnd is optional and may cause issues

**Solution:** Add to hidden imports in spec file:
```python
hiddenimports=['windnd'],
```

Or exclude if not needed:
```python
excludes=['windnd'],
```

#### 4. Executable won't start / Immediate crash

**Problem:** Missing dependencies or console errors

**Solution:**
1. Build with console to see errors:
   ```bash
   pyinstaller --onefile --console m4b_creator.py
   ```
2. Run the executable from command line to see error messages
3. Add missing modules to `hiddenimports`

#### 5. "Failed to execute script" error

**Problem:** Missing hidden imports or data files

**Solution:**
```bash
pyinstaller --onefile --windowed --hidden-import=PIL._imagingtk --hidden-import=PIL._tkinter_finder m4b_creator.py
```

#### 6. Large executable size

**Problem:** PyInstaller includes many unnecessary modules

**Solution:**
1. Use UPX compression:
   ```bash
   pip install upx-windows-binaries
   pyinstaller --onefile --windowed --upx-dir=upx m4b_creator.py
   ```

2. Exclude unnecessary modules:
   ```python
   excludes=['matplotlib', 'numpy', 'pandas', 'scipy']
   ```

### Runtime Errors

#### FFmpeg not found

**Problem:** User doesn't have FFmpeg installed

**Solution:** Include clear error message in app, or bundle FFmpeg

#### Permission denied errors

**Problem:** Writing to protected directories

**Solution:** Run as administrator or use user-writable directories

### Build Performance Tips

1. **Clean build environment**
   ```bash
   rmdir /s /q build dist
   del *.spec
   ```

2. **Use spec file for reproducible builds**

3. **Test on clean Windows installation** (or VM)

4. **Disable antivirus temporarily** during build (can slow down significantly)

## Distribution

### Preparing for Release

1. **Test the executable thoroughly**
   - Run on different Windows versions (10, 11)
   - Test with different audio formats
   - Verify all features work

2. **Create a release package**
   ```
   M4B_Creator_v1.0/
   ├── M4B_Creator.exe
   ├── README.md
   ├── LICENSE
   └── INSTALL.txt
   ```

3. **Write installation instructions** (INSTALL.txt)
   ```
   M4B Creator Installation

   1. Extract all files to a folder
   2. Install FFmpeg (required):
      - Download from: https://www.gyan.dev/ffmpeg/builds/
      - Or run: winget install Gyan.FFmpeg
   3. Run M4B_Creator.exe

   For help, see README.md
   ```

4. **Create a ZIP archive**
   ```bash
   # Name format: M4B_Creator_v1.0_Windows.zip
   ```

5. **Upload to GitHub Releases**
   - Create a new release
   - Tag version (e.g., v1.0.0)
   - Upload the ZIP file
   - Add release notes

### Code Signing (Optional)

For a more professional distribution:

1. Obtain a code signing certificate
2. Sign the executable:
   ```bash
   signtool sign /f certificate.pfx /p password /t http://timestamp.server.com M4B_Creator.exe
   ```

This prevents Windows SmartScreen warnings.

## Continuous Integration (Optional)

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build Executable

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pyinstaller

    - name: Build executable
      run: |
        pyinstaller --name="M4B_Creator" --onefile --windowed m4b_creator.py

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: M4B_Creator
        path: dist/M4B_Creator.exe
```

## Additional Resources

- [PyInstaller Documentation](https://pyinstaller.org/en/stable/)
- [Python Packaging Guide](https://packaging.python.org/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

## Support

If you encounter build issues:

1. Check this document first
2. Search [PyInstaller issues](https://github.com/pyinstaller/pyinstaller/issues)
3. Open an issue on GitHub with:
   - Your Python version
   - PyInstaller version
   - Full error message
   - Build command used

---

**Good luck with your build!**
