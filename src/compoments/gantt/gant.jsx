import {
  Table,
  Space,
  Col,
  Row,
  Popconfirm,
  message,
  Tooltip,
  Collapse,
} from "antd";
import React, { useState } from "react";
import "antd/dist/antd.css";
import "./gantt.css";
import {
  deleteDayoff,
  deleteOtherJob,
  setTester,
} from "../../server/project-service";
import { EditableCell, EditableRow } from "../editable/editable";
import moment from "moment";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { Filter } from "../editable/filter";
const { Panel } = Collapse;
function Gantt(props) {
  const year = props.query.year;
  const month = props.query.month;
  const freshData = () => {
    props.updateData(props.tableData);
  };
  return (
    <>
      <div style={{ display: props.showGantt ? "" : "none" }}>
        <GanttTable
          dataSource={props.ganttTableData}
          year={year}
          month={month}
          simple={props.simple}
        ></GanttTable>
      </div>
      {props.table(props)}
      {props.needOtherJob && (
        <OtherJobTable
          data={props.otherJobTable}
          freshData={freshData}
          system={props.system}
        ></OtherJobTable>
      )}
      {props.needDayOff && (
        <DayOffTable
          data={props.dayoffData}
          freshData={freshData}
          system={props.system}
        ></DayOffTable>
      )}
    </>
  );
}

function GanttTable(props) {
  const year = props.year;
  const month = props.month;
  const simple = !props.simple;
  const sourceData = [
    ...props.dataSource.filter((data) => (data.name || "").includes("*")),
    ...props.dataSource.filter((data) => !(data.name || "").includes("*")),
  ];

  const columns = [
    {
      title: "name",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "left",
      align: "center",
      render: formatName(),
      onCell: groupUser(),
    },
  ];
  for (let i = 1; i <= getDays(year, month); i++) {
    const day = moment(year + "-" + month + "-" + i);
    columns.push({
      title: () => {
        return (
          <span>
            {i}
            <br />
            {day.format("ddd")}
          </span>
        );
      },
      dataIndex: day,
      key: day,
      width: 60,
      align: "center",
      render: formatter(i),
      onCell: colorCell(i, day, simple),
      onHeaderCell: colorHeaderCell(i, day, simple),
    });
  }
  return (
    <>
      <div style={{ width: "95%", margin: "20px auto 0" }}>
        <Table
          className="no-point"
          dataSource={sourceData}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1800 }}
        ></Table>
      </div>
    </>
  );
}

