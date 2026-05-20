var rpcInterval = null;
var patches = [];
var startTime = null;

var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
var metro = vendettaObj ? vendettaObj.metro : null;
var logger = vendettaObj ? vendettaObj.logger : console;
var commands = vendettaObj ? vendettaObj.commands : null;

var Dispatcher = metro ? (
  metro.findByProps("dispatch", "subscribe", "register") || 
  metro.findByProps("_dispatch", "subscribe")
) : null;

function applyRPC(config) {
  if (!Dispatcher) return;
  if (config.timestamp && !startTime) startTime = Date.now();
  if (!config.timestamp) startTime = null;

  var activity = {
    name: config.name,
    type: config.type !== undefined ? config.type : 0,
    details: config.details || undefined,
    state: config.state || undefined,
    application_id: "0"
  };

  if (startTime) activity.timestamps = { start: startTime };

  try {
    Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", activity: activity });
  } catch (err) {
    if (logger.error) logger.error("[CustomRPC] Lỗi RPC: " + err.message);
  }
}

function clearRPC() {
  if (!Dispatcher) return;
  startTime = null;
  try {
    Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", activity: null });
  } catch (err) {}
}

function onLoad() {
  if (!commands) return;
  var rpcCommand = commands.registerCommand({
    name: "rpc",
    description: "Bật / Tắt Custom RPC nhanh từ chat",
    options: [
      {
        name: "action",
        description: "on = bật | off = tắt",
        type: 3, 
        required: true,
        choices: [{ name: "on", value: "on" }, { name: "off", value: "off" }]
      },
      { name: "name", description: "Tên biệt hiệu game", type: 3, required: false },
      { name: "details", description: "Trạng thái hàng 1", type: 3, required: false },
      { name: "state", description: "Trạng thái hàng 2", type: 3, required: false }
    ],
    execute: function(args) {
      var get = function(name) {
        if (!args) return null;
        for (var i = 0; i < args.length; i++) {
          if (args[i].name === name) return args[i].value;
        }
        return null;
      };
      if (get("action") === "off") {
        clearRPC();
        return { content: "🔴 Custom RPC đã tắt." };
      }
      var name = get("name") || "Discord Mobile";
      applyRPC({ name: name, details: get("details"), state: get("state"), type: 0, timestamp: true });
      return { content: "✅ RPC đã bật: **" + name + "**" };
    }
  });
  patches.push(rpcCommand);
}

function onUnload() {
  clearRPC();
  for (var i = 0; i < patches.length; i++) {
    if (typeof patches[i] === "function") patches[i]();
  }
  patches = [];
}

// Hàm vẽ giao diện thô bằng React thuần không qua Compiler JSX
function Settings() {
  try {
    var React = window.purpled?.metro?.findByProps("createElement") || globalThis.React;
    var metroModules = window.purpled?.metro?.findByProps("Text", "ScrollView");
    if (React && metroModules) {
      return React.createElement(
        metroModules.ScrollView, 
        { style: { padding: 16 } }, 
        React.createElement(metroModules.Text, { style: { color: "#ffffff", fontSize: 16 } }, "⚙️ Cấu hình CustomRPC hoạt động ngon lành!")
      );
    }
  } catch (e) {}
  return null;
}

// Xuất bản đầy đủ các cổng kết nối giao diện cho Kettu nạp cấu hình
module.exports = {
  onLoad: onLoad,
  onUnload: onUnload,
  settingsComponent: Settings,
  getSettingsComponent: function() { return Settings; }
};
