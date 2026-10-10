import axios from "axios";
import { ENV_CONFIG, URL_CLICKUP_API } from "../constants/index.contants.ts";

const { CLICKUP_API_TOKEN } = ENV_CONFIG;

export const taskUrl = (task: any) => {
  return task.url || `https://app.clickup.com/t/${task.id}`;
}

export const getTask = async (taskId: any) => {
  const response = await axios.get(
    `${URL_CLICKUP_API}/task/${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: CLICKUP_API_TOKEN },
      timeout: 8000,
    },
  );

  return response.data;
}
