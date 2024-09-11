const courseRouter = {
  route: null,
  name: null,
  title: '课程管理',
  type: 'folder', // 类型: folder, tab, view
  icon: 'iconfont icon-course-manager',
  isElementIcon: false,
  filePath: 'view/course/', // 文件路径
  order: null,
  inNav: true,
  children: [
    {
      title: '课程面板',
      type: 'view',
      name: 'CoursePanel',
      route: '/course/panel',
      filePath: 'view/course/course-panel.vue',
      inNav: true,
      icon: 'iconfont icon-add',
      isElementIcon: false,
    },
    {
      title: '课程列表',
      type: 'view',
      name: 'CourseList',
      route: '/course/list',
      filePath: 'view/course/course-list.vue',
      inNav: true,
      icon: 'iconfont icon-add',
      isElementIcon: false,
    },
    {
      title: '添加课程',
      type: 'view',
      name: 'CourseAdd',
      route: '/course/add',
      filePath: 'view/course/course-create.vue',
      inNav: true,
      icon: 'iconfont icon-add',
      isElementIcon: false,
    },
  ],
}

export default courseRouter
