# M4B Creator - Deployment Guide

This guide explains how to prepare, build, and deploy M4B Creator for release.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Build Checklist](#pre-build-checklist)
- [Building the Executable](#building-the-executable)
- [Testing the Executable](#testing-the-executable)
- [Creating a Release Package](#creating-a-release-package)
- [GitHub Release Process](#github-release-process)
- [Post-Release Tasks](#post-release-tasks)

## Prerequisites

### Software Requirements

1. **Python 3.7 or higher**
   ```bash
   python --version
   ```

2. **Git** (for version control)
   ```bash
   git --version
   ```

3. **PyInstaller**
   ```bash
   pip install pyinstaller>=6.0.0
   ```

4. **All project dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Pre-Build Checklist

Before building, ensure everything is ready:

- [ ] All code changes committed
- [ ] CHANGELOG.md updated with new version
- [ ] Version number updated (if applicable)
- [ ] README.md reviewed and updated
- [ ] All tests passed
- [ ] No debug code or print statements
- [ ] All TODOs resolved or documented
- [ ] Documentation is current

## Building the Executable

### Step 1: Clean Previous Builds

Remove old build artifacts:

```bash
# Windows Command Prompt
cd "C:\path\to\m4b creator"
rmdir /s /q build
rmdir /s /q dist
del M4B_Creator.spec  # Only if you want to regenerate it

# Windows PowerShell
cd "C:\path\to\m4b creator"
Remove-Item -Recurse -Force build, dist -ErrorAction SilentlyContinue
```

### Step 2: Verify Source Code

Test the application runs correctly:

```bash
python m4b_creator.py
```

Verify:
- Application launches
- All UI elements display correctly
- Can add folders
- Can view metadata
- No error messages in console

### Step 3: Build with PyInstaller

Using the spec file (recommended):

```bash
pyinstaller M4B_Creator.spec
```

**Expected Output:**
```
INFO: Building EXE from EXE-00.toc completed successfully.
INFO: Build complete! The results are available in: C:\...\dist
```

### Step 4: Verify Build Success

Check the executable exists:

```bash
# Windows
cd dist
dir M4B_Creator.exe
```

Expected file size: ~15-25 MB (depending on included libraries)

## Testing the Executable

### Basic Tests

1. **Launch Test**
   ```bash
   cd dist
   M4B_Creator.exe
   ```
   - Should launch without errors
   - No console window should appear
   - GUI should display correctly

2. **Functionality Tests**
   - Add a test folder with audio files
   - Verify folder appears in list
   - Select folder and view metadata
   - Check cover art display
   - Edit metadata and save
   - Reorder chapters
   - Start batch processing
   - Verify M4B file created

3. **Error Handling Tests**
   - Try adding empty folder (should warn)
   - Try with invalid audio files
   - Test with missing FFmpeg (should error clearly)

### Advanced Tests

1. **Different File Formats**
   - Test with MP3, M4A, FLAC, etc.
   - Verify all formats work

2. **Large Files**
   - Test with many files (50+)
   - Test with large files (>100 MB each)

3. **Edge Cases**
   - Files with special characters in names
   - Very long file names
   - Files with no metadata
   - Files with corrupt metadata

4. **System Tests**
   - Test on Windows 10
   - Test on Windows 11
   - Test on clean VM (no Python installed)

## Creating a Release Package

### Step 1: Organize Files

Create a release folder structure:

```
M4B_Creator_v1.0.0_Windows/
├── M4B_Creator.exe
├── README.md
├── LICENSE
├── INSTALL.txt
└── CHANGELOG.md
```

### Step 2: Copy Files

```bash
# Create release directory
mkdir M4B_Creator_v1.0.0_Windows
cd M4B_Creator_v1.0.0_Windows

# Copy executable
copy ..\dist\M4B_Creator.exe .

# Copy documentation
copy ..\README.md .
copy ..\LICENSE .
copy ..\INSTALL.txt .
copy ..\CHANGELOG.md .
```

### Step 3: Create Archive

**Windows (PowerShell):**
```powershell
Compress-Archive -Path "M4B_Creator_v1.0.0_Windows" -DestinationPath "M4B_Creator_v1.0.0_Windows.zip"
```

**Using 7-Zip:**
```bash
7z a -tzip M4B_Creator_v1.0.0_Windows.zip M4B_Creator_v1.0.0_Windows
```

### Step 4: Verify Archive

1. Extract to a new location
2. Run the executable
3. Test basic functionality
4. Check all files are included

## GitHub Release Process

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git status

# Commit if needed
git add .
git commit -m "Release v1.0.0"

# Push to GitHub
git push origin main
```

### Step 2: Create Git Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0
```

### Step 3: Create GitHub Release

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Select the tag you just created (v1.0.0)
4. Fill in release information:

**Release Title:**
```
M4B Creator v1.0.0
```

**Release Description Template:**
```markdown
# M4B Creator v1.0.0

## What's New

- Initial release
- Batch processing for multiple folders
- Full metadata editor with cover art support
- Chapter management
- Plex Media Server compatibility
- Drag & Drop support (Windows)

## Download

Download `M4B_Creator_v1.0.0_Windows.zip` below.

## Installation

1. Extract the ZIP file
2. Install FFmpeg (see INSTALL.txt)
3. Run M4B_Creator.exe

## Requirements

- Windows 10/11 (64-bit)
- FFmpeg (download from https://www.gyan.dev/ffmpeg/builds/)

## Documentation

- [README.md](README.md) - Full documentation
- [INSTALL.txt](INSTALL.txt) - Installation guide
- [BUILD.md](BUILD.md) - Build from source

## Known Issues

- GUI is in German (English version planned)
- No progress bar (status messages only)

## Support

Report issues at: https://github.com/yourusername/m4b-creator/issues

## Checksums (SHA256)

[Add checksums here after uploading]

---

**Full Changelog**: https://github.com/yourusername/m4b-creator/blob/main/CHANGELOG.md
```

### Step 4: Upload Release Assets

1. Drag and drop `M4B_Creator_v1.0.0_Windows.zip` into the release assets area
2. Wait for upload to complete
3. Optionally add checksums:

```bash
# Generate SHA256 checksum
certutil -hashfile M4B_Creator_v1.0.0_Windows.zip SHA256
```

Add to release notes:
```
SHA256: [checksum here]
```

### Step 5: Publish Release

1. Review all information
2. Check "Set as the latest release"
3. Click "Publish release"

## Post-Release Tasks

### 1. Update Documentation

- [ ] Update README.md download links if needed
- [ ] Verify GitHub badges are correct
- [ ] Update any external documentation

### 2. Announce Release

Consider announcing on:
- GitHub Discussions
- Social media
- Reddit (r/audiobooks, r/selfhosted)
- Discord/Slack communities

### 3. Monitor Feedback

- Check GitHub Issues for bug reports
- Respond to questions
- Track download statistics

### 4. Plan Next Version

- Review feature requests
- Plan improvements
- Update roadmap in CHANGELOG.md

## Release Versioning

Follow Semantic Versioning (semver):

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (1.X.0)**: New features, backwards compatible
- **Patch (1.0.X)**: Bug fixes, minor improvements

### Examples

- `v1.0.0` - Initial release
- `v1.1.0` - Added English language support
- `v1.1.1` - Fixed metadata bug
- `v2.0.0` - Complete GUI rewrite

## Hotfix Process

For urgent bug fixes:

1. Create hotfix branch from tag
   ```bash
   git checkout -b hotfix/v1.0.1 v1.0.0
   ```

2. Fix the bug
3. Update CHANGELOG.md
4. Commit and tag
   ```bash
   git commit -am "Fix critical metadata bug"
   git tag -a v1.0.1 -m "Hotfix v1.0.1"
   ```

5. Merge back to main
   ```bash
   git checkout main
   git merge hotfix/v1.0.1
   ```

6. Push everything
   ```bash
   git push origin main v1.0.1
   ```

7. Create GitHub release (same process as above)

## Continuous Deployment (Optional)

### GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

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
      run: pyinstaller M4B_Creator.spec

    - name: Create ZIP archive
      run: |
        mkdir release
        copy dist\M4B_Creator.exe release\
        copy README.md release\
        copy LICENSE release\
        copy INSTALL.txt release\
        copy CHANGELOG.md release\
        Compress-Archive -Path release\* -DestinationPath M4B_Creator_${{ github.ref_name }}_Windows.zip

    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: M4B_Creator_${{ github.ref_name }}_Windows.zip
        body_path: CHANGELOG.md
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This automates the build and release process.

## Troubleshooting Deployment

### Build Fails

1. Check Python version: `python --version`
2. Update PyInstaller: `pip install --upgrade pyinstaller`
3. Clear cache: `pip cache purge`
4. Check for missing dependencies

### Executable Doesn't Run

1. Build with console to see errors:
   ```bash
   # Edit M4B_Creator.spec: console=True
   pyinstaller M4B_Creator.spec
   ```
2. Check Windows Event Viewer
3. Test on clean VM
4. Verify all dependencies included

### Large File Size

1. Enable UPX compression
2. Exclude unnecessary modules in spec file
3. Use `--onefile` mode

## Security Considerations

### Code Signing (Optional)

For professional releases, consider code signing:

1. Obtain a code signing certificate
2. Sign the executable:
   ```bash
   signtool sign /f certificate.pfx /p password /t http://timestamp.server M4B_Creator.exe
   ```

Benefits:
- Removes Windows SmartScreen warnings
- Builds user trust
- Prevents tampering

### Virus Scanning

Before release:
1. Scan with Windows Defender
2. Upload to VirusTotal
3. Document results in release notes

## Support and Maintenance

### Regular Tasks

- Monitor GitHub Issues weekly
- Test with new Windows updates
- Update dependencies quarterly
- Review and merge pull requests

### Long-term Maintenance

- Keep Python version current
- Update FFmpeg compatibility
- Maintain documentation
- Address security vulnerabilities

---

**Questions?**

See [BUILD.md](BUILD.md) for technical build details or open an issue on GitHub.

Last Updated: 2025-01-20
