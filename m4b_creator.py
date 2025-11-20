#!/usr/bin/env python3
"""
M4B Creator - Ein Tool zum Erstellen von M4B-Hörbuchdateien mit Metadaten und Kapitelunterstützung
"""

import os
import subprocess
import json
import re
import shutil
from pathlib import Path
from typing import List, Dict, Optional
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext, simpledialog
import threading
from PIL import Image, ImageTk


class AudioFile:
    """Repräsentiert eine Audiodatei mit Metadaten"""

    def __init__(self, path: str):
        self.path = path
        self.metadata = {}
        self.duration = 0.0
        self.has_cover = False
        self.cover_stream_index = None
        self.extract_metadata()

    def extract_metadata(self):
        """Extrahiert Metadaten aus der Audiodatei mit FFprobe"""
        try:
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                self.path
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                data = json.loads(result.stdout)

                # Dauer extrahieren
                if 'format' in data and 'duration' in data['format']:
                    self.duration = float(data['format']['duration'])

                # Metadaten extrahieren
                if 'format' in data and 'tags' in data['format']:
                    self.metadata = data['format']['tags']

                # Cover-Art prüfen
                if 'streams' in data:
                    for idx, stream in enumerate(data['streams']):
                        if stream.get('codec_type') == 'video' or stream.get('codec_name') in ['mjpeg', 'png', 'jpg']:
                            self.has_cover = True
                            self.cover_stream_index = idx
                            break

        except Exception as e:
            print(f"Fehler beim Extrahieren der Metadaten aus {self.path}: {e}")


class FolderData:
    """Repräsentiert einen Ordner mit allen Audiodateien und Einstellungen"""

    def __init__(self, folder_path: str, recursive: bool = False):
        self.folder_path = folder_path
        self.folder_name = Path(folder_path).name
        self.recursive = recursive
        self.audio_files: List[AudioFile] = []
        self.metadata = {}
        self.output_name = self.folder_name
        self.custom_artwork_path: Optional[str] = None  # Benutzerdefiniertes Artwork
        self.load_files()

    def load_files(self):
        """Lädt alle Audiodateien aus dem Ordner"""
        audio_extensions = {'.mp3', '.m4a', '.m4b', '.aac', '.ogg', '.flac', '.wav', '.wma'}
        file_paths = []

        if self.recursive:
            for root, dirs, files in os.walk(self.folder_path):
                for file in files:
                    if Path(file).suffix.lower() in audio_extensions:
                        file_paths.append(os.path.join(root, file))
        else:
            for file in os.listdir(self.folder_path):
                file_path = os.path.join(self.folder_path, file)
                if os.path.isfile(file_path) and Path(file).suffix.lower() in audio_extensions:
                    file_paths.append(file_path)

        # Sortiert hinzufügen
        for path in sorted(file_paths):
            audio_file = AudioFile(path)
            self.audio_files.append(audio_file)

        # Metadaten aus erster Datei extrahieren
        if self.audio_files:
            first_file = self.audio_files[0]
            self.metadata = {
                'title': first_file.metadata.get('album', first_file.metadata.get('title', self.folder_name)),
                'artist': first_file.metadata.get('artist', ''),
                'album': first_file.metadata.get('album', ''),
                'date': first_file.metadata.get('date', ''),
                'genre': first_file.metadata.get('genre', ''),
            }

    def move_file_up(self, index: int):
        """Verschiebt eine Datei nach oben"""
        if 0 < index < len(self.audio_files):
            self.audio_files[index], self.audio_files[index - 1] = \
                self.audio_files[index - 1], self.audio_files[index]

    def move_file_down(self, index: int):
        """Verschiebt eine Datei nach unten"""
        if 0 <= index < len(self.audio_files) - 1:
            self.audio_files[index], self.audio_files[index + 1] = \
                self.audio_files[index + 1], self.audio_files[index]


