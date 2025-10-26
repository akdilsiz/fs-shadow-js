export declare type DateType = number

export declare const DateTypes: Record<DateType, number>,
  MILLI: DateType,
  NANO: DateType

export declare class MetaData {
  IsDir: boolean
  Sum: string
  Size: number
  CreatedAt: number
  UTCCreatedAt: number
  Permission: string
  constructor(
    isDir: boolean,
    sum: string,
    size: number,
    createdAt: number,
    permission: string,
  )

  FromJSON(value: string): { metaData?: MetaData; error?: Error }
  FromObject(obj: Record<string, any>): { metaData: MetaData; error?: Error }
  ToJSON(): string
  ToObject(): {
    is_dir: boolean
    sum: string
    size: number
    created_at: number
    permission: string
    utc_created_at: number
  }
}

export declare class ExtraPayload {
  UUID: string
  IsDir: boolean
  Sum: string
  Size: number
  CreatedAt: number
  UTCCreatedAt: number
  Permission: string
  constructor(
    isDir: boolean,
    sum: string,
    size: number,
    createdAt: number,
    permission: string,
  )

  SetUTCCreatedAt(v: number): ExtraPayload
  FromJSON(value: string): { extraPayload?: ExtraPayload; error?: Error }
  FromObject(obj: Record<string, any>): {
    extraPayload?: ExtraPayload
    error?: Error
  }
  FromBinary(encoded: Uint8Array): {
    extraPayload?: ExtraPayload
    error?: Error
  }
  ToJSON(): string
  ToObject(): {
    UUID: string
    IsDir: boolean
    Sum: string
    Size: number
    CreatedAt: number
    Permission: string
    UTCCreatedAt: number
  }
  ToBinary(): Uint8Array
}
