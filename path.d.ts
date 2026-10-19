export declare const Separator: string

export declare const MaxFileNameBytes: number

/**
 * Fits a single file name into maxBytes UTF-8 bytes (default 240). Names that
 * already fit are returned unchanged; longer names are normalized to NFC with
 * emoji removed and, if still too long, become
 * "{cut base}...~xxxxxxxx{extension}" with a deterministic hash.
 * Throws ErrArguments for a non-string name or maxBytes < 13.
 */
export declare function safeFileName(name: string, maxBytes?: number): string

export declare interface IPath {
  IsVirtual(): boolean
  IsDir(): boolean
  Exists(): boolean
  Name(): string
  String(): string
  ParentPath(): IPath
  ExcludePath(p: IPath): IPath
  Info(): FileInfo
}

export declare class FileInfo {
  IsDir: boolean
  Size: number
  CreatedAt: number
  Permission: string
  constructor(
    isDir: boolean,
    size: number,
    createdAt: number,
    permission: string
  )
  FromJSON(value: string): { fileInfo?: FileInfo; error?: Error }
  ToJSON(): string
}
