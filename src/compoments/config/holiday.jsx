import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import "./holiday.css";

import {
  getHoliday,
  getSystemConfig,
  getUserInfo,
  updateHoliday,
  updateUserInfo,
  deleteHoliday,
} from "../../server/project-service";
import {
  Button,
  Col,
  DatePicker,
  Descriptions,
  InputNumber,
  List,
  PageHeader,
  Row,
  Select,
  Spin,
  Tabs,
} from "antd";
import Modal from "antd/lib/modal/Modal";
import Input from "antd/lib/input/Input";
import moment from "moment";

const { Option } = Select;
function HolidayConfig(props) {
  const [systemConfig, setSystemConfig] = useState([]);
  useEffect(() => {
    getSystemConfig().then((response) => {
      setSystemConfig(response.data);
    });
  }, []);
  return (
    <>
      <Ascription config={systemConfig}></Ascription>
      <Holiday></Holiday>
    </>
  );
}

function Ascription(props) {
  const config = props.config;
  const [userInfo, setUserInfo] = useState([]);
  const [currentSystem, setCunrrentSystem] = useState();
  const [loading, setLoading] = useState();
  const freshData = () => {
    setLoading(true);
    Promise.all([...config.map((system) => getUserInfo(system.id))]).then(
      (res) => {
        const userInfoList = res.map((res) => {
          return { system: (res.data[0] || {}).systemId, data: res.data };
        });
        setUserInfo(userInfoList);
        setLoading(false);
      }
    );
  };
  useEffect(() => {
    freshData();
  }, [config]);
  const changeTab = (key) => {
    setCunrrentSystem(key);
  };
  return (
    <>
      <PageHeader
        className="site-page-header"
        title="Ascription"
        subTitle="Manage your Place of ownership"
      ></PageHeader>
      <Spin spinning={loading}>
        <Tabs
          type="card"
          onChange={changeTab}
          style={{ backgroundColor: "white" }}
          items={config.map((system) => {
            return {
              label: system.systemName,
              key: system.id,
              children: (
                <Row gutter={16}>
                  {userInfo
                    .filter((data) => data.system == system.id)
                    .map((data) => {
                      return (
                        <SpanWithSelect
                          key={data.system}
                          userInfo={data.data}
                        ></SpanWithSelect>
                      );
                    })}
                </Row>
              ),
            };
          })}
        ></Tabs>
      </Spin>
    </>
  );
}

function SpanWithSelect(props) {
  const user = props.userInfo;
  const changeUserInfo = (user, value) => {
    user.ascription = value;

    updateUserInfo(user).then((res) => {
      console.log(res);
    });
  };
  return (
    <>
      {user.map((userInfo) => {
        return (
          <Col span={4} key={userInfo.id}>
            <Row align="middle" justify="end">
              <Col>
                <span>{userInfo.userName}</span> :
              </Col>
              <Col>
                <Select
                  defaultValue={userInfo.ascription}
                  onChange={(value) => changeUserInfo(userInfo, value)}
                  style={{ width: 80 }}
                >
                  <Option value="CD">CD</Option>
                  <Option value="TC">TC</Option>
                  <Option value="US">US</Option>
                </Select>
              </Col>
            </Row>
          </Col>
        );
      })}
    </>
  );
}

function Holiday(props) {
  const [loading, setLoading] = useState();
  const [holidayList, setHolidayList] = useState([]);
  const [currentHoliday, setCurrentHoliday] = useState({});
  const [modalShow, setModalShow] = useState();
  const freshData = () => {
    setLoading(true);
    getHoliday().then((res) => {
      setHolidayList(res.data);
      setLoading(false);
    });
  };
  const editHoliday = (holiday) => {
    setCurrentHoliday(holiday);
    setModalShow(true);
  };
  const handleDeleteHoliday = (holiday) => {
    setLoading(true);
    deleteHoliday(holiday.id).then((res) => {
      freshData();
    });
  };
  const handleOk = () => {
    setModalShow(false);
    console.log(currentHoliday);
    setCurrentHoliday(currentHoliday);
    updateHoliday(currentHoliday).then((res) => {
      freshData();
    });
  };
  const handleCancel = () => {
    setModalShow(false);
    setCurrentHoliday({});
  };
  const handleCHange = (value) => {
    const newHolidayIngfo = { ...currentHoliday, ...value };
    setCurrentHoliday(newHolidayIngfo);
  };
  useEffect(() => {
    freshData();
  }, [currentHoliday]);
  return (
    <>
      <PageHeader
        className="site-page-header"
        title="Holiday"
        subTitle="Manage Holiday"
        extra={[
          <Button onClick={() => editHoliday({})} key="1" ghost type="primary">
            New
          </Button>,
        ]}
      ></PageHeader>
      <Spin spinning={loading}>
        <List
          style={{ backgroundColor: "white" }}
          dataSource={holidayList}
          renderItem={(item) => {
            return (
              <List.Item
                actions={[
                  <a key="list-loadmore-edit" onClick={() => editHoliday(item)}>
                    edit
                  </a>,
                  <a
                    key="list-loadmore-edit"
                    onClick={() => handleDeleteHoliday(item)}
                    style={{ color: "red" }}
                  >
                    delete
                  </a>,
                ]}
              >
                <Descriptions title={item.name} style={{ paddingLeft: 16 }}>
                  <Descriptions.Item label="Date">
                    {moment(item.dateInfo).format("MM-DD")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration">
                    {item.duration}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ascription">
                    {item.ascription}
                  </Descriptions.Item>
                </Descriptions>
              </List.Item>
            );
          }}
        ></List>
      </Spin>
      <Modal
        open={modalShow}
        title="Holiday"
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Row gutter={16} align="middle">
          <Col span={6} style={{ display: "flex", justifyContent: "end" }}>
            <span>Name</span>:
          </Col>
          <Col>
            <Input
              value={currentHoliday.name}
              onChange={(value) => handleCHange({ name: value.target.value })}
            ></Input>
          </Col>
        </Row>
        <Row gutter={16} align="middle">
          <Col span={6} style={{ display: "flex", justifyContent: "end" }}>
            <span>Date</span>:
          </Col>
          <Col>
            <DatePicker
              value={
                currentHoliday.dateInfo ? moment(currentHoliday.dateInfo) : null
              }
              format={"MM-DD"}
              onChange={(value) =>
                handleCHange({ dateInfo: value.format("yyyy-MM-DD") })
              }
            ></DatePicker>
          </Col>
        </Row>
        <Row gutter={16} align="middle">
          <Col span={6} style={{ display: "flex", justifyContent: "end" }}>
            <span>Duration</span>:
          </Col>
          <Col>
            <InputNumber
              value={currentHoliday.duration}
              onChange={(value) => handleCHange({ duration: value })}
            ></InputNumber>
          </Col>
        </Row>
        <Row gutter={16} align="middle">
          <Col span={6} style={{ display: "flex", justifyContent: "end" }}>
            <span>Ascription</span>:
          </Col>
          <Col>
            <Select
              value={currentHoliday.ascription}
              style={{ width: 80 }}
              onChange={(value) => handleCHange({ ascription: value })}
            >
              <Option value="CD">CD</Option>
              <Option value="TC">TC</Option>
              <Option value="US">US</Option>
            </Select>
          </Col>
        </Row>
      </Modal>
    </>
  );
}

export { HolidayConfig };
