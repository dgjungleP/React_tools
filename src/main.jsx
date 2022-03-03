import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "antd/dist/antd.css";
import "./main.css";
import { ScheduleBody } from "./compoments/body/body";
import { Layout, Menu, Tabs } from "antd";
import { PieChartOutlined, SettingOutlined } from "@ant-design/icons";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
const { Sider, Content } = Layout;
const { TabPane } = Tabs;
function MyMenus(props) {
  return (
    <>
      <Menu theme="light" defaultSelectedKeys={["1"]} mode="inline">
        <Menu.Item key="1" icon={<PieChartOutlined />}>
          <Link to="/schedule">Schedule</Link>
        </Menu.Item>

        <Menu.Item key="2" icon={<SettingOutlined />}>
          <Link to="/system">System Config</Link>
        </Menu.Item>
      </Menu>
    </>
  );
}
function SystemConfig(props) {
  return <>hello</>;
}
function ShcedulTab(props) {
  return (
    <>
      <Content className="card-container">
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Tab 1" key="1">
            <ScheduleBody></ScheduleBody>
          </TabPane>
          <TabPane tab="Tab 2" key="2">
            <ScheduleBody></ScheduleBody>
          </TabPane>
          <TabPane tab="Tab 3" key="3">
            <ScheduleBody></ScheduleBody>
          </TabPane>
        </Tabs>
      </Content>
    </>
  );
}
ReactDOM.render(
  <BrowserRouter>
    <React.StrictMode>
      <Layout>
        <Sider
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
          }}
          theme="light"
        >
          <MyMenus></MyMenus>
        </Sider>
        <Layout style={{ marginLeft: 200 }}>
          <Routes>
            <Route path="/" element={<ShcedulTab></ShcedulTab>}></Route>
            <Route path="/schedule" element={<ShcedulTab></ShcedulTab>}></Route>
            <Route
              path="/system"
              element={<SystemConfig></SystemConfig>}
            ></Route>
          </Routes>
        </Layout>
      </Layout>
    </React.StrictMode>
  </BrowserRouter>,
  document.getElementById("root")
);
