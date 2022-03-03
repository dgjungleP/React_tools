import React, { useState } from "react";
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
} from "antd";
import {
  deleteSystemConfig,
  getSystemConfig,
  updateSystemConfig,
} from "../../server/project-service";
import { useEffect } from "react/cjs/react.development";
const { Content } = Layout;

function SystemConfigModal(props) {
  const config = props.config;
  const [systemName, setSystemName] = useState();
  const [groupList, setGroupList] = useState();
  const [testerList, setTesterList] = useState();
  const [preConfig, setPreConfig] = useState();
  useEffect(() => {
    if (preConfig == config) {
      return;
    }
    setSystemName(config.systemName);
    setGroupList(config.groupList);
    setTesterList(config.testerList);
    setPreConfig(config);
  });
  const handleOk = () => {
    if (!checklimit()) {
      cleanStatus();
      return;
    }
    props.setVisible(false);
    config.testerList = testerList;
    config.groupList = groupList;
    config.systemName = systemName;
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
    setSystemName("");
    setGroupList([]);
    setTesterList([]);
    setPreConfig({});
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

  return (
    <Modal
      title="Create System Config"
      centered
      visible={props.visible}
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
          <span>TesterList:</span>
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
                <Col span={4} key={systemConfig.id}>
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
                        <span>Tester List:</span>
                      </Row>
                      <Row>
                        <Select
                          mode="multiple"
                          defaultValue={config.testerList}
                          style={{ width: "100%" }}
                          disabled
                        ></Select>
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
