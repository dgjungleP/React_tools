import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "antd/dist/antd.css";
import "./main.css";
import { Layout, Menu } from "antd";
import { PieChartOutlined, SettingOutlined } from "@ant-design/icons";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { ShceduleTab } from "./compoments/schedule/schedule";
import { SystemConfig } from "./compoments/config/config";
const { Sider } = Layout;
function MyMenus(props) {
  const location = useLocation();
  const baseRoute = location.pathname.split("/")[1];
  return (
    <>
      <Menu theme="light" defaultSelectedKeys={[baseRoute]} mode="inline">
        <Menu.Item key="schedule" icon={<PieChartOutlined />}>
          <Link to="/schedule">Schedule</Link>
        </Menu.Item>

        <Menu.Item key="system" icon={<SettingOutlined />}>
          <Link to="/system">System Config</Link>
        </Menu.Item>
      </Menu>
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
        <Layout style={{ marginLeft: 200, padding: "0 24px 24px" }}>
          <Routes>
            <Route path="/" element={<ShceduleTab></ShceduleTab>}></Route>
            <Route
              path="/schedule"
              element={<ShceduleTab></ShceduleTab>}
            ></Route>
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
