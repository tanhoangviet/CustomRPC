var patches = [];
var startTime = null;

// ─── Thao tác an toàn với biến Global của Client Mod ───────────────────────
var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
var metro = vendettaObj ? vendettaObj.metro : null;
var logger = vendettaObj ? vendettaObj.logger : console;
var commands = vendettaObj ? vendettaObj.commands : null;

// Lấy luồng FluxDispatcher an toàn từ thư viện chung
var commonModules = metro ? metro.common : null;
var Dispatcher = commonModules && commonModules.Flux ? commonModules.Flux.Dispatcher : (
  metro ? (metro.findByProps("dispatch", "subscribe", "register") || metro.findByProps("_dispatch", "subscribe")) : null
);

if (!Dispatcher) {
  logger.error("[CustomRPC] FATAL: Không tìm thấy FluxDispatcher!");
}

// ─── Core: Gửi RPC lên Discord ──────────────────────────────────────────────
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
    logger.error("[CustomRPC] Lỗi gửi activity: " + err.message);
  }
}

// ─── Core: Xóa RPC ──────────────────────────────────────────────────────────
function clearRPC() {
  if (!Dispatcher) return;
  startTime = null;
  try {
    Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", activity: null });
  } catch (err) {}
}

// ─── Hàm Khởi Chạy Plugin (onLoad) ─────────────────────────────────────────
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
      { name: "name", description: "Tên trạng thái game", type: 3, required: false },
      { name: "details", description: "Chi tiết dòng 1", type: 3, required: false },
      { name: "state", description: "Chi tiết dòng 2", type: 3, required: false }
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

// ─── Hàm Tắt Plugin (onUnload) ─────────────────────────────────────────────
function onUnload() {
  clearRPC();
  for (var i = 0; i < patches.length; i++) {
    if (typeof patches[i] === "function") patches[i]();
  }
  patches = [];
}

// ─── Giao diện cấu hình Settings kết nối trực tiếp với Core React Native ───
function SettingsComponent() {
  try {
    var React = (commonModules && commonModules.React) || window.React || globalThis.React;
    var ReactNative = (commonModules && commonModules.ReactNative) || (metro && metro.findByProps("Text", "ScrollView"));
    
    if (React && ReactNative) {
      return React.createElement(
        ReactNative.ScrollView, 
        { style: { padding: 16 } }, 
        React.createElement(ReactNative.Text, { style: { color: "#ffffff", fontSize: 16 } }, "⚙️ Cấu hình CustomRPC hoạt động ngon lành!")
      );
    }
  } catch (e) {
    logger.error("[CustomRPC] Lỗi nạp UI Settings: " + e.message);
  }
  return null;
}

// Đóng gói xuất ra cho loader đọc cấu hình
var pluginObject = {
  onLoad: onLoad,
  onUnload: onUnload,
  settings: SettingsComponent,          // Định dạng chuẩn cho Vendetta/Bunny
  settingsComponent: SettingsComponent   // Định dạng dự phòng cho Kettu
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = pluginObject;
}
pluginObject;
