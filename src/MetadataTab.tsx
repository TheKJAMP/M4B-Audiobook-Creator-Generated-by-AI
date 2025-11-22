import { Upload, Download, X, Image as ImageIcon } from "lucide-react";

interface MetadataTabProps {
  folder: any;
  onUpdate: (updates: any) => void;
  onUploadCover: () => void;
  onExtractCover: () => void;
  onRemoveCover: () => void;
  language: "de" | "en";
}

export default function MetadataTab({
  folder,
  onUpdate,
  onUploadCover,
  onExtractCover,
  onRemoveCover,
  language
}: MetadataTabProps) {
  const t = {
    de: {
      title: "Titel",
      author: "Autor",
      album: "Album",
      year: "Jahr",
      genre: "Genre",
      cover: "Cover Artwork",
      upload: "Hochladen",
      extract: "Extrahieren",
      remove: "Entfernen",
      outputFolder: "Ausgabeordner",
      save: "Metadaten speichern",
      noCover: "Kein Cover vorhanden"
    },
    en: {
      title: "Title",
      author: "Author",
      album: "Album",
      year: "Year",
      genre: "Genre",
      cover: "Cover Artwork",
      upload: "Upload",
      extract: "Extract",
      remove: "Remove",
      outputFolder: "Output Folder",
      save: "Save Metadata",
      noCover: "No cover available"
    }
  };

  const tr = t[language];

  return (
    <div className="space-y-4">
      {/* Cover Artwork Section */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <label className="block text-white/70 text-sm mb-3">{tr.cover}</label>
        <div className="flex gap-4">
          {/* Cover Preview */}
          <div className="w-32 h-32 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
            {folder.coverArt ? (
              <img src={folder.coverArt} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/40 text-xs">{tr.noCover}</p>
              </div>
            )}
          </div>

          {/* Cover Buttons */}
          <div className="flex flex-col gap-2 flex-1">
            <button
              onClick={onUploadCover}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              {tr.upload}
            </button>
            <button
              onClick={onExtractCover}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              {tr.extract}
            </button>
            <button
              onClick={onRemoveCover}
              disabled={!folder.coverArt}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white transition-colors text-sm ${
                folder.coverArt ? "bg-red-500/20 hover:bg-red-500/30" : "bg-white/5 opacity-50 cursor-not-allowed"
              }`}
            >
              <X className="w-4 h-4" />
              {tr.remove}
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Fields */}
      <div>
        <label className="block text-white/70 text-sm mb-2">{tr.title}</label>
        <input
          type="text"
          value={folder.metadata.title}
          onChange={(e) => onUpdate({ metadata: { ...folder.metadata, title: e.target.value } })}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-2">{tr.author}</label>
        <input
          type="text"
          value={folder.metadata.author}
          onChange={(e) => onUpdate({ metadata: { ...folder.metadata, author: e.target.value } })}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-2">{tr.album}</label>
        <input
          type="text"
          value={folder.metadata.album}
          onChange={(e) => onUpdate({ metadata: { ...folder.metadata, album: e.target.value } })}
          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">{tr.year}</label>
          <input
            type="text"
            value={folder.metadata.year}
            onChange={(e) => onUpdate({ metadata: { ...folder.metadata, year: e.target.value } })}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">{tr.genre}</label>
          <input
            type="text"
            value={folder.metadata.genre}
            onChange={(e) => onUpdate({ metadata: { ...folder.metadata, genre: e.target.value } })}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>
    </div>
  );
}
