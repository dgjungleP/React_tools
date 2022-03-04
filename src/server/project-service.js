import axios from "axios";
import { enviroment } from "../enviroments/enrivoment";
const baseApi = enviroment.BASE_URL;
function getProject(request) {
  return axios.get(
    `${baseApi}projects?year=${request.year}&month=${request.month}&history=${request.history}&group=${request.group}`
  );
}
function setTester(request) {
  return axios.post(`${baseApi}set/tester`, request);
}

function updateSystemConfig(request) {
  return axios.post(`${baseApi}system-config`, request);
}
function getSystemConfig(request) {
  return axios.get(`${baseApi}system-config`);
}
function deleteSystemConfig(requst) {
  return axios.delete(`${baseApi}system-config/${requst.id}`);
}

function updateDayoff(request) {
  return axios.post(`${baseApi}day-off`, request);
}
function getDayoff(request) {
  return axios.get(
    `${baseApi}day-off?year=${request.year}&month=${request.month}&history=${request.history}&system=${request.system}`
  );
}
function deleteDayoff(requst) {
  return axios.delete(`${baseApi}day-off/${requst.id}`);
}
export {
  getProject,
  setTester,
  updateSystemConfig,
  getSystemConfig,
  deleteSystemConfig,
  updateDayoff,
  deleteDayoff,
  getDayoff,
};
