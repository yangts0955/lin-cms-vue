<template>
  <div class="container">
    <el-form
      ref="form"
      status-icon
      :rules="rules"
      :model="userInfo"
      label-width="100px"
      v-loading="loading"
      :label-position="labelPosition"
      @submit.prevent
    >
      <el-form-item label="用户名" prop="username">
        <el-input clearable v-model="userInfo.username" :disabled="isEdited" maxlength="10"></el-input>
      </el-form-item>
      <el-form-item label="姓名" prop="realName">
        <el-input clearable maxlength="20" v-model="userInfo.realName"></el-input>
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-select size="medium" v-model="userInfo.grade" placeholder="年级">
          <el-option v-for="item in grades.values" :key="item.name" :label="item.value" :value="item.name"> </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="学科" prop="subject">
        <el-select size="medium" v-model="userInfo.subject" placeholder="学科">
          <el-option v-for="item in subjects.values" :key="item.name" :label="item.value" :value="item.name">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="生日" prop="birthday">
        <el-date-picker v-model="userInfo.birthday" placeholder="选择日期" value-format="YYYY-MM-DD"> </el-date-picker>
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select size="medium" v-model="userInfo.gender" placeholder="性别">
          <el-option v-for="item in genders.values" :key="item.name" :label="item.value" :value="item.name">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="手机" prop="phoneNumber">
        <el-input clearable maxlength="11" v-model="userInfo.phoneNumber"></el-input>
      </el-form-item>
      <el-form-item label="微信" prop="wxNumber">
        <el-input clearable v-model="userInfo.wxNumber"></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input clearable type="textarea" v-model="userInfo.remark" maxlength="150" show-word-limit></el-input>
      </el-form-item>

      <el-form-item v-if="pageType === 'add'" label="密码" prop="password">
        <el-input clearable type="password" v-model="userInfo.password" auto-complete="new-password"></el-input>
      </el-form-item>
      <el-form-item v-if="pageType === 'add'" label="确认密码" prop="confirmPassword">
        <el-input clearable type="password" autocomplete="off" v-model="userInfo.confirmPassword"></el-input>
      </el-form-item>
      <el-form-item v-if="pageType !== 'password' && pageType !== 'edit'" label="选择分组">
        <el-radio-group v-model="userInfo.groupIds" style="transform: translateY(5px)">
          <el-radio
            v-for="item in allGroups"
            :key="item.id"
            :label="item.id"
            border
            style="margin-left: 0"
            @click="userInfo.role = item.name"
            >{{ item.info }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item v-show="submit" class="submit">
        <el-button type="primary" @click="submitForm">保 存</el-button>
        <el-button @click="resetForm">重 置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AdminModel from '@/lin/model/admin'
import UserModel from '@/lin/model/user'
import { GenderEnum, GradeEnum, SubjectEnum } from '@/lin/model/enums'
import { GENDER_TYPE, GRADE_TYPE, SUBJECT_TYPE } from '../../../lin/util/const'

export default {
  props: {
    submit: {
      // 表单是否显示功能按钮
      type: Boolean,
      default: true,
    },
    id: {
      // 用户id
      type: Number,
      default: undefined,
    },
    allGroups: {
      // 所有分组
      type: Array,
      default: () => {},
    },
    labelPosition: {
      // 表单label位置
      type: String,
      default: 'right',
    },
    info: {
      // 用户信息
      type: Object,
      default: () => {},
    },
    pageType: {
      type: String,
      default: 'add', // 区分编辑页面/添加页面
    },
  },
  setup(props, ctx) {
    const form = ref(null)
    const loading = ref(false)
    const isEdited = ref(false) // 能否编辑
    const genders = ref([])
    const grades = ref([])
    const subjects = ref([])

    const userInfo = reactive({
      email: '',
      username: '',
      password: '',
      realName: '',
      phoneNumber: '',
      wxNumber: '',
      remark: '',
      gender: GenderEnum.UNKNOWN,
      grade: GradeEnum.OTHER,
      subject: SubjectEnum.UNKNOWN,
      birthday: '',
      role: '',
      groupIds: [],
      confirmPassword: '',
    })
    const getGenders = async () => {
      genders.value = await UserModel.getEnums(GENDER_TYPE)
    }

    const getGrades = async () => {
      grades.value = await UserModel.getEnums(GRADE_TYPE)
    }

    const getSubjects = async () => {
      subjects.value = await UserModel.getEnums(SUBJECT_TYPE)
    }
    /**
     * 表单规则验证
     */
    const { rules } = getRules(userInfo)

    /**
     * 新增或更新管理员信息
     */
    const submitForm = () => {
      form.value.validate(async valid => {
        if (valid) {
          let res = {}
          // 1. 新增用户
          if (props.pageType === 'add') {
            try {
              loading.value = true
              if (!Array.isArray(userInfo.groupIds)) {
                userInfo.groupIds = [userInfo.groupIds]
              }
              res = await UserModel.register(userInfo)
              if (res.code < window.MAX_SUCCESS_CODE) {
                loading.value = false
                ElMessage.success(`${res.message}`)
                resetForm()
              }
            } catch (e) {
              loading.value = false
              ElMessage.error(`新增用户失败: ${e.data.message}`)
            }
          } else {
            // 2. 更新用户信息
            const originalGroupIds = props.info.groups.map(item => item.id)
            if (userInfo.groupIds.sort().toString() === originalGroupIds.toString()) {
              ctx.emit('handleInfoResult', false)
            }
            try {
              loading.value = true
              res = await AdminModel.updateOneUser(userInfo, props.id)
            } catch (e) {
              loading.value = false
            }
            if (res.code < window.MAX_SUCCESS_CODE) {
              loading.value = false
              ElMessage.success(`${res.message}`)
              ctx.emit('handleInfoResult', true)
            } else {
              loading.value = false
            }
          }
        } else {
          ElMessage.error('请填写正确的信息')
        }
      })
    }

    /**
     * reset表单内容
     */
    const resetForm = () => {
      if (props.pageType === 'edit') {
        setInitialUserInfo()
      } else {
        userInfo.groupIds = []
        form.value.resetFields()
      }
    }

    /**
     * 编辑页面设置初始值
     */
    const setInitialUserInfo = () => {
      userInfo.email = props.info.email
      userInfo.username = props.info.username
      userInfo.realName = props.info.real_name
      userInfo.phoneNumber = props.info.phone_number
      userInfo.wxNumber = props.info.wx_number
      userInfo.remark = props.info.remark
      userInfo.gender = props.info.gender
      userInfo.grade = props.info.grade
      userInfo.subject = props.info.subject
      userInfo.birthday = props.info.birthday
      userInfo.groupIds = props.info.groups.map(item => item.id)
    }

    /**
     * 通过是否接收到数据来判断当前页面是添加数据还是编辑数据
     */
    onMounted(() => {
      getGenders()
      getGrades()
      getSubjects()
      if (props.pageType === 'edit') {
        setInitialUserInfo()
        isEdited.value = true
      }
    })
    return {
      form,
      rules,
      loading,
      isEdited,
      userInfo,
      resetForm,
      submitForm,
      genders,
      grades,
      subjects,
    }
  },
}

/**
 * 表单验证规则
 */
function getRules(userInfo) {
  /**
   * 验证回调函数
   */
  const checkUserName = (rule, value, callback) => {
    if (!value) {
      callback(new Error('用户名不能为空'))
    }
    callback()
  }
  /**
   * 验证密码
   */
  const validatePassword = (rule, value, callback) => {
    if (value === '') {
      callback(new Error('请输入密码'))
    } else if (value.length < 6) {
      callback(new Error('密码长度不能少于6位数'))
    } else {
      callback()
    }
  }
  /**
   * 再次验证密码
   */
  const validatePassword2 = (rule, value, callback) => {
    if (value === '') {
      callback(new Error('请再次输入密码'))
    } else if (value !== userInfo.password) {
      callback(new Error('两次输入密码不一致!'))
    } else {
      callback()
    }
  }
  const rules = {
    password: [{ validator: validatePassword, trigger: 'blur', required: true }],
    username: [{ validator: checkUserName, trigger: ['blur', 'change'], required: true }],
    confirmPassword: [{ validator: validatePassword2, trigger: 'blur', required: true }],
    realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    grade: [{ required: true, message: '请选择年级', trigger: 'blur' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'blur' }],
    subject: [{ required: true, message: '请选择学科', trigger: 'blur' }],
    birthday: [{ required: true, message: '请选择生日', trigger: 'blur' }],
    phoneNumber: [
      { required: true, message: '请输入手机号码', trigger: 'blur' },
      {
        type: 'string',
        min: 11,
        max: 11,
        message: '请输入正确的手机号码',
        trigger: 'blur',
      },
    ],
    email: [
      {
        type: 'email',
        message: '请输入正确的邮箱地址或者不填',
        trigger: ['blur', 'change'],
      },
    ],
  }
  return { rules }
}
</script>

<style lang="scss" scoped>
.container {
  margin-top: 20px;
  margin-left: -30px;
  max-width: 800px;

  .submit {
    float: left;
  }
}
</style>
