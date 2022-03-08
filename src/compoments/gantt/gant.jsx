import {
  Table,
  Space,
  Button,
  Modal,
  Col,
  Row,
  Select,
  DatePicker,
  Input,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import React, { useState } from "react";
import "antd/dist/antd.css";
import "./gantt.css";
import {
  deleteDayoff,
  setTester,
  updateDayoff,
} from "../../server/project-service";
import { EditableCell, EditableRow } from "../editable/editable";
import moment from "moment";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { Filter } from "../editable/filter";
const { RangePicker } = DatePicker;
const { Option } = Select;
function Gantt(props) {
  const year = props.query.year;
  const month = props.query.month;
  const group = props.query.group;
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
      <ReleaseTable
        data={props.tableData}
        updateData={props.updateData}
        selectors={props.selectors}
      ></ReleaseTable>
      <DayOffTable
        year={year}
        month={month}
        group={group}
        data={props.dayoffData}
        freshData={freshData}
        system={props.system}
      ></DayOffTable>
    </>
  );
}

function GanttTable(props) {
  const year = props.year;
  const month = props.month;
  const simple = !props.simple;
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
      {" "}
      <div style={{ width: "80%", margin: "20px auto 0" }}>
        <Table
          className="no-point"
          dataSource={props.dataSource}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1600 }}
        ></Table>
      </div>
    </>
  );
}

function ReleaseTable(props) {
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
  const baseColumns = [
    {
      title: "Project",
      key: "Project",
      dataIndex: "project",
      ...getColumnSearchProps("project"),
    },
    {
      title: "CRL/PB",
      key: "CRL/PB",
      dataIndex: "crl_pb",
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
  const data = props.data;
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
    }).then((response) => {
      console.log(response);
    });
    updateData(newData);
  };

  return (
    <>
      <div style={{ width: "60%", margin: "15px auto 0" }}>
        <Table
          components={components}
          title={() => "项目表"}
          columns={columns}
          dataSource={data}
        ></Table>
      </div>
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

function DayOffTable(props) {
  const [visible, setVisible] = useState(false);
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
      <Button type="primary" onClick={() => setVisible(true)}>
        Request Dayoff
      </Button>

      <DayOffRequest
        visible={visible}
        changeVisible={setVisible}
        freshData={props.freshData}
        system={props.system}
      ></DayOffRequest>
      <Table dataSource={data} columns={columns}></Table>
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
    const result = { with: 200 };
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
    if (tiltle.project) {
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
        </>
      );
    } else {
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
    return record.name;
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
    result.className = className;
    return result;
  };
}

export { Gantt };
