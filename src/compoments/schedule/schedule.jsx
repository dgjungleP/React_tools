import React, { useEffect, useState } from "react";
import "antd/dist/antd.css";
import "./schedule.css";
import { ScheduleBody } from "../body/schedule_body";
import { Layout, Tabs } from "antd";
import {
  getSystemConfig,
  getProject,
  getLocalShcedule,
} from "../../server/project-service";
import { DailyBody } from "../body/daily_body";
import { LTReleaseTable, ReleaseTable } from "../gantt/gant";
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
        return (
          <ScheduleBody
            systemConfig={system.config}
            needDayOff={true}
            needOtherJob={true}
            getProject={(query) => getProject(query)}
            makeData={(data) => makeData(data)}
            table={(props) => (
              <ReleaseTable
                data={props.tableData}
                updateData={props.updateData}
                selectors={props.selectors}
                groups={props.groups}
                systemConfig={props.system}
              ></ReleaseTable>
            )}
          ></ScheduleBody>
        );
      }}
      filter={(data) => !data.config.localTest}
    ></SystemTab>
  );
}
function LTShceduleTab() {
  return (
    <SystemTab
      template={(system) => {
        return (
          <ScheduleBody
            systemConfig={system.config}
            needDayOff={true}
            getProject={(query) => getLocalShcedule(query)}
            makeData={(data) => makeLocalData(data)}
            table={(props) => (
              <LTReleaseTable
                data={props.tableData}
                updateData={props.updateData}
                selectors={props.selectors}
                groups={props.groups}
                systemConfig={props.system}
              ></LTReleaseTable>
            )}
          ></ScheduleBody>
        );
      }}
      filter={(data) => data.config.localTest}
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
function makeData(json) {
  const result = [];
  let count = 0;
  try {
    for (const item of json) {
      const base = {};
      base.project = item.projectNumber;
      base.crl_pb = item.pb.map((data) => data.link).join(";");
      base.version = item.pb.map((data) => data.versionId);
      base.status = item.status;
      base.projectName = item.pb[0].projectName;
      base.tester = item.tester;
      base.releaseDay = item.releaseDate;
      base.launchDay = item.launchDate;
      base.key =
        base.project +
        base.version +
        base.launchDay +
        base.projectName +
        base.tester +
        Math.random(100);
      base.group = item.group;
      base.division = item.division;
      base.usedTime = item.usedTime;
      base.actuallyDoneTime = item.actuallyDoneTime;
      result.push(base);
      count++;
    }
  } catch (e) {
    console.log(e);
  }
  return result;
}
function makeLocalData(json) {
  const result = [];
  let count = 0;
  try {
    for (const item of json) {
      const base = {};
      base.project = item.projectNumber;
      base.crl_pb = item.jiraStory.link;
      base.status = item.status;
      base.projectName = item.jiraStory.projectName;
      base.localTester = item.localTester;
      base.releaseDay = item.releaseDate;
      base.launchDay = item.launchDate;
      base.prepareDay = item.prepareDay;
      base.testingDay = item.testingDay;
      base.regressionTestDay = item.regressionTestDay;
      base.testDay = item.testDay;
      base.key =
        base.project +
        base.launchDay +
        base.projectName +
        base.tester +
        Math.random(100);
      base.group = item.group;
      base.division = item.division;
      result.push(base);
      count++;
    }
  } catch (e) {
    console.log(e);
  }
  return result;
}

export { ShceduleTab, DailyTab, LTShceduleTab };
