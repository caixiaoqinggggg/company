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

  // 新增loading状态
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);

  // 左侧栏全局属性
  const [classificationCriterion, setClassificationCriterion] = useState<string>(CLASSIFICATION_CRITERIA.SW);
  const [tier, setTier] = useState<string>(CLASSIFICATION_TIER.TIER1);

  // 侧边栏状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 右侧抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  // 报告数据
  const [competitorReportData, setCompetitorReportData] = useState<string>('');
  const [categoryReportData, setCategoryReportData] = useState<string>('');
  const [hasCompetitorData, setHasCompetitorData] = useState(false);
  const [hasCategoryData, setHasCategoryData] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('company');
  const [tabOrder, setTabOrder] = useState<string[]>(['company']);


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
        // 设置分类预测loading状态
        setCategoryLoading(true);

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

        // 使用后端返回的report字段作为报告数据
        setCategoryReportData((response as any).report || '');

        // 显示成功消息，包含info内容
        if ((response as any).info) {
          message.success((response as any).info);
        }

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
        // 设置竞争对手分析loading状态
        setCompetitorLoading(true);

        // 调用竞争对手召回接口
        const response = await companyApi.getCompetitors({
          name: companyName.trim(),
          topk: topK,
        });
        setCompetitorAnalysisData(response);

        // 设置竞争对手数据状态
        setHasCompetitorData(true);

        // 使用后端返回的report字段作为报告数据
        setCompetitorReportData((response as any).report || '');

        // 显示成功消息，包含info内容
        if ((response as any).info) {
          message.success((response as any).info);
        }

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
      setDrawerCollapsed(false);
    } catch (error: any) {
      message.error(error.message || "分析失败，请重试");
    } finally {
      // 重置loading状态
      setCategoryLoading(false);
      setCompetitorLoading(false);
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
                分类标准
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
          marginRight: drawerVisible ? (drawerCollapsed ? '80px' : '600px') : '0px'
        }}
      >
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          transition: 'all 0.3s ease'
        }}>

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
                prefix={<SearchOutlined />}
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
                    loading={categoryLoading}
                    disabled={categoryLoading}
                    style={{ height: '48px' }}
                  >
                    {categoryLoading ? '分析中...' : '分类筛选'}
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type={openPanel === "competitor" ? "primary" : "default"}
                    size="large"
                    block
                    icon={<TeamOutlined />}
                    onClick={() => handlePanelClick("competitor")}
                    loading={competitorLoading}
                    disabled={competitorLoading}
                    style={{ height: '48px' }}
                  >
                    {competitorLoading ? '分析中...' : '竞争对手分析'}
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
                {categoryLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#1890ff' }}>
                    <Spin size="small" style={{ marginRight: '8px' }} />
                    <Text>正在分析中...</Text>
                  </div>
                ) : categoryAnalysisData ? (
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
                {competitorLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#1890ff' }}>
                    <Spin size="small" style={{ marginRight: '8px' }} />
                    <Text>正在分析中...</Text>
                  </div>
                ) : competitorAnalysisData ? (
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
            <span style={{ fontSize: '20px', display: drawerCollapsed ? 'none' : 'block' }}>分析报告</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                type="text"
                icon={drawerCollapsed ? <MenuFoldOutlined /> :  <MenuUnfoldOutlined />}
                onClick={() => setDrawerCollapsed(!drawerCollapsed)}
                size="small"
                title={drawerCollapsed ? '展开抽屉' : '收起抽屉'}
              />
              {!drawerCollapsed && (
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setDrawerVisible(false)}
                  size="small"
                  title="关闭报告"
                />
              )}
            </div>
          </div>
        }
        placement="right"
        width={drawerCollapsed ? 80 : 600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        closable={false}
        mask={false}
        style={{ zIndex: 1000 }}
        bodyStyle={{
          padding: drawerCollapsed ? '8px' : '16px',
          overflow: 'hidden'
        }}
      >
        {drawerCollapsed ? (
          // 收起状态：只显示图标
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            {tabOrder.map(tabKey => {
              if (tabKey === 'company') {
                return (
                  <div
                    key="company"
                    style={{
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '6px',
                      background: activeTabKey === 'company' ? '#1890ff' : '#f0f0f0',
                      color: activeTabKey === 'company' ? '#fff' : '#666',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => { setActiveTabKey('company'); setDrawerCollapsed(false); setDrawerVisible(true); }}
                    title="企业分析报告"
                  >
                    <FileTextOutlined style={{ fontSize: '20px' }} />
                  </div>
                );
              }

              if (tabKey === 'category' && hasCategoryData) {
                return (
                  <div
                    key="category"
                    style={{
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '6px',
                      background: activeTabKey === 'category' ? '#1890ff' : '#f0f0f0',
                      color: activeTabKey === 'category' ? '#fff' : '#666',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => { setActiveTabKey('category'); setDrawerCollapsed(false); setDrawerVisible(true); }}
                    title="分类预测分析报告"
                  >
                    <FilterOutlined style={{ fontSize: '20px' }} />
                  </div>
                );
              }

              if (tabKey === 'competitor' && hasCompetitorData) {
                return (
                  <div
                    key="competitor"
                    style={{
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '6px',
                      background: activeTabKey === 'competitor' ? '#1890ff' : '#f0f0f0',
                      color: activeTabKey === 'competitor' ? '#fff' : '#666',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => { setActiveTabKey('competitor'); setDrawerCollapsed(false); setDrawerVisible(true); }}
                    title="竞争对手分析报告"
                  >
                    <TeamOutlined style={{ fontSize: '20px' }} />
                  </div>
                );
              }

              return null;
            })}
          </div>
        ) : (
          // 展开状态：显示完整的标签页内容
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
                      style={{ padding: '0px 16px' }}
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
                          分类预测分析报告
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
                          竞争对手分析报告
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
        )}
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
