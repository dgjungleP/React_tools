import React, { useEffect, useState } from "react";
import "antd/dist/antd.css";
import {
  Card,
  Checkbox,
  Col,
  DatePicker,
  List,
  Row,
  Spin,
  Table,
  Tag,
} from "antd";
import moment from "moment";
import { getDailys } from "../../server/project-service";
import { EditableCell, EditableRow } from "../editable/editable";
const { RangePicker } = DatePicker;
const baseTimeFormat = "YYYY-MM-DD";
const status = ["LAUNCHED", "ABANDON", "HOLD_ON"];
function DailyBody(props) {
  const systemConfig = props.systemConfig;
  const now = moment();
  const [query, setQuery] = useState({
    start: now.add(-1, "d").format(baseTimeFormat),
    end: now.add(2, "d").format(baseTimeFormat),
  });
  const [loading, updateLoading] = useState(false);
  const [timeWindow, setTimeWindow] = useState([]);
  const handleQuery = (query) => {
    setQuery(query);
  };
  const handleTimeWind = () => {
    if (query.start && query.end) {
      const currentTimeWind = [];
      let start = moment(query.start);
      const end = moment(query.end);
      while (start.isSameOrBefore(end)) {
        currentTimeWind.push(start.format(baseTimeFormat));
        start.add(1, "d");
      }
      setTimeWindow(currentTimeWind);
    }
  };
  useEffect(() => {
    updateLoading(true);
    handleTimeWind();
    updateLoading(false);
  }, [query]);
  return (
    <>
      <Header query={query} chanegQuery={handleQuery}></Header>
      <Spin spinning={loading}>
        <CurrentBody
          timeWindow={timeWindow}
          group={systemConfig.groupList}
        ></CurrentBody>
      </Spin>
    </>
  );
}
function CurrentBody(props) {
  const timeWindow = props.timeWindow;
  const group = props.group;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseColumns = [
    {
      title: "Launch Day",
      key: "launchDay",
      dataIndex: "launchDay",
    },
    {
      title: "Project",
      key: "project",
      dataIndex: "project",
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      editable: true,
      render: (status) => {
        return getTypeTag(status);
      },
    },
    {
      title: "Module",
      key: "module",
      dataIndex: "module",
    },
    {
      title: "Planned Time",
      key: "planTime",
      dataIndex: "planTime",
    },
    {
      title: "Effective Time",
      key: "effectTime",
      dataIndex: "effectTime",
    },
    {
      title: "BSD",
      key: "bsd",
      dataIndex: "bsd",
    },
    {
      title: "Move In",
      key: "moveIn",
      dataIndex: "moveIn",
    },
    {
      title: "Memo",
      key: "memo",
      dataIndex: "memo",
    },
    {
      title: "EM",
      key: "em",
      dataIndex: "em",
      render: (em) => {
        return <Checkbox></Checkbox>;
      },
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      render: (text, record) => <a>Edit</a>,
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
          selectors: status,
        };
      },
    };
  });
  const freshTableData = () => {
    setLoading(true);
    getDailys({ timeList: timeWindow, group })
      .then((response) => {
        const data = response.data.map((pj) => {
          pj.key = pj.project;
          return pj;
        });
        setData(data);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const handleSave = (row) => {
    row.tester = (row.tester || []).join(",");
    const newData = [...data];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    console.log(newData);
    setData(newData);
  };
  useEffect(() => {
    freshTableData();
  }, [timeWindow]);
  return (
    <>
      <Table
        style={{ marginTop: 50 }}
        components={components}
        title={() => "Daily Launch"}
        columns={columns}
        dataSource={data}
        loading={loading}
      ></Table>
      <Row gutter={[16, 5]} style={{ marginTop: 100 }}>
        {timeWindow.map((time) => {
          return (
            <Col span={3} key={time}>
              <TimeList time={time} group={group}></TimeList>
            </Col>
          );
        })}
      </Row>
    </>
  );
}
function TimeList(props) {
  const time = props.time;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadMoreData = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    getDailys({ timeList: [time], group: [...props.group] })
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    loadMoreData();
  }, []);

  return (
    <Card
      title={time}
      style={{
        width: "fit-content",
        textAlign: "center",
      }}
      type="inner"
    >
      <Spin spinning={loading}>
        <List
          dataSource={data}
          renderItem={(item) => (
            <List.Item key={item.projectNumber}>
              <span style={{ marginRight: 5 }}>{item.project} </span>
              {getTypeTag(item.status)}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
}

function Header(props) {
  const query = props.query;
  const [time, updateTime] = useState({ start: query.start, end: query.end });
  const onTimeChange = (_, dateString) => {
    const newTime = JSON.parse(JSON.stringify(time));
    newTime.start = dateString[0];
    newTime.end = dateString[1];
    updateTime(newTime);
    let newQuery = JSON.parse(JSON.stringify(query));
    newQuery.start = dateString[0];
    newQuery.end = dateString[1];

    props.chanegQuery(newQuery);
  };
  return (
    <Row gutter={15} justify="center" style={{ marginTop: 10 }} align="center">
      <Col>
        <span>Time:</span>{" "}
        <RangePicker
          onChange={onTimeChange}
          defaultValue={[moment(query.start), moment(query.end)]}
        ></RangePicker>
      </Col>
    </Row>
  );
}

function getTypeTag(status) {
  switch (status) {
    case "LAUNCHED":
      return <Tag color="success">Launched</Tag>;
    case "ABANDON":
      return <Tag color="error">Abandon</Tag>;
    case "HOLD_ON":
      return <Tag color="warning">Hold On</Tag>;
  }
}
export { DailyBody };
