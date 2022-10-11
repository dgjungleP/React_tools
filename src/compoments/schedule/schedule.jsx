import React, { useEffect, useState } from "react";
import "antd/dist/antd.css";
import "./schedule.css";
import { ScheduleBody } from "../body/schedule_body";
import { Layout, Tabs } from "antd";
import { getSystemConfig } from "../../server/project-service";
import { DailyBody } from "../body/daily_body";
const { Content } = Layout;
const { TabPane } = Tabs;

function SystemTab(props) {
  const [systemList, setSystemList] = useState([]);
  useEffect(
    () =>
      getSystemConfig().then((response) => {
        setSystemList(response.data);
      }),
    []
  );

  return (
    <>
      <Content className="card-container">
        <Tabs
          defaultActiveKey="1"
          type="card"
          items={systemList.map((system) => {
            return {
              label: system.systemName,
              key: system.id,
              children: props.template(system),
            };
          })}
        ></Tabs>
      </Content>
    </>
  );
}
function ShceduleTab(props) {
  return (
    <SystemTab
      template={(system) => {
        return <ScheduleBody systemConfig={system.config}></ScheduleBody>;
      }}
    ></SystemTab>
  );
}
function DailyTab(props) {
  return (
    <SystemTab
      template={(system) => {
        return <DailyBody systemConfig={system.config}></DailyBody>;
      }}
    ></SystemTab>
  );
}

export { ShceduleTab, DailyTab };
