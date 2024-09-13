<script>
import { defineComponent, onMounted, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import adminModel from '@/lin/model/admin'
import scheduleModel from '@/model/schedule'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import schedule from '../schedule/schedule.vue'

export default defineComponent({
  components: {
    FullCalendar,
    schedule,
  },
  setup() {
    // const selectedUser = ref(-1);
    const groupUsers = ref([])
    const drawer = ref(false)
    const loading = ref(false)

    // todo: 根据老师和学生筛选课程
    // const handleSelectChange = (val) => {
    //   selectedUser.value = val;
    // };

    const getTeachersAndStudents = async () => {
      try {
        groupUsers.value = await adminModel.getTeachersAndStudents()
      } catch (error) {
        console.log(error.message)
      }
    }
    onMounted(() => {
      getTeachersAndStudents()
    })

    return {
      // handleSelectChange,
      groupUsers,
      drawer,
      loading,
    }
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridYear,timeGridWeek,listMonth',
        },
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        },
        businessHours: {
          startTime: '08:00',
          endTime: '22:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        },
        initialView: 'timeGridWeek',
        views: {
          dayGridMonth: {
            selectable: false,
          },
          listMonth: {
            buttonText: 'week list',
          },
          timeGridWeek: {
            displayEventTime: false,
          },
        },
        initialEvents: this.initSchedules,
        allDaySlot: false,
        scrollTime: '08:00:00',
        slotLabelInterval: '01:00:00',
        slotMinTime: '06:00:00',
        editable: false,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        aspectRatio: 2,
        dateClick: this.handleDateClick,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventsSet: this.handleEvents,
        eventContent: this.handleEventContent,
        eventRemove: this.handleScheduleRemove,
        currentScheduleId: undefined,
        currentCourseDateTime: undefined,
      },
      currentEvents: [],
    }
  },
  methods: {
    async initSchedules() {
      try {
        this.loading = true
        return await scheduleModel.getAllSchedules()
      } catch (error) {
        console.log(error.message)
      } finally {
        this.loading = false
      }
    },
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends
    },
    handleDateSelect(selectInfo) {
      const currentView = this.$refs.calendar.getApi().view.type
      if (currentView === 'timeGridWeek' || currentView === 'listMonth') {
        const startDateTime = dayjs(selectInfo.startStr)
        this.drawer = true
        this.currentScheduleId = null
        this.currentCourseDateTime = new Object({
          course_date: startDateTime.format('YYYY-MM-DD'),
          start_time: startDateTime.format('HH:mm'),
          end_time: dayjs(selectInfo.endStr).format('HH:mm'),
        })
      }
    },
    handleEventClick(clickInfo) {
      const currentView = this.$refs.calendar.getApi().view.type
      if (currentView === 'timeGridWeek' || currentView === 'listMonth') {
        this.drawer = true
        this.currentScheduleId = clickInfo.event.id
      }
    },
    handleEvents(events) {
      this.currentEvents = events
    },
    handleDateClick(clickInfo) {
      const currentView = this.$refs.calendar.getApi().view.type
      if (currentView === 'dayGridYear') {
        const calendarApi = clickInfo.view.calendar
        calendarApi.changeView('timeGridWeek', clickInfo.dateStr)
      }
    },
    async handleScheduleRemove(arg) {
      try {
        await scheduleModel.deleteSchedule(arg.event.id)
      } catch (error) {
        ElMessage.error(error.message)
      }
    },
    async getScheduleById(scheduleId) {
      try {
        return await scheduleModel.getScheduleForPanel(scheduleId)
      } catch (error) {
        ElMessage.error(error.message)
      }
    },
    handleCalendarEventDelete(scheduleArgId) {
      const events = this.currentEvents.filter(event => event.id === scheduleArgId)
      events[0].remove()
      this.drawer = false
    },
    async handleCalendarEventUpdate(scheduleArgId) {
      try {
        this.loading = true
        const events = this.currentEvents.filter(event => event.id === scheduleArgId)
        const scheduleArg = await this.getScheduleById(scheduleArgId)
        events[0].setExtendedProp('name', scheduleArg.name)
        events[0].setExtendedProp('grade', scheduleArg.grade)
        events[0].setExtendedProp('subject', scheduleArg.subject)
        events[0].setExtendedProp('teacher', scheduleArg.teacher)
        events[0].setStart(new Date(scheduleArg.start))
        events[0].setEnd(new Date(scheduleArg.end))
        this.drawer = false
      } catch (error) {
        ElMessage.error(error.message)
      } finally {
        this.loading = false
      }
    },
    async handleCalendarEventCreate(scheduleArgId) {
      try {
        this.loading = true
        const scheduleArg = await this.getScheduleById(scheduleArgId)
        const newEvent = {
          id: scheduleArg.id,
          start: new Date(scheduleArg.start),
          end: new Date(scheduleArg.end),
          extendedProps: {
            name: scheduleArg.name,
            grade: scheduleArg.grade,
            subject: scheduleArg.subject,
            teacher: scheduleArg.teacher,
          },
        }
        this.$refs.calendar.getApi().addEvent(newEvent)
        this.drawer = false
      } catch (error) {
        ElMessage.error(error.message)
      } finally {
        this.loading = false
      }
    },
    handleEventContent(arg) {
      const { type } = this.$refs.calendar.getApi().view
      if (type === 'timeGridWeek') {
        const italicEl = document.createElement('div')
        italicEl.style.padding = '5px'
        const nameEl = document.createElement('div')
        nameEl.innerHTML = arg.event.extendedProps.name
        nameEl.style.fontWeight = 'bold'
        italicEl.append(nameEl)
        const text1El = document.createElement('p')
        text1El.innerHTML = `${arg.event.extendedProps.grade} ${arg.event.extendedProps.subject}`
        text1El.style.marginTop = '5px'
        text1El.style.whiteSpace = 'nowrap'
        text1El.style.overflow = 'hidden'
        text1El.style.textOverflow = 'ellipsis'
        text1El.style.width = '100%'
        italicEl.append(text1El)
        const text2El = document.createElement('p')
        text2El.innerHTML = arg.event.extendedProps.teacher
        italicEl.append(text2El)
        italicEl.setAttribute('class', 'plan_card')
        return { domNodes: [italicEl] }
      } if (type === 'listMonth') {
        const italicEl = document.createElement('div')
        const nameEl = document.createElement('div')
        nameEl.innerHTML = `${arg.event.extendedProps.name}&nbsp;&nbsp;&nbsp;&nbsp;${arg.event.extendedProps.grade}&nbsp;${arg.event.extendedProps.subject}`
        nameEl.style.fontSize = '1em'
        nameEl.style.whiteSpace = 'nowrap'
        nameEl.style.overflow = 'hidden'
        nameEl.style.textOverflow = 'ellipsis'
        nameEl.style.width = '100%'
        italicEl.append(nameEl)
        return { domNodes: [italicEl] }
      }
      return null
    },
  },
})
</script>
<template>
  <div class="container" v-if="!showEdit">
    <div class="calendar-container">
      <div class="header">
        <div class="title">课程面板</div>
        <!-- 分组选择下拉框 -->
        <div class="selector">
          <!-- <el-select
            filterable
            v-model="selectedUser"
            placeholder="选择身份筛选"
            @change="handleSelectChange"
            clearable
          >
            <el-option-group
              v-for="group in groupUsers"
              :key="group.users"
              :label="group.role"
            >
              <el-option
                v-for="item in group.users"
                :key="item.user_id"
                :label="item.real_name"
                :value="item.user_id"
              />
            </el-option-group>
          </el-select> -->
        </div>
      </div>
      <div class="calendar-main">
        <FullCalendar v-loading="loading" class="course-calendar" :options="calendarOptions" ref="calendar">
          <template v-slot:eventContent="arg">
            <b>{{ arg.timeText }}</b>
            <i>{{ arg.event.title }}</i>
          </template>
        </FullCalendar>
      </div>
      <el-drawer v-model="drawer" title="日程详情" size="33%" :with-header="false">
        <schedule
          :scheduleId="currentScheduleId"
          :isPanel="true"
          :courseDateTime="currentCourseDateTime"
          @deleted="handleCalendarEventDelete"
          @updated="handleCalendarEventUpdate"
          @created="handleCalendarEventCreate"
        />
      </el-drawer>
    </div>
  </div>