class M4BCreator:
    """Hauptklasse zum Erstellen von M4B-Dateien"""

    def __init__(self):
        pass

    def create_m4b(self, folder_data: FolderData, output_path: str, copy_audio: bool = True, callback=None) -> bool:
        """Erstellt die M4B-Datei aus FolderData"""
        try:
            if not folder_data.audio_files:
                raise ValueError("Keine Eingabedateien vorhanden")

            # Temporäre Dateien
            temp_dir = Path(output_path).parent
            concat_file = temp_dir / "concat_list.txt"
            metadata_file = temp_dir / "metadata.txt"
            cover_file = None

            if callback:
                callback("Erstelle Konkatenierungsliste...")

            # Erstelle Konkatenierungsliste
            with open(concat_file, 'w', encoding='utf-8') as f:
                for audio_file in folder_data.audio_files:
                    safe_path = audio_file.path.replace("\\", "/").replace("'", "'\\''")
                    f.write(f"file '{safe_path}'\n")

            if callback:
                callback("Extrahiere Cover-Art...")

            # Cover-Art: Entweder benutzerdefiniert oder aus Datei extrahieren
            if folder_data.custom_artwork_path and os.path.exists(folder_data.custom_artwork_path):
                # Benutzerdefiniertes Artwork verwenden und als PNG konvertieren
                cover_file = temp_dir / "cover.png"
                convert_cmd = [
                    'ffmpeg',
                    '-i', folder_data.custom_artwork_path,
                    '-vcodec', 'png',
                    '-y',
                    str(cover_file)
                ]
                subprocess.run(convert_cmd, capture_output=True)
                if callback:
                    callback(f"Verwende benutzerdefiniertes Cover: {Path(folder_data.custom_artwork_path).name}")
            else:
                # Cover-Art aus der ersten Datei extrahieren und als PNG konvertieren
                for audio_file in folder_data.audio_files:
                    if audio_file.has_cover:
                        cover_file = temp_dir / "cover.png"

                        extract_cmd = [
                            'ffmpeg',
                            '-i', audio_file.path,
                            '-an',
                            '-vcodec', 'png',
                            '-y',
                            str(cover_file)
                        ]
                        subprocess.run(extract_cmd, capture_output=True)

                        if callback:
                            callback(f"Cover-Art gefunden in: {Path(audio_file.path).name}")
                        break

            if callback:
                callback("Erstelle Metadaten-Datei mit Kapiteln...")

            # Erstelle Metadaten-Datei mit Kapiteln
            cumulative_time = 0.0
            with open(metadata_file, 'w', encoding='utf-8') as f:
                f.write(";FFMETADATA1\n")

                # Globale Metadaten
                for key, value in folder_data.metadata.items():
                    if value:
                        # Datum auf Jahr reduzieren für Plex-Kompatibilität
                        if key == 'date' and 'T' in value:
                            value = value.split('-')[0]  # Nur Jahr behalten (z.B. "2011")
                        f.write(f"{key}={value}\n")

                # Kapitel
                for index, audio_file in enumerate(folder_data.audio_files, start=1):
                    chapter_title = f"Chapter {index}"
                    f.write("\n[CHAPTER]\n")
                    f.write("TIMEBASE=1/1000\n")
                    f.write(f"START={int(cumulative_time * 1000)}\n")
                    f.write(f"END={int((cumulative_time + audio_file.duration) * 1000)}\n")
                    f.write(f"title={chapter_title}\n")
                    cumulative_time += audio_file.duration

            if callback:
                if copy_audio:
                    callback("Erstelle M4B-Datei (Original-Qualität)...")
                else:
                    callback("Konvertiere zu M4B...")

            # Erstelle M4B-Datei
            cmd = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', str(concat_file),
                '-i', str(metadata_file),
            ]

            # Cover-Art hinzufügen, falls vorhanden
            if cover_file and cover_file.exists():
                cmd.extend(['-i', str(cover_file)])
                cmd.extend(['-map', '0:a'])
                cmd.extend(['-map', '2:v'])
                cmd.extend(['-map_metadata', '1'])

                if copy_audio:
                    cmd.extend(['-c:a', 'copy'])
                    cmd.extend(['-c:v', 'copy'])
                else:
                    cmd.extend(['-c:a', 'aac', '-b:a', '128k'])
                    cmd.extend(['-c:v', 'copy'])

                cmd.extend(['-disposition:v:0', 'attached_pic'])
            else:
                cmd.extend(['-map_metadata', '1'])

                if copy_audio:
                    cmd.extend(['-c', 'copy'])
                else:
                    cmd.extend(['-c:a', 'aac', '-b:a', '128k'])

            # Plex-kompatible Metadaten hinzufügen
            cmd.extend(['-metadata', 'media_type=2'])  # Audiobook
            cmd.extend(['-metadata', 'track=1'])        # Track-Nummer

            # M4A Brand für bessere Plex-Kompatibilität
            cmd.extend(['-brand', 'M4A '])  # Wichtig: mit Leerzeichen am Ende!

            cmd.extend([
                '-f', 'mp4',
                '-movflags', '+faststart',
                '-y',
                output_path
            ])

            if callback:
                callback("FFmpeg läuft...")

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                raise Exception(f"FFmpeg Fehler:\n{result.stderr}")

            # Aufräumen
            if concat_file.exists():
                concat_file.unlink()
            if metadata_file.exists():
                metadata_file.unlink()
            if cover_file and cover_file.exists():
                cover_file.unlink()

            if callback:
                callback("M4B-Datei erfolgreich erstellt!")

            return True

        except Exception as e:
            if callback:
                callback(f"Fehler: {str(e)}")
            return False


