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
  notification,
  Tooltip,
} from "antd";
import "antd/dist/antd.css";
import "./schedule_body.css";
import { Gantt } from "../gantt/gant";
import { ReloadOutlined } from "@ant-design/icons";
import {
  getDayoff,
  getOtherJob,
  updateDayoff,
  updateOtherJob,
  freshServiceCache,
} from "../../server/project-service";
import moment from "moment";
const { Option } = Select;
const yearMonthFormatt = "yyyy-MM";
const { RangePicker } = DatePicker;
function ScheduleBody(props) {
  const date = new Date();
  const systemConfig = props.systemConfig;
  const getProject = props.getProject;
  const makeData = props.makeData;
  const groupData = props.groupData;
  const [groups, setGroup] = useState(systemConfig.groupList);
  const [selectors, setSelectors] = useState(systemConfig.testerList);
  const [query, updateQuery] = useState({
    history: false,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    group: groups,
    system: systemConfig.systemName,
  });
  const table = props.table ? props.table : () => {};
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
    // freshData(newQuery);
  };
  const freshData = (query) => {
    updateLoading(true);
    query = query ? query : {};
    console.log(query);
    if (check(query)) {
      query.system = systemConfig.systemName;
      query.queryLink = systemConfig.dataLink;
      query.hasHistory = systemConfig.hasHistory;
      changeData(query);
    } else {
      setShowGant(false);
      updateLoading(false);
    }
  };
  const changeData = (_newTableData, currentQuery) => {
    currentQuery = currentQuery ? currentQuery : query;
    updateLoading(true);
    Promise.all([
      getDayoff(currentQuery),
      getOtherJob(currentQuery),
      getProject(currentQuery),
    ])
      .then(([newDayoffTableData, newOtherJobTableData, newTableDataQuery]) => {
        newDayoffTableData = newDayoffTableData.data.map((dayoff, index) => {
          dayoff.index = index + 1;
          dayoff.name = dayoff.tester;
          dayoff.releaseDay = dayoff.startTime;
          dayoff.launchDay = dayoff.endTime;
          dayoff.type = "dayoff";
          dayoff.project = "休";
          dayoff.key =
            dayoff.id + dayoff.name + dayoff.releaseDay + dayoff.launchDay;
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
            otherJob.key =
              otherJob.id +
              otherJob.name +
              otherJob.tester +
              otherJob.launchDay;
            return otherJob;
          }
        );
        updateDayoffTable(newDayoffTableData);
        updateOtherJobTable(newOtherJobTableData);
        const newTableData = makeData(newTableDataQuery.data);
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
      })
      .then(() => {
        setShowGant(true);
      })
      .catch(() => {
        setShowGant(false);
        updateLoading(false);
      });
  };

  useEffect(() => {
    freshData(query);
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
        updateData={changeData}
        needDayOff={props.needDayOff}
        needOtherJob={props.needOtherJob}
      ></Header>
      <Spin spinning={loading}>
        <Gantt
          query={query}
          showGantt={showGantt}
          tableData={tableData}
          ganttTableData={ganttTableData}
          dayoffData={dayoffTable}
          otherJobTable={otherJobTable}
          updateData={changeData}
          selectors={selectors}
          simple={simple}
          system={systemConfig}
          groups={groups}
          fresh={() => freshData(query)}
          table={table}
          needDayOff={props.needDayOff}
          needOtherJob={props.needOtherJob}
        ></Gantt>
      </Spin>
    </>
  );
}

