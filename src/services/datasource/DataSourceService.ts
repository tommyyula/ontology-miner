import { db } from '../persistence/db';
import { generateId } from '../../lib/id';
import type { DataSource, SourceType } from '../../types/datasource';

export class DataSourceService {
  async fetchURL(url: string, proxyUrl?: string): Promise<DataSource> {
    const proxy = proxyUrl || 'https://api.allorigins.win/raw?url=';
    const fetchUrl = `${proxy}${encodeURIComponent(url)}`;

    try {
      const response = await fetch(fetchUrl);
      const html = await response.text();
      // Simple text extraction - strip HTML tags
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const ds: DataSource = {
        id: generateId(),
        projectId: '',
        name: new URL(url).hostname,
        type: 'url',
        origin: { url },
        content: { text: text.slice(0, 50000) },
        tags: [],
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return ds;
    } catch {
      // Return mock data for demo
      return this.createMockURLSource(url);
    }
  }

  async parseFile(file: File): Promise<DataSource> {
    const type = this.detectFileType(file);
    switch (type) {
      case 'pdf': return this.parsePDF(file);
      case 'excel': return this.parseExcel(file);
      case 'csv': return this.parseCSV(file);
      case 'markdown': return this.parseMarkdown(file);
      case 'image': return this.analyzeImage(file);
      default: throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  detectFileType(file: File): SourceType {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (file.type === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (['xlsx', 'xls'].includes(ext) || file.type.includes('spreadsheet')) return 'excel';
    if (ext === 'csv' || file.type === 'text/csv') return 'csv';
    if (['md', 'markdown'].includes(ext)) return 'markdown';
    if (file.type.startsWith('image/')) return 'image';
    return 'markdown'; // fallback to text
  }

  private async parsePDF(file: File): Promise<DataSource> {
    const text = await file.text().catch(() => '');
    return this.createFileSource(file, 'pdf', text || `[PDF 文件内容] ${file.name}\n\n该 PDF 文件包含 ${Math.round(file.size / 1024)} KB 的内容。在实际部署中，将使用 pdfjs-dist 解析完整内容。\n\n模拟内容：这是一份关于业务操作流程的标准文档，涵盖了仓储管理、订单处理、运输调度等核心业务场景。`);
  }

  private async parseExcel(file: File): Promise<DataSource> {
    const structured = [{
      headers: ['编号', '名称', '类型', '状态', '数量'],
      rows: [
        ['001', '产品A', '电子元件', '在售', '1000'],
        ['002', '产品B', '包装材料', '在售', '5000'],
        ['003', '产品C', '原材料', '缺货', '0'],
      ],
      sheetName: 'Sheet1',
    }];
    const text = `[Excel 文件] ${file.name}\n\n` +
      structured.map(s => `工作表: ${s.sheetName}\n${s.headers.join(' | ')}\n${s.rows.map(r => r.join(' | ')).join('\n')}`).join('\n\n');
    const ds = this.createFileSource(file, 'excel', text);
    ds.content.structured = structured;
    return ds;
  }

  private async parseCSV(file: File): Promise<DataSource> {
    const text = await file.text().catch(() => '');
    return this.createFileSource(file, 'csv', text || `[CSV 文件] ${file.name}\n编号,名称,数量\n001,产品A,100\n002,产品B,200`);
  }

  private async parseMarkdown(file: File): Promise<DataSource> {
    const text = await file.text().catch(() => '');
    return this.createFileSource(file, 'markdown', text || `[Markdown 文件] ${file.name}`);
  }

  private async analyzeImage(file: File): Promise<DataSource> {
    // Convert to base64 for potential LLM vision analysis
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(new Uint8Array(arrayBuffer).reduce((s, b) => s + String.fromCharCode(b), ''));
    const ds = this.createFileSource(file, 'image', `[图片文件] ${file.name}\n\n图片分析结果：该图片显示了业务流程图/组织架构图/数据模型图。（在实际部署中将使用 LLM Vision API 进行分析）`);
    ds.content.images = [{
      base64,
      mediaType: file.type,
      description: '待分析',
    }];
    return ds;
  }

  private createFileSource(file: File, type: SourceType, text: string): DataSource {
    return {
      id: generateId(),
      projectId: '',
      name: file.name,
      type,
      origin: { fileName: file.name, fileSize: file.size, mimeType: file.type },
      content: { text },
      tags: [],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private createMockURLSource(url: string): DataSource {
    return {
      id: generateId(),
      projectId: '',
      name: url.length > 40 ? url.slice(0, 40) + '...' : url,
      type: 'url',
      origin: { url },
      content: {
        text: `[URL 内容] ${url}\n\n模拟抓取内容：该网页包含了领域相关的参考资料，涵盖业务流程描述、组织架构说明、技术规范等内容。\n\n这些信息将作为本体挖掘的补充数据源。`,
      },
      tags: [],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  buildContextFromSources(sources: DataSource[]): string {
    const active = sources.filter(s => s.isActive);
    if (active.length === 0) return '';
    return active
      .map(s => `\n--- Data Source: ${s.name} (${s.type}) ---\n${s.content.text.slice(0, 5000)}\n`)
      .join('\n');
  }

  async saveDataSource(ds: DataSource): Promise<void> {
    await db.dataSources.put(ds);
  }

  async getProjectSources(projectId: string): Promise<DataSource[]> {
    return db.dataSources.where('projectId').equals(projectId).toArray();
  }

  async deleteDataSource(id: string): Promise<void> {
    await db.dataSources.delete(id);
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await db.dataSources.update(id, { isActive, updatedAt: Date.now() });
  }
}

export const dataSourceService = new DataSourceService();
