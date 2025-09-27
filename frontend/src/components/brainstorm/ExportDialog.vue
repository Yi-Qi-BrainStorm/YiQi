<template>
  <a-modal
    v-model:open="visible"
    title="导出报告"
    width="600px"
    :confirm-loading="exporting"
    @ok="handleExport"
    @cancel="handleCancel"
  >
    <div class="export-dialog">
      <!-- 导出格式选择 -->
      <div class="export-section">
        <h4>选择导出格式</h4>
        <a-radio-group v-model:value="selectedFormat" class="format-group">
          <a-radio-button value="pdf">
            <FilePdfOutlined />
            PDF文档
          </a-radio-button>
          <a-radio-button value="word">
            <FileWordOutlined />
            Word文档
          </a-radio-button>
          <a-radio-button value="html">
            <FileOutlined />
            HTML网页
          </a-radio-button>
        </a-radio-group>
        
        <div class="format-description">
          <p>{{ getFormatDescription(selectedFormat) }}</p>
        </div>
      </div>

      <!-- 模板选择 -->
      <div class="export-section">
        <h4>选择模板样式</h4>
        <a-select
          v-model:value="selectedTemplate"
          style="width: 100%"
          placeholder="选择模板"
        >
          <a-select-option
            v-for="template in availableTemplates"
            :key="template.name"
            :value="template.name"
          >
            <div class="template-option">
              <span class="template-name">{{ template.name }}</span>
              <span class="template-desc">{{ template.description }}</span>
            </div>
          </a-select-option>
        </a-select>
      </div>

      <!-- 导出选项 -->
      <div class="export-section">
        <h4>导出选项</h4>
        <a-space direction="vertical" style="width: 100%">
          <a-checkbox v-model:checked="includeCharts">
            包含图表和统计数据
          </a-checkbox>
          <a-checkbox v-model:checked="includeFullContent">
            包含完整内容（否则仅包含摘要）
          </a-checkbox>
          <a-checkbox v-model:checked="optimizeForPrint">
            优化打印格式
          </a-checkbox>
        </a-space>
      </div>

      <!-- 文件名设置 -->
      <div class="export-section">
        <h4>文件名设置</h4>
        <a-input
          v-model:value="fileName"
          placeholder="输入文件名"
          :suffix="`.${getFileExtension(selectedFormat)}`"
        />
        <p class="file-name-hint">
          文件将保存为: {{ fileName || '报告' }}-{{ currentDate }}.{{ getFileExtension(selectedFormat) }}
        </p>
      </div>

      <!-- 自定义样式 -->
      <div class="export-section" v-if="selectedFormat === 'html'">
        <h4>自定义样式 <a-tag size="small" color="blue">高级</a-tag></h4>
        <a-collapse>
          <a-collapse-panel key="custom-styles" header="CSS样式定制">
            <a-textarea
              v-model:value="customStyles"
              placeholder="输入自定义CSS样式..."
              :rows="6"
              style="font-family: monospace;"
            />
            <p class="style-hint">
              提示: 可以自定义字体、颜色、间距等样式
            </p>
          </a-collapse-panel>
        </a-collapse>
      </div>

      <!-- 预览选项 -->
      <div class="export-section" v-if="selectedFormat === 'html'">
        <a-button type="dashed" @click="handlePreview" :loading="previewing">
          <EyeOutlined />
          预览效果
        </a-button>
      </div>

      <!-- 批量导出 -->
      <div class="export-section">
        <h4>批量导出</h4>
        <a-checkbox-group v-model:value="batchFormats" class="batch-formats">
          <a-checkbox value="pdf">PDF</a-checkbox>
          <a-checkbox value="word">Word</a-checkbox>
          <a-checkbox value="html">HTML</a-checkbox>
        </a-checkbox-group>
        <p class="batch-hint" v-if="batchFormats.length > 1">
          将同时导出 {{ batchFormats.length }} 种格式
        </p>
      </div>

      <!-- 导出进度 -->
      <div class="export-progress" v-if="exporting">
        <a-progress :percent="exportProgress" :status="exportStatus" />
        <p class="progress-text">{{ progressText }}</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button
          type="primary"
          @click="handleExport"
          :loading="exporting"
          :disabled="!canExport"
        >
          <ExportOutlined />
          {{ batchFormats.length > 1 ? '批量导出' : '导出' }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileOutlined,
  ExportOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';
import { useExport } from '@/composables/useExport';
import type { FinalReport } from '@/types/brainstorm';

interface Props {
  open: boolean;
  report: FinalReport;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'exported', result: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
  exporting,
  availableTemplates,
  exportReport,
  exportMultipleFormats,
  previewExport,
  getFileExtension,
  getFormatDisplayName,
  validateReportData,
} = useExport();

// 响应式状态
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const selectedFormat = ref<'pdf' | 'word' | 'html'>('pdf');
const selectedTemplate = ref('default');
const includeCharts = ref(true);
const includeFullContent = ref(true);
const optimizeForPrint = ref(false);
const fileName = ref('');
const customStyles = ref('');
const batchFormats = ref<string[]>([]);
const previewing = ref(false);
const exportProgress = ref(0);
const exportStatus = ref<'normal' | 'exception' | 'success'>('normal');

// 计算属性
const currentDate = computed(() => {
  return new Date().toISOString().slice(0, 10);
});

const canExport = computed(() => {
  const validation = validateReportData(props.report);
  return validation.valid && (selectedFormat.value || batchFormats.value.length > 0);
});

const progressText = computed(() => {
  if (exportProgress.value === 0) return '准备导出...';
  if (exportProgress.value < 50) return '生成报告内容...';
  if (exportProgress.value < 80) return '应用样式和格式...';
  if (exportProgress.value < 100) return '生成文件...';
  return '导出完成';
});

// 监听器
watch(() => props.report, (newReport) => {
  if (newReport && !fileName.value) {
    fileName.value = newReport.topic || '产品解决方案报告';
  }
}, { immediate: true });

watch(selectedFormat, (newFormat) => {
  // 当选择单一格式时，清空批量选择
  if (newFormat) {
    batchFormats.value = [];
  }
});

watch(batchFormats, (newFormats) => {
  // 当选择批量格式时，清空单一选择
  if (newFormats.length > 0) {
    selectedFormat.value = '' as any;
  }
});

// 方法
const getFormatDescription = (format: string): string => {
  const descriptions: Record<string, string> = {
    pdf: '适合打印和正式分享，保持格式一致性',
    word: '可编辑的文档格式，便于后续修改',
    html: '网页格式，支持交互和在线查看',
  };
  return descriptions[format] || '';
};

const handleExport = async () => {
  if (!canExport.value) {
    message.warning('请检查报告数据完整性和导出设置');
    return;
  }

  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (exportProgress.value < 90) {
      exportProgress.value += Math.random() * 20;
    }
  }, 200);

  try {
    const exportOptions = {
      template: selectedTemplate.value,
      includeCharts: includeCharts.value,
      fileName: fileName.value || '报告',
      customStyles: customStyles.value,
    };

    let result;
    
    if (batchFormats.value.length > 1) {
      // 批量导出
      result = await exportMultipleFormats(
        props.report,
        batchFormats.value as ('pdf' | 'word' | 'html')[],
        exportOptions
      );
    } else {
      // 单一格式导出
      const format = selectedFormat.value || batchFormats.value[0] as 'pdf' | 'word' | 'html';
      result = await exportReport(props.report, format, exportOptions);
    }

    exportProgress.value = 100;
    exportStatus.value = 'success';

    setTimeout(() => {
      emit('exported', result);
      handleCancel();
    }, 500);

  } catch (error) {
    exportStatus.value = 'exception';
    console.error('导出失败:', error);
  } finally {
    clearInterval(progressInterval);
    setTimeout(() => {
      exportProgress.value = 0;
      exportStatus.value = 'normal';
    }, 2000);
  }
};

