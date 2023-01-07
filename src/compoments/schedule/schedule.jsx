import React, { useEffect, useState } from "react";
import "antd/dist/antd.css";
import "./schedule.css";
import { ScheduleBody } from "../body/schedule_body";
import { Layout, Tabs } from "antd";
import { getSystemConfig } from "../../server/project-service";
import { DailyBody } from "../body/daily_body";
const { Content } = Layout;

function SystemTab(props) {
  const filter = props.filter ? props.filter : (_data) => true;
  console.log(filter);
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
          items={systemList.filter(filter).map((system) => {
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
function ShceduleTab() {
  return (
    <SystemTab
      template={(system) => {
        return <ScheduleBody systemConfig={system.config}></ScheduleBody>;
      }}
      filter={(data) => !data.config.localTest}
    ></SystemTab>
  );
}
function DailyTab() {
  return (
    <SystemTab
      template={(system) => {
        return <DailyBody systemConfig={system.config}></DailyBody>;
      }}
      filter={(data) => !data.config.localTest}
    ></SystemTab>
  );
}

export { ShceduleTab, DailyTab };
