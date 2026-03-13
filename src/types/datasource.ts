export type SourceType = 'url' | 'pdf' | 'excel' | 'csv' | 'markdown' | 'image';

export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  type: SourceType;
  origin: {
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
  content: {
    text: string;
    structured?: {
      headers: string[];
      rows: string[][];
      sheetName?: string;
    }[];
    images?: {
      base64: string;
      mediaType: string;
      description?: string;
    }[];
    metadata?: Record<string, string>;
  };
  tags: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
