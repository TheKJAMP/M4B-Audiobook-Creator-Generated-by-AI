# -*- mode: python ; coding: utf-8 -*-

"""
PyInstaller Spec File for M4B Creator
This file defines how PyInstaller should build the executable.

To build using this spec file:
    pyinstaller M4B_Creator.spec

The resulting executable will be in the 'dist' folder.
"""

block_cipher = None

a = Analysis(
    ['m4b_creator.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('README.md', '.'),
        ('LICENSE', '.'),
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
    excludes=[
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'pytest',
        'IPython',
    ],
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
    console=False,  # Change to True for debugging (shows console window)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='icon.ico'  # Uncomment and provide icon file if available
)

# Optional: Create a distribution folder with additional files
# coll = COLLECT(
#     exe,
#     a.binaries,
#     a.zipfiles,
#     a.datas,
#     strip=False,
#     upx=True,
#     upx_exclude=[],
#     name='M4B_Creator'
# )