const handlePreview = async () => {
  previewing.value = true;
  
  try {
    await previewExport(props.report, {
      template: selectedTemplate.value,
      customStyles: customStyles.value,
    });
  } finally {
    previewing.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
  // 重置表单
  selectedFormat.value = 'pdf';
  selectedTemplate.value = 'default';
  includeCharts.value = true;
  includeFullContent.value = true;
  optimizeForPrint.value = false;
  customStyles.value = '';
  batchFormats.value = [];
  exportProgress.value = 0;
  exportStatus.value = 'normal';
};
</script>

<style scoped lang="scss">
.export-dialog {
  .export-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #262626;
    }

    .format-group {
      width: 100%;
      
      .ant-radio-button-wrapper {
        flex: 1;
        text-align: center;
        
        .anticon {
          margin-right: 6px;
        }
      }
    }

    .format-description {
      margin-top: 8px;
      
      p {
        margin: 0;
        font-size: 13px;
        color: #8c8c8c;
      }
    }

    .template-option {
      display: flex;
      flex-direction: column;
      
      .template-name {
        font-weight: 500;
        color: #262626;
      }
      
      .template-desc {
        font-size: 12px;
        color: #8c8c8c;
        margin-top: 2px;
      }
    }

    .file-name-hint {
      margin: 8px 0 0 0;
      font-size: 12px;
      color: #8c8c8c;
    }

    .style-hint {
      margin: 8px 0 0 0;
      font-size: 12px;
      color: #8c8c8c;
    }

    .batch-formats {
      display: flex;
      gap: 16px;
    }

    .batch-hint {
      margin: 8px 0 0 0;
      font-size: 12px;
      color: #1890ff;
    }
  }

  .export-progress {
    margin-top: 16px;
    padding: 16px;
    background: #f6ffed;
    border-radius: 6px;
    border: 1px solid #b7eb8f;

    .progress-text {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #52c41a;
      text-align: center;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 响应式设计
@media (max-width: 768px) {
  .export-dialog {
    .export-section {
      .format-group {
        .ant-radio-button-wrapper {
          font-size: 12px;
          padding: 4px 8px;
        }
      }

      .batch-formats {
        flex-direction: column;
        gap: 8px;
      }
    }
  }
}
</style>