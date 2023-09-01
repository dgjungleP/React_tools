import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import "./config.css";
import {
  Button,
  Col,
  Input,
  Layout,
  Modal,
  Row,
  Select,
  message,
  Card,
  Popconfirm,
  Spin,
  Switch,
} from "antd";
import {
  deleteSystemConfig,
  getSystemConfig,
  updateSystemConfig,
} from "../../server/project-service";
const { Content } = Layout;

function SystemConfigModal(props) {
  const config = props.config;
  const [systemName, setSystemName] = useState();
  const [groupList, setGroupList] = useState();
  const [divisionList, setDivisionList] = useState();

  const [testerList, setTesterList] = useState();
  const [dataLink, setDataLink] = useState();
  const [hasHistory, setHasHistory] = useState();
  const [needGroup, setNeedGroup] = useState();

  const [needDivision, setNeedDivision] = useState();
  const [needFetch, setNeedFetch] = useState();
  const [localTest, setLocalTest] = useState();
  const [developer, setDeveloper] = useState();

  useEffect(() => {
    updateConfig(config);
  }, [config]);
  const updateConfig = (config) => {
    setSystemName(config.systemName);
    setGroupList(config.groupList);
    setTesterList(config.testerList);
    setDataLink(config.dataLink);
    setHasHistory(config.hasHistory);
    setNeedGroup(config.needGroup);
    setDivisionList(config.divisionList);
    setNeedDivision(config.needDivision);
    setNeedFetch(config.needFetch);
    setLocalTest(config.localTest);
    setDeveloper(config.developer);
  };
  const handleOk = () => {
    if (!checklimit()) {
      cleanStatus();
      return;
    }
    props.setVisible(false);
    config.testerList = testerList;
    config.groupList = groupList;
    config.systemName = systemName;
    config.dataLink = dataLink;
    config.hasHistory = hasHistory;
    config.needGroup = needGroup;
    config.divisionList = divisionList;
    config.needDivision = needDivision;
    config.needFetch = needFetch;
    config.localTest = localTest;
    config.developer = developer;

    const body = { id: config.id, systemName, config: config };
    updateSystemConfig([body]);
    cleanStatus();
    setTimeout(() => props.freashData(), 500);
  };
  const handleClose = () => {
    props.setVisible(false);
    cleanStatus();
  };
  const cleanStatus = () => {
    updateConfig({});
    props.setSelectedSystem({});
  };
  const checklimit = () => {
    if (!systemName) {
      message.warning("Please input your system name", 5);
      return false;
    }
    if (!groupList) {
      message.warning("Please input your group list", 5);
      return false;
    }
    if (!testerList) {
      message.warning("Please input your tester list", 5);
      return false;
    }
    return true;
  };
  const handleSystemChange = (event) => {
    setSystemName(event.target.value);
  };
  const handleDataLinkChange = (event) => {
    setDataLink(event.target.value);
  };
  const onHasHistotyChange = () => {
    setHasHistory(!hasHistory);
  };

  const onNeedGroupChange = () => {
    setNeedGroup(!needGroup);
  };
  const onNeedDivisionChange = () => {
    setNeedDivision(!needDivision);
  };
  const onNeedFetchChange = () => {
    setNeedFetch(!needFetch);
  };
  const onLocalTestChange = () => {
    setLocalTest(!localTest);
  };
  const onDeveloperChange = () => {
    setDeveloper(!developer);
  };
  return (
    <Modal
      title="Create System Config"
      centered
      open={props.visible}
      onOk={handleOk}
      onCancel={handleClose}
      width={500}
    >
      <Col>
        <Row>
          <span>SystemName:</span>
          <Input
            value={systemName}
            onPressEnter={handleSystemChange}
            onChange={handleSystemChange}
          ></Input>
        </Row>
        <Row>
          <span>UserList:</span>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            onChange={(value) => setTesterList(value)}
            tokenSeparators={[","]}
            value={testerList}
          ></Select>
        </Row>
        <Row>
          <span>GroupList:</span>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            onChange={(value) => setGroupList(value)}
            tokenSeparators={[","]}
            value={groupList}
          ></Select>
        </Row>
        <Row>
          <span>DivisionList:</span>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            onChange={(value) => setDivisionList(value)}
            tokenSeparators={[","]}
            value={divisionList}
          ></Select>
        </Row>
        <Row>
          <span>DataLink:</span>
          <Input
            value={dataLink}
            onPressEnter={handleDataLinkChange}
            onChange={handleDataLinkChange}
          ></Input>
        </Row>
        <Row align="middle">
          <span>HasHistory:</span>
          <Switch
            style={{ marginLeft: 5 }}
            checked={hasHistory}
            onChange={onHasHistotyChange}
            size="small"
          />
        </Row>
        <Row align="middle">
          <span>NeedGroup:</span>
          <Switch
            style={{ marginLeft: 5 }}
            checked={needGroup}
            onChange={onNeedGroupChange}
            size="small"
          />
        </Row>
        <Row align="middle">
          <span>NeedDivision:</span>
          <Switch
            style={{ marginLeft: 5 }}
            checked={needDivision}
            onChange={onNeedDivisionChange}
            size="small"
          />
        </Row>
        <Row align="middle">
          <span>NeedFetch:</span>
          <Switch
            style={{ marginLeft: 5 }}
            checked={needFetch}
            onChange={onNeedFetchChange}
            size="small"
          />
        </Row>
        <Row align="middle">
          <span>LocalTester:</span>
          <Switch
            style={{ marginLeft: 5 }}
            checked={localTest}
            onChange={onLocalTestChange}
            size="small"
          />
        </Row>
        <Row align="middle">
          <span>Developer:</span>
          <Switch
            style={{ marginLeft: 5 }}
            checked={developer}
            onChange={onDeveloperChange}
            size="small"
          />
        </Row>
      </Col>
    </Modal>
  );
}
function SystemConfig(props) {
  const [visible, setVisible] = useState(false);
  const [systemConfigs, setSystemConfigs] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState({});
  const [loading, setLoading] = useState(false);
  const freshData = () => {
    setLoading(true);
    setSystemConfigs([]);
    getSystemConfig().then((response) => {
      setSystemConfigs(response.data);
      setLoading(false);
    });
  };
  const editSystem = (systemConfig) => {
    const currentConfig = systemConfig.config;
    currentConfig.id = systemConfig.id;
    setSelectedSystem(currentConfig);
    setTimeout(() => setVisible(true), 200);
  };
  const delteSystem = (systemConfig) => {
    deleteSystemConfig(systemConfig);
    setTimeout(() => freshData(), 500);
  };
  useEffect(() => {
    freshData();
  }, []);
  return (
    <>
      <Content
        style={{
          marginTop: 24,
          padding: 24,
          margin: 0,
          minHeight: "500px",
          background: "#fff",
        }}
      >
        <Button type="primary" onClick={() => setVisible(true)}>
          Create System
        </Button>
        <SystemConfigModal
          visible={visible}
          setVisible={setVisible}
          setSelectedSystem={setSelectedSystem}
          freashData={freshData}
          config={selectedSystem}
        ></SystemConfigModal>
        <Spin spinning={loading}>
          <Row gutter={16} style={{ marginTop: 24 }}>
            {systemConfigs.map((systemConfig) => {
              const config = systemConfig.config;
              return (
                <Col span={5} key={systemConfig.id}>
                  <Card
                    type="inner"
                    title={systemConfig.systemName}
                    extra={
                      <div>
                        <a onClick={() => editSystem(systemConfig)}>Edit</a>
                        <Popconfirm
                          title="Are you sure to delete this system?"
                          onConfirm={() => delteSystem(systemConfig)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <a style={{ marginLeft: 5, color: "red" }}>Delete</a>
                        </Popconfirm>
                      </div>
                    }
                    style={{ width: 300 }}
                  >
                    <Col>
                      <Row>
                        <span>Group List:</span>
                      </Row>
                      <Row>
                        <Select
                          mode="multiple"
                          defaultValue={config.groupList}
                          disabled
                          style={{ width: "100%" }}
                        ></Select>
                      </Row>
                      <Row>
                        <span>Division List:</span>
                      </Row>
                      <Row>
                        <Select
                          mode="multiple"
                          defaultValue={config.divisionList}
                          disabled
                          style={{ width: "100%" }}
                        ></Select>
                      </Row>
                      <Row>
                        <span>User List:</span>
                      </Row>
                      <Row>
                        <Select
                          mode="multiple"
                          defaultValue={config.testerList}
                          style={{ width: "100%" }}
                          disabled
                        ></Select>
                      </Row>
                      <Row>
                        <span>Data Link:</span>
                      </Row>
                      <Row>
                        <a style={{ wordBreak: "break-all" }}>
                          {config.dataLink}
                        </a>
                      </Row>
                      <Row align="middle">
                        <span>Has History:</span>
                        <Switch
                          style={{ marginLeft: 5 }}
                          checked={config.hasHistory}
                          size="small"
                          disabled
                        />
                      </Row>
                      <Row align="middle">
                        <span>Need Group:</span>
                        <Switch
                          style={{ marginLeft: 5 }}
                          checked={config.needGroup}
                          size="small"
                          disabled
                        />
                      </Row>
                      <Row align="middle">
                        <span>Need Division:</span>
                        <Switch
                          style={{ marginLeft: 5 }}
                          checked={config.needDivision}
                          size="small"
                          disabled
                        />
                      </Row>
                      <Row align="middle">
                        <span>Need Fetch:</span>
                        <Switch
                          style={{ marginLeft: 5 }}
                          checked={config.needFetch}
                          size="small"
                          disabled
                        />
                      </Row>
                      <Row align="middle">
                        <span>Local Tester:</span>
                        <Switch
                          style={{ marginLeft: 5 }}
                          checked={config.localTest}
                          size="small"
                          disabled
                        />
                      </Row>
                      <Row align="middle">
                        <span>Developer:</span>
                        <Switch
                          style={{ marginLeft: 5 }}
                          checked={config.developer}
                          size="small"
                          disabled
                        />
                      </Row>
                    </Col>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Spin>
      </Content>
    </>
  );
}

export { SystemConfig };
