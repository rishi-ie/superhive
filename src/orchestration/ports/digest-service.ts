export interface DigestService {
  digest(value: unknown): Promise<string>
}