class BatchMetadataDialog:
    """Dialog zum Anwenden von Metadaten auf alle Ordner"""

    def __init__(self, parent):
        self.metadata = {}
        self.result = False

        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Metadaten auf alle Ordner anwenden")
        self.dialog.geometry("600x400")
        self.dialog.transient(parent)
        self.dialog.grab_set()

        self.setup_ui()

        # Zentriere Dialog
        self.dialog.update_idletasks()
        x = parent.winfo_x() + (parent.winfo_width() // 2) - (self.dialog.winfo_width() // 2)
        y = parent.winfo_y() + (parent.winfo_height() // 2) - (self.dialog.winfo_height() // 2)
        self.dialog.geometry(f"+{x}+{y}")

    def setup_ui(self):
        """Erstellt die Benutzeroberfläche"""
        main_frame = ttk.Frame(self.dialog, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Diese Metadaten werden auf ALLE Ordner angewendet:",
                 font=('TkDefaultFont', 10, 'bold')).pack(anchor=tk.W, pady=(0, 10))

        ttk.Label(main_frame, text="Leere Felder werden übersprungen (nicht überschrieben).",
                 font=('TkDefaultFont', 9), foreground='gray').pack(anchor=tk.W, pady=(0, 10))

        # Metadaten-Felder
        self.metadata_entries = {}
        metadata_fields = [
            ('artist', 'Autor:'),
            ('date', 'Jahr:'),
            ('genre', 'Genre:'),
        ]

        fields_frame = ttk.Frame(main_frame)
        fields_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        for key, label in metadata_fields:
            field_frame = ttk.Frame(fields_frame)
            field_frame.pack(fill=tk.X, pady=5)
            ttk.Label(field_frame, text=label, width=15).pack(side=tk.LEFT, padx=(0, 5))
            entry = ttk.Entry(field_frame)
            entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
            self.metadata_entries[key] = entry

        # Info
        info_frame = ttk.Frame(main_frame)
        info_frame.pack(fill=tk.X, pady=(10, 0))
        info_text = "Hinweis: Der Titel und Albumname werden NICHT überschrieben,\nda diese für jeden Ordner individuell sein sollten."
        ttk.Label(info_frame, text=info_text, font=('TkDefaultFont', 8),
                 foreground='gray', justify=tk.LEFT).pack(anchor=tk.W)

        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(20, 0))

        ttk.Button(button_frame, text="Abbrechen", command=self.cancel).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Anwenden", command=self.apply).pack(side=tk.RIGHT, padx=5)

    def apply(self):
        """Wendet die Metadaten an"""
        self.metadata = {}
        for key, entry in self.metadata_entries.items():
            value = entry.get().strip()
            if value:
                self.metadata[key] = value

        if not self.metadata:
            messagebox.showwarning("Keine Daten", "Bitte mindestens ein Feld ausfüllen!")
            return

        self.result = True
        self.dialog.destroy()

    def cancel(self):
        """Bricht ab"""
        self.result = False
        self.dialog.destroy()


class M4BCreatorGUI:
    """GUI für den M4B Creator"""

    def __init__(self, root):
        self.root = root
        self.root.title("M4B Creator - Batch-Verarbeitung")
        self.root.geometry("1400x800")

        self.folder_data_list: List[FolderData] = []
        self.selected_folder_index: Optional[int] = None

        self.setup_ui()

    def setup_ui(self):
        """Erstellt die Benutzeroberfläche"""

        # Hauptframe mit PanedWindow für linke/rechte Seite
        main_paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # LINKE SEITE: Ordnerliste und Einstellungen
        left_frame = ttk.Frame(main_paned, padding="5")
        main_paned.add(left_frame, weight=1)

        # Ordner-Liste
        folders_frame = ttk.LabelFrame(left_frame, text="Ordner-Liste (Drag & Drop unterstützt)", padding="5")
        folders_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 5))

        btn_frame = ttk.Frame(folders_frame)
        btn_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Button(btn_frame, text="+ Ordner", command=self.add_batch_folder).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="- Entfernen", command=self.remove_folder).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="Liste leeren", command=self.clear_batch_folders).pack(side=tk.LEFT, padx=2)

        # Listbox mit Scrollbar
        list_frame = ttk.Frame(folders_frame)
        list_frame.pack(fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.folder_listbox = tk.Listbox(list_frame, yscrollcommand=scrollbar.set)
        self.folder_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.folder_listbox.yview)
        self.folder_listbox.bind('<<ListboxSelect>>', self.on_folder_select)

        # Drag & Drop Unterstützung
        self.setup_drag_and_drop()

        # Batch-Metadaten
        batch_meta_frame = ttk.LabelFrame(left_frame, text="Batch-Aktionen", padding="5")
        batch_meta_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Button(batch_meta_frame, text="Metadaten auf alle anwenden",
                  command=self.apply_batch_metadata).pack(fill=tk.X, pady=2)

        # Einstellungen
        settings_frame = ttk.LabelFrame(left_frame, text="Einstellungen", padding="5")
        settings_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Label(settings_frame, text="Qualität:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.copy_audio_var = tk.BooleanVar(value=True)
        ttk.Radiobutton(settings_frame, text="Original",
                       variable=self.copy_audio_var, value=True).grid(row=0, column=1, sticky=tk.W)
        ttk.Radiobutton(settings_frame, text="Neu (AAC 128k)",
                       variable=self.copy_audio_var, value=False).grid(row=1, column=1, sticky=tk.W)

        ttk.Label(settings_frame, text="Unterordner:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        self.recursive_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(settings_frame, text="Rekursiv",
                       variable=self.recursive_var).grid(row=2, column=1, sticky=tk.W)

        # Ausgabe
        output_frame = ttk.LabelFrame(left_frame, text="Ausgabe", padding="5")
        output_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Label(output_frame, text="Ausgabeordner:").pack(anchor=tk.W, padx=5)
        output_entry_frame = ttk.Frame(output_frame)
        output_entry_frame.pack(fill=tk.X, padx=5, pady=2)

        self.output_dir_entry = ttk.Entry(output_entry_frame)
        self.output_dir_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(output_entry_frame, text="...", width=3,
                  command=self.browse_output_dir).pack(side=tk.RIGHT)

        ttk.Label(output_frame, text="Leer = Quellordner", font=('TkDefaultFont', 8),
                 foreground='gray').pack(anchor=tk.W, padx=5)

        # Start-Button
        ttk.Button(left_frame, text="⚡ Batch-Verarbeitung starten",
                  command=self.create_batch).pack(fill=tk.X, pady=5)

        # Status
        status_frame = ttk.LabelFrame(left_frame, text="Status", padding="5")
        status_frame.pack(fill=tk.BOTH, expand=True)

        self.status_text = scrolledtext.ScrolledText(status_frame, height=8, state='disabled')
        self.status_text.pack(fill=tk.BOTH, expand=True)

        # RECHTE SEITE: Detail-Ansicht
        right_frame = ttk.Frame(main_paned, padding="5")
        main_paned.add(right_frame, weight=2)

        # Notebook für Tabs
        self.detail_notebook = ttk.Notebook(right_frame)
        self.detail_notebook.pack(fill=tk.BOTH, expand=True)

        # Tab 1: Kapitel
        self.chapters_tab = ttk.Frame(self.detail_notebook, padding="10")
        self.detail_notebook.add(self.chapters_tab, text="Kapitel-Reihenfolge")

        ttk.Label(self.chapters_tab, text="Keine Auswahl",
                 font=('TkDefaultFont', 12)).pack(pady=50)

        # Tab 2: Metadaten
        self.metadata_tab = ttk.Frame(self.detail_notebook, padding="10")
        self.detail_notebook.add(self.metadata_tab, text="Metadaten")

        ttk.Label(self.metadata_tab, text="Keine Auswahl",
                 font=('TkDefaultFont', 12)).pack(pady=50)

        # Tab 3: Übersicht
        self.overview_tab = ttk.Frame(self.detail_notebook, padding="10")
        self.detail_notebook.add(self.overview_tab, text="Übersicht")

        ttk.Label(self.overview_tab, text="Keine Auswahl",
                 font=('TkDefaultFont', 12)).pack(pady=50)

    def add_batch_folder(self):
        """Fügt einen oder mehrere Ordner zur Batch-Liste hinzu"""
        # Erstelle einen benutzerdefinierten Dialog für Multi-Select
        import tkinter.filedialog as fd

        # Nutze einen Trick: Zeige Dialog für Dateien, aber erlaube nur Ordner-Auswahl
        folders = []

        # Windows: Nutze askdirectory mehrfach mit Hinweis
        result = messagebox.askyesno(
            "Mehrere Ordner hinzufügen?",
            "Möchten Sie mehrere Ordner gleichzeitig auswählen?\n\n"
            "Ja = Mehrere Ordner nacheinander auswählen (mit Abbrechen beenden)\n"
            "Nein = Nur einen Ordner auswählen"
        )

        if result:  # Mehrere Ordner
            while True:
                folder = filedialog.askdirectory(title="Ordner auswählen (Abbrechen zum Beenden)")
                if not folder:
                    break
                if folder not in folders:
                    folders.append(folder)
        else:  # Nur ein Ordner
            folder = filedialog.askdirectory(title="Ordner mit Audiodateien auswählen")
            if folder:
                folders.append(folder)

        # Verarbeite alle ausgewählten Ordner
        added_count = 0
        for folder in folders:
            if any(fd.folder_path == folder for fd in self.folder_data_list):
                continue  # Überspringe bereits vorhandene

            recursive = self.recursive_var.get()
            folder_data = FolderData(folder, recursive)

            if not folder_data.audio_files:
                messagebox.showwarning("Keine Dateien", f"Keine Audiodateien in {folder} gefunden!")
                continue  # Überspringe diesen Ordner

            self.folder_data_list.append(folder_data)
            added_count += 1

        if added_count > 0:
            self.update_folder_list()
            if added_count > 1:
                messagebox.showinfo("Erfolg", f"{added_count} Ordner hinzugefügt!")
            else:
                messagebox.showinfo("Erfolg", "Ordner hinzugefügt!")

    def remove_folder(self):
        """Entfernt den ausgewählten Ordner"""
        if self.selected_folder_index is None:
            messagebox.showinfo("Keine Auswahl", "Bitte einen Ordner auswählen!")
            return

        folder_name = self.folder_data_list[self.selected_folder_index].folder_name

        if messagebox.askyesno("Bestätigen", f"'{folder_name}' aus der Liste entfernen?"):
            del self.folder_data_list[self.selected_folder_index]
            self.selected_folder_index = None
            self.update_folder_list()
            self.clear_detail_view()

    def clear_batch_folders(self):
        """Leert die Ordnerliste"""
        if self.folder_data_list and messagebox.askyesno("Bestätigen", "Alle Ordner entfernen?"):
            self.folder_data_list = []
            self.selected_folder_index = None
            self.update_folder_list()
            self.clear_detail_view()

    def setup_drag_and_drop(self):
        """Richtet Drag & Drop für die Ordnerliste ein"""
        try:
            # Versuche tkinterdnd2 zu verwenden
            from tkinterdnd2 import DND_FILES

            # Aktiviere Drag & Drop für die Listbox
            self.folder_listbox.drop_target_register(DND_FILES)
            self.folder_listbox.dnd_bind('<<Drop>>', self.on_drop)
            print("✓ Drag & Drop aktiviert (tkinterdnd2)")
        except ImportError:
            # Fallback: Versuche windnd (nur Windows)
            try:
                import windnd
                windnd.hook_dropfiles(self.folder_listbox, func=self.on_drop_windnd)
                print("✓ Drag & Drop aktiviert (windnd)")
            except ImportError:
                print("Info: Drag & Drop nicht verfügbar.")
                print("Installiere eines der folgenden Pakete:")
                print("  - pip install tkinterdnd2")
                print("  - pip install windnd")
        except Exception as e:
            print(f"Drag & Drop konnte nicht aktiviert werden: {e}")

    def on_drop(self, event):
        """Verarbeitet Drag & Drop Events (tkinterdnd2)"""
        # Parse die gedropten Pfade
        files = self.root.tk.splitlist(event.data)

        added_count = 0
        recursive = self.recursive_var.get()

        for file_path in files:
            # Bereinige Pfad (entferne geschweifte Klammern falls vorhanden)
            file_path = file_path.strip('{}')

            # Prüfe ob es ein Ordner ist
            if os.path.isdir(file_path):
                # Prüfe ob bereits vorhanden
                if any(fd.folder_path == file_path for fd in self.folder_data_list):
                    continue

                folder_data = FolderData(file_path, recursive)

                if folder_data.audio_files:
                    self.folder_data_list.append(folder_data)
                    added_count += 1

        if added_count > 0:
            self.update_folder_list()
            if added_count > 1:
                messagebox.showinfo("Erfolg", f"{added_count} Ordner per Drag & Drop hinzugefügt!")
            else:
                messagebox.showinfo("Erfolg", "Ordner per Drag & Drop hinzugefügt!")

    def on_drop_windnd(self, files):
        """Verarbeitet Drag & Drop Events (windnd)"""
        added_count = 0
        recursive = self.recursive_var.get()

        for file_path in files:
            # Dekodiere Bytes zu String falls nötig
            if isinstance(file_path, bytes):
                file_path = file_path.decode('utf-8')

            # Prüfe ob es ein Ordner ist
            if os.path.isdir(file_path):
                # Prüfe ob bereits vorhanden
                if any(fd.folder_path == file_path for fd in self.folder_data_list):
                    continue

                folder_data = FolderData(file_path, recursive)

                if folder_data.audio_files:
                    self.folder_data_list.append(folder_data)
                    added_count += 1

        if added_count > 0:
            self.update_folder_list()
            if added_count > 1:
                messagebox.showinfo("Erfolg", f"{added_count} Ordner per Drag & Drop hinzugefügt!")
            else:
                messagebox.showinfo("Erfolg", "Ordner per Drag & Drop hinzugefügt!")

    def update_folder_list(self):
        """Aktualisiert die Ordnerliste"""
        self.folder_listbox.delete(0, tk.END)
        for folder_data in self.folder_data_list:
            file_count = len(folder_data.audio_files)
            display = f"{folder_data.output_name} ({file_count} Dateien)"
            self.folder_listbox.insert(tk.END, display)

    def on_folder_select(self, event):
        """Wird aufgerufen wenn ein Ordner ausgewählt wird"""
        selection = self.folder_listbox.curselection()
        if selection:
            self.selected_folder_index = selection[0]
            self.show_folder_details()

    def show_folder_details(self):
        """Zeigt die Details des ausgewählten Ordners"""
        if self.selected_folder_index is None:
            return

        folder_data = self.folder_data_list[self.selected_folder_index]

        # Tab 1: Kapitel aufbauen
        for widget in self.chapters_tab.winfo_children():
            widget.destroy()

        ttk.Label(self.chapters_tab, text=f"Kapitel: {folder_data.output_name}",
                 font=('TkDefaultFont', 11, 'bold')).pack(anchor=tk.W, pady=(0, 10))

        # Buttons
        btn_frame = ttk.Frame(self.chapters_tab)
        btn_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Button(btn_frame, text="↑ Nach oben", command=self.move_chapter_up).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="↓ Nach unten", command=self.move_chapter_down).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="🔄 Aktualisieren", command=self.show_folder_details).pack(side=tk.LEFT, padx=2)

        # Kapitel-Liste
        list_frame = ttk.Frame(self.chapters_tab)
        list_frame.pack(fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.chapter_listbox = tk.Listbox(list_frame, yscrollcommand=scrollbar.set, font=('Courier', 9))
        self.chapter_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.chapter_listbox.yview)

        for idx, audio_file in enumerate(folder_data.audio_files, 1):
            filename = Path(audio_file.path).name
            duration = f"{audio_file.duration / 60:.1f} min"
            display = f"{idx:3d}. {filename:<70} ({duration})"
            self.chapter_listbox.insert(tk.END, display)

        # Tab 2: Metadaten aufbauen
        for widget in self.metadata_tab.winfo_children():
            widget.destroy()

        ttk.Label(self.metadata_tab, text=f"Metadaten: {folder_data.output_name}",
                 font=('TkDefaultFont', 11, 'bold')).pack(anchor=tk.W, pady=(0, 10))

        # Hauptcontainer mit zwei Spalten: Links Artwork, Rechts Metadaten
        main_container = ttk.Frame(self.metadata_tab)
        main_container.pack(fill=tk.BOTH, expand=True)

        # LINKE SPALTE: Artwork
        artwork_frame = ttk.LabelFrame(main_container, text="Cover-Artwork", padding="10")
        artwork_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))

        # Artwork-Anzeige
        self.artwork_label = ttk.Label(artwork_frame, text="Kein Cover", relief=tk.RIDGE)
        self.artwork_label.pack(pady=5)

        # Lade und zeige Artwork
        self.load_and_display_artwork(folder_data)

        # Artwork-Buttons
        artwork_btn_frame = ttk.Frame(artwork_frame)
        artwork_btn_frame.pack(fill=tk.X, pady=5)

        ttk.Button(artwork_btn_frame, text="Cover ändern",
                  command=self.change_artwork).pack(fill=tk.X, pady=2)
        ttk.Button(artwork_btn_frame, text="Cover extrahieren",
                  command=self.extract_artwork).pack(fill=tk.X, pady=2)
        ttk.Button(artwork_btn_frame, text="Cover entfernen",
                  command=self.remove_artwork).pack(fill=tk.X, pady=2)

        # RECHTE SPALTE: Metadaten
        metadata_container = ttk.Frame(main_container)
        metadata_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Ausgabename
        name_frame = ttk.Frame(metadata_container)
        name_frame.pack(fill=tk.X, pady=5)
        ttk.Label(name_frame, text="Ausgabename:", width=15).pack(side=tk.LEFT, padx=(0, 5))
        self.output_name_entry = ttk.Entry(name_frame)
        self.output_name_entry.insert(0, folder_data.output_name)
        self.output_name_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Metadaten
        self.metadata_entries = {}
        metadata_fields = [
            ('title', 'Titel:'),
            ('artist', 'Autor:'),
            ('album', 'Album/Buch:'),
            ('date', 'Jahr:'),
            ('genre', 'Genre:'),
        ]

        for key, label in metadata_fields:
            field_frame = ttk.Frame(metadata_container)
            field_frame.pack(fill=tk.X, pady=3)
            ttk.Label(field_frame, text=label, width=15).pack(side=tk.LEFT, padx=(0, 5))
            entry = ttk.Entry(field_frame)
            entry.insert(0, folder_data.metadata.get(key, ''))
            entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
            self.metadata_entries[key] = entry

        # Speichern-Button
        ttk.Button(metadata_container, text="💾 Änderungen speichern",
                  command=self.save_folder_metadata).pack(pady=20)

        # Tab 3: Übersicht aufbauen
        for widget in self.overview_tab.winfo_children():
            widget.destroy()

        ttk.Label(self.overview_tab, text=f"Übersicht: {folder_data.output_name}",
                 font=('TkDefaultFont', 11, 'bold')).pack(anchor=tk.W, pady=(0, 10))

        info_text_widget = tk.Text(self.overview_tab, wrap=tk.WORD, state='disabled')
        info_text_widget.pack(fill=tk.BOTH, expand=True)

        info_lines = [
            f"Ordnername: {folder_data.folder_name}",
            f"Pfad: {folder_data.folder_path}",
            f"Ausgabename: {folder_data.output_name}.m4b",
            f"Anzahl Dateien: {len(folder_data.audio_files)}",
            f"Rekursiv: {'Ja' if folder_data.recursive else 'Nein'}",
            "",
            "Audiodateien:",
            "-" * 80
        ]

        total_duration = 0.0
        for idx, af in enumerate(folder_data.audio_files, 1):
            duration_str = f"{af.duration / 60:.1f} min"
            info_lines.append(f"{idx:3d}. {Path(af.path).name} ({duration_str})")
            total_duration += af.duration

        info_lines.append("-" * 80)
        info_lines.append(f"Gesamtdauer: {total_duration / 3600:.2f} Stunden ({total_duration / 60:.1f} Minuten)")

        info_text_widget.config(state='normal')
        info_text_widget.insert('1.0', '\n'.join(info_lines))
        info_text_widget.config(state='disabled')

    def clear_detail_view(self):
        """Leert die Detail-Ansicht"""
        for widget in self.chapters_tab.winfo_children():
            widget.destroy()
        ttk.Label(self.chapters_tab, text="Keine Auswahl", font=('TkDefaultFont', 12)).pack(pady=50)

        for widget in self.metadata_tab.winfo_children():
            widget.destroy()
        ttk.Label(self.metadata_tab, text="Keine Auswahl", font=('TkDefaultFont', 12)).pack(pady=50)

        for widget in self.overview_tab.winfo_children():
            widget.destroy()
        ttk.Label(self.overview_tab, text="Keine Auswahl", font=('TkDefaultFont', 12)).pack(pady=50)

    def move_chapter_up(self):
        """Verschiebt Kapitel nach oben"""
        if self.selected_folder_index is None:
            return

        if not hasattr(self, 'chapter_listbox'):
            return

        selection = self.chapter_listbox.curselection()
        if selection:
            index = selection[0]
            if index > 0:
                folder_data = self.folder_data_list[self.selected_folder_index]
                folder_data.move_file_up(index)
                self.show_folder_details()
                self.chapter_listbox.selection_set(index - 1)
                self.chapter_listbox.see(index - 1)

    def move_chapter_down(self):
        """Verschiebt Kapitel nach unten"""
        if self.selected_folder_index is None:
            return

        if not hasattr(self, 'chapter_listbox'):
            return

        selection = self.chapter_listbox.curselection()
        if selection:
            index = selection[0]
            folder_data = self.folder_data_list[self.selected_folder_index]
            if index < len(folder_data.audio_files) - 1:
                folder_data.move_file_down(index)
                self.show_folder_details()
                self.chapter_listbox.selection_set(index + 1)
                self.chapter_listbox.see(index + 1)

    def load_and_display_artwork(self, folder_data: FolderData):
        """Lädt und zeigt das Artwork an"""
        artwork_path = None

        # Prüfe ob benutzerdefiniertes Artwork existiert
        if folder_data.custom_artwork_path and os.path.exists(folder_data.custom_artwork_path):
            artwork_path = folder_data.custom_artwork_path
        else:
            # Versuche Cover aus erster Datei zu extrahieren
            for audio_file in folder_data.audio_files:
                if audio_file.has_cover:
                    # Extrahiere Cover temporär
                    temp_cover = Path(folder_data.folder_path) / ".temp_cover.jpg"
                    extract_cmd = [
                        'ffmpeg',
                        '-i', audio_file.path,
                        '-an',
                        '-vcodec', 'copy',
                        '-y',
                        str(temp_cover)
                    ]
                    result = subprocess.run(extract_cmd, capture_output=True)
                    if result.returncode == 0 and temp_cover.exists():
                        artwork_path = str(temp_cover)
                    break

        # Zeige Artwork
        if artwork_path and os.path.exists(artwork_path):
            try:
                img = Image.open(artwork_path)
                # Resize für Anzeige (max 300x300)
                img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self.artwork_label.configure(image=photo, text="")
                self.artwork_label.image = photo  # Referenz behalten
            except Exception as e:
                self.artwork_label.configure(text=f"Fehler beim\nLaden: {str(e)}", image="")
        else:
            self.artwork_label.configure(text="Kein Cover\nverfügbar", image="")

    def change_artwork(self):
        """Ändert das Artwork des ausgewählten Ordners"""
        if self.selected_folder_index is None:
            return

        folder_data = self.folder_data_list[self.selected_folder_index]

        file_path = filedialog.askopenfilename(
            title="Cover-Bild auswählen",
            filetypes=[
                ("Bild-Dateien", "*.jpg *.jpeg *.png *.bmp *.gif"),
                ("Alle Dateien", "*.*")
            ]
        )

        if file_path:
            folder_data.custom_artwork_path = file_path
            self.load_and_display_artwork(folder_data)
            messagebox.showinfo("Erfolg", "Cover wurde geändert!")

    def extract_artwork(self):
        """Extrahiert das Cover und speichert es"""
        if self.selected_folder_index is None:
            return

        folder_data = self.folder_data_list[self.selected_folder_index]

        # Finde Quelle für Cover
        source_path = None
        if folder_data.custom_artwork_path and os.path.exists(folder_data.custom_artwork_path):
            source_path = folder_data.custom_artwork_path
        else:
            # Suche in Audiodateien
            for audio_file in folder_data.audio_files:
                if audio_file.has_cover:
                    # Extrahiere temporär
                    temp_cover = Path(folder_data.folder_path) / ".temp_extract_cover.jpg"
                    extract_cmd = [
                        'ffmpeg',
                        '-i', audio_file.path,
                        '-an',
                        '-vcodec', 'copy',
                        '-y',
                        str(temp_cover)
                    ]
                    result = subprocess.run(extract_cmd, capture_output=True)
                    if result.returncode == 0 and temp_cover.exists():
                        source_path = str(temp_cover)
                    break

        if not source_path:
            messagebox.showwarning("Kein Cover", "Kein Cover zum Extrahieren gefunden!")
            return

        # Speichern-Dialog
        save_path = filedialog.asksaveasfilename(
            title="Cover speichern unter",
            defaultextension=".jpg",
            initialfile=f"{folder_data.output_name}_cover.jpg",
            filetypes=[
                ("JPEG", "*.jpg"),
                ("PNG", "*.png"),
                ("Alle Dateien", "*.*")
            ]
        )

        if save_path:
            try:
                shutil.copy2(source_path, save_path)
                messagebox.showinfo("Erfolg", f"Cover gespeichert:\n{save_path}")
            except Exception as e:
                messagebox.showerror("Fehler", f"Fehler beim Speichern:\n{str(e)}")

            # Aufräumen
            if source_path.endswith('.temp_extract_cover.jpg'):
                try:
                    os.remove(source_path)
                except:
                    pass

    def remove_artwork(self):
        """Entfernt das benutzerdefinierte Artwork"""
        if self.selected_folder_index is None:
            return

        folder_data = self.folder_data_list[self.selected_folder_index]

        if folder_data.custom_artwork_path:
            if messagebox.askyesno("Bestätigen", "Benutzerdefiniertes Cover entfernen?"):
                folder_data.custom_artwork_path = None
                self.load_and_display_artwork(folder_data)
                messagebox.showinfo("Erfolg", "Cover wurde entfernt!")
        else:
            messagebox.showinfo("Kein Cover", "Kein benutzerdefiniertes Cover vorhanden!")

    def save_folder_metadata(self):
        """Speichert die Metadaten des aktuellen Ordners"""
        if self.selected_folder_index is None:
            return

        folder_data = self.folder_data_list[self.selected_folder_index]

        # Metadaten aktualisieren
        for key, entry in self.metadata_entries.items():
            folder_data.metadata[key] = entry.get()

        # Ausgabename aktualisieren
        folder_data.output_name = self.output_name_entry.get().strip()
        if not folder_data.output_name:
            folder_data.output_name = folder_data.folder_name

        self.update_folder_list()
        messagebox.showinfo("Gespeichert", "Änderungen wurden gespeichert!")

    def apply_batch_metadata(self):
        """Öffnet Dialog zum Anwenden von Metadaten auf alle Ordner"""
        if not self.folder_data_list:
            messagebox.showinfo("Keine Ordner", "Bitte erst Ordner hinzufügen!")
            return

        dialog = BatchMetadataDialog(self.root)
        self.root.wait_window(dialog.dialog)

        if dialog.result and dialog.metadata:
            count = 0
            for folder_data in self.folder_data_list:
                for key, value in dialog.metadata.items():
                    folder_data.metadata[key] = value
                count += 1

            messagebox.showinfo("Erfolg", f"Metadaten auf {count} Ordner angewendet!")

            # Aktualisiere Ansicht falls ein Ordner ausgewählt ist
            if self.selected_folder_index is not None:
                self.show_folder_details()

    def browse_output_dir(self):
        """Öffnet Dialog zur Auswahl des Ausgabeordners"""
        folder = filedialog.askdirectory(title="Ausgabeordner wählen")
        if folder:
            self.output_dir_entry.delete(0, tk.END)
            self.output_dir_entry.insert(0, folder)

    def log_status(self, message):
        """Fügt eine Statusmeldung hinzu"""
        self.status_text.config(state='normal')
        self.status_text.insert(tk.END, message + "\n")
        self.status_text.see(tk.END)
        self.status_text.config(state='disabled')
        self.root.update()

    def create_batch(self):
        """Startet die Batch-Verarbeitung"""
        if not self.folder_data_list:
            messagebox.showerror("Fehler", "Bitte mindestens einen Ordner hinzufügen!")
            return

        output_dir = self.output_dir_entry.get().strip()

        self.status_text.config(state='normal')
        self.status_text.delete(1.0, tk.END)
        self.status_text.config(state='disabled')

        def run_batch():
            copy_audio = self.copy_audio_var.get()

            total_folders = len(self.folder_data_list)
            successful = 0
            failed = 0

            self.log_status(f"=== Batch-Verarbeitung gestartet ===")
            self.log_status(f"Anzahl Ordner: {total_folders}")
            self.log_status(f"Audio-Modus: {'Original kopieren' if copy_audio else 'Neu codieren'}")
            self.log_status("")

            creator = M4BCreator()

            for idx, folder_data in enumerate(self.folder_data_list, 1):
                self.log_status(f"[{idx}/{total_folders}] Verarbeite: {folder_data.output_name}")
                self.log_status("-" * 60)

                try:
                    if not folder_data.audio_files:
                        self.log_status(f"WARNUNG: Keine Audiodateien!")
                        self.log_status("")
                        continue

                    self.log_status(f"Dateien: {len(folder_data.audio_files)}")
                    self.log_status(f"Kapitel: {len(folder_data.audio_files)}")

                    if output_dir:
                        output_path = os.path.join(output_dir, f"{folder_data.output_name}.m4b")
                    else:
                        output_path = os.path.join(folder_data.folder_path, f"{folder_data.output_name}.m4b")

                    self.log_status(f"Ausgabe: {output_path}")

                    success = creator.create_m4b(folder_data, output_path, copy_audio, self.log_status)

                    if success:
                        successful += 1
                        self.log_status(f"✓ ERFOLG: {folder_data.output_name}.m4b erstellt!")
                    else:
                        failed += 1
                        self.log_status(f"✗ FEHLER: Konnte nicht erstellt werden!")

                except Exception as e:
                    failed += 1
                    self.log_status(f"✗ FEHLER: {str(e)}")

                self.log_status("")

            self.log_status("=" * 60)
            self.log_status(f"=== Batch-Verarbeitung abgeschlossen ===")
            self.log_status(f"Gesamt: {total_folders} Ordner")
            self.log_status(f"Erfolgreich: {successful}")
            self.log_status(f"Fehlgeschlagen: {failed}")

            if failed == 0:
                self.root.after(0, lambda: messagebox.showinfo("Erfolg",
                    f"Alle {successful} M4B-Dateien wurden erfolgreich erstellt!"))
            else:
                self.root.after(0, lambda: messagebox.showwarning("Teilweise erfolgreich",
                    f"Erfolgreich: {successful}\nFehlgeschlagen: {failed}\n\nSiehe Status-Log für Details."))

        thread = threading.Thread(target=run_batch, daemon=True)
        thread.start()


def main():
    """Hauptfunktion"""
    # Versuche TkinterDnD zu verwenden für Drag & Drop Support
    try:
        from tkinterdnd2 import TkinterDnD
        root = TkinterDnD.Tk()
    except ImportError:
        root = tk.Tk()

    app = M4BCreatorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
