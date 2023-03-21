import {
  Table,
  Space,
  Col,
  Row,
  Popconfirm,
  message,
  Tooltip,
  Collapse,
  Form,
  Modal,
  InputNumber,
  Select,
  DatePicker,
} from "antd";
import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import "./gantt.css";
import {
  deleteDayoff,
  deleteOtherJob,
  setTester,
  updateLocalShcedule,
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
          extra={props.extra}
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
    ...(props.extra || []),
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
      width: 90,
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
  const autoTetingTag = ["None", "Plan", "Doing", "Done"];

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
  const domainSelectors = Array.from(
    new Set(data.map((inner) => inner.domain))
  ).filter((data) => data);
  const firstCol = {
    title: !systemConfig.needDivision ? "Group" : "Division",
    key: !systemConfig.needDivision ? "group" : "division",
    dataIndex: !systemConfig.needDivision ? "group" : "division",
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
      title: "Domain",
      key: "domain",
      dataIndex: "domain",
      filters: makeFilter(domainSelectors),
      onFilter: (value, record) => record["domain"].indexOf(value) === 0,
      filterSearch: true,
    },
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
      onCell: (record) => {
        return {
          record,
          editable: true,
          dataIndex: "tester",
          title: "Tester",
          handleSave: handleSave,
          selectors: props.selectors,
          type: "multiple",
        };
      },
    },
    {
      title: "AutoTestingTag",
      key: "AutoTestingTag",
      dataIndex: "autoTestTag",
      editable: true,
      sorter: {
        compare: (a, b) => {
          return a.autoTestTag > b.autoTestTag ? -1 : 1;
        },
      },
      filters: makeFilter(autoTetingTag),
      onFilter: (value, record) => record.autoTestTag == value,
      filterSearch: true,
      onCell: (record) => {
        return {
          record,
          editable: true,
          dataIndex: "autoTestTag",
          title: "AutoTestingTag",
          handleSave: handleSave,
          selectors: autoTetingTag,
        };
      },
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
  const columns = baseColumns;
  // const columns = baseColumns.map((col) => {
  //   if (!col.editable) {
  //     return col;
  //   }
  //   return {
  //     ...col,
  //     onCell: (record) => {
  //       return {
  //         record,
  //         editable: col.editable,
  //         dataIndex: col.dataIndex,
  //         title: col.title,
  //         handleSave: handleSave,
  //         selectors: props.selectors,
  //         type: "multiple",
  //       };
  //     },
  //   };
  // });

  const updateData = (newData) => {
    props.updateData(newData);
  };
  const handleSave = (row) => {
    console.log(row);
    if (Array.isArray(row.tester)) {
      row.tester = (row.tester || []).join(",");
    }
    const newData = [...data];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setTester({
      projectId: row.project,
      tester: row.tester,
      autoTestTag: row.autoTestTag,
      system: systemConfig.systemName,
      systemId: systemConfig.id,
    }).then((response) => {
      updateData(newData);
    });
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
function LTReleaseTable(props) {
  const systemConfig = props.systemConfig;
  const [searchText, updateSearchText] = useState("");
  const [searchedColumn, updateSearchedColumn] = useState("");
  const [modalVisiable, setModalVisiable] = useState(false);
  const [current, setCurrent] = useState({});
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
  const firstCol = {
    title: !systemConfig.needDivision ? "Group" : "Division",
    key: !systemConfig.needDivision ? "group" : "division",
    dataIndex: !systemConfig.needDivision ? "group" : "division",
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
      title: "PB",
      key: "PB",
      dataIndex: "jiraName",
    },
    {
      title: "PB Name",
      key: "PBName",
      dataIndex: "projectName",
    },
    {
      title: "Tester",
      key: "Tester",
      dataIndex: "localTester",
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
      title: "Prepare",
      key: "Prepare",
      dataIndex: "prepareDay",
    },
    {
      title: "TestDay",
      key: "TestDay",
      dataIndex: "testDay",
      render: (text, record) => {
        return text ? moment(text).format("yyyy-MM-DD") : "";
      },
    },
    {
      title: "Testing",
      key: "Testing",
      dataIndex: "testingDay",
    },
    {
      title: "Regression test",
      key: "Regression test",
      dataIndex: "regressionTestDay",
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      render: (text, record) => {
        return <a onClick={() => showModal(record)}>Edit</a>;
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
  const showModal = (current) => {
    setModalVisiable(true);
    setCurrent(current);
  };
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
    }).then((response) => {});
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
        <OperateModal
          title={current.project + "#-" + current.jiraName + "#"}
          visible={modalVisiable}
          data={current}
          changeVisiable={setModalVisiable}
          systemConfig={systemConfig}
          fresh={props.fresh}
        ></OperateModal>
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
function OperateModal(props) {
  const config = props.systemConfig;
  const changeVisiable = props.changeVisiable;
  const localZone = props.localZone;
  const data = props.data;
  const [currentData, setCurrentData] = useState({});
  const [form] = Form.useForm();
  const handleOk = () => {
    const formValues = form.getFieldsValue();
    const request = {
      ...currentData,
      ...formValues,
    };
    request.tester = (request.localTester || []).join(",");

    request.system = config.systemName;
    request.systemId = config.id;

    request.projectId = request.project;
    request.jira = request.jiraName;
    request.prepareDay = request.prepareTime;
    request.testingDay = request.testingTime;
    request.regressionTestDay = request.regressionTestTime;
    updateLocalShcedule(request).then((response) => {
      props.fresh();
      changeVisiable(false);
    });
    message.info("Please waiting for update!");
  };
  const handleCancel = () => {
    changeVisiable(false);
  };
  const tryCalculate = () => {
    if (!form.getFieldValue("localTester") || !form.getFieldValue("testDay")) {
      return;
    }
    const launchDay = moment(currentData.launchDay);
    const releaseDay = moment(currentData.releaseDay);
    const testDay = moment(form.getFieldValue("testDay"));

    if (form.getFieldValue("testingTime") == 0) {
      form.setFieldValue("testingTime", releaseDay.diff(testDay, "days"));
    }
    if (form.getFieldValue("regressionTestTime") == 0) {
      form.setFieldValue(
        "regressionTestTime",
        launchDay.diff(releaseDay, "days")
      );
    }
  };
  useEffect(() => {
    const currentData = { ...data };
    currentData.localTester = currentData.localTester
      ? currentData.localTester.split(",")
      : undefined;
    currentData.prepareTime = currentData.prepareDay;
    currentData.testingTime = currentData.testingDay;
    currentData.regressionTestTime = currentData.regressionTestDay;
    currentData.testDay = moment(currentData.testDay);
    setCurrentData(currentData);
    form.setFieldsValue(currentData);
  }, [data, localZone]);
  return (
    <Modal
      title={props.title}
      open={props.visible}
      onOk={handleOk}
      onCancel={handleCancel}
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item label={"Prepare Time:"} name={"prepareTime"}>
          <InputNumber></InputNumber>
        </Form.Item>
        <Form.Item label={"Testing Time:"} name={"testingTime"}>
          <InputNumber></InputNumber>
        </Form.Item>
        <Form.Item label={"Regression Test Time:"} name={"regressionTestTime"}>
          <InputNumber></InputNumber>
        </Form.Item>
        <Form.Item label={"Local Testster:"} name={"localTester"}>
          <Select mode="multiple" onChange={tryCalculate}>
            {config.testerList.map((user) => {
              return <Select.Option key={user}>{user}</Select.Option>;
            })}
          </Select>
        </Form.Item>
        <Form.Item label={"Test Day:"} name={"testDay"}>
          <DatePicker onChange={tryCalculate}></DatePicker>
        </Form.Item>
      </Form>
    </Modal>
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
    let title = {};
    let tag;
    if (record[i]) {
      let memo = record[i].split("-&")[1];
      memo = (memo || "{}").replace('/\\"/g', '"');
      title = JSON.parse(memo);
      tag = title.autoTestTag;
    }
    let bodyTemp;
    if (title.key == "otherJob") {
      bodyTemp = (
        <>
          <Row>
            <span>JobName: {title.jobName}</span>
          </Row>
          <Row>
            <span>StartTime: {title.startTime}</span>
          </Row>
          <Row>
            <span>EndTime: {title.endTime}</span>
          </Row>
        </>
      );
    } else if (title.key == "dayoff") {
      bodyTemp = (
        <>
          <Row>
            <span>StartTime: {title.startTime}</span>
          </Row>

          <Row>
            <span>days: {title.days}</span>
          </Row>
        </>
      );
    } else if (title.key == "local") {
      bodyTemp = (
        <>
          <Row>
            <span>Project: {title.project}</span>
          </Row>
        </>
      );
    } else {
      bodyTemp = (
        <>
          <Row>
            <span>Project: {title.project}</span>
          </Row>
          <Row>
            <span>ReleaseTime: {title.startTime}</span>
          </Row>
          <Row>
            <span>LaunchTime: {title.endTime}</span>
          </Row>
          <Row>
            <span>ActuallyDoneTime: {title.actuallyDoneTime}</span>
          </Row>
          <Row>
            <span>Used Time: {title.usedTime}</span>
          </Row>
          <Row>
            <span>AutoTestingTag: {title.autoTestTag}</span>
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
                <span>Type: {title.type}</span>
              </Row>
              <Row>
                <span>User: {title.user}</span>
              </Row>
              {bodyTemp}
            </Col>
          );
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {(record[i] || "").split("-")[0]}
          {tag && tag != "None" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              strokeWidth={2}
              width={15}
              color={getColor(tag)}
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
                clipRule="evenodd"
              />
              <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
            </svg>
          ) : (
            ""
          )}
        </div>
      </Tooltip>
    );
  };
}
function getColor(tag) {
  if (tag == "Plan") {
    return "#1864ab";
  }
  if (tag == "Doing") {
    return "#d9480f";
  }
  if (tag == "Done") {
    return "#5c940d";
  }
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

    const now = moment();
    if (now.date() == i && now.month() == day.month()) {
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
    const now = moment();
    if (now.date() == i && now.month() == day.month()) {
      className += " today-header-class";
    }

    result.className = className;
    return result;
  };
}

export { Gantt, ReleaseTable, LTReleaseTable };
