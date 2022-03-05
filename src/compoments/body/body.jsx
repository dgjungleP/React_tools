import React, { useState, useEffect, useContext } from "react";
import { DatePicker, Switch, Select, Row, Col, Spin } from "antd";
import "antd/dist/antd.css";
import "./body.css";
import { Gantt } from "../gantt/gant";
import { getDayoff, getProject } from "../../server/project-service";
import moment from "moment";
const { Option } = Select;
const yearMonthFormatt = "yyyy-MM";
function ScheduleBody(props) {
  const date = new Date();
  const systemConfig = props.systemConfig;
  const [groups, setGroup] = useState(systemConfig.groupList);
  const [selectors, setSelectors] = useState(systemConfig.testerList);
  const [query, updateQuery] = useState({
    history: false,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    group: groups,
    system: systemConfig.systemName,
  });

  const [showGantt, setShowGant] = useState(false);
  const [tableData, updateTableData] = useState([]);
  const [ganttTableData, updateganttTableData] = useState([]);
  const [loading, updateLoading] = useState(false);
  const [simple, updateSimple] = useState(false);
  const [dayoffTable, updateDayoffTable] = useState([]);
  const chanegQuery = (parmas) => {
    const newQuery = JSON.parse(JSON.stringify(query));
    Object.assign(newQuery, parmas);
    newQuery.history = moment(new Date()).isAfter(
      newQuery.year + "-" + newQuery.month + "-01",
      "month"
    );
    updateQuery(newQuery);
    freashData(newQuery);
  };
  const freashData = (query) => {
    updateLoading(true);
    query = query ? query : {};
    if (check(query)) {
      getProject(query)
        .then((response) => {
          setShowGant(true);
          flushDate(response.data, query);
        })
        .catch(() => {
          setShowGant(false);
          updateLoading(false);
        });
    } else {
      setShowGant(false);
      updateLoading(false);
    }
  };
  const chanDage = (newTableData, currentQuery) => {
    currentQuery = currentQuery ? currentQuery : query;
    updateLoading(true);
    getDayoff(currentQuery).then((response) => {
      let newDayoffTableData = response.data;
      newDayoffTableData = newDayoffTableData.map((dayoff, index) => {
        dayoff.key = dayoff.id;
        dayoff.index = index + 1;
        dayoff.name = dayoff.tester;
        dayoff.releaseDay = dayoff.startTime;
        dayoff.launchDay = dayoff.endTime;
        dayoff.type = "dayoff";
        dayoff.project = "休";
        return dayoff;
      });
      const tableDataMerge = [...newTableData, ...newDayoffTableData];
      updateDayoffTable(newDayoffTableData);
      const newGanttData = makeGanttTableData(
        groupData(
          tableDataMerge,
          currentQuery.year,
          currentQuery.month,
          selectors
        ),
        currentQuery.month,
        currentQuery.year
      );
      updateganttTableData(newGanttData);
      updateTableData(newTableData);
      updateLoading(false);
    });
  };
  const flushDate = (responseData, query) => {
    const newTableData = makeData(responseData);
    chanDage(newTableData, query);
  };
  useEffect(() => {
    freashData(query);
  }, [query]);
  return (
    <>
      <Header
        onQueryChange={chanegQuery}
        query={query}
        onSimpleChange={updateSimple}
        groups={groups}
      ></Header>
      <Spin spinning={loading}>
        <Gantt
          query={query}
          showGantt={showGantt}
          tableData={tableData}
          ganttTableData={ganttTableData}
          dayoffData={dayoffTable}
          updateData={chanDage}
          selectors={selectors}
          simple={simple}
          system={systemConfig}
        ></Gantt>
      </Spin>
    </>
  );
}

