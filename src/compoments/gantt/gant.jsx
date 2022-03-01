import { Table, Form, Input } from "antd";
import React, { useState, useEffect, useRef, useContext } from "react";
import "antd/dist/antd.css";
import "./gantt.css";
import { setTester } from "../../server/project-service";
import { EditableCell, EditableRow } from "../editable/editable";
import moment from "moment";

function checkWeekendDay(weekNumber, simple) {
  return simple
    ? weekNumber == 0 || weekNumber == 6
    : weekNumber == 0 || weekNumber == 1;
}
function Gantt(props) {
  const year = props.query.year;
  const month = props.query.month;
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
    </>
  );
}
function getDays(year, month) {
  month = parseInt(month, 10);
  var d = new Date(year, month, 0);
  return d.getDate();
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
      with: 200,
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
      with: 100,
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
        ></Table>
      </div>
    </>
  );
}

function ReleaseTable(props) {
  const baseColumns = [
    {
      title: "Project",
      key: "Project",
      dataIndex: "project",
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
      title: "LuanchDay",
      key: "LuanchDay",
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

//Method

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
    return (record[i] || "").split("-")[0];
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
    if (checkWeekendDay(weekNumber, simple)) {
      className += " weekenday-class ";
    }
    if (record.missCol.findIndex((data) => data === i) < 0) {
      if (record[i]) {
        const tail = record[i];
        switch (tail.split("-")[1]) {
          case "Release":
            className += " release-class ";
            break;
          case "Launch":
            className += " luanch-class ";
            break;
        }
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
