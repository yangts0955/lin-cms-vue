import { post, get, put, _delete } from '@/lin/plugin/axios'

class Schedule {
  async createSchedule(data) {
    const res = await post('v1/schedule', data)
    return res
  }

  async editSchedule(id, info) {
    const res = await put(`v1/schedule/${id}`, info)
    return res
  }

  async deleteSchedule(id) {
    const res = await _delete(`v1/schedule/${id}`)
    return res
  }

  async getSchedule(id) {
    const res = await get(`v1/schedule/${id}`)
    return res
  }

  async getAllSchedules() {
    const res = await get('v1/schedule/panel')
    return res
  }
}

export default new Schedule()
