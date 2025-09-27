import type { FinalReport } from '@/types/brainstorm';

export interface ExportOptions {
  format: 'pdf' | 'word' | 'html';
  template?: 'default' | 'minimal' | 'detailed';
  includeCharts?: boolean;
  customStyles?: string;
  fileName?: string;
}

export interface ExportTemplate {
  name: string;
  description: string;
  styles: string;
  layout: 'single-column' | 'two-column' | 'multi-section';
}

export class ExportService {
  private static readonly DEFAULT_TEMPLATES: Record<string, ExportTemplate> = {
    default: {
      name: '默认模板',
      description: '标准的报告格式，包含所有章节',
      styles: `
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px; }
        h2 { color: #262626; margin-top: 30px; }
        .section { margin-bottom: 40px; }
        .highlight { background-color: #f6ffed; padding: 15px; border-left: 4px solid #52c41a; }
      `,
      layout: 'single-column',
    },
    minimal: {
      name: '简洁模板',
      description: '简洁的报告格式，突出关键信息',
      styles: `
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.5; color: #333; }
        h1 { color: #000; font-weight: 700; }
        h2 { color: #333; font-weight: 600; }
        .section { margin-bottom: 30px; }
        .key-point { font-weight: 600; color: #1890ff; }
      `,
      layout: 'single-column',
    },
    detailed: {
      name: '详细模板',
      description: '详细的报告格式，包含图表和完整分析',
      styles: `
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.7; color: #333; }
        h1 { color: #722ed1; border-bottom: 3px solid #722ed1; padding-bottom: 15px; }
        h2 { color: #1890ff; background: #f0f9ff; padding: 10px; border-radius: 5px; }
        .section { margin-bottom: 50px; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px; }
        .chart-container { text-align: center; margin: 20px 0; }
      `,
      layout: 'two-column',
    },
  };

