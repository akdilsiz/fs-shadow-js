export declare const Separator: string;

export declare interface IPath {
  IsVirtual(): boolean;
  IsDir(): boolean;
  Exists(): boolean;
  Name(): string;
  String(): string;
  ParentPath(): IPath
  ExcludePath(p: IPath): IPath
  Info(): FileInfo
}

export declare class FileInfo {
  IsDir: boolean;
  Size: number;
  CreatedAt: number;
  Permission: string
  constructor(isDir: boolean, size: number, createdAt: number, permission: string);
  FromJSON(value: string): { fileInfo?: FileInfo, error?: Error };
  ToJSON(): string;
}
