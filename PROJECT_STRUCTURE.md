# M4B Creator - Project Structure

This document describes the organization of the M4B Creator project.

## Directory Structure

```
m4b-creator/
├── .gitignore                    # Git ignore rules
├── LICENSE                       # MIT License
├── README.md                     # Main documentation (English)
├── BUILD.md                      # Build instructions
├── CHANGELOG.md                  # Version history
├── INSTALL.txt                   # Installation guide for end users
├── PROJECT_STRUCTURE.md          # This file
├── requirements.txt              # Python dependencies
├── M4B_Creator.spec              # PyInstaller build configuration
├── m4b_creator.py                # Main application source code
├── screenshots/                  # Application screenshots
│   └── README.md                 # Screenshot guidelines
├── dist/                         # Built executables (not in git)
│   └── M4B_Creator.exe          # Windows executable
├── build/                        # Build artifacts (not in git)
└── __pycache__/                  # Python cache (not in git)
```

## File Descriptions

### Core Files

- **m4b_creator.py** (1155 lines)
  - Main application code
  - Classes: `AudioFile`, `FolderData`, `M4BCreator`, `M4BCreatorGUI`, `BatchMetadataDialog`
  - GUI implementation using tkinter
  - FFmpeg integration for audio processing
  - Batch processing logic

### Documentation

- **README.md**
  - Comprehensive user guide
  - Feature list
  - Installation instructions
  - Usage guide
  - Troubleshooting section

- **BUILD.md**
  - Detailed build instructions
  - PyInstaller configuration guide
  - Troubleshooting build issues
  - Distribution guidelines

- **CHANGELOG.md**
  - Version history
  - Feature additions and changes
  - Roadmap for future versions

- **INSTALL.txt**
  - End-user installation guide
  - FFmpeg setup instructions
  - Quick start guide
  - Troubleshooting for common issues

### Configuration Files

- **requirements.txt**
  - Python package dependencies
  - Pillow (required)
  - windnd (optional, for drag & drop)

- **M4B_Creator.spec**
  - PyInstaller specification file
  - Build configuration
  - Hidden imports
  - Excluded modules

- **.gitignore**
  - Git ignore patterns
  - Python artifacts
  - Build directories
  - Audio files
  - OS-specific files

- **LICENSE**
  - MIT License
  - Copyright and permissions

### Screenshots

- **screenshots/**
  - Folder for application screenshots
  - Include in README for visual guide
  - Guidelines in screenshots/README.md

## Code Architecture

### Main Components

1. **AudioFile Class**
   - Represents a single audio file
   - Metadata extraction using FFprobe
   - Duration calculation
   - Cover art detection

2. **FolderData Class**
   - Represents a folder of audio files
   - File discovery and sorting
   - Metadata management
   - Chapter ordering

3. **M4BCreator Class**
   - Core M4B creation logic
   - FFmpeg command generation
   - Temporary file management
   - Error handling

4. **M4BCreatorGUI Class**
   - Main GUI window
   - Split-screen layout
   - Batch processing interface
   - Progress tracking

5. **BatchMetadataDialog Class**
   - Dialog for batch metadata operations
   - Apply metadata to multiple folders

### Key Features Implementation

- **Batch Processing**: Threading for non-blocking operations
- **Metadata Editing**: Entry widgets with validation
- **Cover Art**: PIL/Pillow for image display and conversion
- **Drag & Drop**: Optional windnd integration
- **Chapter Management**: List reordering with buttons

## Dependencies

### Required

- **Python 3.7+**: Programming language
- **tkinter**: GUI framework (included with Python)
- **Pillow**: Image handling
- **FFmpeg**: External tool for audio processing
- **FFprobe**: Part of FFmpeg, metadata extraction

### Optional

- **windnd**: Drag & drop support (Windows only)
- **tkinterdnd2**: Alternative drag & drop (cross-platform)

### Build Dependencies

- **PyInstaller**: Executable creation

## Build Artifacts

### Not in Version Control

- `build/` - Intermediate build files
- `dist/` - Final executable
- `__pycache__/` - Python bytecode cache
- `*.pyc` - Compiled Python files
- `*.spec` (if auto-generated)

### Included in Releases

- `M4B_Creator.exe` (Windows)
- `README.md`
- `LICENSE`
- `INSTALL.txt`

## Git Workflow

### Branches

- `main` - Stable releases
- `develop` - Active development
- `feature/*` - Feature branches
- `hotfix/*` - Bug fixes

### Commits

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Build/tooling changes

### Releases

1. Update CHANGELOG.md
2. Update version in code (if applicable)
3. Build executable
4. Create GitHub release
5. Tag version (e.g., v1.0.0)
6. Upload artifacts

## Development Setup

1. Clone repository
2. Create virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Run: `python m4b_creator.py`

## Building for Release

1. Update version number
2. Update CHANGELOG.md
3. Test thoroughly
4. Build: `pyinstaller M4B_Creator.spec`
5. Test executable
6. Create release package
7. Upload to GitHub

## Code Style

- **Language**: Python 3.7+
- **Style Guide**: PEP 8
- **Docstrings**: Google style
- **Line Length**: 120 characters
- **Indentation**: 4 spaces

## Testing

Currently manual testing:
- Run application
- Test all features
- Verify M4B output
- Check metadata
- Test error handling

Future: Automated testing with pytest

## Contributing

See README.md for contribution guidelines.

## Maintenance

### Regular Tasks

- Update dependencies
- Test with new Python versions
- Update FFmpeg compatibility
- Review and merge pull requests
- Update documentation

### Release Checklist

- [ ] Code tested
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Build successful
- [ ] Executable tested
- [ ] Release notes written
- [ ] GitHub release created
- [ ] Version tagged

## Support

For questions or issues:
1. Check documentation
2. Search existing issues
3. Create new issue with details

---

Last Updated: 2025-01-20
