# 基于Node.js镜像
FROM node:lts-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 复制package.json文件并安装依赖
COPY package*.json ./
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 使用Nginx作为服务器
FROM nginx:stable-alpine as production-stage

# 从构建阶段复制构建结果到Nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