function ReleaseTable(props) {
  const systemConfig = props.systemConfig;
  const [searchText, updateSearchText] = useState("");
  const [searchedColumn, updateSearchedColumn] = useState("");

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <Filter
        setSelectedKeys={setSelectedKeys}
        selectedKeys={selectedKeys}
        confirm={confirm}
        clearFilters={clearFilters}
        handlSearchText={updateSearchText}
        handlSearchedColumn={updateSearchedColumn}
        dataIndex={dataIndex}
      ></Filter>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const data = props.data;
  const statusSelectors = Array.from(
    new Set(data.map((inner) => inner.status))
  );
  const firstCol = {
    title: !systemConfig.needDivision ? "Group" : "Division",
    key: !systemConfig.needDivision ? "group" : "division",
    dataIndex: !systemConfig.needDivision ? "group" : "division",
    editable: true,
    filters: makeFilter(
      (systemConfig.needDivision
        ? systemConfig.divisionList
        : systemConfig.groupList) || []
    ),
    onFilter: (value, record) =>
      record[!systemConfig.needDivision ? "group" : "division"].indexOf(
        value
      ) === 0,
    filterSearch: true,
  };
  const baseColumns = [
    firstCol,
    {
      title: "Project",
      key: "Project",
      dataIndex: "project",
      ...getColumnSearchProps("project"),
    },
    {
      title: "Status",
      key: "Status",
      dataIndex: "status",
      editable: true,

      filters: makeFilter(statusSelectors),
      onFilter: (value, record) => record.status.indexOf(value) === 0,
      filterSearch: true,
    },
    {
      title: "CRL/PB",
      key: "CRL/PB",
      dataIndex: "crl_pb",
      render: (link) => {
        return (
          <Collapse ghost>
            <Panel header="Link Collapse">
              {link.split(";").map((singleLink) => (
                <>
                  <a href={singleLink} target="_blank">
                    {singleLink}
                  </a>
                  <br />
                </>
              ))}
            </Panel>
          </Collapse>
        );
      },
    },
    {
      title: "ProjectName",
      key: "ProjectName",
      dataIndex: "projectName",
      ...getColumnSearchProps("projectName"),
    },
    {
      title: "Tester",
      key: "Tester",
      dataIndex: "tester",
      editable: true,
      sorter: {
        compare: (a, b) => {
          return a.tester > b.tester ? -1 : 1;
        },
      },
      filters: makeFilter(props.selectors),
      onFilter: (value, record) => record.tester.indexOf(value) === 0,
      filterSearch: true,
    },
    {
      title: "ReleaseDay",
      key: "ReleaseDay",
      dataIndex: "releaseDay",
      sorter: {
        compare: (a, b) => {
          return a.releaseDay > b.releaseDay ? -1 : 1;
        },
      },
    },
    {
      title: "LaunchDay",
      key: "LaunchDay",
      dataIndex: "launchDay",
      sorter: {
        compare: (a, b) => {
          return a.launchDay > b.launchDay ? -1 : 1;
        },
      },
    },
  ];
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columns = baseColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => {
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: handleSave,
          selectors: props.selectors,
          type: "multiple",
        };
      },
    };
  });

  const updateData = (newData) => {
    props.updateData(newData);
  };
  const handleSave = (row) => {
    row.tester = (row.tester || []).join(",");
    const newData = [...data];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setTester({
      projectId: row.project,
      tester: row.tester,
      system: systemConfig.systemName,
      systemId: systemConfig.id,
    }).then((response) => {
      console.log(response);
    });
    updateData(newData);
  };
  return (
    <>
      <div style={{ width: "99%", margin: "15px auto 0" }}>
        <Table
          components={components}
          title={() => "Project"}
          columns={columns}
          dataSource={data}
        ></Table>
      </div>
    </>
  );
}
function OtherJobTable(props) {
  const data = [...props.data];

  const columns = [
    {
      title: "Index",
      dataIndex: "index",
      key: "index",
    },
    {
      title: "JobName",
      dataIndex: "jobName",
      key: "jobName",
    },
    {
      title: "UserName",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "StartTime",
      dataIndex: "startTime",
      key: "startTime",
      render: (time) => {
        return time.split(" ")[0];
      },
    },
    {
      title: "EndTime",
      dataIndex: "endTime",
      key: "endTime",
      render: (time) => {
        return time.split(" ")[0];
      },
    },

    {
      title: "System",
      dataIndex: "systemName",
      key: "systemName",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Popconfirm
            title="Are you sure to delete this task?"
            onConfirm={() =>
              deleteOtherJob(record).then((response) => {
                message.success("Delete success!");
                props.freshData();
              })
            }
            onCancel={() => console.log("撤销")}
            okText="Yes"
            cancelText="No"
          >
            <a>Delete</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <>
      <Table
        title={() => "Other Job"}
        dataSource={data}
        columns={columns}
      ></Table>
    </>
  );
}

function DayOffTable(props) {
  const data = [...props.data];

  const columns = [
    {
      title: "Index",
      dataIndex: "index",
      key: "index",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "StartTime",
      dataIndex: "startTime",
      key: "startTime",
      render: (time) => {
        return time.split(" ")[0];
      },
    },
    {
      title: "EndTime",
      dataIndex: "endTime",
      key: "endTime",
      render: (time) => {
        return time.split(" ")[0];
      },
    },
    {
      title: "DayOff",
      dataIndex: "days",
      key: "days",
    },
    {
      title: "System",
      dataIndex: "systemName",
      key: "systemName",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Popconfirm
            title="Are you sure to delete this task?"
            onConfirm={() =>
              deleteDayoff(record).then((response) => {
                message.success("Delete success!");
                props.freshData();
              })
            }
            onCancel={() => console.log("撤销")}
            okText="Yes"
            cancelText="No"
          >
            <a>Delete</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <>
      <Table
        title={() => "Day Off"}
        dataSource={data}
        columns={columns}
      ></Table>
    </>
  );
}

//Method

function checkWeekendDay(weekNumber, simple) {
  return simple
    ? weekNumber == 0 || weekNumber == 6
    : weekNumber == 0 || weekNumber == 1;
}
function getDays(year, month) {
  month = parseInt(month, 10);
  var d = new Date(year, month, 0);
  return d.getDate();
}

function makeFilter(selectors) {
  return selectors.map((data) => {
    return { text: data, value: data };
  });
}

function groupUser() {
  return (record, index) => {
    const result = { width: 200 };
    if (record.miss) {
      result.rowSpan = 0;
    } else {
      result.rowSpan = record.rowSpan;
    }
    const dayCount = record.dayCount;
    let className = "";
    if (dayCount < 20) {
      className = "relaxed-work";
    } else if (dayCount < 40) {
      className = "balanced-work";
    } else {
      className = "overload-work";
    }
    if ((record.name || "").includes("*")) {
      className = " pending-class";
    }
    result.className = className;
    return result;
  };
}
function formatter(i) {
  return (text, record, index) => {
    let tiltle = {};
    if (record[i]) {
      let memo = record[i].split("-&")[1];
      memo = (memo || "{}").replace('/\\"/g', '"');
      tiltle = JSON.parse(memo);
    }
    let bodyTemp;
    if (tiltle.key == "otherJob") {
      bodyTemp = (
        <>
          <Row>
            <span>JobName: {tiltle.jobName}</span>
          </Row>
          <Row>
            <span>StartTime: {tiltle.startTime}</span>
          </Row>
          <Row>
            <span>EndTime: {tiltle.endTime}</span>
          </Row>
        </>
      );
    } else if (tiltle.key == "dayoff") {
      bodyTemp = (
        <>
          <Row>
            <span>StartTime: {tiltle.startTime}</span>
          </Row>

          <Row>
            <span>days: {tiltle.days}</span>
          </Row>
        </>
      );
    } else {
      bodyTemp = (
        <>
          <Row>
            <span>Project: {tiltle.project}</span>
          </Row>
          <Row>
            <span>ReleaseTime: {tiltle.startTime}</span>
          </Row>
          <Row>
            <span>LaunchTime: {tiltle.endTime}</span>
          </Row>
          <Row>
            <span>ActuallyDoneTime: {tiltle.actuallyDoneTime}</span>
          </Row>
          <Row>
            <span>Used Time: {tiltle.usedTime}</span>
          </Row>
        </>
      );
    }

    return (
      <Tooltip
        title={() => {
          return (
            <Col>
              <Row>
                <span>Type: {tiltle.type}</span>
              </Row>
              <Row>
                <span>User: {tiltle.user}</span>
              </Row>
              {bodyTemp}
            </Col>
          );
        }}
      >
        {(record[i] || "").split("-")[0]}
      </Tooltip>
    );
  };
}

function formatName(i) {
  return (text, record, index) => {
    return record.name.replace(new RegExp("\\*", "gm"), "");
  };
}

function colorCell(i, day, simple) {
  return (record, index) => {
    const weekNumber = day.format("d");
    let result = { with: 100 };
    let className = "";
    // if (checkWeekendDay(weekNumber, simple)) {
    //   className += " weekenday-class ";
    // }
    if (moment().date() == i && moment().month() == day.month()) {
      className += " today-class";
    }
    if (record.missCol.findIndex((data) => data === i) < 0) {
      if (record[i]) {
        const tail = record[i];
        className += " " + tail.split("-")[1].toLowerCase() + "-class ";
        result.colSpan = new Number(tail.split("-")[2]);
      }
    } else {
      result.colSpan = 0;
    }

    result.className = className;
    return result;
  };
}
function colorHeaderCell(i, day, simple) {
  return (record) => {
    const weekNumber = day.format("d");
    let result = {};
    let className = "";
    if (checkWeekendDay(weekNumber, simple)) {
      className += " weekenday-header-class ";
    }
    if (moment().date() == i) {
      className += " today-header-class";
    }
    result.className = className;
    return result;
  };
}

export { Gantt, ReleaseTable };