function Header(props) {
  const query = props.query;

  const [time, updateTime] = useState({ year: query.year, month: query.month });
  const [group, updateGroup] = useState([...query.group]);
  const [simple, updatSimple] = useState(false);
  const onTimeChange = (_, dateString) => {
    const newTime = JSON.parse(JSON.stringify(time));
    newTime.year = parseInt(dateString.split("-")[0]);
    newTime.month = parseInt(dateString.split("-")[1]);
    updateTime(newTime);
    props.onQueryChange(newTime);
  };
  const onHistoryChange = () => {
    props.onSimpleChange(!simple);
    updatSimple(!simple);
    props.onQueryChange({ simple: !simple });
  };
  const onGroupChange = (value) => {
    updateGroup(value);
    props.onQueryChange({ group: value });
  };
  return (
    <>
      <Row
        gutter={15}
        justify="center"
        style={{ marginTop: 10 }}
        align="center"
      >
        <Col>
          <span>Time:</span>{" "}
          <DatePicker
            defaultValue={moment(
              time.year + "-" + time.month,
              yearMonthFormatt
            )}
            onChange={onTimeChange}
            picker="month"
          />
        </Col>
        <Col>
          <span>Group:</span>{" "}
          <Select
            defaultValue={group}
            style={{ width: 500 }}
            onChange={onGroupChange}
            mode="multiple"
          >
            {props.groups.map((data) => {
              return (
                <Option value={data} key={data}>
                  {data}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col>
          <span>Simple:</span>{" "}
          <Switch checked={simple} onChange={onHistoryChange} />
        </Col>
      </Row>
    </>
  );
}

//Method
function check(query) {
  return (
    Number.isInteger(query.year) &&
    Number.isInteger(query.month) &&
    query.history != undefined &&
    query.group != undefined
  );
}
function getDays(year, month) {
  month = parseInt(month, 10);
  var d = new Date(year, month, 0);
  return d.getDate();
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
  return result;
}
function getTime(dataItem, month, year) {
  let start = getDateNumber(dataItem.releaseDay);
  let end = getDateNumber(dataItem.launchDay);
  if (
    getMothNumber(dataItem.releaseDay) < parseInt(month) ||
    getYearNumber(dataItem.releaseDay) < parseInt(year)
  ) {
    start = 1;
  }
  if (
    getMothNumber(dataItem.launchDay) > parseInt(month) ||
    getYearNumber(dataItem.launchDay) > parseInt(year)
  ) {
    end = getDays(year, month) + 1;
  }
  return { start, end };
}

function makeGanttTableData(tableDataGroup, month, year) {
  const ganttTableData = [];
  tableDataGroup
    .filter((data) => data.name && data.name != "None")
    .sort((l, r) => l.index - r.index)
    .forEach((data, index) => {
      const result = { key: index, rowSpan: 1, missCol: [], dayCount: 0 };
      result.name = data.name;
      makeLine(data.dataList, result, month, year);
      if (
        ganttTableData[index - 1] &&
        ganttTableData[index - 1].name == result.name
      ) {
        result.pre = ganttTableData[index - 1].pre;
        if (result.pre == undefined) {
          result.pre = index - 1;
        }
        result.miss = true;
        ganttTableData[result.pre].rowSpan += 1;
        ganttTableData[result.pre].dayCount += result.dayCount;
      }
      ganttTableData.push(result);
    });
  return ganttTableData;
}
function checkTime(timeWindow, start, end) {
  const timeArray = [];
  timeWindow.forEach((time) => {
    for (let i = time.start; i <= time.end; i++) {
      timeArray.push(i);
    }
  });
  timeArray.sort((l, r) => l - r);
  const result =
    timeArray.findIndex((data) => data == start) < 0 &&
    timeArray.findIndex((data) => data == end) < 0 &&
    (start > timeArray[timeArray.length - 1] || end < timeArray[0]);
  return result;
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
function makeLine(dataList, result, month, year) {
  dataList.forEach((data) => {
    const missCol = [];
    const { start, end } = getTime(data, month, year);
    for (let i = start + 1; i < end; i++) {
      missCol.push(i);
    }
    const memo = {};
    memo.user = data.tester;
    if (data.type && data.type == "dayoff") {
      memo.type = "休假";
      memo.startTime = data.releaseDay.split(" ")[0];
      memo.days = end - start + 1;
      result[start] =
        data.project +
        "-Dayoff-" +
        (end - start + 1) +
        "-&" +
        JSON.stringify(memo);
      if (start != end) {
        missCol.push(end);
      }
      // result[end] = data.project + "-Dayoff-1";
    } else {
      memo.type = "项目";
      memo.project = data.project;
      memo.startTime = data.releaseDay;
      memo.endTime = data.launchDay;
      result[start] =
        data.project +
        "-Release-" +
        (end - start) +
        "-&" +
        JSON.stringify(memo);
      result[end] = data.project + "-Launch-1" + "-&" + JSON.stringify(memo);
      result.dayCount += end - start + 1;
    }
    missCol.forEach((item) => {
      result.missCol.push(item);
    });
  });
}

function makeData(json) {
  const result = [];
  let count = 0;
  for (const item of json) {
    const base = {};
    base.project = item.projectNumber;
    base.crl_pb = item.pb[0].link;
    base.version = item.pb[0].versionId;
    base.status = item.status;
    base.projectName = item.pb[0].projectName;
    // base.tester = count % 2 == 0 ? "Tina" : "Vic";
    base.tester = item.tester;
    base.releaseDay = item.releaseDate;
    base.launchDay = item.launchDate;
    base.key = base.project + base.version;
    result.push(base);
    count++;
  }
  return result;
}

export { ScheduleBody };
