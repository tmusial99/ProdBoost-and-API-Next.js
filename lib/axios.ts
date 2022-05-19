import axiosDefault from "axios";

const axios = axiosDefault.create({
    baseURL: process.env.AXIOS_URL,
});
export default axios