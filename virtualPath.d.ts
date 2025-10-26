import { FileInfo, IPath } from './path'

export declare class VirtualPath implements IPath {
  p: string;
  isDir: boolean;
  IsVirtual(): boolean
  IsDir(): boolean
  Info(): FileInfo
  Exists(): boolean
  String(): string
  Name(): string
  ParentPath(): IPath
  ExcludePath(p: IPath): IPath
}
