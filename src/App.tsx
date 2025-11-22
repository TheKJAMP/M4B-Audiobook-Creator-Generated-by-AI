import { useState } from "react";
import { Play, FolderPlus, Trash2, X, FileAudio, Book, Info, Moon, Sun, Languages, Save, Edit2, GripVertical, Check, Settings, Folder } from "lucide-react";
import MetadataTab from "./MetadataTab";

interface AudioFile {
  path: string;
  filename: string;
  duration: number;
  customName?: string;
  hasCover?: boolean;
  chapterName?: string;
  title?: string;
}

interface Folder {
  id: string;
  path: string;
  name: string;
  files: AudioFile[];
  metadata: {
    title: string;
    author: string;
    album: string;
    year: string;
    genre: string;
  };
  coverArt?: string;
  outputPath?: string;
}

function Spinner() {
  return (
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 animate-spin">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-green-500 rounded-full" style={{ transformOrigin: 'center 20px' }} />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2.5 bg-green-400 rounded-full" style={{ transformOrigin: 'center 20px', transform: 'rotate(45deg) translateX(-50%)' }} />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-green-300 rounded-full" style={{ transformOrigin: 'center 20px', transform: 'rotate(90deg) translateX(-50%)' }} />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-green-200 rounded-full" style={{ transformOrigin: 'center 20px', transform: 'rotate(135deg) translateX(-50%)' }} />
      </div>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"Chapter" | "Metadata" | "Overview">("Chapter");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedChapter, setDraggedChapter] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([
    language === "de" ? "Willkommen zu M4B Creator v1.0.3" : "Welcome to M4B Creator v1.0.3",
    language === "de" ? "Bereit zum Erstellen von Hörbüchern..." : "Ready to create audiobooks..."
  ]);

  const t = {
    de: {
      folders: "Ordner",
      noFolders: "Keine Ordner hinzugefügt\nKlicken Sie auf \"Ordner hinzufügen\"",
      files: "Dateien",
      statusLog: "Status-Log",
      chapters: "Kapitel",
      path: "Pfad",
      duration: "Dauer",
      min: "Min",
      ready: "Bereit",
      start: "Start",
      addFolder: "Ordner hinzufügen",
      remove: "Entfernen",
      clearList: "Liste löschen",
      chapter: "Kapitel",
      metadata: "Metadaten",
      overview: "Übersicht",
      openingFolder: "Öffne Ordnerauswahl-Dialog...",
      addedFolder: "Ordner hinzugefügt:",
      removedFolder: "Ordner entfernt:",
      noFolderSelected: "Kein Ordner zum Entfernen ausgewählt",
      clearedAll: "Alle Ordner gelöscht",
      switchedTo: "Gewechselt zu",
      tab: "Tab",
      selectFolder: "Ordner auswählen",
      starting: "Starte M4B-Erstellungsprozess...",
      processing: "Verarbeite Ordner",
      of: "von",
      allProcessed: "Alle Ordner erfolgreich verarbeitet! (100%)",
      noFoldersError: "Fehler: Keine Ordner zu verarbeiten",
      selected: "Ausgewählt:",
      language: "Sprache:",
      darkMode: "Dark Mode:"
    },
    en: {
      folders: "Folders",
      noFolders: "No folders added\nClick \"Add Folder\"",
      files: "files",
      statusLog: "Status Log",
      chapters: "chapters",
      path: "Path",
      duration: "Duration",
      min: "min",
      ready: "Ready",
      start: "Start",
      addFolder: "Add Folder",
      remove: "Remove",
      clearList: "Clear List",
      chapter: "Chapter",
      metadata: "Metadata",
      overview: "Overview",
      openingFolder: "Opening folder selection dialog...",
      addedFolder: "Added folder:",
      removedFolder: "Removed folder:",
      noFolderSelected: "No folder selected to remove",
      clearedAll: "Cleared all folders",
      switchedTo: "Switched to",
      tab: "tab",
      selectFolder: "Select a folder",
      starting: "Starting M4B creation process...",
      processing: "Processing folder",
      of: "of",
      allProcessed: "All folders processed successfully! (100%)",
      noFoldersError: "Error: No folders to process",
      selected: "Selected:",
      language: "Language:",
      darkMode: "Dark mode:"
    }
  };

  const tr = t[language];

  const addLogMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const handleAddFolder = async () => {
    addLogMessage(language === "de" ? "Ordnerauswahl wird geöffnet..." : "Opening folder selection...");

    try {
      const folderPath = await window.electronAPI.selectFolder();

      if (!folderPath) {
        addLogMessage(language === "de" ? "Keine Auswahl getroffen" : "No selection made");
        return;
      }

      addLogMessage(language === "de" ? `Scanne Ordner: ${folderPath}` : `Scanning folder: ${folderPath}`);

      // Get audio files from folder
      const audioFiles = await window.electronAPI.getAudioFiles(folderPath, false);

      if (audioFiles.length === 0) {
        addLogMessage(language === "de" ? "Keine Audiodateien gefunden!" : "No audio files found!");
        return;
      }

      addLogMessage(language === "de" ? `${audioFiles.length} Audiodateien gefunden` : `Found ${audioFiles.length} audio files`);

      // Get metadata for each file
      const filesWithMetadata: AudioFile[] = [];
      for (const filePath of audioFiles) {
        const metadata = await window.electronAPI.getFileMetadata(filePath);
        const filename = filePath.split('\\').pop() || filePath.split('/').pop() || '';

        // Use title from metadata if available, otherwise use filename
        const chapterName = metadata.tags?.title || filename;

        filesWithMetadata.push({
          path: filePath,
          filename: filename,
          duration: metadata.duration,
          hasCover: metadata.hasCover,
          title: metadata.tags?.title,
          chapterName: chapterName
        });
      }

      // Extract metadata from first file
      const firstFileMetadata = filesWithMetadata[0] ? await window.electronAPI.getFileMetadata(filesWithMetadata[0].path) : null;

      const folderName = folderPath.split('\\').pop() || folderPath.split('/').pop() || 'Unknown';

      // Check if any file has cover art
      const fileWithCover = filesWithMetadata.find(f => f.hasCover);
      let coverArt: string | undefined = undefined;

      if (fileWithCover) {
        try {
          addLogMessage(language === "de" ? "Lade Cover-Bild..." : "Loading cover image...");
          const tempCoverPath = `${folderPath}\\temp_cover_${Date.now()}.png`;
          const extractResult = await window.electronAPI.extractCover(fileWithCover.path, tempCoverPath);

          if (extractResult.success) {
            // Read the file as base64
            const coverData = await window.electronAPI.readFileAsBase64(tempCoverPath);
            if (coverData) {
              coverArt = `data:image/png;base64,${coverData}`;
            }
            // Delete temp file
            await window.electronAPI.deleteFile(tempCoverPath);
          }
        } catch (error) {
          console.error('Error loading cover:', error);
        }
      }

      const newFolder: Folder = {
        id: Date.now().toString(),
        path: folderPath,
        name: folderName,
        files: filesWithMetadata,
        metadata: {
          title: firstFileMetadata?.tags?.album || firstFileMetadata?.tags?.title || folderName,
          author: firstFileMetadata?.tags?.artist || '',
          album: firstFileMetadata?.tags?.album || '',
          year: firstFileMetadata?.tags?.date || '',
          genre: firstFileMetadata?.tags?.genre || ''
        },
        coverArt: coverArt
      };

      setFolders(prev => [...prev, newFolder]);
      addLogMessage(`${tr.addedFolder} ${folderName}`);
    } catch (error) {
      addLogMessage(language === "de" ? `Fehler: ${error}` : `Error: ${error}`);
    }
  };

  const handleRemoveFolder = (folderId?: string) => {
    const folderToRemove = folderId
      ? folders.find(f => f.id === folderId)
      : selectedFolder;

    if (folderToRemove) {
      setFolders(prev => prev.filter(f => f.id !== folderToRemove.id));
      addLogMessage(`${tr.removedFolder} ${folderToRemove.name}`);
      if (selectedFolder?.id === folderToRemove.id) {
        setSelectedFolder(null);
      }
    } else {
      addLogMessage(tr.noFolderSelected);
    }
  };

  const handleClearList = () => {
    setIsClearing(true);
    // Warte bis die Fade-out Animation abgeschlossen ist (500ms)
    setTimeout(() => {
      setFolders([]);
      setSelectedFolder(null);
      setIsClearing(false);
      addLogMessage(tr.clearedAll);
    }, 500);
  };

  const handleStart = async () => {
    if (folders.length === 0) {
      addLogMessage(tr.noFoldersError);
      return;
    }

    setIsLoading(true);
    setProgress(0);
    addLogMessage(tr.starting);

    // Set up log listener
    window.electronAPI.onLog((message: string) => {
      addLogMessage(message);
    });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const percent = Math.round((i / folders.length) * 100);
      setProgress(percent);

      addLogMessage(`${tr.processing} ${i + 1}/${folders.length}: ${folder.name}`);

      try {
        const outputPath = folder.outputPath || `${folder.path}\\${folder.name}.m4b`;

        const result = await window.electronAPI.createM4B(
          folder,
          outputPath,
          { copyAudio: true } // Use original quality
        );

        if (result.success) {
          successCount++;
          addLogMessage(language === "de" ? `✓ Erfolgreich: ${folder.name}.m4b` : `✓ Success: ${folder.name}.m4b`);
        } else {
          failedCount++;
          addLogMessage(language === "de" ? `✗ Fehler bei: ${folder.name}` : `✗ Error: ${folder.name}`);
          if (result.error) {
            addLogMessage(`Error: ${result.error}`);
          }
        }
      } catch (error) {
        failedCount++;
        addLogMessage(language === "de" ? `✗ Fehler bei: ${folder.name}` : `✗ Error: ${folder.name}`);
        addLogMessage(`Error: ${error}`);
      }
    }

    setProgress(100);
    addLogMessage(language === "de"
      ? `=== Abgeschlossen === Erfolgreich: ${successCount}, Fehlgeschlagen: ${failedCount}`
      : `=== Completed === Success: ${successCount}, Failed: ${failedCount}`);
    setIsLoading(false);
  };

  const handleButtonClick = (button: string) => {
    switch (button) {
      case "addFolder": handleAddFolder(); break;
      case "remove": handleRemoveFolder(); break;
      case "clearList": handleClearList(); break;
      case "Chapter":
      case "Metadata":
      case "Overview":
        setActiveTab(button as any);
        addLogMessage(`${tr.switchedTo} ${button} ${tr.tab}`);
        break;
    }
  };

  const handleUpdateFolder = (updates: Partial<Folder>) => {
    if (selectedFolder) {
      const updated = { ...selectedFolder, ...updates };
      setSelectedFolder(updated);
      setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
    }
  };

  const handleStartEditChapter = (index: number, file: AudioFile) => {
    setEditingChapter(index);
    setEditingName(file.customName || file.filename);
  };

  const handleSaveChapterName = (index: number) => {
    if (selectedFolder && editingName.trim()) {
      const updatedFiles = [...selectedFolder.files];
      updatedFiles[index] = { ...updatedFiles[index], customName: editingName.trim() };
      handleUpdateFolder({ files: updatedFiles });
      addLogMessage(`${language === "de" ? "Kapitel umbenannt:" : "Chapter renamed:"} ${editingName.trim()}`);
    }
    setEditingChapter(null);
    setEditingName("");
  };

  const handleDragStart = (index: number) => {
    setDraggedChapter(index);
  };

  const handleChapterDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedChapter === null || draggedChapter === index) return;

    if (selectedFolder) {
      const updatedFiles = [...selectedFolder.files];
      const draggedFile = updatedFiles[draggedChapter];
      updatedFiles.splice(draggedChapter, 1);
      updatedFiles.splice(index, 0, draggedFile);
      handleUpdateFolder({ files: updatedFiles });
      setDraggedChapter(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedChapter(null);
    addLogMessage(language === "de" ? "Kapitelreihenfolge geändert" : "Chapter order changed");
  };

  const handleDeleteChapter = (index: number) => {
    if (selectedFolder) {
      const updatedFiles = [...selectedFolder.files];
      const deletedFile = updatedFiles[index];
      updatedFiles.splice(index, 1);
      handleUpdateFolder({ files: updatedFiles });
      addLogMessage(`${language === "de" ? "Kapitel gelöscht:" : "Chapter deleted:"} ${deletedFile.customName || deletedFile.filename}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      // Collect all folder paths first
      const folderPaths: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();

          if (entry && entry.isDirectory) {
            // Get the full path using the File API
            const file = item.getAsFile();
            if (file && (file as any).path) {
              folderPaths.push((file as any).path);
            }
          }
        }
      }

      // Process each folder path
      for (const rawPath of folderPaths) {
        addLogMessage(language === "de" ? `Verarbeite: ${rawPath}` : `Processing: ${rawPath}`);

        try {
          // Process the path through the main process
          const result = await window.electronAPI.processDroppedPath(rawPath);

          if (result.success && result.path) {
            const folderPath = result.path;
            addLogMessage(language === "de" ? `Ordner per Drag & Drop hinzugefügt: ${folderPath}` : `Folder added via drag & drop: ${folderPath}`);

            // Scan the folder for audio files
            addLogMessage(language === "de" ? `Scanne Ordner: ${folderPath}` : `Scanning folder: ${folderPath}`);

            const audioFiles = await window.electronAPI.getAudioFiles(folderPath, false);

            if (audioFiles.length === 0) {
              addLogMessage(language === "de" ? "Keine Audiodateien gefunden!" : "No audio files found!");
              continue;
            }

            addLogMessage(language === "de" ? `${audioFiles.length} Audiodateien gefunden` : `Found ${audioFiles.length} audio files`);

            // Get metadata for each file
            const filesWithMetadata: AudioFile[] = [];
            for (const filePath of audioFiles) {
              const metadata = await window.electronAPI.getFileMetadata(filePath);
              const filename = filePath.split('\\').pop() || filePath.split('/').pop() || '';
              const chapterName = metadata.tags?.title || filename;

              filesWithMetadata.push({
                path: filePath,
                filename: filename,
                duration: metadata.duration,
                hasCover: metadata.hasCover,
                title: metadata.tags?.title,
                chapterName: chapterName
              });
            }

            const firstFileMetadata = filesWithMetadata[0] ? await window.electronAPI.getFileMetadata(filesWithMetadata[0].path) : null;
            const folderName = folderPath.split('\\').pop() || folderPath.split('/').pop() || 'Unknown';

            // Check if any file has cover art
            const fileWithCover = filesWithMetadata.find(f => f.hasCover);
            let coverArt: string | undefined = undefined;

            if (fileWithCover) {
              try {
                addLogMessage(language === "de" ? "Lade Cover-Bild..." : "Loading cover image...");
                const tempCoverPath = `${folderPath}\\temp_cover_${Date.now()}.png`;
                const extractResult = await window.electronAPI.extractCover(fileWithCover.path, tempCoverPath);

                if (extractResult.success) {
                  const coverData = await window.electronAPI.readFileAsBase64(tempCoverPath);
                  if (coverData) {
                    coverArt = `data:image/png;base64,${coverData}`;
                  }
                  await window.electronAPI.deleteFile(tempCoverPath);
                }
              } catch (error) {
                console.error('Error loading cover:', error);
              }
            }

            const newFolder: Folder = {
              id: Date.now().toString(),
              path: folderPath,
              name: folderName,
              files: filesWithMetadata,
              metadata: {
                title: firstFileMetadata?.tags?.album || firstFileMetadata?.tags?.title || folderName,
                author: firstFileMetadata?.tags?.artist || '',
                album: firstFileMetadata?.tags?.album || '',
                year: firstFileMetadata?.tags?.date || '',
                genre: firstFileMetadata?.tags?.genre || ''
              },
              coverArt: coverArt
            };

            setFolders(prev => [...prev, newFolder]);
            addLogMessage(`${tr.addedFolder} ${folderName}`);
          } else {
            addLogMessage(language === "de" ? `Fehler: ${result.error}` : `Error: ${result.error}`);
          }
        } catch (error) {
          addLogMessage(language === "de" ? `Fehler: ${error}` : `Error: ${error}`);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const bgColor = darkMode ? "from-gray-900 via-gray-800 to-gray-900" : "from-blue-900 via-blue-500 to-cyan-300";
  const buttons = [
    { name: "addFolder", label: tr.addFolder, icon: FolderPlus },
    ...(folders.length > 0 || isClearing ? [
      { name: "Chapter", label: tr.chapter, icon: FileAudio },
      { name: "Metadata", label: tr.metadata, icon: Book },
      { name: "Overview", label: tr.overview, icon: Info }
    ] : [])
  ];

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${bgColor} transition-colors duration-500`}>
      {/* Top Right - Spinner */}
      <div className="absolute top-6 right-6 z-20">
        {isLoading && <Spinner />}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-12 py-8">
        {/* Button Bar */}
        <div className="flex items-center justify-center gap-2 mb-8 w-full">
          <div className="flex items-center gap-1 px-2 py-2 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
            {buttons.map((button, index) => {
              const Icon = button.icon;
              const isActive = activeTab === button.name || (["addFolder", "remove", "clearList"].includes(button.name) && activeTab === "Chapter");
              const isTabButton = ["Chapter", "Metadata", "Overview"].includes(button.name);
              const animationDelay = isTabButton ? `${(index - 1) * 100}ms` : "0ms";
              const animationClass = isTabButton
                ? (isClearing ? "animate-fadeOut" : "animate-fadeIn")
                : "";

              return (
                <button
                  key={button.name}
                  onClick={() => handleButtonClick(button.name)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${isActive && isTabButton ? "bg-white/20 backdrop-blur-md border border-white/30 shadow-md" : "hover:bg-white/5"} ${animationClass}`}
                  style={{ animationDelay }}
                >
                  <Icon className="w-4 h-4 text-white/90" />
                  <p className="text-white/90 text-sm">{button.label}</p>
                </button>
              );
            })}
          </div>

          {/* Settings, Language, Dark Mode Buttons */}
          <div className="relative flex items-center gap-2 ml-4">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                title={language === "de" ? "Einstellungen" : "Settings"}
              >
                <Settings className="w-5 h-5 text-white" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute top-full mt-2 left-0 z-30 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/20 shadow-2xl p-4 w-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white/90">
                      <Settings className="w-5 h-5" />
                      <span className="font-semibold">{language === "de" ? "Einstellungen" : "Settings"}</span>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-1 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Output Folder */}
                    <div className="min-w-0">
                      <label className="block text-white/70 text-sm mb-2">{language === "de" ? "Ausgabeordner" : "Output Folder"}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedFolder?.outputPath || (language === "de" ? "Standard" : "Default")}
                          readOnly
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white/60 cursor-not-allowed text-xs truncate"
                        />
                        <button
                          onClick={() => { handleUpdateFolder({ outputPath: "C:\\Custom\\Output\\" }); addLogMessage(language === "de" ? "Ausgabeordner ausgewählt" : "Output folder selected"); }}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quality */}
                    <div className="min-w-0">
                      <label className="block text-white/70 text-sm mb-2">{language === "de" ? "Qualität" : "Quality"}</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-xs"
                        onChange={(e) => addLogMessage(`${language === "de" ? "Qualität geändert zu" : "Quality changed to"}: ${e.target.value}`)}
                      >
                        <option value="original">{language === "de" ? "Original" : "Original"}</option>
                        <option value="aac128">{language === "de" ? "Neu (AAC 128k)" : "New (AAC 128k)"}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { setLanguage(language === "de" ? "en" : "de"); addLogMessage(`${tr.language} ${language === "de" ? "EN" : "DE"}`); }}
              className="p-3 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              <Languages className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => { setDarkMode(!darkMode); addLogMessage(`${tr.darkMode} ${!darkMode ? "ON" : "OFF"}`); }}
              className="p-3 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
          </div>

          <button onClick={handleStart} disabled={folders.length === 0 || isLoading} className={`flex items-center gap-2 px-6 py-2 rounded-full text-white transition-colors shadow-lg ml-4 ${folders.length === 0 || isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}>
            <Play className="w-4 h-4 fill-white" />
            <span>{tr.start}</span>
          </button>
        </div>

        {/* Three Panels */}
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-3 gap-3 w-full max-w-6xl">
          {/* LEFT COLUMN - Folders + Output + Quality */}
          <div className="flex flex-col gap-1.5">
            {/* LEFT - Folders */}
            <div
              className="rounded-3xl backdrop-blur-xl shadow-2xl p-6 h-[600px] flex flex-col mx-auto w-full bg-white/5 border border-white/20"
              style={{ maxWidth: 'calc(28rem + 5px)' }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/90 text-xl font-semibold">{tr.folders}</h3>
                {folders.length > 0 && (
                  <button
                    onClick={handleClearList}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-white transition-colors"
                    title={language === "de" ? "Liste leeren" : "Clear list"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {folders.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/50"><p className="text-center whitespace-pre-line">{tr.noFolders}</p></div>
                ) : (
                  folders.map(folder => (
                    <div key={folder.id} className={`p-4 rounded-xl transition-all ${selectedFolder?.id === folder.id ? "bg-white/20 border border-white/40" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                      <div className="flex items-start gap-3">
                        <FolderPlus className="w-5 h-5 text-white/70 flex-shrink-0" />
                        <div className="flex-1 cursor-pointer min-w-0" onClick={() => { setSelectedFolder(folder); addLogMessage(`${tr.selected} ${folder.name}`); }}>
                          <p className="text-white/90 font-medium break-words">{folder.name}</p>
                          <p className="text-white/60 text-sm">{folder.files.length} {tr.files}</p>
                          <p className="text-white/40 text-xs break-all">{folder.path}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFolder(folder.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex-shrink-0"
                          title={language === "de" ? "Ordner entfernen" : "Remove folder"}
                        >
                          <Trash2 className="w-4 h-4 text-red-400/80" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE - Tabs + Progress */}
          <div className="flex flex-col gap-1.5">
          <div className="rounded-3xl backdrop-blur-xl bg-white/5 border border-white/20 shadow-2xl p-6 h-[600px] flex flex-col mx-auto w-full" style={{ maxWidth: 'calc(28rem + 5px)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/90 text-xl font-semibold">{activeTab === "Chapter" ? tr.chapter : activeTab === "Metadata" ? tr.metadata : tr.overview}</h3>
              {folders.length > 0 && activeTab === "Metadata" && (
                <button
                  onClick={() => addLogMessage(language === "de" ? "Metadaten gespeichert!" : "Metadata saved!")}
                  className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-white transition-colors"
                  title={language === "de" ? "Metadaten speichern" : "Save metadata"}
                >
                  <Save className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {!selectedFolder ? (
                <div className="flex items-center justify-center h-full text-white/50"><p>{tr.selectFolder}</p></div>
              ) : activeTab === "Metadata" ? (
                <MetadataTab
                  folder={selectedFolder}
                  onUpdate={handleUpdateFolder}
                  onUploadCover={async () => {
                    const imagePath = await window.electronAPI.selectCoverImage();
                    if (imagePath) {
                      // For now, just store the path - we'll convert to base64 during M4B creation
                      handleUpdateFolder({ coverArt: imagePath });
                      addLogMessage(language === "de" ? "Cover hochgeladen" : "Cover uploaded");
                    }
                  }}
                  onExtractCover={async () => {
                    if (!selectedFolder) return;

                    // Find first file with cover
                    const fileWithCover = selectedFolder.files.find(f => f.hasCover);
                    if (!fileWithCover) {
                      addLogMessage(language === "de" ? "Kein Cover in Audiodateien gefunden!" : "No cover found in audio files!");
                      return;
                    }

                    addLogMessage(language === "de" ? "Cover-Extraktion wird vorbereitet..." : "Preparing cover extraction...");

                    try {
                      // Ask user where to save
                      const savePath = await window.electronAPI.selectCoverSavePath();
                      if (!savePath) {
                        addLogMessage(language === "de" ? "Vorgang abgebrochen" : "Operation cancelled");
                        return;
                      }

                      addLogMessage(language === "de" ? `Extrahiere Cover aus: ${fileWithCover.filename}` : `Extracting cover from: ${fileWithCover.filename}`);

                      // Extract cover
                      const result = await window.electronAPI.extractCover(fileWithCover.path, savePath);
                      if (result.success) {
                        addLogMessage(language === "de" ? `✓ Cover gespeichert: ${savePath}` : `✓ Cover saved: ${savePath}`);
                      } else {
                        addLogMessage(language === "de" ? `✗ Fehler: ${result.error}` : `✗ Error: ${result.error}`);
                      }
                    } catch (error) {
                      addLogMessage(language === "de" ? `Fehler: ${error}` : `Error: ${error}`);
                    }
                  }}
                  onRemoveCover={() => { handleUpdateFolder({ coverArt: undefined }); addLogMessage(language === "de" ? "Cover entfernt" : "Cover removed"); }}
                  language={language}
                />
              ) : activeTab === "Chapter" ? (
                <div className="space-y-2">
                  <p className="text-white/70 text-sm mb-3">{selectedFolder.files.length} {tr.chapters}</p>
                  {selectedFolder.files.map((file, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleChapterDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-lg border transition-all cursor-move ${
                        draggedChapter === i ? "bg-white/20 border-white/40 opacity-50" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
                        <span className="text-white/60 text-sm flex-shrink-0">#{i + 1}</span>

                        {editingChapter === i ? (
                          <div className="flex-1 flex gap-2 items-center min-w-0">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveChapterName(i)}
                              className="flex-1 min-w-0 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveChapterName(i)}
                              className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 transition-colors flex-shrink-0"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-white/90 text-sm flex-1 min-w-0 break-words">
                              {file.chapterName || file.customName || file.filename}
                            </p>
                            <button
                              onClick={() => handleStartEditChapter(i, file)}
                              className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                            >
                              <Edit2 className="w-4 h-4 text-white/60" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(i)}
                              className="p-1 rounded hover:bg-red-500/20 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-400/80" />
                            </button>
                          </>
                        )}

                        <span className="text-white/60 text-xs flex-shrink-0">
                          {Math.floor(file.duration / 60)}:{String(Math.floor(file.duration % 60)).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-white/60 mb-1">{tr.path}</p>
                    <p className="text-white/90">{selectedFolder.path}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-white/60 mb-1">{tr.files}</p>
                    <p className="text-white/90">{selectedFolder.files.length} {tr.files}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-white/60 mb-1">{tr.duration}</p>
                    <p className="text-white/90">{Math.floor(selectedFolder.files.reduce((s, f) => s + f.duration, 0) / 60)} {tr.min}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-green-400">✓ {tr.ready}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PROGRESS BAR */}
          {isLoading && (
            <div className="rounded-3xl backdrop-blur-xl bg-white/5 border border-white/20 shadow-2xl p-4 mx-auto w-full" style={{ maxWidth: 'calc(28rem + 5px)' }}>
              <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">{progress}%</div>
              </div>
            </div>
          )}
          </div>

          {/* RIGHT - Log */}
          <div className="rounded-3xl backdrop-blur-xl bg-white/5 border border-white/20 shadow-2xl p-6 h-[600px] flex flex-col mx-auto w-full" style={{ maxWidth: 'calc(28rem + 5px)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/90 text-xl font-semibold">{tr.statusLog}</h3>
              <button
                onClick={() => addLogMessage(language === "de" ? "Log gespeichert" : "Log saved")}
                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-white transition-colors"
                title={language === "de" ? "Log speichern" : "Save Log"}
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-2">
              {logMessages.map((msg, i) => (
                <div key={i} className="text-white/70 hover:text-white/90">{msg}</div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
