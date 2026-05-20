// Khai báo biến toàn cục trước
let rpcInterval = null;

// Hàm xử lý bóc tách chuỗi ${code}
function parseEvalString(str) {
    if (!str) return "";
    return str.replace(/\${(.*?)}/g, (match, code) => {
        try {
            return eval(code);
        } catch (error) {
            return "[Lỗi: " + error.message + "]";
        }
    });
}

// Hàm chạy chính của plugin khi được Kettu kích hoạt
function onLoad() {
    try {
        // Lấy biến môi trường an toàn bên trong onLoad
        var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
        if (!vendettaObj || !vendettaObj.metro) {
            console.error("[CustomRPC] Không tìm thấy nền tảng Vendetta/Kettu");
            return;
        }

        var metro = vendettaObj.metro;
        var commands = vendettaObj.commands;
        var Dispatcher = metro.findByProps("dispatch", "subscribe");

        if (!Dispatcher) {
            console.error("[CustomRPC] Không tìm thấy Discord Dispatcher");
            return;
        }

        // Cấu hình nội dung hiển thị
        var rpcConfig = {
            details: "Đang code dự án: ${1 + 1} giờ liền",
            state: "Bây giờ là: ${new Date().toLocaleTimeString()}"
        };

        // Hàm cập nhật trạng thái
        var updateCustomRPC = function() {
            var finalDetails = parseEvalString(rpcConfig.details);
            var finalState = parseEvalString(rpcConfig.state);

            Dispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: {
                    name: "CustomRPC Eval",
                    type: 0, // 0: Playing
                    details: finalDetails,
                    state: finalState,
                    assets: {
                        large_image: "https://github.com/tanhoangviet.png",
                        large_text: "Đang chạy mượt mà!"
                    }
                }
            });
        };

        // Chạy ngay lập tức lần đầu
        updateCustomRPC();

        // Thiết lập vòng lặp mỗi 5 giây
        if (rpcInterval) clearInterval(rpcInterval);
        rpcInterval = setInterval(updateCustomRPC, 5000);

        // Đăng ký lệnh chat /eval nếu có hỗ trợ
        if (commands) {
            commands.registerCommand({
                name: "eval",
                displayName: "eval",
                description: "Chạy nhanh code JS trên điện thoại",
                options: [{ name: "code", displayName: "code", description: "Đoạn code cần chạy", type: 3, required: true }],
                applicationId: "-1",
                inputType: 1,
                execute: function(args) {
                    var codeInput = args.find(a => a.name === "code")?.value;
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
        console.error("[CustomRPC CRASH]: " + crashError.message);
    }
}

// Hàm dọn dẹp khi tắt plugin
function onUnload() {
    if (rpcInterval) clearInterval(rpcInterval);
    try {
        var vendettaObj = window.vendetta || globalThis.vendetta || window.purpled;
        var Dispatcher = vendettaObj?.metro?.findByProps("dispatch", "subscribe");
        if (Dispatcher) {
            Dispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: null
            });
        }
    } catch(e) {}
}

// Tạo một màn hình Settings trống để nút Configure không bị lỗi văng app
function DummySettings() {
    try {
        var React = window.purpled?.metro?.findByProps("createElement") || globalThis.React;
        var { Text } = window.purpled?.metro?.findByProps("Text") || {};
        if (React && Text) {
            return React.createElement(Text, null, "Cấu hình Custom RPC Eval thành công!");
        }
    } catch(e) {}
    return null;
}

// Export chuẩn chỉ cho bộ cài đặt của Kettu nhận diện
if (typeof module !== "undefined") {
    module.exports = {
        onLoad: onLoad,
        onUnload: onUnload,
        settingsComponent: DummySettings
    };
}
