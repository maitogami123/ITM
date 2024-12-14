const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    try {
      // Lấy `mscb` và `name` từ req.body
      const mscb = req.body.mscb || "unknown";
      const name = req.body.name || "unknown";

      // Chuyển đổi tên sang không dấu và viết thường
      const normalizedName = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

      // Tạo tên file
      const fileName = `${mscb}_${normalizedName}${path.extname(
        file.originalname
      )}`;
      cb(null, fileName);
    } catch (error) {
      cb(new Error("Không thể xử lý tên file."));
    }
  },
});

// Middleware kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
  if (file.size > 5 * 1024 * 1024) {
    // Kiểm tra xem file có vượt quá 5MB không
    return cb(new Error("File quá lớn! Giới hạn là 5MB"));
  }
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File không được hỗ trợ, chỉ chấp nhận JPEG, PNG, GIF"));
  }
};

// Khởi tạo multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file 5MB
  fileFilter,
});

module.exports = upload;
