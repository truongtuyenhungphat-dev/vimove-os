import { redirect } from "next/navigation";

// "/attendance" tự nó không phải trang thật — redirect về Chấm công (đúng §34 rule 6:
// không có link trỏ tới trang không tồn tại), cùng quy ước với /crm, /work, /process.
export default function AttendanceIndexPage() {
  redirect("/attendance/checkin");
}
