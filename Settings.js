import { React, metro } from "@vendetta";
import { storage } from "@vendetta/plugin";

// Lấy UI components từ bó giao diện chuẩn của Discord Mobile
const { Button, TextInput, Toast } = metro.findByProps("Button", "Modal", "TextInput");

// Các loại Activity Type Discord hỗ trợ
const ACTIVITY_TYPES = [
  { label: "🎮 Playing", value: 0 },
  { label: "📺 Watching", value: 3 },
  { label: "🎧 Listening", value: 2 },
  { label: "🔴 Streaming", value: 1 },
];

export default function Settings({ applyRPC, clearRPC }) {
  // Trạng thái form — đọc từ storage nếu có
  const [name, setName]       = React.useState(storage.rpcName    ?? "Visual Studio Code");
  const [details, setDetails] = React.useState(storage.rpcDetails ?? "Đang code plugin");
  const [state, setState]     = React.useState(storage.rpcState   ?? "Vendetta Plugin Dev");
  const [typeIdx, setTypeIdx] = React.useState(
    ACTIVITY_TYPES.findIndex(t => t.value === (storage.rpcType ?? 0)) ?? 0
  );
  const [useTimestamp, setUseTimestamp] = React.useState(storage.rpcTimestamp ?? true);
  const [active, setActive]   = React.useState(false);

  // Lưu vào storage & áp dụng RPC
  const handleApply = () => {
    if (!name.trim()) {
      Toast.show({ content: "⚠️ Tên activity không được để trống!", id: "rpc_warn" });
      return;
    }

    storage.rpcName      = name.trim();
    storage.rpcDetails   = details.trim();
    storage.rpcState     = state.trim();
    storage.rpcType      = ACTIVITY_TYPES[typeIdx].value;
    storage.rpcTimestamp = useTimestamp;

    applyRPC({
      name:      storage.rpcName,
      details:   storage.rpcDetails   || undefined,
      state:     storage.rpcState     || undefined,
      type:      storage.rpcType,
      timestamp: storage.rpcTimestamp,
    });

    setActive(true);
    Toast.show({ content: "✅ RPC đã được kích hoạt!", id: "rpc_ok" });
  };

  const handleClear = () => {
    clearRPC();
    setActive(false);
    Toast.show({ content: "🔴 RPC đã tắt.", id: "rpc_off" });
  };

  // Xoay vòng chọn activity type
  const cycleType = () => setTypeIdx(i => (i + 1) % ACTIVITY_TYPES.length);

  return (
    <React.Fragment>
      {/* ── Tên Activity ── */}
      <TextInput
        label="Tên Activity (bắt buộc)"
        placeholder="VD: Visual Studio Code"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: 8 }}
      />

      {/* ── Details ── */}
      <TextInput
        label="Details (dòng 1)"
        placeholder="VD: Đang code plugin Discord"
        value={details}
        onChangeText={setDetails}
        style={{ marginBottom: 8 }}
      />

      {/* ── State ── */}
      <TextInput
        label="State (dòng 2)"
        placeholder="VD: Vendetta Plugin Dev"
        value={state}
        onChangeText={setState}
        style={{ marginBottom: 12 }}
      />

      {/* ── Chọn loại Activity ── */}
      <Button
        variant="secondary"
        onPress={cycleType}
        style={{ marginBottom: 8 }}
      >
        {`Loại: ${ACTIVITY_TYPES[typeIdx].label}  (nhấn để đổi)`}
      </Button>

      {/* ── Toggle Timestamp ── */}
      <Button
        variant={useTimestamp ? "primary" : "secondary"}
        onPress={() => setUseTimestamp(v => !v)}
        style={{ marginBottom: 16 }}
      >
        {useTimestamp ? "⏱ Timestamp: BẬT" : "⏱ Timestamp: TẮT"}
      </Button>

      {/* ── Áp dụng / Tắt ── */}
      <Button
        variant="primary"
        onPress={handleApply}
        style={{ marginBottom: 8 }}
      >
        {active ? "🔄 Cập Nhật RPC" : "🚀 Kích Hoạt RPC"}
      </Button>

      <Button
        variant="danger"
        onPress={handleClear}
      >
        🔴 Tắt RPC
      </Button>
    </React.Fragment>
  );
}
