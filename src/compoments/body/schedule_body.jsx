import React, { useState, useEffect } from "react";
import {
  DatePicker,
  Switch,
  Select,
  Row,
  Col,
  Spin,
  Button,
  Modal,
  Input,
  message,
  Divider,
} from "antd";
import "antd/dist/antd.css";
import "./schedule_body.css";
import { Gantt } from "../gantt/gant";
import {
  getDayoff,
  getProject,
  getOtherJob,
  updateDayoff,
  updateOtherJob,
} from "../../server/project-service";
import moment from "moment";
const { Option } = Select;
const yearMonthFormatt = "yyyy-MM";
const { RangePicker } = DatePicker;
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
  const [otherJobTable, updateOtherJobTable] = useState([]);

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
      query.system = systemConfig.systemName;
      query.queryLink = systemConfig.dataLink;
      query.hasHistory = systemConfig.hasHistory;
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
    Promise.all([getDayoff(currentQuery), getOtherJob(currentQuery)]).then(
      ([newDayoffTableData, newOtherJobTableData]) => {
        newDayoffTableData = newDayoffTableData.data.map((dayoff, index) => {
          dayoff.key = dayoff.id;
          dayoff.index = index + 1;
          dayoff.name = dayoff.tester;
          dayoff.releaseDay = dayoff.startTime;
          dayoff.launchDay = dayoff.endTime;
          dayoff.type = "dayoff";
          dayoff.project = "休";
          return dayoff;
        });
        newOtherJobTableData = newOtherJobTableData.data.map(
          (otherJob, index) => {
            otherJob.key = otherJob.id;
            otherJob.index = index + 1;
            otherJob.name = otherJob.user;
            otherJob.tester = otherJob.user;
            otherJob.releaseDay = otherJob.startTime;
            otherJob.launchDay = otherJob.endTime;
            otherJob.type = "otherJob";
            otherJob.project = otherJob.jobName;
            return otherJob;
          }
        );
        updateDayoffTable(newDayoffTableData);
        updateOtherJobTable(newOtherJobTableData);

        const tableDataMerge = [
          ...newTableData,
          ...newDayoffTableData,
          ...newOtherJobTableData,
        ];
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
      }
    );
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
        system={systemConfig}
        tableData={tableData}
        updateData={chanDage}
      ></Header>
      <Spin spinning={loading}>
        <Gantt
          query={query}
          showGantt={showGantt}
          tableData={tableData}
          ganttTableData={ganttTableData}
          dayoffData={dayoffTable}
          otherJobTable={otherJobTable}
          updateData={chanDage}
          selectors={selectors}
          simple={simple}
          system={systemConfig}
          groups={groups}
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

  const freshData = () => {
    props.updateData(props.tableData);
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
      <Divider>Operations</Divider>
      <Row gutter={15} justify="left" style={{ marginLeft: 40 }} align="start">
        <Col>
          <DayOffRequestClick
            freshData={freshData}
            system={props.system}
          ></DayOffRequestClick>
        </Col>
        <Col>
          <OtherJobClick
            freshData={freshData}
            system={props.system}
          ></OtherJobClick>
        </Col>
      </Row>
      <Divider></Divider>
    </>
  );
}

function OtherJobClick(props) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        Request Other Job
      </Button>

      <OtherJobRequest
        visible={visible}
        changeVisible={setVisible}
        freshData={props.freshData}
        system={props.system}
      ></OtherJobRequest>
    </>
  );
}

function OtherJobRequest(props) {
  const systemConfig = props.system;
  const [user, setUser] = useState();
  const [time, setTime] = useState();
  const [jobName, setJobName] = useState();
  const [system, setSystem] = useState(systemConfig.systemName);

  const checkValid = () => {
    if (!user) {
      message.warning("Please select user");
      return true;
    }
    if (!time) {
      message.warning("Please select time");
      return true;
    }
    return false;
  };
  const handleSumbit = () => {
    if (checkValid()) {
      return;
    }
    const request = { user: user, systemName: system, jobName: jobName };
    request.startTime = time[0].format("YYYY-MM-DD");
    request.endTime = time[1].format("YYYY-MM-DD");
    request.days = time[1].diff(time[0], "days") + 1;
    updateOtherJob([request]).then((response) => {
      props.changeVisible(false);
      message.success("Create Other Job success!");
      setTimeout(() => {
        props.freshData();
        cleanStatus();
      }, 200);
    });
  };
  const handleCancel = () => {
    props.changeVisible(false);
    cleanStatus();
  };
  const cleanStatus = () => {
    setTime();
    setUser();
    setJobName();
  };
  return (
    <>
      <Modal
        title="Request Other Job"
        centered
        visible={props.visible}
        onOk={handleSumbit}
        onCancel={handleCancel}
        width={500}
      >
        <Col>
          <Row>
            <span>User:</span>
            <Select
              style={{ width: "100%" }}
              value={user}
              onChange={(value) => setUser(value)}
            >
              {systemConfig.testerList.map((tester) => {
                return (
                  <Option value={tester} key={tester}>
                    {tester}
                  </Option>
                );
              })}
            </Select>
          </Row>
          <Row>
            <span>Job Name:</span>
            <Input
              style={{ width: "100%" }}
              value={jobName}
              onChange={(value) => {
                setJobName(value.target.value);
              }}
            ></Input>
          </Row>
          <Row>
            <span>Time:</span>
            <RangePicker
              style={{ width: "100%" }}
              value={time}
              onChange={(value) => setTime(value)}
            ></RangePicker>
          </Row>
          <Row>
            <span>System:</span>
            <Input style={{ width: "100%" }} value={system} disabled></Input>
          </Row>
        </Col>
      </Modal>
    </>
  );
}

