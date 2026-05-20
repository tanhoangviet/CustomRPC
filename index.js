var rpcInterval = null;
var patches = [];
var startTime = null;

// ─── Lấy các module hệ thống từ biến Global ────────────────────────────────
var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
var metro = vendettaObj ? vendettaObj.metro : null;
var logger = vendettaObj ? vendettaObj.logger : console;
var commands = vendettaObj ? vendettaObj.commands : null;

// ─── Metro: Flux Dispatcher ─────────────────────────────────────────────────
var Dispatcher = metro ? (
  metro.findByProps("dispatch", "subscribe", "register") || 
  metro.findByProps("_dispatch", "subscribe")
) : null;

if (!Dispatcher) {
  logger.error("[CustomRPC] FATAL: Không tìm được FluxDispatcher trong Metro!");
}

// ─── Core: Xử lý chuỗi ${code} ──────────────────────────────────────────────
function parseEvalString(str) {
    if (!str) return "";
    return str.replace(/\${(.*?)}/g, function(match, code) {
        try {
            return eval(code);
        } catch (error) {
            return "[Lỗi: " + error.message + "]";
        }
    });
}

// ─── Core: Gửi RPC lên Discord ──────────────────────────────────────────────
function applyRPC(config) {
  if (!Dispatcher) return;

  if (config.timestamp && !startTime) {
    startTime = Date.now();
  }
  if (!config.timestamp) {
    startTime = null;
  }

  var activity = {
    name: config.name,
    type: config.type !== undefined ? config.type : 0,
    details: config.details || undefined,
    state: config.state || undefined,
    application_id: "0"
  };

  if (startTime) {
    activity.timestamps = { start: startTime };
  }

  try {
    Dispatcher.dispatch({
      type: "LOCAL_ACTIVITY_UPDATE",
      activity: activity
    });
    logger.log("[CustomRPC] Activity đã được gửi: " + JSON.stringify(activity));
  } catch (err) {
    logger.error("[CustomRPC] Lỗi khi dispatch activity: " + err.message);
  }
}

// ─── Core: Xóa RPC ──────────────────────────────────────────────────────────
function clearRPC() {
  if (!Dispatcher) return;
  startTime = null;
  try {
    Dispatcher.dispatch({
      type: "LOCAL_ACTIVITY_UPDATE",
      activity: null
    });
    logger.log("[CustomRPC] Activity đã được xóa.");
  } catch (err) {
    logger.error("[CustomRPC] Lỗi khi xóa activity: " + err.message);
  }
}

// ─── Hàm Khởi Chạy Plugin (onLoad) ─────────────────────────────────────────
function onLoad() {
  logger.log("[CustomRPC] Plugin đang khởi động...");
  if (!commands) return;

  // Đăng ký lệnh /rpc 
  var rpcCommand = commands.registerCommand({
    name: "rpc",
    description: "Bật / Tắt Custom RPC nhanh từ chat",
    options: [
      {
        name: "action",
        description: "on = bật | off = tắt",
        type: 3, 
        required: true,
        choices: [
          { name: "on", value: "on" },
          { name: "off", value: "off" }
        ]
      },
      { name: "name", description: "Tên activity (chỉ cần khi action=on)", type: 3, required: false },
      { name: "details", description: "Details (dòng 1)", type: 3, required: false },
      { name: "state", description: "State (dòng 2)", type: 3, required: false }
    ],

    execute: function(args, _ctx) {
      var get = function(name) {
        if (!args) return null;
        for (var i = 0; i < args.length; i++) {
          if (args[i].name === name) return args[i].value;
        }
        return null;
      };
      
      var action = get("action");

      if (action === "off") {
        clearRPC();
        return { content: "🔴 Custom RPC đã tắt." };
      }

      var activityName = get("name") || "Discord Mobile";
      applyRPC({
        name: activityName,
        details: get("details"),
        state: get("state"),
        type: 0,
        timestamp: true
      });

      return {
        content: "✅ RPC đã bật: **" + activityName + "**"
      };
    }
  });

  patches.push(rpcCommand);
  logger.log("[CustomRPC] Khởi động hoàn tất. Lệnh /rpc đã đăng ký.");
}

// ─── Hàm Tắt Plugin (onUnload) ─────────────────────────────────────────────
function onUnload() {
  clearRPC();

  for (var i = 0; i < patches.length; i++) {
    if (typeof patches[i] === "function") {
      patches[i]();
    }
  }
  patches = [];

  logger.log("[CustomRPC] Plugin đã dọn dẹp sạch và tắt thành công.");
}

// ─── Màn hình Giao diện Settings (Sửa lỗi không bấm được) ───────────────────
function SettingsComponent() {
  try {
    var React = window.purpled?.metro?.findByProps("createElement") || globalThis.React;
    var { Text, ScrollView } = window.purpled?.metro?.findByProps("Text", "ScrollView") || {};
    
    if (React && Text) {
      return React.createElement(
        ScrollView, 
        { style: { padding: 16 } }, 
        React.createElement(Text, { style: { color: "#fff", fontSize: 16 } }, "Cấu hình CustomRPC hoạt động ngon lành!")
      );
    }
  } catch (e) {
    if (logger && logger.error) logger.error("[CustomRPC] Lỗi UI Settings: " + e.message);
  }
  return null;
}

// ─── Đóng gói hoàn chỉnh đầy đủ thuộc tính ──────────────────────────────────
var pluginObject = {
  onLoad: onLoad,
  onUnload: onUnload,
  settingsComponent: SettingsComponent, // Định dạng chuẩn cho client mod đã build
  settings: SettingsComponent           // Dự phòng cho loader đọc thô
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = pluginObject;
}

pluginObject;
