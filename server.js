const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = 5173;

app.use(express.json());
app.use(express.static(__dirname));

const STORE = path.join(__dirname, "store");
const NOIDUNG = path.join(STORE, "noidung.json");
const BAOCAO = path.join(STORE, "baocao.xlsx");

if (!fs.existsSync(STORE)) fs.mkdirSync(STORE);

// ===== HÀM ĐỌC JSON =====
function docJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// ===== GHI BÁO CÁO =====
function ghiBaoCao(dong) {
  let wb, ws, data = [];
  if (fs.existsSync(BAOCAO)) {
    wb = XLSX.readFile(BAOCAO);
    ws = wb.Sheets["DATA"];
    data = XLSX.utils.sheet_to_json(ws);
  } else {
    wb = XLSX.utils.book_new();
  }
  data.push(dong);
  ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "DATA", true);
  XLSX.writeFile(wb, BAOCAO);
}

// ===== XỬ LÝ NGÀY =====
function formatDate(d = new Date()) {
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}
function congNgay(date, so) {
  const d = new Date(date);
  d.setDate(d.getDate() + so);
  return formatDate(d);
}

// ===== CHAT =====
app.post("/chat", (req, res) => {
  const { ten, lop, cauhoi } = req.body;
  const data = docJSON(NOIDUNG)[lop];
  const q = cauhoi.toLowerCase();
  const homnay = formatDate();

  let ngayHoi = homnay;
  if (q.includes("hôm trước")) ngayHoi = congNgay(homnay, -1);
  if (q.includes("ngày mai") || q.includes("hôm sau")) ngayHoi = congNgay(homnay, 1);

  let traloi = "";

  // hỏi lịch / bài học theo ngày
  if (q.includes("học") || q.includes("bài")) {
    if (data.lich[ngayHoi]) {
      traloi =
`📘 Ngày ${ngayHoi}, lớp ${lop} học:
${data.lich[ngayHoi].bai}

Nội dung chính:
${data.lich[ngayHoi].noidung}

Thầy tin các em nắm được bài! 💙`;
    }
  }

  // hỏi dặn dò
  if (!traloi && (q.includes("dặn") || q.includes("bài tập"))) {
    if (data.lich[ngayHoi]) {
      traloi =
`📝 Dặn dò ngày ${ngayHoi}:
${data.lich[ngayHoi].dando}

Các em nhớ hoàn thành nhé! 🎯`;
    }
  }

  if (!traloi) {
    traloi =
`Nội dung này thầy chưa cập nhật cho lớp ${lop}.
Các em hỏi lại đúng bài đang học nhé.`;
  }

  ghiBaoCao({
    ThoiGian: new Date().toLocaleString(),
    Ten: ten,
    Lop: lop,
    Loai: "Chat",
    CauHoi: cauhoi,
    TraLoi: traloi,
    Diem: ""
  });

  res.json({ traloi });
});

app.listen(PORT, () => {
  console.log("🚀 HUUAI chạy tại http://localhost:" + PORT);
});
