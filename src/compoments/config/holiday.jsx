import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import "./holiday.css";

import {
  getSystemConfig,
  getHoliday,
  getUserInfo,
  updateHoliday,
  updateUserInfo,
} from "../../server/project-service";
import { Col, PageHeader, Row, Select, Tabs } from "antd";
import { func } from "prop-types";
import { loadConfigFromFile } from "vite";
const { TabPane } = Tabs;

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
  useEffect(() => {
    Promise.all([...config.map((system) => getUserInfo(system.id))]).then(
      (res) => {
        const userInfoList = res.map((res) => {
          return { system: (res.data[0] || {}).systemId, data: res.data };
        });
        setUserInfo(userInfoList);
      }
    );
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
      <Tabs
        type="card"
        onChange={changeTab}
        style={{ backgroundColor: "white" }}
      >
        {config.map((system) => {
          return (
            <TabPane tab={system.systemName} key={system.id}>
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
            </TabPane>
          );
        })}
      </Tabs>
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
  return (
    <>
      <PageHeader
        className="site-page-header"
        title="Holiday"
        subTitle="Manage Holiday"
      ></PageHeader>
    </>
  );
}

export { HolidayConfig };