function DayOffRequestClick(props) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        Request Dayoff
      </Button>

      <DayOffRequest
        visible={visible}
        changeVisible={setVisible}
        freshData={props.freshData}
        system={props.system}
      ></DayOffRequest>
    </>
  );
}
function DayOffRequest(props) {
  const systemConfig = props.system;
  const [user, setUser] = useState();
  const [time, setTime] = useState();
  const [system, setSystem] = useState(systemConfig.systemName);

  const checkValid = () => {
    if (!user) {
      message.warning("Please select user");
      return true;
    }
    if (!time) {
      message.warning("Please select time");
      return true;
    }
    return false;
  };
  const handleSumbit = () => {
    if (checkValid()) {
      return;
    }
    const request = { tester: user, systemName: system };
    request.startTime = time[0].format("YYYY-MM-DD");
    request.endTime = time[1].format("YYYY-MM-DD");
    request.days = time[1].diff(time[0], "days") + 1;
    updateDayoff([request]).then((response) => {
      props.changeVisible(false);
      message.success("Create Day off success!");
      setTimeout(() => {
        props.freshData();
        cleanStatus();
      }, 200);
    });
  };
  const handleCancel = () => {
    props.changeVisible(false);
    cleanStatus();
  };
  const cleanStatus = () => {
    setTime();
    setUser();
  };
  return (
    <>
      <Modal
        title="Request Dayoff"
        centered
        visible={props.visible}
        onOk={handleSumbit}
        onCancel={handleCancel}
        width={500}
      >
        <Col>
          <Row>
            <span>User:</span>
            <Select
              style={{ width: "100%" }}
              value={user}
              onChange={(value) => setUser(value)}
            >
              {systemConfig.testerList.map((tester) => {
                return (
                  <Option value={tester} key={tester}>
                    {tester}
                  </Option>
                );
              })}
            </Select>
          </Row>
          <Row>
            <span>Time:</span>
            <RangePicker
              style={{ width: "100%" }}
              value={time}
              onChange={(value) => setTime(value)}
            ></RangePicker>
          </Row>
          <Row>
            <span>System:</span>
            <Input style={{ width: "100%" }} value={system} disabled></Input>
          </Row>
        </Col>
      </Modal>
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
  let startMoth = getMothNumber(dataItem.releaseDay);
  let startYear = getYearNumber(dataItem.releaseDay);
  let endMoth = getMothNumber(dataItem.launchDay);
  let endYear = getYearNumber(dataItem.launchDay);

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
function makeLine(dataList, result, month, year) {
  dataList.forEach((data) => {
    const missCol = [];
    const { start, end, overload } = getTime(data, month, year);
    for (let i = start + 1; i < end; i++) {
      missCol.push(i);
    }

    const memo = {};
    memo.user = data.tester;
    memo.key = data.type;
    if (data.type && data.type == "dayoff") {
      memo.type = "休假";
      memo.startTime = data.releaseDay.split(" ")[0];
      memo.days = end - start + 1;
      result[start] =
        data.project +
        "-Dayoff-" +
        (end - start + (overload ? 0 : 1)) +
        "-&" +
        JSON.stringify(memo);
      if (start != end) {
        missCol.push(end);
      }
    } else if (data.type == "otherJob") {
      memo.type = "其他";
      memo.startTime = data.releaseDay.split(" ")[0];
      memo.endTime = data.launchDay.split(" ")[0];
      memo.jobName = data.jobName;
      result[start] =
        data.project +
        "-JobTime-" +
        (end - start + (overload ? 0 : 1)) +
        "-&" +
        JSON.stringify(memo);
      if (start != end) {
        missCol.push(end);
      }
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
        base.tester;
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

export { ScheduleBody };
