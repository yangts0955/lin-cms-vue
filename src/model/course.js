import { post, get, put, _delete } from '@/lin/plugin/axios'

class Course {
  async createCourse(data) {
    const res = await post('v1/course', data)
    return res
  }

  async editCourse(id, info) {
    const res = await put(`v1/course/${id}`, info)
    return res
  }

  async deleteCourse(id) {
    const res = await _delete(`v1/course/${id}`)
    return res
  }

  async getAllCourses() {
    const res = await get('v1/course')
    return res
  }

  async getCourses(page, count, userId) {
    const res = await get('v1/course/list', {
      page,
      count,
      user_id: userId,
    })
    return res
  }

  async getCourse(id) {
    const res = await get(`v1/course/${id}`)
    return res
  }
}

export default new Course()
