# 数字孪生原型

基于 `three.js`、`mqtt.js` 和 `React Flow` 的最小可运行原型，目标是验证以下三块能力：

- 3D 设备场景预览
- MQTT 实时消息接入
- 类似 UE5 蓝图的节点式编排界面

## 启动

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

## 当前原型能力

- three.js 场景中内置三个示例设备
- 设备状态支持颜色映射
- 支持通过 `mqtt.js` 连接 WebSocket MQTT Broker
- 支持注入模拟消息验证状态更新
- 右侧使用 `React Flow` 搭建最小蓝图编排界面

## MQTT 消息格式

订阅主题默认是：

```text
demo/digital-twin/device
```

消息体示例：

```json
{
  "id": "pump-001",
  "temperature": 91,
  "status": "alarm"
}
```

## 下一步建议

- 接入真实 `glb/gltf` 工厂或设备模型
- 为节点系统增加条件判断、阈值告警、发布消息、公式计算节点
- 将蓝图图结构持久化为 JSON
- 增加后端中间层，处理权限、数据清洗和历史数据
