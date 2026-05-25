# 数字孪生原型

基于 `three.js`、`mqtt.js`、`React Flow` 和 `Zustand` 的前端数字孪生原型，用于验证以下能力：

- 3D 设备场景预览
- MQTT 实时消息接入
- 类似 UE 蓝图的节点式执行引擎
- 本地保存 / JSON 导入导出 / 运行日志调试

## 启动

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

## 当前能力

- three.js 场景内置三个示例设备
- 支持通过 `mqtt.js` 连接 WebSocket MQTT Broker
- 蓝图节点支持拖拽创建、连线、属性编辑
- 运行时支持 `Inject`、`MQTT Subscribe`、`MQTT Publish`、`Filter`、`Map`、`Update 3D Device`、`Logger`
- 蓝图可保存到 `localStorage`
- 蓝图可导出 / 导入 JSON
- 日志面板可查看执行轨迹和错误

## MQTT Blueprint 系统

使用方式：

1. 在右侧 `Node Palette` 中拖拽节点到画布
2. 选中节点，在 `Inspector` 中填写 topic、映射、deviceId 等配置
3. 使用连线把节点串成流程
4. 点击 `Run`，让蓝图进入运行状态
5. 通过 `Inject` 节点或真实 MQTT 消息触发流程
6. 在左侧 3D 场景和下方 `Logs` 中观察运行结果

### 支持的节点

- `MQTT Subscribe`
- `MQTT Publish`
- `Inject`
- `Filter`
- `Map`
- `Update 3D Device`
- `Logger`

### 设备受控属性

`Update 3D Device` 首版只允许更新：

- `status`
- `temperature`
- `color`
- `position`

## MQTT 消息示例

默认高温告警消息：

```json
{
  "id": "pump-001",
  "temperature": 91,
  "status": "alarm",
  "color": "#db4f54"
}
```

可用于触发的 Topic 示例：

```text
devices/pump-001/status
```

## 后续方向

- 接入真实 `glb/gltf` 模型
- 增加 `Timer`、`Delay`、`Alert`、`Animation` 等节点
- 为 `Map` 和 `Filter` 增加更细的可视化配置器
- 将蓝图与历史数据、权限控制、后端规则服务打通
