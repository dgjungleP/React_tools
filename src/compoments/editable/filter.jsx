import { Input, Button, Space } from "antd";
import React, { useRef } from "react";
import "antd/dist/antd.css";
import { SearchOutlined } from "@ant-design/icons";

function Filter(props) {
  const searchInput = useRef(null);
  const setSelectedKeys = props.setSelectedKeys;
  const selectedKeys = props.selectedKeys;
  const confirm = props.confirm;
  const clearFilters = props.clearFilters;
  const dataIndex = props.dataIndex;
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    updateSearch(selectedKeys, dataIndex);
  };
  const updateSearch = (selectedKeys, dataIndex) => {
    props.handlSearchText(selectedKeys[0]);
    props.handlSearchedColumn(dataIndex);
  };
  const handleReset = (clearFilters) => {
    clearFilters();
    props.handlSearchText("");
  };
  return (
    <>
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              updateSearch(selectedKeys, dataIndex);
            }}
          >
            Filter
          </Button> */}
        </Space>
      </div>
    </>
  );
}

export { Filter };
