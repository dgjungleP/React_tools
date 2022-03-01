import axios from "axios";

const baseApi = "http://172.16.171.106:8080/open-api/";
function getProject(request) {
  return axios.get(
    `${baseApi}projects?year=${request.year}&month=${request.month}&history=${request.history}&group=${request.group}`
  );
}
function setTester(request) {
  return axios.post(`${baseApi}/set/tester`, request);
}

export { getProject, setTester };