function Header(props) {
  const query = props.query;
  const needDayOff = props.needDayOff;
  const needOtherJob = props.needOtherJob;
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
    props.updateData([props.tableData]);
  };
  const freshCache = () => {
    freshServiceCache().then(() => {
      freshData();
      notification.open({
        message: "Fresh Chache",
        description: "You success clean the chache ",
      });
    });
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
          <span>Simple:</span>
          <Switch checked={simple} onChange={onHistoryChange} />
        </Col>
        <Tooltip title="Fresh cache for actrual data">
          <Button
            type="primary"
            onClick={freshCache}
            style={{ marginRight: "auto" }}
            shape="circle"
          >
            <ReloadOutlined />
          </Button>
        </Tooltip>
      </Row>
      <Divider>Operations</Divider>
      {(needDayOff || needOtherJob) && (
        <Row
          gutter={15}
          justify="left"
          style={{ marginLeft: 40 }}
          align="start"
        >
          {needDayOff && (
            <Col>
              <DayOffRequestClick
                freshData={freshData}
                system={props.system}
              ></DayOffRequestClick>
            </Col>
          )}
          {needOtherJob && (
            <Col>
              <OtherJobClick
                freshData={freshData}
                system={props.system}
              ></OtherJobClick>
            </Col>
          )}
        </Row>
      )}

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
    const request = {
      user: user,
      systemName: system,
      jobName: jobName,
      systemId: systemConfig.id,
    };
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
        open={props.visible}
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
    const request = {
      tester: user,
      systemName: system,
      systemId: systemConfig.id,
    };
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
        open={props.visible}
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
function getLocalTime(starTime, endTime, month, year) {
  let start = getDateNumber(starTime);
  let end = getDateNumber(endTime);
  let startMoth = getMothNumber(starTime);
  let startYear = getYearNumber(starTime);
  let endMoth = getMothNumber(endTime);
  let endYear = getYearNumber(endTime);
  const currentDate = moment([year, month - 1]);
  const startDate = moment([startYear, startMoth - 1]);
  const endDate = moment([endYear, endMoth - 1]);
  let overload = false;
  if (startDate.isBefore(currentDate)) {
    start = 0;
    overload = true;
  } else if (startDate.isAfter(currentDate)) {
    start = getDays(year, month) + 1;
    overload = true;
  }
  if (endDate.isAfter(currentDate)) {
    end = getDays(year, month) + 1;
    overload = true;
  } else if (endDate.isBefore(currentDate)) {
    end = 0;
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
      if (result.miss) {
        return;
      }
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
    let missCol = [];
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
    } else if (data.type == "local") {
      memo.type = "Local Test";
      memo.project = data.project;
      const prepareDayTime = data.prepareDayTime;
      const regressionTestDayTime = data.regressionTestDayTime;
      const testDay = data.testDay;
      const testingDayTime = data.testingDayTime;

      const prepareStart = getLocalTime(prepareDayTime, testDay, month, year);
      const testStart = getLocalTime(prepareDayTime, testDay, month, year);
      const testingStart = getLocalTime(testDay, testingDayTime, month, year);
      const regressionTestStart = getLocalTime(
        testingDayTime,
        regressionTestDayTime,
        month,
        year
      );
      const regressionTestEnd = getLocalTime(
        testingDayTime,
        regressionTestDayTime,
        month,
        year
      );
      result[prepareStart.start] =
        data.jiraName.replace("-", " ") +
        "-Prepare-" +
        (testStart.end - prepareStart.start) +
        "-&" +
        JSON.stringify(memo);
      result[testStart.end] =
        data.jiraName.replace("-", " ") +
        "-Test-" +
        (testingStart.start + 1 - testStart.end) +
        "-&" +
        JSON.stringify(memo);
      result[testingStart.start + 1] =
        data.jiraName.replace("-", " ") +
        "-Testing-" +
        (regressionTestStart.start - testingStart.start) +
        "-&" +
        JSON.stringify(memo);
      result[regressionTestStart.start + 1] =
        data.jiraName.replace("-", " ") +
        "-RegressionTest-" +
        (regressionTestEnd.end - regressionTestStart.start) +
        "-&" +
        JSON.stringify(memo);
      missCol = [];
      for (let i = prepareStart.start + 1; i < testStart.end; i++) {
        missCol.push(i);
      }
      for (let i = testStart.end + 1; i < testingStart.start + 1; i++) {
        missCol.push(i);
      }
      for (
        let i = testingStart.start + 2;
        i < regressionTestStart.start + 1;
        i++
      ) {
        missCol.push(i);
      }
      for (
        let i = regressionTestStart.start + 2;
        i < regressionTestEnd.end + 1;
        i++
      ) {
        missCol.push(i);
      }
      result.dayCount += prepareStart - regressionTestEnd + 1;
      const maxDay = getDays(year, month);
      result.miss =
        (prepareStart.start > maxDay &&
          testStart.end > maxDay &&
          testingStart.start + 1 > maxDay &&
          regressionTestStart.start + 1 > maxDay) ||
        (prepareStart.start <= 0 &&
          testStart.end <= 0 &&
          testingStart.start + 1 <= 0 &&
          regressionTestStart.start + 1 <= 0);
    } else {
      memo.type = "项目";
      memo.project = data.project;
      memo.startTime = data.releaseDay;
      memo.endTime = data.launchDay;
      memo.usedTime = data.usedTime;
      memo.actuallyDoneTime = data.actuallyDoneTime || "";
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

export { ScheduleBody };
