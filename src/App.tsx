import React, { useState } from "react";
import {
  Input,
  Button,
  Card,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  message,
  Spin,
  Layout,
  Select,
  Modal,
  InputNumber,
  Drawer,
  Tabs
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  CopyOutlined,
  SettingOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { CLASSIFICATION_CRITERIA, CLASSIFICATION_CRITERIA_LABELS, CLASSIFICATION_TIER, CompanyClassificationResponse } from "./types/api";
import { companyApi } from "./services/api";
import CompanySummaryReport from "./components/CompanySummaryReport";
import CompetitorAnalysisReport from "./components/CompetitorAnalysisReport";
import CategoryAnalysisReport from "./components/CategoryAnalysisReport";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function CompanyAnalysisPage() {
  const [companyName, setCompanyName] = useState("");
  const [openPanel, setOpenPanel] = useState<"category" | "competitor" | null>(null);
  const [jsonData, setJsonData] = useState<CompanyClassificationResponse | null>(null);
  const [llmData, setLlmData] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 新增状态
  const [topK, setTopK] = useState<number>(5);
  const [showTopKModal, setShowTopKModal] = useState(false);
  const [pendingPanel, setPendingPanel] = useState<"category" | "competitor" | null>(null);
  const [categoryAnalysisData, setCategoryAnalysisData] = useState<any>(null);
  const [competitorAnalysisData, setCompetitorAnalysisData] = useState<any>(null);

  // 左侧栏全局属性
  const [classificationCriterion, setClassificationCriterion] = useState<string>(CLASSIFICATION_CRITERIA.SW);
  const [tier, setTier] = useState<string>(CLASSIFICATION_TIER.TIER1);

  // 侧边栏状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 右侧抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 报告数据
  const [competitorReportData, setCompetitorReportData] = useState<string>('');
  const [categoryReportData, setCategoryReportData] = useState<string>('');
  const [hasCompetitorData, setHasCompetitorData] = useState(false);
  const [hasCategoryData, setHasCategoryData] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('company');
  const [tabOrder, setTabOrder] = useState<string[]>(['company']);

  const mockData = {
    competitorReport: `# 竞争对手分析报告

## 一、主体公司概况

**公司名称**: 东莞长联新材料科技股份有限公司

### 1.1 主营业务
- 专业从事印花材料的研发、生产与销售
- 主要产品包括：
  - 水性印花胶浆（包括通用型、数码胶浆等）
  - 水性树脂
  - 丝印硅胶
  - 数码涂料墨水
  - 自动化印花设备

### 1.2 经营范围
- 涉及印花材料与设备的研发、设计与销售

### 1.3 主要产品与服务
- 环保、手感柔软、耐洗水等特性，广泛应用于纺织印花领域

---

## 二、竞争对手概况

### 2.1 中山市盈丰泰水性涂料有限公司
- **主营业务**: 水性印花材料领域，产品包括水性印花胶浆、数码涂料墨水等
- **经营范围**: 涂料与颜料的制造与销售
- **主要产品**: 包括多种水性印花胶浆及自动化印花设备

### 2.2 东莞市彩韵新材料有限公司
- **主营业务**: 水性服装印花材料及助剂的生产与销售
- **经营范围**: 提供高端印花浆料及设备的研发与销售
- **主要产品**: 涉及水性PU、胶浆等多种印花材料

### 2.3 Rutland Corporation
- **主营业务**: 废物管理，未直接从事印花材料业务
- **经营范围**: 固体废物管理服务
- **主要产品**: 不涉及印花材料，与主体公司竞争关系不显著

### 2.4 石狮市德采化工科技有限公司
- **主营业务**: 分散染料与水性印花涂料的研发与生产
- **经营范围**: 水性印花涂料合成加工及染料销售
- **主要产品**: 中高端分散染料及印花涂料

### 2.5 Matsui International Company Inc.
- **主营业务**: 颜料与油墨的生产与销售
- **经营范围**: 油墨、颜料及相关产品的开发与销售
- **主要产品**: 涉及多种水性油墨及特种油墨

---

## 三、竞争关系分析

### 3.1 竞争重叠
- **产品线重叠**: 东莞长联新材料与中山市盈丰泰水性涂料有限公司、东莞市彩韵新材料有限公司在水性印花材料的研发与生产上存在直接竞争关系。
- **市场定位相似**: 三家公司均专注于环保型水性印花材料，服务于纺织品印花市场。

### 3.2 市场背景
- **行业趋势**: 随着环保法规的日益严格，水性印花材料市场需求上升，这为以上公司提供了良好的市场机遇。
- **技术进步**: 自动化印花设备的研发与应用增强了市场竞争力，促使各公司不断更新和优化产品。

### 3.3 竞争优势与劣势
- **竞争优势**:
  - 东莞长联新材料科技股份有限公司在环保型材料的研发上具备深厚的技术积累。
  - 中山市盈丰泰水性涂料有限公司在市场份额和品牌影响力方面相对较强。
  
- **竞争劣势**:
  - 东莞长联可能在市场推广和渠道建设上相对薄弱。
  - 中山市盈丰泰可能在产品多样性和创新能力上面临挑战。

---

## 四、结论
东莞长联新材料科技股份有限公司与中山市盈丰泰水性涂料有限公司、东莞市彩韵新材料有限公司之间的竞争关系主要源于市场需求的重叠和产品特性的相似。随着环保型材料的市场需求上升，竞争将愈发激烈。建议主体公司在保持技术创新的同时，加强市场推广与客户关系管理，以巩固其市场地位。`,

    categoryReport: `# 分类预测分析报告

## 一、公司基本信息

**公司名称**: 东莞长联新材料科技股份有限公司

## 二、分类预测结果

### 2.1 申万行业分类（一级）
- **主要分类**: 化工
- **置信度**: 95.2%

### 2.2 申万行业分类（二级）
- **主要分类**: 化学制品
- **置信度**: 92.8%

### 2.3 国证行业分类
- **主要分类**: 基础化工
- **置信度**: 89.5%

## 三、分类依据分析

### 3.1 主营业务匹配度
- 印花材料研发、生产与销售
- 水性印花胶浆、树脂等化工产品
- 符合化工行业特征

### 3.2 技术特征分析
- 新材料技术研发
- 环保型化工产品
- 符合化学制品细分领域

## 四、行业发展趋势

### 4.1 市场前景
- 环保政策推动水性材料需求
- 纺织印花行业持续发展
- 新材料技术不断创新

### 4.2 竞争格局
- 行业集中度逐步提升
- 技术壁垒日益明显
- 环保要求日趋严格

## 五、投资建议

### 5.1 优势分析
- 技术研发能力较强
- 产品环保性能突出
- 市场定位明确

### 5.2 风险提示
- 原材料价格波动
- 环保政策变化
- 市场竞争加剧

## 六、结论
东莞长联新材料科技股份有限公司在化工行业分类中具有较高的置信度，主要归属于化学制品细分领域。公司在新材料研发和环保产品方面具有明显优势，未来发展前景良好。`
  };

  const handleSearch = async () => {
    if (!companyName.trim()) {
      message.warning("请输入公司名称");
      return;
    }

    setLoading(true);
    try {
      // 调用企业分类分析接口
      const response = await companyApi.classifyCompany({
        name: companyName.trim(),
        classification_criterion: classificationCriterion,
        tier: tier,
      });

      // 设置企业分类分析结果
      // API服务已经通过拦截器返回了response.data
      if (response) {
        // 使用类型断言，因为API拦截器已经返回了实际数据
        const responseData = response as any;
        setJsonData(responseData);
        setLlmData(responseData?.formatted_prompt || '');
        console.log('设置jsonData成功:', responseData);
      } else {
        console.error('API响应为空');
        message.error('API响应为空');
        return;
      }



      // 自动展开右侧抽屉
      setDrawerVisible(true);

      // 重置为默认的企业分析报告标签页
      setActiveTabKey('company');

      message.success("分析完成！");
    } catch (error: any) {

      message.error(error.message || "分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handlePanelClick = (panel: "category" | "competitor") => {
    setPendingPanel(panel);
    setShowTopKModal(true);
  };

  const handleTopKConfirm = async () => {
    if (!pendingPanel) return;

    setShowTopKModal(false);
    setOpenPanel(pendingPanel);
    setPendingPanel(null);

    try {
      if (pendingPanel === "category") {
        // 调用 Top-N 分类预测接口
        const response = await companyApi.classifyTopN({
          name: companyName.trim(),
          classification_criterion: classificationCriterion,
          tier: tier,
          top_k: topK,
        });
        setCategoryAnalysisData(response);

        // 设置分类预测数据状态
        setHasCategoryData(true);

        // 使用mockData中的分类预测报告
        setCategoryReportData(mockData.categoryReport);

        // 将分类预测标签页添加到末尾
        setTabOrder(prev => {
          if (prev.includes('category')) {
            return prev; // 如果已经存在，不重复添加
          }
          return [...prev, 'category'];
        });

        // 自动切换到分类预测分析标签页，但用户可以手动切换
        setActiveTabKey('category');

      } else if (pendingPanel === "competitor") {
        // 调用竞争对手召回接口
        const response = await companyApi.getCompetitors({
          name: companyName.trim(),
          topk: topK,
        });
        setCompetitorAnalysisData(response);

        // 设置竞争对手数据状态
        setHasCompetitorData(true);

        // 使用mockData中的竞争对手分析报告
        setCompetitorReportData(mockData.competitorReport);

        // 将竞争对手分析标签页添加到末尾
        setTabOrder(prev => {
          if (prev.includes('competitor')) {
            return prev; // 如果已经存在，不重复添加
          }
          return [...prev, 'competitor'];
        });

        // 自动切换到竞争对手分析标签页，但用户可以手动切换
        setActiveTabKey('competitor');
      }

      // 确保抽屉打开
      setDrawerVisible(true);
    } catch (error: any) {
      message.error(error.message || "分析失败，请重试");
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧栏 - 全局配置 */}
      <Layout.Sider
        width={280}
        collapsed={sidebarCollapsed}
        collapsedWidth={80}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
        trigger={null}
      >
        <div style={{
          padding: sidebarCollapsed ? '16px 8px' : '16px',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* 标题和切换按钮 */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between'
          }}>
            {!sidebarCollapsed && (
              <Title level={4} style={{ margin: 0, color: '#262626' }}>
                <SettingOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                全局配置
              </Title>
            )}
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                color: '#1890ff',
                fontSize: '16px',
                padding: '4px',
                minWidth: 'auto'
              }}
              title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            />
          </div>

          {/* 分类标准选择 */}
          {!sidebarCollapsed && (
            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                分类标准 *
              </Text>
              <Select
                value={classificationCriterion}
                onChange={setClassificationCriterion}
                style={{ width: '100%' }}
                placeholder="请选择分类标准"
              >
                {Object.entries(CLASSIFICATION_CRITERIA_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          {/* 分类层级选择 */}
          {!sidebarCollapsed && (
            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                分类层级
              </Text>
              <Select
                value={tier}
                onChange={setTier}
                style={{ width: '100%' }}
                placeholder="请选择分类层级"
              >
                <Select.Option value={CLASSIFICATION_TIER.TIER1}>一级分类</Select.Option>
                <Select.Option value={CLASSIFICATION_TIER.TIER2}>二级分类</Select.Option>
              </Select>
            </div>
          )}

          {/* 分隔线 */}
          {!sidebarCollapsed && <Divider style={{ margin: '20px 0' }} />}

          {/* 当前配置信息 */}
          {!sidebarCollapsed ? (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                当前配置：
              </Text>
              <div style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <Text style={{ fontSize: '12px' }}>
                  分类标准：{CLASSIFICATION_CRITERIA_LABELS[classificationCriterion]}
                </Text>
                <br />
                <Text style={{ fontSize: '12px' }}>
                  分类层级：{tier === CLASSIFICATION_TIER.TIER1 ? '一级' : '二级'}
                </Text>
              </div>
            </div>
          ) : (
            // 收起状态下的简化显示
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666'
              }}>
                {CLASSIFICATION_CRITERIA_LABELS[classificationCriterion].substring(0, 2)}
              </div>
            </div>
          )}
        </div>
      </Layout.Sider>

      {/* 主内容区域 */}
      <Layout.Content
        style={{
          padding: '24px',
          background: '#f5f5f5',
          transition: 'all 0.3s ease',
          marginRight: drawerVisible ? '600px' : '0px'
        }}
      >
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          transition: 'all 0.3s ease'
        }}>
          {/* 页面标题 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={1} style={{ marginBottom: '8px', color: '#262626' }}>
              <CopyOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
              公司分析工具
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              输入公司名称，获取详细的分析报告
            </Text>
          </div>

          {/* 主卡片容器 */}
          <Card
            size="small"
            style={{ marginBottom: '24px', padding: '24px' }}
          >
            {/* 公司名称输入框 */}
            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                公司名称
              </Text>
              <Input
                size="large"
                placeholder="请输入公司名称，如：OpenAI、腾讯、阿里巴巴..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<CopyOutlined />}
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* 分类 / 竞争对手按钮组 - 只在分析完成后显示 */}
            {jsonData && (
              <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={12}>
                  <Button
                    type={openPanel === "category" ? "primary" : "default"}
                    size="large"
                    block
                    icon={<FilterOutlined />}
                    onClick={() => handlePanelClick("category")}
                    style={{ height: '48px' }}
                  >
                    分类筛选
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type={openPanel === "competitor" ? "primary" : "default"}
                    size="large"
                    block
                    icon={<TeamOutlined />}
                    onClick={() => handlePanelClick("competitor")}
                    style={{ height: '48px' }}
                  >
                    竞争对手分析
                  </Button>
                </Col>
              </Row>
            )}

            {/* 分类参数面板 */}
            {openPanel === "category" && (
              <Card
                size="small"
                style={{ marginBottom: '24px', background: '#fafafa' }}
                title={
                  <Space>
                    <FilterOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Top-{topK} 分类预测结果</Text>
                  </Space>
                }
              >
                {categoryAnalysisData ? (
                  <div>
                    <Text strong>预测结果：</Text>
                    <div style={{ marginTop: '12px' }}>
                      {Object.entries(categoryAnalysisData.predictions || {}).map(([industry, probability]) => (
                        <div key={industry} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          padding: '8px',
                          background: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #e8e8e8'
                        }}>
                          <Text>{industry}</Text>
                          <Text strong style={{ color: '#52c41a' }}>
                            {(Number(probability) * 100).toFixed(2)}%
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <Text>请先进行 Top-{topK} 分类预测分析</Text>
                  </div>
                )}
              </Card>
            )}

            {/* 竞争对手参数面板 */}
            {openPanel === "competitor" && (
              <Card
                size="small"
                style={{ marginBottom: '24px', background: '#fafafa' }}
                title={
                  <Space>
                    <TeamOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Top-{topK} 竞争对手分析结果</Text>
                  </Space>
                }
              >
                {competitorAnalysisData ? (
                  <div>
                    <Text strong>竞争对手列表：</Text>
                    <div style={{ marginTop: '12px' }}>
                      {(competitorAnalysisData.competitors || []).map((competitor: string, index: number) => (
                        <div key={index} style={{
                          padding: '8px',
                          background: '#fff',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          border: '1px solid #e8e8e8'
                        }}>
                          <Text>{index + 1}. {competitor}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <Text>请先进行 Top-{topK} 竞争对手分析</Text>
                  </div>
                )}
              </Card>
            )}

            {/* 搜索按钮 */}
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                disabled={!companyName.trim()}
                style={{
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                开始分析
              </Button>
            </div>
          </Card>
        </div>
      </Layout.Content>

      {/* 右侧抽屉 - 分析报告 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '20px' }}>分析报告</span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setDrawerVisible(false)}
              size="small"
              title="关闭报告"
            />
          </div>
        }
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        closable={false}
        mask={false}
        style={{ zIndex: 1000 }}
        bodyStyle={{
          padding: '16px',
          overflow: 'hidden'
        }}
      >
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Tabs
            activeKey={activeTabKey}
            onChange={setActiveTabKey}
            size="small"
          >
            {tabOrder.map(tabKey => {
              if (tabKey === 'company') {
                return (
                  <TabPane
                    key="company"
                    tab={
                      <span style={{ padding: '0 5px' }}>
                        <FileTextOutlined style={{ marginRight: '8px' }} />
                        企业分析报告
                      </span>
                    }
                  >
                    <div>
                      <CompanySummaryReport data={jsonData} />
                    </div>
                  </TabPane>
                );
              }

              if (tabKey === 'category' && hasCategoryData) {
                return (
                  <TabPane
                    key="category"
                    tab={
                      <span style={{ padding: '0 5px' }}>
                        <FilterOutlined style={{ marginRight: '8px' }} />
                        分类预测分析
                      </span>
                    }
                  >
                    <div>
                      <CategoryAnalysisReport data={categoryReportData} />
                    </div>
                  </TabPane>
                );
              }

              if (tabKey === 'competitor' && hasCompetitorData) {
                return (
                  <TabPane
                    key="competitor"
                    tab={
                      <span style={{ padding: '0 5px' }}>
                        <TeamOutlined style={{ marginRight: '8px' }} />
                        竞争对手分析
                      </span>
                    }
                  >
                    <div>
                      <CompetitorAnalysisReport data={competitorReportData} />
                    </div>
                  </TabPane>
                );
              }

              return null;
            })}
          </Tabs>
        </div>
      </Drawer>

      {/* Top-K 输入弹窗 */}
      <Modal
        title="设置分析参数"
        open={showTopKModal}
        onOk={handleTopKConfirm}
        onCancel={() => {
          setShowTopKModal(false);
          setPendingPanel(null);
        }}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ padding: '16px 0' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            {pendingPanel === "category" ? "分类预测数量" : "竞争对手数量"}
          </Text>
          <InputNumber
            min={1}
            max={20}
            value={topK}
            onChange={(value) => setTopK(value || 5)}
            style={{ width: '100%' }}
            placeholder="请输入需要的结果个数"
            addonAfter="个"
          />
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {pendingPanel === "category"
              ? "请输入需要预测的分类数量（1-20个）"
              : "请输入需要召回的竞争对手数量（1-20个）"
            }
          </Text>
        </div>
      </Modal>
    </Layout>
  );
}
