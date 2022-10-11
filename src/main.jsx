import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "antd/dist/antd.css";
import "./main.css";
import { Layout, Menu } from "antd";
import {
  PieChartOutlined,
  SettingOutlined,
  CalendarOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  HashRouter,
} from "react-router-dom";
import { DailyTab, ShceduleTab } from "./compoments/schedule/schedule";
import { SystemConfig } from "./compoments/config/config";
import { HolidayConfig } from "./compoments/config/holiday";
const { Sider } = Layout;
function MyMenus(props) {
  const location = useLocation();
  const baseRoute = location.pathname.split("/")[1];
  const items = [
    {
      label: <Link to="/schedule">Schedule</Link>,
      key: "schedule",
      icon: <PieChartOutlined />,
    },
    {
      label: <Link to="/daily">Daily Launch</Link>,
      key: "daily",
      icon: <CalendarOutlined />,
    },
    {
      label: <Link to="/system">System Config</Link>,
      key: "system",
      icon: <SettingOutlined />,
    },
    {
      label: <Link to="/holiday">Holiday Config</Link>,
      key: "holiday",
      icon: <SmileOutlined />,
    },
  ];
  return (
    <>
      <Menu
        theme="light"
        defaultSelectedKeys={[baseRoute]}
        mode="inline"
        items={items}
      ></Menu>
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
            <Route path="/daily" element={<DailyTab></DailyTab>}></Route>
            <Route
              path="/system"
              element={<SystemConfig></SystemConfig>}
            ></Route>
            <Route
              path="/holiday"
              element={<HolidayConfig></HolidayConfig>}
            ></Route>
          </Routes>
        </Layout>
      </Layout>
    </React.StrictMode>
  </BrowserRouter>,
  document.getElementById("root")
);
