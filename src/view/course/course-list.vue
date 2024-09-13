<template>
  <div>
    <div class="container" v-if="!showEdit">
      <div class="header">
        <div class="title">课程列表</div>
        <!-- 分组选择下拉框 -->
        <div class="selector">
          <el-select
            filterable
            v-model="selectedUser"
            placeholder="选择身份筛选"
            @change="handleSelectChange"
            clearable
          >
            <el-option-group v-for="group in groupUsers" :key="group.users" :label="group.role">
              <el-option
                v-for="item in group.users"
                :key="item.user_id"
                :label="item.real_name"
                :value="item.user_id"
              />
            </el-option-group>
          </el-select>
        </div>
      </div>
      <el-table
        ref="courses_table"
        :data="courses"
        v-loading="loading"
        border="false"
        @row-dblclick="toggleRowExpansion"
      >
        <el-table-column type="expand" style="overflow: hidden">
          <template #default="scope">
            <el-table :data="scope.row.schedules" border="false" style="margin-left: 30px; width: 95%">
              <el-table-column type="index" :index="indexMethod" label="课程" width="100"></el-table-column>
              <el-table-column prop="teacher_name" label="教师"></el-table-column>
              <el-table-column prop="student_names" label="学生" width="300" show-overflow-tooltip>
                <template #default="scope">
                  <div class="cell-wrap-text">
                    {{ scope.row.student_names.join(', ') }}
                  </div>
                </template></el-table-column
              >
              <el-table-column prop="course_date" label="日期"></el-table-column>
              <el-table-column label="时间">
                <template #default="scope"> {{ scope.row.start_time }} - {{ scope.row.end_time }} </template>
              </el-table-column>
              <el-table-column prop="course_status" label="状态"></el-table-column>
              <el-table-column prop="remark" label="备注"></el-table-column>
              <el-table-column label="操作" fixed="right">
                <template #default="scope">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    style="margin: 1px"
                    @click="handleScheduleDetail(scope.row.schedule_id)"
                    >详情</el-button
                  >
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    style="margin: 1px"
                    @click="handleScheduleDelete(scope.row.schedule_id)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column type="index" :index="indexMethod" label="序号" width="100"></el-table-column>
        <el-table-column prop="name" label="课程名称"></el-table-column>
        <el-table-column prop="grade_name" label="年级"></el-table-column>
        <el-table-column prop="subject_name" label="学科"></el-table-column>
        <el-table-column prop="remaining_quantity" label="剩余课时"></el-table-column>
        <el-table-column prop="profit" label="Profit"></el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain style="margin: 1px" @click="handleEdit(scope.row.course_id)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              style="margin: 1px"
              plain
              @click="handleDelete(scope.row.course_id)"
              v-permission="{ permission: '删除课程', type: 'disabled' }"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="page"
          :page-sizes="[2, 5, 10]"
          :page-size="count"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        >
        </el-pagination>
      </div>
    </div>

    <!-- 编辑页面 -->
    <course-update v-else @editClose="editClose" :editCourseId="editCourseId"></course-update>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import courseModel from '@/model/course'
import { useRouter } from 'vue-router'
import adminModel from '@/lin/model/admin'
import scheduleModel from '@/model/schedule'
import CourseUpdate from './course-create'

export default {
  components: {
    CourseUpdate,
  },
  setup() {
    const courses = ref([])
    const editCourseId = ref(1)
    const loading = ref(false)
    const showEdit = ref(false)
    const courses_table = ref(null)
    const page = ref(1)
    const count = ref(10)
    const total = ref(0)
    const router = useRouter()
    const selectedUser = ref(-1)
    const groupUsers = ref([])

    onMounted(() => {
      getTeachersAndStudents()
      getCourses()
    })

    const getCourses = async () => {
      try {
        loading.value = true
        const res = await courseModel.getCourses(page.value - 1, count.value, selectedUser.value)
        courses.value = res.records
        total.value = res.total
        loading.value = false
      } catch (error) {
        loading.value = false
        if (error.code === 10020) {
          courses.value = []
          ElMessage.error('没有权限访问该页面')
        }
      }
    }

    const getTeachersAndStudents = async () => {
      try {
        groupUsers.value = await adminModel.getTeachersAndStudents()
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    const handleSelectChange = val => {
      selectedUser.value = val
      getCourses()
    }

    const handleSizeChange = val => {
      count.value = val
      getCourses()
    }

    const handleCurrentChange = val => {
      page.value = val
      getCourses()
    }

    const handleScheduleDetail = id => {
      router.push({ path: '/schedule', query: { id } })
    }

    const handleScheduleDelete = id => {
      ElMessageBox.confirm('此操作将永久删除该日程, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const res = await scheduleModel.deleteSchedule(id)
        if (res.code < window.MAX_SUCCESS_CODE) {
          getCourses()
          ElMessage.success(`${res.message}`)
        }
      })
    }

    const handleEdit = id => {
      showEdit.value = true
      editCourseId.value = id
    }

    const handleDelete = id => {
      ElMessageBox.confirm('此操作将永久删除该课程, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const res = await courseModel.deleteCourse(id)
        if (res.code < window.MAX_SUCCESS_CODE) {
          getCourses()
          ElMessage.success(`${res.message}`)
        }
      })
    }

    const editClose = () => {
      showEdit.value = false
      getCourses()
    }

    const indexMethod = index => index + 1

    const toggleRowExpansion = row => {
      courses_table.value.toggleRowExpansion(row)
    }

    return {
      loading,
      courses,
      courses_table,
      showEdit,
      editClose,
      handleEdit,
      editCourseId,
      indexMethod,
      handleDelete,
      handleScheduleDetail,
      handleScheduleDelete,
      toggleRowExpansion,
      groupUsers,
      page,
      count,
      total,
      handleCurrentChange,
      handleSizeChange,
      handleSelectChange,
    }
  },
}
</script>

<style lang="scss" scoped>
.container {
  padding: 0 30px;
  width: auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      height: 59px;
      line-height: 59px;
      color: $parent-title-color;
      font-size: 16px;
      font-weight: 500;
    }

    .selector {
      display: flex;
      flex-direction: row;

      .el-select {
        width: 200px;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin: 20px;
  }

  .cell-wrap-text {
    white-space: normal;
    word-break: break-all;
  }
}
</style>
