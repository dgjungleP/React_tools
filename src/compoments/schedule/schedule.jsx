import React from "react";
import "antd/dist/antd.css";
import "./schedule.css";
import { ScheduleBody } from "../body/body";
import { Layout, Tabs } from "antd";
const { Content } = Layout;
const { TabPane } = Tabs;

function ShceduleTab(props) {
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

export { ShceduleTab };
