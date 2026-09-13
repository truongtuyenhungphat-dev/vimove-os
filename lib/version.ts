import packageJson from "../package.json";

// Nguồn duy nhất cho số phiên bản hiển thị công khai (hiện đang hiện ở footer
// trang đăng nhập) — lấy thẳng từ package.json để không phải sửa 2 nơi. Theo
// yêu cầu người dùng: MỖI LẦN nâng cấp/deploy có thay đổi đáng kể, bump
// version trong package.json trước khi commit (không tự động — không có CI
// version-bump nào chạy hộ).
export const APP_VERSION = packageJson.version;

export const APP_CREDIT = "Made by Trương Tuyền · 0966912268";