</template>
<style lang="scss">
.container {
  padding: 0 30px;

  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    .title {
      height: 59px;
      line-height: 59px;
      color: $parent-title-color;
      font-size: 16px;
      font-weight: 500;
      text-indent: 40px;
      border-bottom: 1px solid #dae1ec;
    }

    .selector {
      display: flex;
      flex-direction: row;

      .el-select {
        width: 200px;
      }
    }
  }
}
.calendar-main {
  flex-grow: 1;
  margin: 1em;
  padding-inline: 2em;
  box-sizing: border-box;
}

.fullcalendar-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fc {
  --fc-event-bg-color: #cadffb;
  --fc-event-border-color: #000000;
  --fc-event-text-color: #000000;
  --fc-button-bg-color: #ffffff;
  --fc-button-border-color: #000000;
  --fc-button-text-color: #000000;
  --fc-button-active-bg-color: #cadffb;
  --fc-button-active-border-color: #000000;
  --fc-button-active-text-color: #000000;
  --fc-page-bg-color: #ffffff;
  --fc-border-color: rgba(20, 38, 82, 0.25);
  --fc-today-bg-color: #ebf2f8;
  --fc-today-bg-color-alpha: 0.1;
  --fc-non-business-color: rgba(217, 222, 226, 0.5);
}

.fc .fc-timegrid-slot {
  font-variant: JIS83;
  border-bottom: 0px;
  height: 2.4em;
}

.fc .fc-col-header-cell {
  height: 4em;
  line-height: 4em;
}

.fc .fc-col-header-cell .fc-col-header-cell-cushion {
  font-weight: bold;
  font-size: 1.2em;
}

.fc-list-table .fc-list-event-dot {
  display: flex;
}

.fc-direction-ltr .fc-list-table .fc-list-event-graphic {
  padding-right: 0px;
  vertical-align: middle;
}
</style>
