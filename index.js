/**
 * CustomRPC — Discord Mobile Plugin
 * Hỗ trợ: Vendetta / Bunny / Kettu
 *
 * Nguyên lý hoạt động:
 *   Dispatch action LOCAL_ACTIVITY_UPDATE qua FluxDispatcher
 *   để ghi đè Rich Presence hiện tại của client.
 */

import { metro, logger } from "@vendetta";
import { commands } from "@vendetta/commands";
import Settings from "./Settings";

// ─── Bộ nhớ quản lý vòng đời ───────────────────────────────────────────────
let patches    = [];
let startTime  = null; // Lưu thời điểm bắt đầu để tính elapsed time

// ─── Metro: Flux Dispatcher ─────────────────────────────────────────────────
// Tìm FluxDispatcher — dùng để dispatch action RPC lên Discord client
const FluxDispatcher = metro.findByProps("dispatch", "subscribe", "register");

// Fallback: thử tìm qua tên khác nếu build Discord thay đổi
const Dispatcher = FluxDispatcher
  ?? metro.findByProps("_dispatch", "subscribe")
  ?? null;

if (!Dispatcher) {
  logger.error("[CustomRPC] FATAL: Không tìm được FluxDispatcher trong Metro!");
}

// ─── Core: Gửi RPC lên Discord ──────────────────────────────────────────────
/**
 * @param {Object} config
 * @param {string}  config.name       - Tên activity (bắt buộc)
 * @param {string}  [config.details]  - Dòng mô tả 1
 * @param {string}  [config.state]    - Dòng mô tả 2
 * @param {number}  [config.type]     - 0=Playing 1=Streaming 2=Listening 3=Watching
 * @param {boolean} [config.timestamp]- Có hiện elapsed time không
 */
function applyRPC(config) {
  if (!Dispatcher) return;

  if (config.timestamp && !startTime) {
    startTime = Date.now();
  }
  if (!config.timestamp) {
    startTime = null;
  }

  const activity = {
    name:    config.name,
    type:    config.type ?? 0,
    details: config.details || undefined,
    state:   config.state   || undefined,
    ...(startTime ? { timestamps: { start: startTime } } : {}),

    // application_id giả — một số build yêu cầu trường này
    // Thay bằng App ID thật nếu bạn có Discord Application
    application_id: "0",
  };

  try {
    Dispatcher.dispatch({
      type:     "LOCAL_ACTIVITY_UPDATE",
      activity: activity,
    });
    logger.log("[CustomRPC] Activity đã được gửi:", JSON.stringify(activity));
  } catch (err) {
    logger.error("[CustomRPC] Lỗi khi dispatch activity:", err.message);
  }
}

// ─── Core: Xóa RPC ──────────────────────────────────────────────────────────
function clearRPC() {
  if (!Dispatcher) return;
  startTime = null;
  try {
    Dispatcher.dispatch({
      type:     "LOCAL_ACTIVITY_UPDATE",
      activity: null,
    });
    logger.log("[CustomRPC] Activity đã được xóa.");
  } catch (err) {
    logger.error("[CustomRPC] Lỗi khi xóa activity:", err.message);
  }
}

// ─── Plugin Export ───────────────────────────────────────────────────────────
export default {
  // ── onLoad: đăng ký lệnh + áp dụng RPC đã lưu từ lần trước ──────────────
  onLoad: () => {
    logger.log("[CustomRPC] Plugin đang khởi động...");

    // Đăng ký lệnh /rpc để toggle nhanh từ chat
    const rpcCommand = commands.registerCommand({
      name:        "rpc",
      description: "Bật / Tắt Custom RPC nhanh từ chat",
      options: [
        {
          name:        "action",
          description: "on = bật | off = tắt",
          type:        3, // STRING
          required:    true,
          choices: [
            { name: "on",  value: "on"  },
            { name: "off", value: "off" },
          ],
        },
        {
          name:        "name",
          description: "Tên activity (chỉ cần khi action=on)",
          type:        3,
          required:    false,
        },
        {
          name:        "details",
          description: "Details (dòng 1)",
          type:        3,
          required:    false,
        },
        {
          name:        "state",
          description: "State (dòng 2)",
          type:        3,
          required:    false,
        },
      ],

      execute: (args, _ctx) => {
        const get = (name) => args.find(a => a.name === name)?.value;
        const action = get("action");

        if (action === "off") {
          clearRPC();
          return { content: "🔴 Custom RPC đã tắt." };
        }

        const activityName = get("name") || "Discord Mobile";
        applyRPC({
          name:      activityName,
          details:   get("details"),
          state:     get("state"),
          type:      0,
          timestamp: true,
        });

        return {
          content: `✅ RPC đã bật: **${activityName}**`,
        };
      },
    });

    patches.push(rpcCommand);
    logger.log("[CustomRPC] Khởi động hoàn tất. Lệnh /rpc đã đăng ký.");
  },

  // ── onUnload: dọn dẹp toàn bộ ────────────────────────────────────────────
  onUnload: () => {
    // Xóa RPC khỏi Discord trước
    clearRPC();

    // Hủy đăng ký lệnh và patches
    for (const unpatch of patches) {
      if (typeof unpatch === "function") unpatch();
    }
    patches = [];

    logger.log("[CustomRPC] Plugin đã dọn dẹp sạch và tắt thành công.");
  },

  // ── Gắn trang Settings và truyền applyRPC / clearRPC vào ─────────────────
  settings: () => <Settings applyRPC={applyRPC} clearRPC={clearRPC} />,
};
