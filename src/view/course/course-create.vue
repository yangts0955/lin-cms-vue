<template>
  <div class="container">
    <div class="title" v-if="!editCourseId">新建课程</div>
    <div class="title" v-else>
      <span>修改课程</span>
      <span class="back" @click="back"> <i class="iconfont icon-fanhui"></i> 返回 </span>
    </div>

    <div class="wrap">
      <el-row>
        <el-col :lg="16" :md="20" :sm="24" :xs="24">
          <el-form :model="course" status-icon ref="form" label-width="100px" @submit.prevent :rules="rules">
            <el-form-item label="课程名字" prop="name">
              <el-input v-model="course.name" placeholder="请填写课程名字"></el-input>
            </el-form-item>
            <el-form-item label="年级" prop="grade">
              <el-select size="medium" v-model="course.grade" placeholder="年级">
                <el-option v-for="item in grades.values" :key="item.name" :label="item.value" :value="item.name">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="学科" prop="subject">
              <el-select size="medium" v-model="course.subject" placeholder="学科">
                <el-option v-for="item in subjects.values" :key="item.name" :label="item.value" :value="item.name">
                </el-option>
              </el-select>
            </el-form-item>
            <div v-if="!editCourseId">
              <el-form-item label="教师" prop="teacher_id">
                <el-select v-model="course.teacher_id" filterable placeholder="教师">
                  <el-option v-for="item in teachers" :key="item.id" :label="item.real_name" :value="item.id">
                    <span style="float: left">{{ item.real_name }}</span>
                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                      {{ item.subject_name }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="学生" prop="student_ids">
                <el-select
                  v-model="course.student_ids"
                  filterable
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  max-collapse-tags="6"
                  placeholder="学生"
                >
                  <el-option v-for="item in students" :key="item.id" :label="item.real_name" :value="item.id">
                    <span style="float: left">{{ item.real_name }}</span>
                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                      {{ item.grade_name }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="开课日期" prop="start_date">
                <el-date-picker
                  v-model="course.start_date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate"
                >
                </el-date-picker>
              </el-form-item>
              <el-form-item label="课时数量" prop="quantity">
                <el-input-number
                  v-model="course.quantity"
                  placeholder="课时数量"
                  max="99"
                  min="1"
                  style="height: 30px"
                ></el-input-number>
              </el-form-item>
              <el-form-item label="上课时间" prop="course_date_times">
                <div v-for="(time, index) in course.course_date_times" :key="index" class="course-time-row">
                  <el-select
                    class="course-day-select"
                    size="medium"
                    v-model="time.course_day"
                    placeholder="周"
                    style="width: 200px; padding-right: 10px"
                  >
                    <el-option
                      v-for="item in weekDays"
                      :key="item.value"
                      :label="item.name"
                      :value="item.value"
                    ></el-option>
                  </el-select>
                  <el-time-picker
                    class="course-time-picker"
                    v-model="time.start_time"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="开始时间"
                  ></el-time-picker>
                  <span style="margin: 0 10px">至</span>
                  <el-time-picker
                    class="course-time-picker"
                    v-model="time.end_time"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="结束时间"
                  ></el-time-picker>
                  <el-button
                    v-if="course.course_date_times.length > 1"
                    class="delete-time-button"
                    type="danger"
                    size="mini"
                    plain
                    @click="course.course_date_times.splice(index, 1)"
                    >删除</el-button
                  >
                </div>
                <el-button type="button" @click="addCourseDateTime">添加上课时间</el-button>
              </el-form-item>
            </div>
            <el-form-item label="备注" prop="remark">
              <el-input clearable type="textarea" v-model="course.remark" maxlength="150" show-word-limit></el-input>
            </el-form-item>
            <el-form-item class="submit">
              <el-button type="primary" @click="submitForm">保 存</el-button>
              <el-button @click="resetForm">重 置</el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import courseModel from '@/model/course'
import userModel from '@/lin/model/user'
import adminModel from '@/lin/model/admin'
import { WeekDayEnum } from '@/lin/model/enums'
import Util from '@/lin/util/util'
import { GRADE_TYPE, SUBJECT_TYPE } from '../../lin/util/const'

export default {
  props: {
    editCourseId: {
      type: Number,
      default: null,
    },
  },
  setup(props, context) {
    const form = ref(null)
    const loading = ref(false)
    const grades = ref([])
    const subjects = ref([])
    const teachers = ref([])
    const students = ref([])
    const weekDays = ref([])

    const course = reactive({
      name: '',
      subject: '',
      grade: '',
      teacher_id: '',
      student_ids: [],
      start_date: '',
      quantity: 0,
      remark: '',
      course_date_times: [
        {
          start_time: '',
          end_time: '',
          course_day: '',
        },
      ],
    })

    /**
     * 表单规则验证
     */
    const { rules } = getRules()

    const getGrades = async () => {
      grades.value = await userModel.getEnums(GRADE_TYPE)
    }

    const getSubjects = async () => {
      subjects.value = await userModel.getEnums(SUBJECT_TYPE)
    }

    const getTeachers = async () => {
      teachers.value = await adminModel.getTeachers(course.subject)
    }

    const getStudents = async () => {
      students.value = await adminModel.getStudents(course.grade)
    }

    const getWeekDay = () => {
      weekDays.value = Object.keys(WeekDayEnum).map(key => ({
        value: key,
        name: WeekDayEnum[key],
      }))
    }

    function addCourseDateTime() {
      course.course_date_times.push({
        start_time: '08:00',
        end_time: '09:00',
        course_day: '',
      })
    }

    onMounted(() => {
      init()
      if (props.editCourseId) {
        getCourse()
      }
    })

    const getCourse = async () => {
      loading.value = true
      const res = await courseModel.getCourse(props.editCourseId)
      Util.listAssign(course, res)
      loading.value = false
    }

    const init = () => {
      getGrades()
      getSubjects()
      getTeachers()
      getStudents()
      getWeekDay()
      initCourseDateTimes()
    }

    const initCourseDateTimes = () => {
      course.course_date_times = [
        {
          start_time: '08:00',
          end_time: '09:00',
          course_day: '',
        },
      ]
    }

    // 重置表单
    const resetForm = () => {
      form.value.resetFields()
      initCourseDateTimes()
    }

    const disabledDate = date => isDateBeforeToday(date)

    const submitForm = async formName => {
      form.value.validate(async valid => {
        if (valid) {
          let res = {}
          if (props.editCourseId) {
            res = await courseModel.editCourse(props.editCourseId, course)
            context.emit('editClose')
          } else {
            res = await courseModel.createCourse(course)
            resetForm(formName)
          }
          if (res.code < window.MAX_SUCCESS_CODE) {
            ElMessage.success(`${res.message}`)
          }
        } else {
          console.error('error submit!!')
        }
      })
    }

    const back = () => {
      context.emit('editClose')
    }

    watch(
      () => course.subject,
      () => {
        getTeachers()
      },
    )

    watch(
      () => course.grade,
      () => {
        getStudents()
      },
    )

    return {
      back,
      form,
      rules,
      resetForm,
      submitForm,
      course,
      grades,
      subjects,
      teachers,
      students,
      weekDays,
      addCourseDateTime,
      disabledDate,
    }
  },
}

function isDateBeforeToday(date) {
  // 获取今天的日期，忽略时间部分
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const comparedDate = new Date(date)
  comparedDate.setHours(0, 0, 0, 0)
  return comparedDate < today
}

/**
 * 表单验证规则
 */
function getRules() {
  /**
   * 验证回调函数
   */
  const checkInfo = (rule, value, callback) => {
    if (Util.isEmpty(value)) {
      callback(new Error('信息不能为空'))
    }
    callback()
  }

  const checkCourseDay = (rule, value, callback) => {
    if (Util.isEmpty(value)) {
      callback(new Error('请选择上课时间'))
    }
    for (const index in value) {
      if (Util.isEmpty(value[index].course_day)) {
        callback(new Error('请选择上课时间'))
        break
      }
    }
    for (const index in value) {
      if (Util.isEmpty(value[index].start_time) || Util.isEmpty(value[index].end_time)) {
        callback(new Error('请选择上课时间'))
      }
      if (value[index].start_time >= value[index].end_time) {
        callback(new Error('开始时间不能晚于结束时间'))
        break
      }
    }

    callback()
  }

  const checkStartDate = (rule, value, callback) => {
    if (Util.isEmpty(value)) {
      callback(new Error('请选择开课日期'))
    }
    if (isDateBeforeToday(value)) {
      callback(new Error('开课日期不能早于今天'))
    }
    callback()
  }

  const rules = {
    name: [{ validator: checkInfo, trigger: 'blur', required: true }],
    subject: [{ validator: checkInfo, trigger: 'blur', required: true }],
    grade: [{ validator: checkInfo, trigger: 'blur', required: true }],
    teacher_id: [{ validator: checkInfo, trigger: 'blur', required: true }],
    student_ids: [{ validator: checkInfo, trigger: 'blur', required: true }],
    start_date: [{ validator: checkStartDate, trigger: 'blur', required: true }],
    quantity: [{ validator: checkInfo, trigger: 'blur', required: true }],
    course_date_times: [{ validator: checkCourseDay, trigger: 'blur', required: true }],
  }
  return { rules }
}
</script>

<style lang="scss" scoped>
.container {
  .title {
    height: 59px;
    line-height: 59px;
    color: $parent-title-color;
    font-size: 16px;
    font-weight: 500;
    text-indent: 40px;
    border-bottom: 1px solid #dae1ec;

    .back {
      float: right;
      margin-right: 40px;
      cursor: pointer;
    }
  }

  .wrap {
    padding: 20px;

    .course-time-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      width: 100%;
    }

    .delete-time-button {
      margin-left: 10px;
    }
  }

  .submit {
    float: left;
  }
}
</style>
