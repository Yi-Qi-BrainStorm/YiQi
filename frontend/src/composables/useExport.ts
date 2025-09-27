import { ref } from 'vue';
import { message } from 'ant-design-vue';
import ExportService, { type ExportOptions, type ExportTemplate } from '@/services/exportService';
import type { FinalReport } from '@/types/brainstorm';

export function useExport() {
  const exporting = ref(false);
  const availableTemplates = ref<ExportTemplate[]>(ExportService.getAvailableTemplates());

  /**
   * 导出报告
   */
  const exportReport = async (
    report: FinalReport,
    format: 'pdf' | 'word' | 'html',
    options: Partial<ExportOptions> = {}
  ) => {
    exporting.value = true;
    
    try {
      const exportOptions: ExportOptions = {
        format,
        template: 'default',
        includeCharts: true,
        fileName: `${report.topic}-报告`,
        ...options,
      };

      const blob = await ExportService.exportReport(report, exportOptions);
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 10);
      const extension = getFileExtension(format);
      const fileName = `${exportOptions.fileName}-${timestamp}.${extension}`;
      
      // 下载文件
      ExportService.downloadFile(blob, fileName);
      
      message.success(`报告已成功导出为 ${format.toUpperCase()} 格式`);
      
      return { success: true, fileName, blob };
    } catch (error) {
      console.error('导出失败:', error);
      message.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      return { success: false, error };
    } finally {
      exporting.value = false;
    }
  };

  /**
   * 导出为PDF
   */
  const exportToPDF = async (report: FinalReport, options: Partial<ExportOptions> = {}) => {
    return exportReport(report, 'pdf', options);
  };

  /**
   * 导出为Word
   */
  const exportToWord = async (report: FinalReport, options: Partial<ExportOptions> = {}) => {
    return exportReport(report, 'word', options);
  };

  /**
   * 导出为HTML
   */
  const exportToHTML = async (report: FinalReport, options: Partial<ExportOptions> = {}) => {
    return exportReport(report, 'html', options);
  };

  /**
   * 批量导出多种格式
   */
  const exportMultipleFormats = async (
    report: FinalReport,
    formats: ('pdf' | 'word' | 'html')[],
    options: Partial<ExportOptions> = {}
  ) => {
    const results = [];
    
    for (const format of formats) {
      const result = await exportReport(report, format, options);
      results.push({ format, ...result });
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      message.success(`所有 ${totalCount} 个格式导出成功`);
    } else if (successCount > 0) {
      message.warning(`${successCount}/${totalCount} 个格式导出成功`);
    } else {
      message.error('所有格式导出失败');
    }
    
    return results;
  };

  /**
   * 预览导出内容（仅HTML格式）
   */
  const previewExport = async (report: FinalReport, options: Partial<ExportOptions> = {}) => {
    try {
      const blob = await ExportService.exportReport(report, {
        format: 'html',
        template: 'default',
        ...options,
      });
      
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // 清理URL对象
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return { success: true, url };
    } catch (error) {
      console.error('预览失败:', error);
      message.error('预览失败');
      return { success: false, error };
    }
  };

  /**
   * 获取文件扩展名
   */
  const getFileExtension = (format: string): string => {
    const extensions: Record<string, string> = {
      pdf: 'pdf',
      word: 'docx',
      html: 'html',
    };
    return extensions[format] || 'txt';
  };

  /**
   * 获取格式显示名称
   */
  const getFormatDisplayName = (format: string): string => {
    const names: Record<string, string> = {
      pdf: 'PDF文档',
      word: 'Word文档',
      html: 'HTML网页',
    };
    return names[format] || format;
  };

  /**
   * 验证报告数据完整性
   */
  const validateReportData = (report: FinalReport): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!report.topic) {
      errors.push('缺少报告主题');
    }
    
    if (!report.executiveSummary) {
      errors.push('缺少执行摘要');
    }
    
    if (!report.designConcept) {
      errors.push('缺少设计概念');
    }
    
    if (!report.technicalSolution) {
      errors.push('缺少技术方案');
    }
    
    if (!report.marketingStrategy) {
      errors.push('缺少营销策略');
    }
    
    if (!report.implementationPlan) {
      errors.push('缺少实施计划');
    }
    
    if (!report.riskAssessment) {
      errors.push('缺少风险评估');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  };

  /**
   * 获取导出进度（模拟）
   */
  const getExportProgress = () => {
    // 这里可以实现真实的进度跟踪
    return ref(0);
  };

  return {
    exporting,
    availableTemplates,
    exportReport,
    exportToPDF,
    exportToWord,
    exportToHTML,
    exportMultipleFormats,
    previewExport,
    getFileExtension,
    getFormatDisplayName,
    validateReportData,
    getExportProgress,
  };
}

export default useExport;