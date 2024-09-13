<template>
  <div class="container">
    <div class="title" v-if="!isEdit">新建日程</div>
    <div class="title" v-else>
      <span>修改日程</span>
      <span v-if="!isPanel" class="back" @click="back"> <i class="iconfont icon-fanhui"></i> 返回 </span>
    </div>

    <div class="wrap">
      <el-row>
        <el-col :lg="16" :md="20" :sm="24" :xs="24">
          <el-form
            v-loading="loading"
            :model="schedule"
            status-icon
            ref="form"
            label-width="100px"
            @submit.prevent
            :rules="rules"
          >
            <el-form-item label="关联课程" prop="course_id">
              <el-select v-model="schedule.course_id" filterable placeholder="选择课程">
                <el-option v-for="item in courses" :key="item.course_id" :label="item.name" :value="item.course_id">
                  <span style="float: left">{{ item.name }}</span>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ subjectValue(item.subject) }}
                  </span>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ gradeValue(item.grade) }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="上课时间" prop="course_date">
              <el-date-picker
                v-model="schedule.course_date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledDate"
              >
              </el-date-picker>
              <span style="margin: 0 10px"></span>
              <div>
                <el-time-picker
                  class="course-time-picker"
                  v-model="schedule.start_time"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="开始时间"
                ></el-time-picker>
                <span style="margin: 0 10px">至</span>
                <el-time-picker
                  class="course-time-picker"
                  v-model="schedule.end_time"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="结束时间"
                ></el-time-picker>
              </div>
            </el-form-item>
            <el-form-item label="教师" prop="teacher_id">
              <el-select v-model="schedule.teacher_id" filterable placeholder="教师">
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
                v-model="schedule.student_ids"
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
            <el-form-item label="备注" prop="remark">
              <el-input clearable type="textarea" v-model="schedule.remark" maxlength="150" show-word-limit></el-input>
            </el-form-item>
            <el-form-item class="submit">
              <el-button type="primary" @click="submitForm">保 存</el-button>
              <el-button v-if="!isEdit" @click="resetForm">重 置</el-button>
              <el-button v-else type="danger" @click="deleteSchedule">删 除</el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import scheduleModel from '@/model/schedule'
import courseModel from '@/model/course'
import adminModel from '@/lin/model/admin'
import Util from '@/lin/util/util'
import { GradeEnum, SubjectEnum } from '@/lin/model/enums'
import { useRoute, useRouter } from 'vue-router'

export default {
  props: {
    isPanel: {
      type: Boolean,
      default: false,
    },
    scheduleId: {
      type: Number,
      default: undefined,
    },
    courseDateTime: {
      type: Object,
      default: undefined,
    },
  },

  setup(props, context) {
    const form = ref(null)
    const loading = ref(false)
    const teachers = ref([])
    const students = ref([])
    const courses = ref([])
    const route = useRoute()
    const router = useRouter()
    const isPanel = ref(false)
    const isEdit = ref(false)
    const scheduleId = ref(null)

    const schedule = reactive({
      id: '',
      course_date: '',
      start_time: '',
      end_time: '',
      teacher_id: '',
      teacher_name: '',
      student_ids: [],
      student_names: '',
      course_id: '',
      profit: '',
      remark: '',
      course_name: '',
      course_subject: '',
      course_grade: '',
    })

    /**
     * 表单规则验证
     */
    const { rules } = getRules()

    const getTeachers = async () => {
      try {
        teachers.value = await adminModel.getTeachers(schedule.course_subject)
      } catch (err) {
        ElMessage.error(err.message)
      }
    }

    const getStudents = async () => {
      try {
        students.value = await adminModel.getStudents(schedule.course_grade)
      } catch (err) {
        ElMessage.error(err.message)
      }
    }

    const getCourses = async () => {
      try {
        courses.value = await courseModel.getAllCourses()
      } catch (err) {
        ElMessage.error(err.message)
      }
    }

    const getCourseDetail = async courseId => {
      try {
        const res = await courseModel.getCourse(courseId)
        schedule.course_subject = res.subject
        schedule.course_grade = res.grade
        schedule.course_name = res.name
      } catch (err) {
        ElMessage.error(err.message)
      }
    }

    const gradeValue = gradeCode => GradeEnum[gradeCode]

    const subjectValue = subjectCode => SubjectEnum[subjectCode]

    onMounted(() => {
      init()
      scheduleId.value = route.query.id ? route.query.id : props.scheduleId
      if (scheduleId.value) {
        getSchedule(scheduleId.value)
        isEdit.value = true
      }
      if (props.courseDateTime) {
        schedule.course_date = props.courseDateTime.course_date
        schedule.start_time = props.courseDateTime.start_time
        schedule.end_time = props.courseDateTime.end_time
      }
      if (props.isPanel === true) {
        isPanel.value = true
      }
    })

    const getSchedule = async id => {
      resetForm()
      try {
        loading.value = true
        const res = await scheduleModel.getSchedule(id)
        Util.listAssign(schedule, res)
      } catch (err) {
        ElMessage.error(err.message)
      } finally {
        loading.value = false
      }
    }

    const init = () => {
      getTeachers()
      getStudents()
      getCourses()
      initCourseDate()
    }

    const initCourseDate = () => {
      schedule.start_time = '08:00'
      schedule.end_time = '09:00'
    }

    // 重置表单
    const resetForm = () => {
      form.value.resetFields()
      initCourseDate()
    }

    const deleteSchedule = () => {
      ElMessageBox.confirm('此操作将永久删除该日程, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const res = await scheduleModel.deleteSchedule(scheduleId.value)
        if (res.code < window.MAX_SUCCESS_CODE) {
          if (!isPanel.value) {
            back()
          } else {
            context.emit('deleted', scheduleId.value)
            resetForm()
          }
          ElMessage.success(`${res.message}`)
        }
      })
    }

    const submitForm = async formName => {
      form.value.validate(async valid => {
        if (valid) {
          let res = {}
          if (scheduleId.value) {
            res = await scheduleModel.editSchedule(scheduleId.value, schedule)
            if (isPanel.value) {
              context.emit('updated', scheduleId.value)
              resetForm()
            }
          } else {
            res = await scheduleModel.createSchedule(schedule)
            if (isPanel.value) {
              context.emit('created', res.schedule_id)
              resetForm()
            }
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
      router.push('/course/list')
    }

    watch(
      () => schedule.course_subject,
      () => {
        getTeachers()
      },
    )

    watch(
      () => schedule.course_grade,
      () => {
        getStudents()
      },
    )

    watch(
      () => schedule.course_id,
      () => {
        getCourseDetail(schedule.course_id)
      },
    )

    watch(
      () => props.scheduleId,
      () => {
        scheduleId.value = props.scheduleId
        getSchedule(scheduleId.value)
      },
    )

    return {
      back,
      form,
      rules,
      deleteSchedule,
      submitForm,
      resetForm,
      teachers,
      students,
      courses,
      loading,
      schedule,
      gradeValue,
      subjectValue,
      isEdit,
      isPanel,
    }
  },
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

  const rules = {
    teacher_id: [{ validator: checkInfo, trigger: 'blur', required: true }],
    student_ids: [{ validator: checkInfo, trigger: 'blur', required: true }],
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
