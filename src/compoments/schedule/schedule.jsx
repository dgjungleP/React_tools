import React, { useEffect, useState } from "react";
import "antd/dist/antd.css";
import "./schedule.css";
import { ScheduleBody } from "../body/schedule_body";
import { Layout, Tabs, Col, Row, Tooltip } from "antd";
import {
  getSystemConfig,
  getProject,
  getLocalShcedule,
  getDeveloperShcedule,
} from "../../server/project-service";
import { DailyBody } from "../body/daily_body";
import {
  DeveloperReleaseTable,
  LTReleaseTable,
  ReleaseTable,
} from "../gantt/gant";
const { Content } = Layout;

function SystemTab(props) {
  const filter = props.filter ? props.filter : (_data) => true;
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
            groupData={(tableData, year, month, selectors) =>
              groupData(tableData, year, month, selectors)
            }
            tryMergeDayoff={(data) => data}
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
      filter={(data) => !data.config.localTest && !data.config.developer}
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
            needOtherJob={true}
            getProject={(query) => getLocalShcedule(query)}
            makeData={(data) => makeLocalData(data)}
            groupData={(tableData, year, month, selectors) =>
              groupLocalData(tableData, year, month, selectors)
            }
            tryMergeDayoff={(data) => localTryMergeDayOff(data)}
            table={(props) => (
              <LTReleaseTable
                data={props.tableData}
                updateData={props.updateData}
                selectors={props.selectors}
                groups={props.groups}
                systemConfig={props.system}
                fresh={props.fresh}
              ></LTReleaseTable>
            )}
            extra={[
              {
                title: "Project#",
                dataIndex: "project",
                key: "project",
                width: 100,
                fixed: "left",
                align: "center",
                render: (text, record, index) => {
                  if (!record.needToolTip) {
                    return <>{record.project}</>;
                  }
                  let bodyTemp = (
                    <>
                      <Row>
                        <span>Project: {record.project}</span>
                      </Row>
                      <Row>
                        <span>ReleaseDate: {record.releaseDate}</span>
                      </Row>
                      <Row>
                        <span>LaunchDate: {record.launchDate}</span>
                      </Row>
                    </>
                  );
                  return (
                    <Tooltip
                      title={() => {
                        return <Col>{bodyTemp}</Col>;
                      }}
                    >
                      {record.project}
                    </Tooltip>
                  );
                },
              },
              {
                title: "Jira#",
                dataIndex: "jiraName",
                key: "jiraName",
                width: 200,
                fixed: "left",
                align: "center",
                render: (text, record, index) => {
                  return record.jiraName;
                },
              },
            ]}
          ></ScheduleBody>
        );
      }}
      filter={(data) => data.config.localTest}
    ></SystemTab>
  );
}
function DeveloperShceduleTab() {
  return (
    <SystemTab
      template={(system) => {
        return (
          <ScheduleBody
            systemConfig={system.config}
            needDayOff={false}
            needOtherJob={false}
            getProject={(query) => getDeveloperShcedule(query)}
            makeData={(data) => makeDeveloperData(data)}
            groupData={(tableData, year, month, selectors) =>
              groupDeveloperData(tableData, year, month, selectors)
            }
            tryMergeDayoff={(data) => localTryMergeDayOff(data)}
            table={(props) => (
              <DeveloperReleaseTable
                data={props.tableData}
                updateData={props.updateData}
                selectors={props.selectors}
                groups={props.groups}
                systemConfig={props.system}
                fresh={props.fresh}
              ></DeveloperReleaseTable>
            )}
            nameWidth={200}
            extra={[]}
          ></ScheduleBody>
        );
      }}
      filter={(data) => data.config.developer}
    ></SystemTab>
  );
}
function localTryMergeDayOff(data) {
  return data;
}
function DailyTab() {
  return (
    <SystemTab
      template={(system) => {
        return <DailyBody systemConfig={system.config}></DailyBody>;
      }}
      filter={(data) => !data.config.localTest && !data.config.developer}
    ></SystemTab>
  );
}
function makeData(json) {
  const result = [];
  let count;
  try {
    for (const item of json) {
      const pb = item.pb;
      const base = {};
      base.project = item.projectNumber;
      base.crl_pb = pb ? pb.map((data) => data.link).join(";") : "";
      base.version = pb ? pb?.map((data) => data.versionId) : "";
      base.status = item.status;
      base.projectName = pb ? pb[0].projectName : "";
      base.tester = item.tester;
      base.releaseDay = item.releaseDate;
      base.launchDay = item.launchDate;
      base.autoTestTag = item.autoTestTag;
      if (!pb) {
        console.log(item);
      }
      base.key =
        base.project +
        base.version +
        base.launchDay +
        base.projectName +
        base.tester +
        Math.random(100);
      base.group = item.group;
      base.division = item.division;
      base.domain = item.domain;
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
function groupData(tableData, year, month, selectors) {
  let count = selectors.length;
  const result = selectors.map((data, index) => ({
    name: data,
    dataList: [],
    index: index,
  }));
  const groupData = tableData.flatMap((data) =>
    (data.tester || "None").split(",").map((testerData) => {
      const newData = {};
      Object.assign(newData, data);
      newData.tester = testerData;
      return newData;
    })
  );
  try {
    groupData
      .filter((data) => data.tester && data.tester != "None")
      .forEach((data) => {
        const item = { name: data.tester };
        let tag = true;
        for (const resultItem of result) {
          if (resultItem.name == item.name) {
            const timeWindow = resultItem.dataList.map((dataItem) => {
              return getTime(dataItem, month, year);
            });
            const time = getTime(data, month, year);
            if (
              checkTime(timeWindow, time.start, time.end) ||
              resultItem.dataList.length == 0
            ) {
              resultItem.dataList.push(data);
              tag = false;
              break;
            }
          }
        }
        let index = (
          result.find((data) => data.name == item.name) || { index: -1 }
        ).index;
        if (tag) {
          item.dataList = [data];
          item.index = index > 0 ? index : ++count;
          result.push(item);
        }
      });
    for (const item of result) {
      item.dataList.sort((l, r) => {
        return l.releaseDay > r.releaseDay ? -1 : 1;
      });
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
      base.jiraName = item.jiraStory.name;
      base.status = item.status;
      base.projectName = item.jiraStory.projectName;
      base.localTester = item.localTester;
      base.tester = item.localTester;
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
      base.testingDayTime = item.testingDayTime;
      base.regressionTestDayTime = item.regressionTestDayTime;
      base.prepareDayTime = item.prepareDayTime;
      base.type = "local";

      result.push(base);
      count++;
    }
  } catch (e) {
    console.log(e);
  }
  return result;
}
function makeDeveloperData(json) {
  const result = [];
  try {
    for (const item of json) {
      const pb = item.pb;
      const base = {};
      base.project = item.projectNumber;
      base.crl_pb = pb ? pb.map((data) => data.link).join(";") : "";
      base.version = pb ? pb?.map((data) => data.versionId) : "";
      base.status = item.status;
      base.projectName = pb ? pb[0].projectName : "";
      base.localTester = item.localTester;
      base.tester = item.localTester;
      base.releaseDay = item.releaseDate;
      base.launchDay = item.launchDate;
      base.endTime = item.launchDate;
      base.startTime = item.releaseDate;
      base.developer = item.developer;
      base.key =
        base.project +
        base.launchDay +
        base.projectName +
        base.tester +
        Math.random(100);
      base.group = item.group;
      base.division = item.division;
      base.type = "developer";
      result.push(base);
    }
  } catch (e) {
    console.log(e);
  }
  return result;
}
function groupLocalData(tableData, year, month, selectors) {
  let count = selectors.length;
  // 非 dayoff
  let result = selectors.map((data, index) => ({
    name: data,
    dataList: [],
    index: index,
  }));
  const groupData = tableData.flatMap((data) =>
    (data.tester || "None").split(",").map((testerData) => {
      const newData = {};
      Object.assign(newData, data);
      newData.tester = testerData;
      return newData;
    })
  );
  groupData
    .filter(
      (data) => data.tester && data.tester != "None" && data.type !== "dayoff"
    )
    .forEach((data) => {
      const item = { name: data.tester };
      let tag = true;
      for (const resultItem of result) {
        if (resultItem.name == item.name) {
          if (resultItem.dataList.length == 0) {
            resultItem.dataList.push(data);
            tag = false;
            break;
          }
        }
      }
      let index = (
        result.find((data) => data.name == item.name) || { index: 0 }
      ).index;
      if (tag) {
        item.dataList = [data];
        item.index = index >= 0 ? index : ++count;
        result.push(item);
      }
    });
  // dayoff
  let dayOffNewArr = selectors.map((data, index) => ({
    name: data,
    dataList: [],
    index: index,
  }));
  groupData
    .filter(
      (data) => data.tester && data.tester != "None" && data.type === "dayoff"
    )
    .forEach((data) => {
      const item = { name: data.tester };
      let tag = true;
      for (const resultItem of dayOffNewArr) {
        if (resultItem.name == item.name) {
          const timeWindow = resultItem.dataList.map((dataItem) => {
            return getTime(dataItem, month, year);
          });
          const time = getTime(data, month, year);
          if (
            checkTime(timeWindow, time.start, time.end) ||
            resultItem.dataList.length == 0
          ) {
            resultItem.dataList.push(data);
            tag = false;
            break;
          }
        }
      }
      let index = (
        dayOffNewArr.find((data) => data.name == item.name) || { index: -1 }
      ).index;
      if (tag) {
        item.dataList = [data];
        item.index = index > 0 ? index : ++count;
        dayOffNewArr.push(item);
      }
    });
  // 两个数组合并，筛选出 name = none 的
  let newResult = (result || [])
    .concat((dayOffNewArr || []).filter((val) => val.dataList.length !== 0))
    .filter((item) => item.name !== "None");
  for (const item of newResult) {
    item.dataList.sort((l, r) => {
      return l.testDay > r.testDay ? -1 : 1;
    });
  }
  // 按照名字排序
  newResult = newResult.sort(compare("name"));
  return newResult;
}
function groupDeveloperData(tableData, year, month, selectors) {
  let count = selectors.length;
  let result = selectors.map((data, index) => ({
    name: data,
    dataList: [],
    index: index,
  }));
  const groupData = tableData.flatMap((data) =>
    (data.developer || "None").split(",").map((testerData) => {
      const newData = {};
      Object.assign(newData, data);
      newData.developer = testerData;
      return newData;
    })
  );
  try {
    groupData
      .filter((data) => data.developer && data.developer != "None")
      .forEach((data) => {
        const item = { name: data.developer };
        let tag = true;
        for (const resultItem of result) {
          if (resultItem.name == item.name) {
            const timeWindow = resultItem.dataList.map((dataItem) => {
              return getSimpleTime(
                getTimeDateYearMonth(dataItem.startTime),
                getTimeDateYearMonth(dataItem.endTime),
                month,
                year
              );
            });
            const time = getSimpleTime(
              getTimeDateYearMonth(data.startTime),
              getTimeDateYearMonth(data.endTime),
              month,
              year
            );
            if (
              checkTime(timeWindow, time.start, time.end) ||
              resultItem.dataList.length == 0
            ) {
              resultItem.dataList.push(data);
              tag = false;
              break;
            }
          }
        }
        let index = (
          result.find((data) => data.name == item.name) || { index: -1 }
        ).index;
        if (tag) {
          item.dataList = [data];
          item.index = index > 0 ? index : ++count;
          result.push(item);
        }
      });
    for (const item of result) {
      item.dataList.sort((l, r) => {
        return l.startTime > r.startTime ? -1 : 1;
      });
    }
  } catch (e) {
    console.log(e);
  }
  // 按照名字排序
  result = result.sort(compare("name"));
  return result;
}
function compare(prop) {
  return function (obj1, obj2) {
    var val1 = obj1[prop];
    var val2 = obj2[prop];
    if (val1 < val2) {
      return -1;
    } else if (val1 > val2) {
      return 1;
    } else {
      return 0;
    }
  };
}

function getTimeDateYearMonth(date) {
  return {
    date: getDateNumber(date),
    month: getMothNumber(date),
    year: getYearNumber(date),
  };
}
function getSimpleTime(startTime, endTime, month, year) {
  let start = startTime.date;
  let startMoth = startTime.month;
  let startYear = startTime.year;
  let end = endTime.date;
  let endMoth = endTime.month;
  let endYear = endTime.year;
  let overload = false;
  if (startMoth < parseInt(month) || startYear < parseInt(year)) {
    start = 1;
    overload = true;
  }
  if (endMoth > parseInt(month) || endYear > parseInt(year)) {
    end = getDays(year, month) + 1;
    overload = true;
  }
  if (endMoth == parseInt(month) && endYear == parseInt(year)) {
    overload = false;
  }
  return { start, end, overload };
}

function getTime(dataItem, month, year) {
  return getSimpleTime(
    getTimeDateYearMonth(dataItem.releaseDay),
    getTimeDateYearMonth(dataItem.launchDay),
    month,
    year
  );
}
function checkTime(timeWindow, start, end) {
  const timeArray = [];
  timeWindow.forEach((time) => {
    for (let i = time.start; i <= time.end; i++) {
      timeArray.push(i);
    }
  });
  const currentTimeArray = [];
  for (let i = start; i <= end; i++) {
    currentTimeArray.push(i);
  }
  const intersection = timeArray.filter((data) => {
    return currentTimeArray.indexOf(data) > -1;
  });
  return intersection.length <= 0;
}
function getDateNumber(time) {
  return parseInt(time.split("-")[2]);
}
function getYearNumber(time) {
  return parseInt(time.split("-")[0]);
}
function getMothNumber(time) {
  return parseInt(time.split("-")[1]);
}
function getDays(year, month) {
  month = parseInt(month, 10);
  var d = new Date(year, month, 0);
  return d.getDate();
}
export { ShceduleTab, DailyTab, LTShceduleTab, DeveloperShceduleTab };
