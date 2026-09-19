# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

hidden_imports = [
    'waitress',
    'flask_cors',
    'sqlalchemy',
    'sqlalchemy.sql.default_comparator',
    'sqlalchemy.dialects.sqlite',
    'pandas',
    'numpy',
    'openpyxl',
    'sqlite3',
    'dateutil',
    'dateutil.parser',
    'routes',
    'models',
    'analytics'
]
hidden_imports += collect_submodules('waitress')
hidden_imports += collect_submodules('flask_cors')
hidden_imports += collect_submodules('sqlalchemy')

icon_path = os.path.join(os.path.dirname(os.path.abspath(SPEC)), '..', 'electron', 'assets', 'icon.ico')
if not os.path.exists(icon_path):
    icon_path = None

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=[],
    hiddenimports=hidden_imports,
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
    name='SmartFinanceBackend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=icon_path,
)
