import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Typography,
  Divider,
  message,
  Space,
  Row,
  Col,
  Select
} from 'antd';
import { SaveOutlined, LinkOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { CLASSIFICATION_CRITERIA, CLASSIFICATION_CRITERIA_LABELS, CLASSIFICATION_TIER } from '../types/api';
import { companyApi } from '../services/api';

const { Title, Text } = Typography;

interface ApiConfig {
  backend_api: string;
  base_url: string;
  api_key: string;
  model_use: string;
  temperature: number;
  time_out: number;
  max_tries: number;
}

interface GlobalConfigProps {
  onConfigChange?: (config: any) => void;
  classificationCriterion?: string;
  tier?: string;
  onClassificationChange?: (criterion: string, tier: string) => void;
  hasTier1Data?: boolean; // 新增：是否有一级分类数据
}

const GlobalConfig: React.FC<GlobalConfigProps> = ({ 
  onConfigChange, 
  classificationCriterion: propClassificationCriterion,
  tier: propTier,
  onClassificationChange,
  hasTier1Data = false // 新增：默认没有一级分类数据
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [classificationCriterion, setClassificationCriterion] = useState<string>(
    propClassificationCriterion || CLASSIFICATION_CRITERIA.SW
  );
  const [tier, setTier] = useState<string>(
    propTier || CLASSIFICATION_TIER.TIER1
  );
  const [formValid, setFormValid] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      // 从localStorage加载配置
      const backendApi = localStorage.getItem('backend_api') || '';
      const apiConfigStr = localStorage.getItem('api_config');
      const year = localStorage.getItem('analysis_year');
      
      if (year) {
        setCurrentYear(parseInt(year));
      }

      if (apiConfigStr) {
        const apiConfig = JSON.parse(apiConfigStr);
        form.setFieldsValue({
          ...apiConfig,
          backend_api: backendApi
        });
      } else {
        // 设置默认值
        form.setFieldsValue({
          backend_api: backendApi,
        });
      }
      
      // 检查backend_api有效性
      checkBackendApiValid(backendApi);
      
      // 检查表单有效性
      setTimeout(() => {
        const values = form.getFieldsValue();
        const requiredFields = ['backend_api', 'base_url', 'api_key', 'model_use'];
        const hasAllRequired = requiredFields.every(field => {
          const value = values[field];
          return value && typeof value === 'string' && value.trim().length > 0;
        });
        setFormValid(hasAllRequired);
      }, 100);
    } catch (error) {
      console.error('加载配置失败:', error);
      message.error('加载配置失败');
    }
  };

  const validateBackendApi = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const checkBackendApiValid = (url: string) => {
    const isValid = validateBackendApi(url);
    return isValid;
  };

  const checkFormValid = async () => {
    try {
      const values = await form.validateFields();
      // 检查必填字段是否都有值
      const requiredFields = ['backend_api', 'base_url', 'api_key', 'model_use'];
      const hasAllRequired = requiredFields.every(field => {
        const value = values[field];
        return value && typeof value === 'string' && value.trim().length > 0;
      });
      
      if (hasAllRequired) {
        setFormValid(true);
      } else {
        setFormValid(false);
      }
    } catch (error) {
      setFormValid(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      message.success('配置保存成功');
      
      // 通知父组件配置已更新
      if (onConfigChange) {
        const { backend_api, ...apiConfig } = values;
        onConfigChange({ backend_api, ...apiConfig });
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败，请检查表单数据');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setTestLoading(true);
      const values = await form.validateFields();
      
      // 从localStorage获取backend_api
      const backendApi = localStorage.getItem('backend_api') || values.backend_api;
      
      if (!validateBackendApi(backendApi)) {
        message.error('后端地址格式不正确');
        return;
      }

      // 准备健康检查参数
      const healthCheckParams = {
        base_url: values.base_url,
        api_key: values.api_key,
        model_use: values.model_use,
        max_retries: values.max_tries || 3,
        timeout: values.time_out || 60,
        temperature: values.temperature || 0.7
      };

      // 使用companyApi进行健康检查
      const response = await companyApi.healthCheck(healthCheckParams);

      if (response) {
        message.success('连接测试成功');
      } else {
        message.warning('连接测试完成，但返回非200状态码');
      }
    } catch (error: any) {
      console.error('测试连接失败:', error);
      if (error.code === 'ECONNABORTED') {
        message.error('连接超时，请检查后端地址和网络连接');
      } else if (error.response) {
        message.error(`连接失败: ${error.response.status} ${error.response.statusText}`);
      } else {
        message.error('连接失败，请检查后端地址是否正确');
      }
    } finally {
      setTestLoading(false);
    }
  };

  const handleYearChange = (year: number | null) => {
    if (year !== null) {
      setCurrentYear(year);
      localStorage.setItem('analysis_year', year.toString());
    }
  };

  const handleClassificationCriterionChange = (value: string) => {
    setClassificationCriterion(value);
    if (onClassificationChange) {
      onClassificationChange(value, tier);
    }
  };

  const handleTierChange = (value: string) => {
    // 如果没有一级分类数据且尝试选择二级分类，则阻止
    if (!hasTier1Data && value === CLASSIFICATION_TIER.TIER2) {
      message.warning('请先进行一级分类分析，再进行二级分类分析');
      return;
    }
    
    setTier(value);
    if (onClassificationChange) {
      onClassificationChange(classificationCriterion, value);
    }
  };

  return (
    <div>
      {/* API配置部分 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#262626'
        }}>
          API配置
        </div>
        
        <Form
          form={form}
          layout="vertical"
          size="small"
          style={{ marginBottom: '0' }}
          onValuesChange={(changedValues, allValues) => {
            // 数据变化时自动保存
            if (changedValues.backend_api !== undefined) {
              localStorage.setItem('backend_api', changedValues.backend_api);
            }
            
            // 保存其他表单数据到localStorage
            const { backend_api, ...apiConfig } = allValues;
            if (Object.keys(apiConfig).length > 0) {
              localStorage.setItem('api_config', JSON.stringify(apiConfig));
            }
            
            // 检查表单有效性
            const requiredFields = ['backend_api', 'base_url', 'api_key', 'model_use'];
            const hasAllRequired = requiredFields.every(field => {
              const value = allValues[field];
              return value && typeof value === 'string' && value.trim().length > 0;
            });
            setFormValid(hasAllRequired);
          }}
        >
          <Form.Item
            label="后端地址"
            name="backend_api"
            rules={[
              { required: true, message: '请输入后端地址' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (!validateBackendApi(value)) {
                    return Promise.reject(new Error('请输入有效的URL地址'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input/>
          </Form.Item>

          <Form.Item
            label="API服务URL"
            name="base_url"
            rules={[{ required: true, message: '请输入API服务URL' }]}
          >
            <Input/>
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="api_key"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input.Password/>
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="model_use"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input/>
          </Form.Item>

          <Form.Item
            label="温度 (0-2)"
            name="temperature"
            initialValue={0.7}
          >
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="0.7"
              size="small"
            />
          </Form.Item>

          <Form.Item
            label="超时时间 (0-120ms)"
            name="time_out"
            initialValue={60}
          >
            <InputNumber
              min={0}
              max={120}
              step={1}
              precision={0}
              style={{ width: '100%' }}
              placeholder="60"
              size="small"
            />
          </Form.Item>

          <Form.Item
            label="最大重试次数 (0-10)"
            name="max_tries"
            initialValue={3}
          >
            <InputNumber
              min={0}
              max={10}
              step={1}
              precision={0}
              style={{ width: '100%' }}
              placeholder="3"
              size="small"
            />
          </Form.Item>

          <div style={{ marginTop: '20px' }}>
              <Button
                onClick={handleSave}
                loading={loading}
                style={{ 
                  width: '49%',
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  color: '#666',
                  marginRight: '1%'
                }}
              >
                保存
              </Button>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleTest}
                loading={testLoading}
                disabled={!formValid}
                style={{
                width: '49%',
                }}
              >
                测试
              </Button>
          </div>
        </Form>
      </div>

      {/* 分类设置部分 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#262626'
        }}>
          分类设置
        </div>
        
        <Form layout="vertical" size="small">
          <Form.Item label="分类标准">
            <Select
              value={classificationCriterion}
              onChange={handleClassificationCriterionChange}
              style={{ width: '100%' }}
              size="small"
              placeholder="请选择分类标准"
            >
              {Object.entries(CLASSIFICATION_CRITERIA_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="分类层级">
            <Select
              value={tier}
              onChange={handleTierChange}
              style={{ width: '100%' }}
              size="small"
              placeholder="请选择分类层级"
              disabled={!hasTier1Data && tier === CLASSIFICATION_TIER.TIER2}
            >
              <Select.Option value={CLASSIFICATION_TIER.TIER1}>一级分类</Select.Option>
              <Select.Option 
                value={CLASSIFICATION_TIER.TIER2}
                disabled={!hasTier1Data}
              >
                二级分类
              </Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="分析年份（2000-2025）">
            <InputNumber
              value={currentYear}
              onChange={handleYearChange}
              min={2000}
              max={2025}
              style={{ width: '100%' }}
              placeholder="2025"
              addonAfter="年"
              size="small"
            />
          </Form.Item>
        </Form>
      </div>

      {/* 当前配置显示 */}
      <div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#262626'
        }}>
          当前配置
        </div>
        <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
          <Text style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#666' }}>
            分类标准：{CLASSIFICATION_CRITERIA_LABELS[classificationCriterion]}
          </Text>
          <Text style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#666' }}>
            分类层级：{tier === CLASSIFICATION_TIER.TIER1 ? '一级' : '二级'}
          </Text>
          <Text style={{ fontSize: '12px', display: 'block', color: '#666' }}>
            分析年份：{currentYear}年
          </Text>
        </div>
      </div>
    </div>
  );
};

export default GlobalConfig;
