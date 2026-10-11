declare module 'mammoth' {
  export interface ConvertResult {
    value: string;
    messages: any[];
  }
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer }): Promise<ConvertResult>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer }): Promise<ConvertResult>;
}
