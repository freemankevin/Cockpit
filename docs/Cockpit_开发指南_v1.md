# Cockpit 开发指南 v1.0

> 面向本地开发 & 现场部署场景的 Docker/Compose 自动化运维平台

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [模块开发规范](#4-模块开发规范)
5. [第一期功能模块详解](#5-第一期功能模块详解)
   - 5.1 用户登录 & 权限
   - 5.2 主机管理（已完成）
   - 5.3 Docker 环境安装
   - 5.4 容器管理
   - 5.5 Compose 应用部署（模版化）
   - 5.6 证书管理
   - 5.7 防火墙管理
   - 5.8 主机监控
   - 5.9 日志中心（补充）
   - 5.10 环境变量管理（补充）
   - 5.11 告警通知（补充）
   - 5.12 操作审计（补充）
6. [API 设计规范](#6-api-设计规范)
7. [数据库设计](#7-数据库设计)
8. [现场部署关键点](#8-现场部署关键点)
9. [Sprint 计划](#9-sprint-计划)
10. [参考资料](#10-参考资料)

---

## 1. 项目概述

Cockpit 是一个轻量级的自动化部署管理平台，主要面向两类场景：

- **本地开发环境**：快速拉起多个服务，统一管理本地 Docker 容器
- **现场环境部署**：在客户现场（通常是内网或弱网环境）快速部署和维护应用

### 核心设计原则

- **轻量优先**：单二进制 / 单 Docker 镜像即可部署，不依赖 K8s 等重型基础设施
- **离线可用**：支持离线镜像包，不强依赖公网
- **面向运维**：操作简单，非研发背景的运维人员也能独立使用
- **安全可控**：所有操作有迹可查，权限最小化原则

---

## 2. 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue 3 | ^3.4 | 主框架 |
| TypeScript | ^5.x | 类型安全 |
| Vite | ^5.x | 构建工具 |
| Naive UI / Arco Design | latest | UI 组件库（选一） |
| Pinia | ^2.x | 状态管理 |
| Vue Router | ^4.x | 路由 |
| xterm.js | ^5.x | 浏览器 Terminal |
| ECharts | ^5.x | 监控图表 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Go | ^1.22 | 主语言 |
| Gin / Fiber | latest | HTTP 框架 |
| GORM | ^2.x | ORM |
| SQLite / PostgreSQL | — | 数据存储（小型用 SQLite） |
| golang.org/x/crypto/ssh | — | SSH 连接主机 |
| github.com/docker/docker | — | Docker API |
| JWT (golang-jwt) | — | 认证 |

### 基础设施

- **部署方式**：单容器（`docker run`）或 `docker-compose`
- **Agent 通信**：通过 SSH 下发命令，或在目标主机安装轻量 Agent（可选）

---

## 3. 目录结构

```
Cockpit/
├── frontend/                  # Vue 3 前端
│   ├── src/
│   │   ├── api/               # 接口封装（按模块分文件）
│   │   ├── components/        # 公共组件
│   │   │   ├── Terminal/      # xterm.js 封装
│   │   │   └── MonitorChart/  # ECharts 监控图表
│   │   ├── views/             # 页面视图
│   │   │   ├── hosts/         # 主机管理（已完成）
│   │   │   ├── auth/          # 登录页
│   │   │   ├── containers/    # 容器管理
│   │   │   ├── compose/       # Compose 部署
│   │   │   ├── certs/         # 证书管理
│   │   │   ├── firewall/      # 防火墙
│   │   │   ├── monitor/       # 主机监控
│   │   │   ├── logs/          # 日志中心
│   │   │   └── settings/      # 系统设置
│   │   ├── stores/            # Pinia store
│   │   ├── router/            # 路由配置
│   │   └── utils/             # 工具函数
│   └── package.json
│
├── app/                   # Go 后端
│   ├── cmd/
│   │   └── server/main.go     # 入口
│   ├── internal/
│   │   ├── api/               # HTTP handler（按模块）
│   │   │   ├── auth/
│   │   │   ├── hosts/
│   │   │   ├── containers/
│   │   │   ├── compose/
│   │   │   ├── certs/
│   │   │   ├── firewall/
│   │   │   └── monitor/
│   │   ├── middleware/        # JWT、鉴权、审计日志
│   │   ├── model/             # 数据模型
│   │   ├── service/           # 业务逻辑
│   │   ├── ssh/               # SSH 连接池
│   │   └── docker/            # Docker API 封装
│   ├── config/                # 配置文件
│   └── go.mod
│
├── templates/                 # Compose 应用模版库
│   ├── mysql/
│   │   └── compose.yaml
│   ├── redis/
│   │   └── compose.yaml
│   ├── nginx/
│   │   └── compose.yaml
│   └── ...
│
├── docker-compose.yml         # 平台自身部署
└── Makefile
```

---

## 4. 模块开发规范

### 4.1 API 响应格式

所有接口统一返回以下结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

错误码约定：

| code | 含义 |
|------|------|
| 0 | 成功 |
| 401 | 未登录 / Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务端错误 |
| 1xxx | 业务错误（自定义） |

### 4.2 前端页面规范

- 列表页统一使用 Table + 搜索栏 + 分页
- 操作类按钮（删除、停止等）需二次确认弹窗
- 危险操作（删除主机、删除容器）使用红色按钮，并在弹窗中展示影响范围
- 所有异步操作展示 Loading 状态

### 4.3 SSH 操作规范

- 所有 SSH 命令执行前记录审计日志（操作人、目标主机、命令内容、时间）
- 命令超时统一设置 30s，长耗时操作（如 Docker 安装）使用 WebSocket 实时推送进度
- SSH 连接复用连接池，避免频繁握手

---

## 5. 第一期功能模块详解

### 5.1 用户登录 & 权限

**功能范围**

- 账号密码登录，JWT Token 认证（Access Token + Refresh Token）
- 角色划分：

| 角色 | 权限 |
|------|------|
| Admin | 所有权限，含用户管理 |
| Operator | 部署、操作容器，不能管理用户和系统设置 |
| Viewer | 只读，查看状态和日志 |

**接口设计**

```
POST /api/auth/login          # 登录
POST /api/auth/refresh        # 刷新 Token
POST /api/auth/logout         # 登出
GET  /api/users               # 用户列表（Admin）
POST /api/users               # 创建用户（Admin）
PUT  /api/users/:id           # 更新用户
DEL  /api/users/:id           # 删除用户
```

**开发要点**

- 密码使用 bcrypt 哈希存储，禁止明文
- 登录失败超过 5 次，锁定账号 10 分钟（防暴力破解）
- 首次启动自动生成 Admin 账号，密码输出到日志

---

### 5.2 主机管理（已完成）

**现有功能**：主机列表、状态展示、Terminal、SFTP

**待补充**

- 主机分组（按环境：开发/测试/现场）
- 批量操作（批量重启 Docker、批量推送文件）
- 主机连通性心跳检测（每 30s ping 一次 SSH）

---

### 5.3 Docker 环境安装

**功能范围**

- 检测目标主机是否已安装 Docker / Docker Compose
- 一键安装（支持选择版本）
- 配置镜像加速（国内环境：阿里云/USTC 镜像源）
- 离线安装包支持（上传安装包到主机再安装）

**接口设计**

```
GET  /api/hosts/:id/docker/status    # 检测 Docker 安装状态
POST /api/hosts/:id/docker/install   # 触发安装（WebSocket 推流进度）
PUT  /api/hosts/:id/docker/registry  # 配置镜像加速
```

**安装流程**（后端 SSH 执行）

```
1. 检测 OS 发行版（Ubuntu / CentOS / Debian）
2. 选择对应安装脚本
3. 配置 /etc/docker/daemon.json 镜像加速
4. systemctl enable --now docker
5. 验证 docker info
```

**开发要点**

- 安装过程通过 WebSocket 实时推送每一行输出
- 支持离线模式：预先上传 `.tar.gz` 安装包，通过 SFTP 传输后本地安装
- 记录已安装的 Docker 版本，展示在主机详情页

---

### 5.4 容器管理

**功能范围**

- 容器列表（按主机过滤）：名称、镜像、状态、端口、创建时间
- 容器操作：启动 / 停止 / 重启 / 删除 / 重建
- 查看容器日志（实时 tail）
- 进入容器 Terminal（exec -it）
- 资源用量：CPU%、内存用量（实时）
- 镜像管理：拉取、删除、导入导出（支持离线）

**接口设计**

```
GET    /api/hosts/:id/containers          # 容器列表
POST   /api/hosts/:id/containers/:cid/start
POST   /api/hosts/:id/containers/:cid/stop
POST   /api/hosts/:id/containers/:cid/restart
DELETE /api/hosts/:id/containers/:cid
GET    /api/hosts/:id/containers/:cid/logs    # WebSocket 实时日志
GET    /api/hosts/:id/containers/:cid/stats   # 资源用量
GET    /api/hosts/:id/images                  # 镜像列表
POST   /api/hosts/:id/images/pull             # 拉取镜像
POST   /api/hosts/:id/images/load             # 离线导入镜像
```

**开发要点**

- 日志接口使用 WebSocket，支持设置日志行数（默认 100 行）和实时 follow
- 容器删除前检查是否为 Compose 管理的服务，若是则提示用 Compose 操作
- 镜像离线导入：前端上传 `.tar` → 后端 SFTP 传到目标主机 → `docker load`

---

### 5.5 Compose 应用部署（模版化）

**功能范围**

- 内置模版库（MySQL、Redis、Nginx、MinIO、Postgres 等常用服务）
- 自定义模版（用户可上传保存自己的 compose.yaml）
- 变量注入：模版中使用 `${VAR}` 占位符，部署时填写实际值
- 部署状态管理：运行中 / 停止 / 异常
- 一键操作：up / down / restart / pull（更新镜像）
- 查看 compose 文件内容（可在线编辑）

**模版结构示例**

```yaml
# templates/mysql/compose.yaml
# meta:
#   name: MySQL
#   icon: mysql
#   description: MySQL 8.x 数据库
#   variables:
#     - MYSQL_ROOT_PASSWORD: Root 密码
#     - MYSQL_DATABASE: 初始数据库名
#     - DATA_PATH: 数据目录（主机路径）

services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
    volumes:
      - ${DATA_PATH}:/var/lib/mysql
    ports:
      - "3306:3306"
```

**接口设计**

```
GET  /api/templates                         # 模版列表
GET  /api/templates/:id                     # 模版详情（含变量定义）
POST /api/hosts/:id/compose/deploy          # 部署（传入模版ID + 变量值）
GET  /api/hosts/:id/compose                 # 已部署的 compose 项目列表
POST /api/hosts/:id/compose/:name/up
POST /api/hosts/:id/compose/:name/down
POST /api/hosts/:id/compose/:name/restart
POST /api/hosts/:id/compose/:name/pull      # 更新镜像
GET  /api/hosts/:id/compose/:name/file      # 查看 compose.yaml 内容
PUT  /api/hosts/:id/compose/:name/file      # 在线编辑
```

**开发要点**

- 部署路径规范：所有 compose 项目统一部署到 `/opt/cockpit/apps/{name}/`
- 变量值加密存储到数据库，支持重新部署时复用
- 支持「从已有 compose.yaml 导入」：用户在主机上已有的项目可以导入纳管
- 参考 Dockge 的 compose 编辑器交互，变量用高亮显示

---

### 5.6 证书管理

**功能范围**

- 手动上传证书（.crt + .key）
- 自动申请 Let's Encrypt 证书（DNS 或 HTTP 验证）
- 自签名证书生成
- 证书到期提醒（提前 30 天告警）
- 将证书部署到指定主机（写入到目标路径）
- 与 Nginx 容器联动（自动 reload）

**接口设计**

```
GET    /api/certs                        # 证书列表
POST   /api/certs/upload                 # 上传证书
POST   /api/certs/apply                  # 申请 Let's Encrypt
POST   /api/certs/self-signed            # 生成自签名证书
DELETE /api/certs/:id
POST   /api/certs/:id/deploy             # 部署到主机
GET    /api/certs/:id/info               # 查看证书详情（域名、有效期）
```

**开发要点**

- 证书私钥在数据库中加密存储（AES-256）
- 到期检查：启动定时任务每天检查一次，提前 30/15/7 天触发告警
- Let's Encrypt 申请使用 `golang.org/x/crypto/acme` 或调用 `certbot` 命令

---

### 5.7 防火墙管理

**功能范围**

- 查看当前防火墙规则（iptables / ufw / firewalld 自动识别）
- 可视化开放 / 关闭端口
- IP 白名单管理（允许特定 IP 访问某端口）
- 规则模版（Web 服务常用规则一键应用）
- 危险操作二次确认（防止误操作锁死 SSH）

**接口设计**

```
GET  /api/hosts/:id/firewall/rules       # 获取当前规则
POST /api/hosts/:id/firewall/rules       # 添加规则
DEL  /api/hosts/:id/firewall/rules/:rid  # 删除规则
POST /api/hosts/:id/firewall/enable
POST /api/hosts/:id/firewall/disable
```

**开发要点**

- 执行防火墙操作前，**强制检查 22 端口是否在白名单中**，防止用户把自己锁在外面
- 支持 Ubuntu（ufw）、CentOS 7（firewalld）、CentOS 8+（nftables）自动适配
- 规则变更同样记录审计日志

---

### 5.8 主机监控

**功能范围**

- 实时指标：CPU 使用率、内存使用率、磁盘 IO、网络流量
- 历史趋势图（最近 1h / 6h / 24h）
- 多主机对比视图
- 磁盘分区详情

**数据采集方案**

方案 A（无 Agent，推荐轻量场景）：定时通过 SSH 执行命令采集

```bash
# CPU
top -bn1 | grep "Cpu(s)"
# 内存
free -m
# 磁盘
df -h
# 网络
cat /proc/net/dev
```

方案 B（有 Agent，推荐生产场景）：在目标主机部署轻量 Agent（Go 编写，单二进制），通过 HTTP 上报指标

**接口设计**

```
GET /api/hosts/:id/monitor/realtime      # 实时指标（WebSocket 或轮询）
GET /api/hosts/:id/monitor/history       # 历史数据（?period=1h&metric=cpu）
GET /api/hosts/:id/monitor/disk          # 磁盘分区详情
```

**开发要点**

- 采集频率：实时页面 5s 刷新，历史数据 60s 采样一次
- 历史数据保留 7 天（可配置），超期自动清理
- ECharts 折线图，支持时间范围选择器

---

### 5.9 日志中心（补充建议）

**功能范围**

- 容器日志：实时 tail + 关键词搜索 + 时间范围筛选
- 系统日志：`/var/log/syslog`、`journalctl` 等
- 日志下载（导出为 .log 文件）

**接口设计**

```
GET /api/hosts/:id/logs/containers/:cid    # 容器日志（WebSocket）
GET /api/hosts/:id/logs/system             # 系统日志
GET /api/hosts/:id/logs/export             # 日志下载
```

**开发要点**

- 日志不落库，实时通过 SSH 或 Docker API 获取
- 前端使用虚拟滚动（Virtual Scroll），避免大日志量卡顿
- 搜索支持正则表达式，高亮匹配行

---

### 5.10 环境变量管理（补充建议）

**功能范围**

- 以「项目」为单位管理 `.env` 文件
- 变量加密存储，敏感值脱敏展示（`****`）
- 同步到指定主机（生成 `.env` 文件到目标路径）
- 变量版本历史（可回滚）

**接口设计**

```
GET    /api/envsets                         # 变量集列表
POST   /api/envsets                         # 创建变量集
GET    /api/envsets/:id                     # 变量详情
PUT    /api/envsets/:id                     # 更新变量
POST   /api/envsets/:id/sync                # 同步到主机（SFTP 写入 .env）
GET    /api/envsets/:id/history             # 历史版本
```

---

### 5.11 告警通知（补充建议）

**功能范围**

- 告警规则配置：指标 + 阈值 + 持续时间（如：CPU > 90% 持续 5 分钟）
- 通知渠道：钉钉 Webhook、飞书 Webhook、邮件（SMTP）
- 告警历史记录
- 证书到期告警（复用证书管理模块）
- 容器异常退出告警

**接口设计**

```
GET    /api/alerts/rules                    # 规则列表
POST   /api/alerts/rules                    # 创建规则
PUT    /api/alerts/rules/:id
DELETE /api/alerts/rules/:id
GET    /api/alerts/history                  # 告警历史
POST   /api/alerts/channels/test            # 测试通知渠道
```

---

### 5.12 操作审计（补充建议）

**功能范围**

- 记录所有变更类操作（创建/删除/修改/部署/SSH命令）
- 字段：操作人、目标主机、操作类型、详情、IP 来源、时间、结果
- 支持按时间、操作人、主机筛选
- 审计日志只读，Admin 可导出

**接口设计**

```
GET /api/audit/logs                         # 审计日志列表（分页+筛选）
GET /api/audit/logs/export                  # 导出 CSV
```

**开发要点**

- 通过 Gin 中间件自动记录，无需业务层手动埋点
- 写入数据库，不可删除（Admin 也无删除接口）

---

## 6. API 设计规范

### 基础路由结构

```
/api/auth/...                # 认证相关
/api/users/...               # 用户管理
/api/hosts/...               # 主机操作（含容器、监控、日志等子资源）
/api/templates/...           # Compose 模版库
/api/certs/...               # 证书管理
/api/envsets/...             # 环境变量集
/api/alerts/...              # 告警规则
/api/audit/...               # 审计日志
/ws/...                      # WebSocket（Terminal、日志、进度推流）
```

### WebSocket 消息格式

```json
// 服务端推送
{ "type": "output", "data": "Installing docker...\n" }
{ "type": "done",   "data": "success" }
{ "type": "error",  "data": "Connection refused" }
```

---

## 7. 数据库设计

### 核心表概览

```sql
-- 用户
users (id, username, password_hash, role, last_login, created_at)

-- 主机
hosts (id, name, ip, port, username, auth_type, private_key, password, status, created_at)

-- Compose 项目
compose_projects (id, host_id, name, path, template_id, variables_json, status, deployed_at)

-- 证书
certs (id, domain, cert_pem, key_pem_encrypted, expires_at, auto_renew, created_at)

-- 环境变量集
envsets (id, name, host_id, vars_json_encrypted, version, created_at)

-- 告警规则
alert_rules (id, host_id, metric, operator, threshold, duration, channel, enabled)

-- 告警历史
alert_history (id, rule_id, triggered_at, resolved_at, message)

-- 审计日志
audit_logs (id, user_id, host_id, action, detail, source_ip, result, created_at)
```

---

## 8. 现场部署关键点

### 离线部署支持

现场环境通常无公网访问，需要提前准备：

1. **平台本身**：打包为单一 Docker 镜像（`cockpit:latest.tar`），现场 `docker load` 导入
2. **应用镜像**：提前在有网环境 `docker save` 导出，现场通过平台的「离线导入镜像」功能上传
3. **Docker 安装包**：提前下载对应 OS 版本的离线安装包（`.deb` 或 `.rpm`），放入平台的安装包仓库

### 私有 Registry 支持

```yaml
# 平台配置文件支持配置私有仓库
registry:
  - url: "registry.company.com"
    username: "admin"
    password: "xxx"
    insecure: true       # 允许 HTTP（内网场景）
```

### 网络适配

- 部署时 `docker-compose.yml` 中的端口映射默认绑定 `127.0.0.1`，需要现场确认是否需要对外暴露
- 提供「网络检测」工具：检查目标主机与平台的网络连通性、常用端口是否被占用

---

## 9. Sprint 计划

### Sprint 1（2 周）：基础可用

- [x] 主机管理（已完成）
- [ ] 用户登录 & JWT 认证
- [ ] Docker 环境一键安装
- [ ] 容器管理（列表 / 启停 / 日志）

### Sprint 2（2 周）：核心部署

- [ ] Compose 模版库（内置 5 个常用模版）
- [ ] Compose 部署 & 管理（up/down/restart）
- [ ] 主机监控（CPU/内存/磁盘实时 + 24h 历史）
- [ ] 日志中心（容器日志实时查看）

### Sprint 3（2 周）：安全运维完善

- [ ] 证书管理（上传 + 自签 + 到期提醒）
- [ ] 防火墙管理
- [ ] 环境变量管理
- [ ] 告警通知（钉钉/飞书）
- [ ] 操作审计

---

## 10. 参考资料

| 项目 | 参考点 |
|------|--------|
| [1Panel](https://github.com/1Panel-dev/1Panel) | 证书管理、防火墙、整体架构 |
| [Portainer](https://github.com/portainer/portainer) | 容器管理 UI 交互设计 |
| [Dockge](https://github.com/louislam/dockge) | Compose 可视化编辑器 |
| [Uptime Kuma](https://github.com/louislam/uptime-kuma) | 告警通知渠道设计 |
| [Netdata](https://github.com/netdata/netdata) | 主机监控指标采集 |

---

*最后更新：2026-03-26 | Cockpit v1.0 开发规划*
