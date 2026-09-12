"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitContactFormAction, type ContactFormState } from "./actions";

const INTERESTS = [
  "Vali kéo 20 inch (Cabin)",
  "Vali kéo 24 inch (Ký gửi)",
  "Vali kéo 28 inch (Gia đình)",
  "Bộ 3 vali (20+24+28 inch)",
  "Túi du lịch",
  "Phụ kiện hành lý",
  "Mua số lượng lớn / đại lý",
  "Khác",
];
const interestItems = Object.fromEntries(INTERESTS.map((i) => [i, i]));

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(submitContactFormAction, undefined);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
        <p className="font-medium">Đã gửi yêu cầu thành công!</p>
        <p className="text-sm text-muted-foreground">Chúng tôi sẽ liên hệ lại trong vòng 30 phút (giờ hành chính).</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">Họ và tên *</Label>
          <Input id="contact-name" name="contactName" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-phone">Số điện thoại *</Label>
          <Input id="contact-phone" name="phone" type="tel" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-interest">Bạn quan tâm đến</Label>
        <Select items={interestItems} name="interest">
          <SelectTrigger id="contact-interest" className="w-full">
            <SelectValue placeholder="-- Chọn sản phẩm / dịch vụ --" />
          </SelectTrigger>
          <SelectContent>
            {INTERESTS.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-message">Nội dung cần tư vấn *</Label>
        <Textarea id="contact-message" name="message" rows={4} required />
      </div>

      {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <p className="text-xs text-muted-foreground">
        Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi cam kết không chia sẻ với bên thứ ba.
      </p>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isPending ? "Đang gửi..." : "Gửi yêu cầu tư vấn"}
      </Button>
    </form>
  );
}
