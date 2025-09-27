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
    const { format } = options;

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
   * 导出为PDF格式 (简化版本)
   */
  private static async exportToPDF(report: FinalReport, options: ExportOptions): Promise<Blob> {
    // 简化版本：生成HTML并提示用户使用浏览器打印为PDF
    const template = this.DEFAULT_TEMPLATES[options.template || 'default'];
    const htmlContent = this.generateHTMLContent(report, template, options);
    
    // 添加打印样式
    const printableHTML = htmlContent.replace(
      '</head>',
      `<style>@media print { body { margin: 0; } .no-print { display: none; } }</style></head>`
    );
    
    return new Blob([printableHTML], { type: 'text/html;charset=utf-8' });
  }

  /**
   * 导出为Word格式 (简化版本)
   */
  private static async exportToWord(report: FinalReport, options: ExportOptions): Promise<Blob> {
    // 简化版本：生成富文本格式
    const content = this.generatePlainTextContent(report);
    return new Blob([content], { type: 'text/plain;charset=utf-8' });
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
   * 生成纯文本内容
   */
  private static generatePlainTextContent(report: FinalReport): string {
    return `
${report.topic} - 产品解决方案报告

生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}
会话ID: ${report.sessionId}

执行摘要
========
${report.executiveSummary}

设计概念
========
产品类型: ${report.designConcept.productType}
文化背景: ${report.designConcept.culturalBackground}
目标受众: ${report.designConcept.targetAudience}
设计元素: ${report.designConcept.designElements.join(', ')}
视觉描述: ${report.designConcept.visualDescription}

技术方案
========
材料清单: ${report.technicalSolution.materials.join(', ')}
生产流程: ${report.technicalSolution.productionProcess.join(' -> ')}
质量标准: ${report.technicalSolution.qualityStandards.join(', ')}

成本估算:
- 材料成本: ${report.technicalSolution.costEstimation.materials} ${report.technicalSolution.costEstimation.currency}
- 人工成本: ${report.technicalSolution.costEstimation.labor} ${report.technicalSolution.costEstimation.currency}
- 管理费用: ${report.technicalSolution.costEstimation.overhead} ${report.technicalSolution.costEstimation.currency}
- 总成本: ${report.technicalSolution.costEstimation.total} ${report.technicalSolution.costEstimation.currency}

营销策略
========
定位声明: ${report.marketingStrategy.positioningStatement}
总预算: ${report.marketingStrategy.budget.total} ${report.marketingStrategy.budget.currency}

实施计划
========
总实施周期: ${report.implementationPlan.totalDuration} 天

风险评估
========
整体风险等级: ${this.getRiskLevelLabel(report.riskAssessment.overallRiskLevel)}

本报告由AI头脑风暴平台自动生成
`;
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

  // 辅助方法
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