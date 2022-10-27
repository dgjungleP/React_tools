import axios from "axios";
import { enviroment } from "../enviroments/enrivoment";
const baseApi = enviroment.BASE_URL;

function updateOtherJob(request) {
  return axios.post(`${baseApi}other-job`, request);
}
function getOtherJob(request) {
  return axios.get(
    `${baseApi}other-job?year=${request.year}&month=${request.month}&history=${request.history}&system=${request.system}`
  );
}
function deleteOtherJob(requst) {
  return axios.delete(`${baseApi}other-job/${requst.id}`);
}

function getProject(request) {
  return axios.post(`${baseApi}projects`, request);
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

function getDailys(request) {
  return axios.post(`${baseApi}dailys`, request);
}
function getHoliday(request) {
  return axios.get(`${baseApi}holiday`);
}
function getUserInfo(request) {
  return axios.get(`${baseApi}user-info?systemId=${request}`);
}
function updateHoliday(request) {
  return axios.post(`${baseApi}holiday`, request);
}
function deleteHoliday(request) {
  return axios.delete(`${baseApi}holiday?id=${request}`);
}
function updateUserInfo(request) {
  return axios.post(`${baseApi}user-info`, request);
}
function setDaliy(request) {
  return axios.post(`${baseApi}set/daily`, request);
}
function freshServiceCache() {
  return axios.get(`${baseApi}fresh`);
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
  getDailys,
  setDaliy,
  getUserInfo,
  getHoliday,
  updateHoliday,
  updateUserInfo,
  deleteHoliday,
  updateOtherJob,
  deleteOtherJob,
  getOtherJob,
  freshServiceCache,
};
