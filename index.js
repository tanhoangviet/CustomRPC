var rpcInterval = null;

// Hàm xử lý bóc tách chuỗi ${code} dùng function truyền thống
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

// Hàm khởi chạy chính khi bật plugin
function onLoad() {
    try {
        var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
        if (!vendettaObj || !vendettaObj.metro) {
            return;
        }

        var metro = vendettaObj.metro;
        var commands = vendettaObj.commands;
        var Dispatcher = metro.findByProps("dispatch", "subscribe");

        if (!Dispatcher) {
            return;
        }

        var rpcConfig = {
            details: "Đang code dự án: ${1 + 1} giờ liền",
            state: "Bây giờ là: ${new Date().toLocaleTimeString()}"
        };

        var updateCustomRPC = function() {
            var finalDetails = parseEvalString(rpcConfig.details);
            var finalState = parseEvalString(rpcConfig.state);

            Dispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: {
                    name: "CustomRPC Eval",
                    type: 0, 
                    details: finalDetails,
                    state: finalState,
                    assets: {
                        large_image: "https://github.com/tanhoangviet.png",
                        large_text: "Đang chạy mượt mà!"
                    }
                }
            });
        };

        // Chạy ngay lần đầu
        updateCustomRPC();

        // Tạo vòng lặp 5 giây
        if (rpcInterval) clearInterval(rpcInterval);
        rpcInterval = setInterval(updateCustomRPC, 5000);

        // Đăng ký lệnh chat /eval an toàn cho ES5
        if (commands) {
            commands.registerCommand({
                name: "eval",
                displayName: "eval",
                description: "Chạy nhanh code JS trên điện thoại",
                options: [{ name: "code", displayName: "code", description: "Đoạn code cần chạy", type: 3, required: true }],
                applicationId: "-1",
                inputType: 1,
                execute: function(args) {
                    var codeInput = null;
                    if (args && args.length > 0) {
                        for (var i = 0; i < args.length; i++) {
                            if (args[i].name === "code") {
                                codeInput = args[i].value;
                                break;
                            }
                        }
                    }
                    try {
                        var output = eval(codeInput);
                        return { content: "📥 **Input:** `" + codeInput + "` \n📤 **Output:** `" + output + "`" };
                    } catch (err) {
                        return { content: "❌ **Lỗi:** `" + err.message + "`" };
                    }
                }
            });
        }

    } catch (crashError) {
        console.error("[CustomRPC] Lỗi khởi chạy: " + crashError.message);
    }
}

// Hàm dọn dẹp khi tắt plugin
function onUnload() {
    if (rpcInterval) clearInterval(rpcInterval);
    try {
        var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
        var Dispatcher = vendettaObj && vendettaObj.metro ? vendettaObj.metro.findByProps("dispatch", "subscribe") : null;
        if (Dispatcher) {
            Dispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: null
            });
        }
    } catch(e) {}
}

// Đóng gói đối tượng plugin
var pluginObject = {
    onLoad: onLoad,
    onUnload: onUnload
};

// Hỗ trợ cả CommonJS exports lẫn trả về kết quả trực tiếp cho trình loader
if (typeof module !== "undefined" && module.exports) {
    module.exports = pluginObject;
}

pluginObject;
