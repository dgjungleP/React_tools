import React, { useEffect, useState } from "react";
import "antd/dist/antd.css";
import {
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  List,
  Modal,
  Row,
  Spin,
  Table,
  Tag,
  Button,
  Input,
  TimePicker,
  InputNumber,
  Select,
} from "antd";
import moment from "moment";
import { getDailys, setDaliy } from "../../server/project-service";
import { EditableCell, EditableRow } from "../editable/editable";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const baseTimeFormat = "YYYY-MM-DD";
const timeFotmat = "HH:mm";
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
          systemConfig={systemConfig}
        ></CurrentBody>
      </Spin>
    </>
  );
}
function CurrentBody(props) {
  const timeWindow = props.timeWindow;
  const systemConfig = props.systemConfig;
  const group = systemConfig.groupList;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisiable, setModalVisiable] = useState(false);
  const [currentDaily, setCurrentDaily] = useState({});
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
      render: (em, record) => {
        return (
          <Checkbox
            onClick={() => {
              record.em = !record.em;
              handleSave(record);
            }}
            checked={record.em}
          ></Checkbox>
        );
      },
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
    const newData = [...data];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    console.log(row);
    newData.splice(index, 1, { ...item, ...row });
    setLoading(true);
    setDaliy(row)
      .then((response) => {
        setData(newData);
        setLoading(false);
      })
      .finally(() => {});
  };
  const showModal = (daily) => {
    setModalVisiable(true);
    setCurrentDaily(daily);
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
      <OperateModal
        title={currentDaily.launchDay + "'s Project:" + currentDaily.project}
        visible={modalVisiable}
        data={currentDaily}
        changeVisiable={setModalVisiable}
        systemConfig={systemConfig}
        fresh={freshTableData}
      ></OperateModal>
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
          style={{
            height: 300,
            overflow: "auto",
            padding: "0 16px",
            border: "1px solid rgba(140, 140, 140, 0.35)",
          }}
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

function OperateModal(props) {
  const config = props.systemConfig;
  const changeVisiable = props.changeVisiable;
  const daily = props.data;
  const [currentDaily, setCurrentDaily] = useState({});
  const [form] = Form.useForm();
  const handleOk = () => {
    const formValues = form.getFieldsValue();
    const request = {
      ...currentDaily,
      ...formValues,
    };
    request.moveIn = (request.moveIn || []).join(",");
    request.effectTime = (request.effectTime || [])
      .filter((data) => data)
      .map((data) => {
        return data[0].format(timeFotmat) + "-" + data[1].format(timeFotmat);
      })
      .join(",");
    setDaliy(request).then((response) => {
      console.log(response);
    });
    props.fresh();
    changeVisiable(false);
  };
  const handleCancel = () => {
    changeVisiable(false);
  };
  useEffect(() => {
    const currentDaily = { ...daily };
    currentDaily.moveIn = currentDaily.moveIn
      ? currentDaily.moveIn.split(",")
      : undefined;
    const timeWindow = [];

    if (currentDaily.effectTime) {
      currentDaily.effectTime.split(",").forEach((time) => {
        const timeArr = time.split("-");
        timeWindow.push([
          moment(timeArr[0], timeFotmat),
          moment(timeArr[0], timeFotmat),
        ]);
      });
    } else {
      timeWindow.push([moment(), moment()]);
    }
    currentDaily.effectTime = timeWindow;
    console.log(currentDaily);
    setCurrentDaily(currentDaily);
    form.setFieldsValue(currentDaily);
  }, [daily]);
  return (
    <Modal
      title={props.title}
      visible={props.visible}
      onOk={handleOk}
      onCancel={handleCancel}
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item label={"Planned Time:"} name={"planTime"}>
          <InputNumber></InputNumber>
        </Form.Item>
        <Form.Item label={"Move In:"} name={"moveIn"}>
          <Select mode="multiple">
            {config.testerList.map((user) => {
              return <Option key={user}>{user}</Option>;
            })}
          </Select>
        </Form.Item>
        <Form.List name={"effectTime"}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  label={index === 0 ? "Effictive Time:" : ""}
                  required={false}
                  key={field.key}
                >
                  <Form.Item
                    {...field}
                    validateTrigger={["onChange", "onBlur"]}
                    noStyle
                  >
                    <TimePicker.RangePicker
                      format={timeFotmat}
                    ></TimePicker.RangePicker>
                  </Form.Item>
                  <PlusCircleOutlined
                    onClick={() => add()}
                    style={{ fontSize: 20, marginLeft: 5 }}
                  />
                  {fields.length > 1 ? (
                    <MinusCircleOutlined
                      onClick={() => remove(field.name)}
                      style={{ fontSize: 20, marginLeft: 5 }}
                    />
                  ) : null}
                </Form.Item>
              ))}
            </>
          )}
        </Form.List>
        <Form.Item label={"Memo:"} name={"memo"}>
          <TextArea></TextArea>
        </Form.Item>
      </Form>
    </Modal>
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