  /**
   * 导出报告为指定格式
   */
  static async exportReport(report: FinalReport, options: ExportOptions): Promise<Blob> {
    const { format, template = 'default' } = options;

    switch (format) {
      case 'html':
        return this.exportToHTML(report, options);
      case 'pdf':
        return this.exportToPDF(report, options);
      case 'word':
        return this.exportToWord(report, options);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 导出为HTML格式
   */
  private static async exportToHTML(report: FinalReport, options: ExportOptions): Promise<Blob> {
    const template = this.DEFAULT_TEMPLATES[options.template || 'default'];
    const html = this.generateHTMLContent(report, template, options);
    
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * 导出为PDF格式
   */
  private static async exportToPDF(report: FinalReport, options: ExportOptions): Promise<Blob> {
    // 使用html2pdf或jsPDF库
    const html2pdf = await import('html2pdf.js');
    
    const template = this.DEFAULT_TEMPLATES[options.template || 'default'];
    const htmlContent = this.generateHTMLContent(report, template, options);
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
      margin: 1,
      filename: options.fileName || `${report.topic}-报告.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    return html2pdf.default().set(opt).from(element).outputPdf('blob');
  }

  /**
   * 导出为Word格式
   */
  private static async exportToWord(report: FinalReport, options: ExportOptions): Promise<Blob> {
    // 使用docx库生成Word文档
    const docx = await import('docx');
    
    const doc = new docx.Document({
      sections: [
        {
          properties: {},
          children: this.generateWordContent(report, options),
        },
      ],
    });

    return docx.Packer.toBlob(doc);
  }

  /**
   * 生成HTML内容
   */
  private static generateHTMLContent(report: FinalReport, template: ExportTemplate, options: ExportOptions): string {
    const customStyles = options.customStyles || '';
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.topic} - 产品解决方案报告</title>
    <style>
        ${template.styles}
        ${customStyles}
        
        /* 打印样式 */
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        
        /* 响应式样式 */
        @media (max-width: 768px) {
            body { font-size: 14px; }
            .two-column { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHTMLHeader(report)}
        ${this.generateHTMLExecutiveSummary(report)}
        ${this.generateHTMLDesignConcept(report)}
        ${this.generateHTMLTechnicalSolution(report)}
        ${this.generateHTMLMarketingStrategy(report)}
        ${this.generateHTMLImplementationPlan(report)}
        ${this.generateHTMLRiskAssessment(report)}
        ${this.generateHTMLFooter(report)}
    </div>
</body>
</html>`;
  }

  /**
   * 生成Word文档内容
   */
  private static generateWordContent(report: FinalReport, options: ExportOptions): any[] {
    const docx = require('docx');
    
    return [
      // 标题页
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: `${report.topic} - 产品解决方案报告`,
            bold: true,
            size: 32,
            color: '1890ff',
          }),
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // 生成时间
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: `生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`,
            size: 20,
          }),
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 600 },
      }),

      // 分页符
      new docx.Paragraph({
        children: [new docx.PageBreak()],
      }),

      // 执行摘要
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: '执行摘要',
            bold: true,
            size: 28,
            color: '262626',
          }),
        ],
        heading: docx.HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: report.executiveSummary,
            size: 22,
          }),
        ],
        spacing: { after: 240 },
      }),

      // 设计概念
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: '设计概念',
            bold: true,
            size: 28,
            color: '262626',
          }),
        ],
        heading: docx.HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),

      ...this.generateWordDesignConcept(report.designConcept),
      ...this.generateWordTechnicalSolution(report.technicalSolution),
      ...this.generateWordMarketingStrategy(report.marketingStrategy),
      ...this.generateWordImplementationPlan(report.implementationPlan),
      ...this.generateWordRiskAssessment(report.riskAssessment),
    ];
  }

  /**
   * 生成HTML头部
   */
  private static generateHTMLHeader(report: FinalReport): string {
    return `
      <header class="report-header">
        <h1>${report.topic} - 产品解决方案报告</h1>
        <div class="report-meta">
          <p><strong>生成时间:</strong> ${new Date(report.generatedAt).toLocaleString('zh-CN')}</p>
          <p><strong>会话ID:</strong> ${report.sessionId}</p>
        </div>
      </header>
    `;
  }

  /**
   * 生成HTML执行摘要
   */
  private static generateHTMLExecutiveSummary(report: FinalReport): string {
    return `
      <section class="section">
        <h2>执行摘要</h2>
        <div class="highlight">
          <p>${report.executiveSummary}</p>
        </div>
      </section>
    `;
  }

  /**
   * 生成HTML设计概念
   */
  private static generateHTMLDesignConcept(report: FinalReport): string {
    const { designConcept } = report;
    
    return `
      <section class="section page-break">
        <h2>设计概念</h2>
        <div class="two-column" style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h3>产品类型</h3>
            <p>${designConcept.productType}</p>
            
            <h3>文化背景</h3>
            <p>${designConcept.culturalBackground}</p>
            
            <h3>目标受众</h3>
            <p>${designConcept.targetAudience}</p>
          </div>
          <div style="flex: 1;">
            <h3>设计元素</h3>
            <ul>
              ${designConcept.designElements.map(element => `<li>${element}</li>`).join('')}
            </ul>
            
            <h3>视觉描述</h3>
            <p>${designConcept.visualDescription}</p>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 生成HTML技术方案
   */
  private static generateHTMLTechnicalSolution(report: FinalReport): string {
    const { technicalSolution } = report;
    
    return `
      <section class="section page-break">
        <h2>技术方案</h2>
        
        <div class="three-column" style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h3>材料清单</h3>
            <ul>
              ${technicalSolution.materials.map(material => `<li>${material}</li>`).join('')}
            </ul>
          </div>
          
          <div style="flex: 1;">
            <h3>生产流程</h3>
            <ol>
              ${technicalSolution.productionProcess.map(process => `<li>${process}</li>`).join('')}
            </ol>
          </div>
          
          <div style="flex: 1;">
            <h3>质量标准</h3>
            <ul>
              ${technicalSolution.qualityStandards.map(standard => `<li>${standard}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="cost-section" style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
          <h3>成本估算</h3>
          <div style="display: flex; justify-content: space-around;">
            <div><strong>材料成本:</strong> ${technicalSolution.costEstimation.materials} ${technicalSolution.costEstimation.currency}</div>
            <div><strong>人工成本:</strong> ${technicalSolution.costEstimation.labor} ${technicalSolution.costEstimation.currency}</div>
            <div><strong>管理费用:</strong> ${technicalSolution.costEstimation.overhead} ${technicalSolution.costEstimation.currency}</div>
            <div><strong>总成本:</strong> ${technicalSolution.costEstimation.total} ${technicalSolution.costEstimation.currency}</div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 生成HTML营销策略
   */
  private static generateHTMLMarketingStrategy(report: FinalReport): string {
    const { marketingStrategy } = report;
    
    return `
      <section class="section page-break">
        <h2>营销策略</h2>
        
        <div class="highlight">
          <h3>定位声明</h3>
          <p>${marketingStrategy.positioningStatement}</p>
        </div>
        
        <h3>营销渠道</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          ${marketingStrategy.channels.map(channel => `
            <div style="border: 1px solid #d9d9d9; padding: 15px; border-radius: 6px;">
              <h4>${channel.name}</h4>
              <p><strong>类型:</strong> ${this.getChannelTypeLabel(channel.type)}</p>
              <p><strong>预算:</strong> ${channel.budget} ${marketingStrategy.budget.currency}</p>
              <p><strong>预期覆盖:</strong> ${channel.expectedReach.toLocaleString()} 人</p>
            </div>
          `).join('')}
        </div>
        
        <h3>预算分配</h3>
        <div style="background: #fafafa; padding: 20px; border-radius: 8px;">
          <p><strong>总预算:</strong> ${marketingStrategy.budget.total} ${marketingStrategy.budget.currency}</p>
          <ul>
            <li>广告费用: ${marketingStrategy.budget.breakdown.advertising} ${marketingStrategy.budget.currency}</li>
            <li>内容制作: ${marketingStrategy.budget.breakdown.content} ${marketingStrategy.budget.currency}</li>
            <li>活动费用: ${marketingStrategy.budget.breakdown.events} ${marketingStrategy.budget.currency}</li>
            <li>其他费用: ${marketingStrategy.budget.breakdown.other} ${marketingStrategy.budget.currency}</li>
          </ul>
        </div>
      </section>
    `;
  }

  /**
   * 生成HTML实施计划
   */
  private static generateHTMLImplementationPlan(report: FinalReport): string {
    const { implementationPlan } = report;
    
    return `
      <section class="section page-break">
        <h2>实施计划</h2>
        
        <div class="highlight">
          <p><strong>总实施周期:</strong> ${implementationPlan.totalDuration} 天</p>
        </div>
        
        <h3>实施阶段</h3>
        ${implementationPlan.phases.map((phase, index) => `
          <div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #1890ff; background: #f6ffed;">
            <h4>阶段 ${index + 1}: ${phase.name} (${phase.duration}天)</h4>
            <p>${phase.description}</p>
            <div><strong>任务:</strong></div>
            <ul>
              ${phase.tasks.map(task => `<li>${task}</li>`).join('')}
            </ul>
            ${phase.dependencies.length ? `<div><strong>依赖:</strong> ${phase.dependencies.join(', ')}</div>` : ''}
          </div>
        `).join('')}
        
        <h3>关键里程碑</h3>
        ${implementationPlan.milestones.map(milestone => `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #d9d9d9; border-radius: 6px;">
            <h4>${milestone.name}</h4>
            <p><strong>截止日期:</strong> ${new Date(milestone.dueDate).toLocaleDateString('zh-CN')}</p>
            <p>${milestone.description}</p>
            <div><strong>交付物:</strong> ${milestone.deliverables.join(', ')}</div>
          </div>
        `).join('')}
      </section>
    `;
  }

  /**
   * 生成HTML风险评估
   */
  private static generateHTMLRiskAssessment(report: FinalReport): string {
    const { riskAssessment } = report;
    
    return `
      <section class="section page-break">
        <h2>风险评估</h2>
        
        <div class="highlight">
          <p><strong>整体风险等级:</strong> ${this.getRiskLevelLabel(riskAssessment.overallRiskLevel)}</p>
        </div>
        
        <h3>识别的风险</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #fafafa;">
              <th style="border: 1px solid #d9d9d9; padding: 8px;">ID</th>
              <th style="border: 1px solid #d9d9d9; padding: 8px;">类别</th>
              <th style="border: 1px solid #d9d9d9; padding: 8px;">描述</th>
              <th style="border: 1px solid #d9d9d9; padding: 8px;">概率</th>
              <th style="border: 1px solid #d9d9d9; padding: 8px;">影响</th>
              <th style="border: 1px solid #d9d9d9; padding: 8px;">严重程度</th>
            </tr>
          </thead>
          <tbody>
            ${riskAssessment.risks.map(risk => `
              <tr>
                <td style="border: 1px solid #d9d9d9; padding: 8px;">${risk.id}</td>
                <td style="border: 1px solid #d9d9d9; padding: 8px;">${this.getRiskCategoryLabel(risk.category)}</td>
                <td style="border: 1px solid #d9d9d9; padding: 8px;">${risk.description}</td>
                <td style="border: 1px solid #d9d9d9; padding: 8px;">${this.getRiskLevelLabel(risk.probability)}</td>
                <td style="border: 1px solid #d9d9d9; padding: 8px;">${this.getRiskLevelLabel(risk.impact)}</td>
                <td style="border: 1px solid #d9d9d9; padding: 8px;">${risk.severity}/10</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h3>缓解策略</h3>
        ${riskAssessment.mitigationStrategies.map(strategy => `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #d9d9d9; border-radius: 6px;">
            <h4>风险 ${strategy.riskId} 的缓解策略</h4>
            <p><strong>策略:</strong> ${strategy.strategy}</p>
            <p><strong>成本:</strong> ${strategy.cost} 元</p>
            <p><strong>有效性评分:</strong> ${strategy.effectiveness}/10</p>
          </div>
        `).join('')}
      </section>
    `;
  }

  /**
   * 生成HTML页脚
   */
  private static generateHTMLFooter(report: FinalReport): string {
    return `
      <footer class="report-footer" style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #d9d9d9; text-align: center; color: #8c8c8c;">
        <p>本报告由AI头脑风暴平台自动生成</p>
        <p>生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}</p>
      </footer>
    `;
  }

  // Word文档生成辅助方法
  private static generateWordDesignConcept(designConcept: any): any[] {
    const docx = require('docx');
    
    return [
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: '设计概念',
            bold: true,
            size: 28,
            color: '262626',
          }),
        ],
        heading: docx.HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: '产品类型: ',
            bold: true,
            size: 22,
          }),
          new docx.TextRun({
            text: designConcept.productType,
            size: 22,
          }),
        ],
        spacing: { after: 120 },
      }),
      
      // 更多设计概念内容...
    ];
  }

  private static generateWordTechnicalSolution(technicalSolution: any): any[] {
    // 实现Word技术方案生成
    return [];
  }

  private static generateWordMarketingStrategy(marketingStrategy: any): any[] {
    // 实现Word营销策略生成
    return [];
  }

  private static generateWordImplementationPlan(implementationPlan: any): any[] {
    // 实现Word实施计划生成
    return [];
  }

  private static generateWordRiskAssessment(riskAssessment: any): any[] {
    // 实现Word风险评估生成
    return [];
  }

  // 辅助方法
  private static getChannelTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      digital: '数字化',
      traditional: '传统媒体',
      social: '社交媒体',
      direct: '直接营销',
    };
    return labels[type] || type;
  }

  private static getRiskLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
    };
    return labels[level] || level;
  }

  private static getRiskCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      technical: '技术风险',
      market: '市场风险',
      financial: '财务风险',
      operational: '运营风险',
    };
    return labels[category] || category;
  }

  /**
   * 获取可用的导出模板
   */
  static getAvailableTemplates(): ExportTemplate[] {
    return Object.values(this.DEFAULT_TEMPLATES);
  }

  /**
   * 下载文件
   */
  static downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default ExportService;