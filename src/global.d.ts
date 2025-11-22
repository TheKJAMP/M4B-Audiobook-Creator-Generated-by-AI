export {};

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      selectCoverImage: () => Promise<string | null>;
      selectCoverSavePath: () => Promise<string | null>;
      isDirectory: (path: string) => Promise<boolean>;
      getAudioFiles: (folderPath: string, recursive: boolean) => Promise<string[]>;
      getFileMetadata: (filePath: string) => Promise<{
        duration: number;
        hasCover: boolean;
        tags: Record<string, string>;
      }>;
      extractCover: (filePath: string, outputPath: string) => Promise<{ success: boolean; error?: string }>;
      readFileAsBase64: (filePath: string) => Promise<string | null>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      processDroppedPath: (droppedPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      createM4B: (folderData: any, outputPath: string, options: { copyAudio: boolean }) => Promise<{ success: boolean; error?: string }>;
      onProgress: (callback: (...args: any[]) => void) => void;
      onLog: (callback: (message: string) => void) => void;
      onFolderDropped: (callback: (folderPath: string) => void) => void;
    };
  }
}
