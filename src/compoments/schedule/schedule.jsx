import React from "react";
import "antd/dist/antd.css";
import "./schedule.css";
import { ScheduleBody } from "../body/body";
import { Layout, Tabs } from "antd";
import { getSystemConfig } from "../../server/project-service";
import { useEffect, useState } from "react/cjs/react.development";
const { Content } = Layout;
const { TabPane } = Tabs;

function ShceduleTab(props) {
  const [systemList, setSystemList] = useState([]);
  useEffect(() =>
    getSystemConfig().then((response) => {
      setSystemList(response.data);
    })
  );

  return (
    <>
      <Content className="card-container">
        <Tabs defaultActiveKey="1" type="card">
          {systemList.map((system) => {
            return (
              <TabPane tab={system.systemName} key={system.id}>
                <ScheduleBody
                  groups={system.config.groupList}
                  selectors={system.config.testerList}
                ></ScheduleBody>
              </TabPane>
            );
          })}
        </Tabs>
      </Content>
    </>
  );
}

export { ShceduleTab };
