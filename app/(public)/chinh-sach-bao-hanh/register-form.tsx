"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VIETNAM_PROVINCES, WARRANTY_PURCHASE_CHANNELS, WARRANTY_COLORS, WARRANTY_SIZES } from "@/lib/warranty/types";
import { registerWarrantyAction, type RegisterWarrantyState } from "./actions";

type Product = { id: string; name: string };

export function RegisterForm({ products, onRegistered }: { products: Product[]; onRegistered: (code: string) => void }) {
  const [state, formAction, isPending] = useActionState<RegisterWarrantyState, FormData>(registerWarrantyAction, undefined);
  const [agree, setAgree] = useState(false);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-primary">Đăng ký thành công!</h3>
        <p className="text-sm text-muted-foreground">Mã bảo hành của bạn là:</p>
        <div className="mx-auto max-w-xs rounded-xl border-2 border-dashed border-primary bg-primary/5 px-6 py-4 text-2xl font-bold tracking-[0.2em]">
          {state.warrantyCode}
        </div>
        <p className="text-xs text-muted-foreground">📱 Lưu mã này để tra cứu và sử dụng dịch vụ bảo hành sau này.</p>
        <Button variant="outline" onClick={() => onRegistered(state.warrantyCode)}>
          Xem thông tin bảo hành
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-xl border bg-card p-6">
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">Thông tin khách hàng</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên" required>
            <Input name="customerName" required />
          </Field>
          <Field label="Số điện thoại" required>
            <Input name="customerPhone" type="tel" required />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input name="customerEmail" type="email" />
          </Field>
          <Field label="Tỉnh / Thành phố">
            <Select items={Object.fromEntries(VIETNAM_PROVINCES.map((p) => [p, p]))} name="customerCity">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn tỉnh thành --" />
              </SelectTrigger>
              <SelectContent>
                {VIETNAM_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Địa chỉ cụ thể">
          <Input name="customerAddress" placeholder="Số nhà, đường, phường/xã, quận/huyện" />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">Thông tin sản phẩm</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Sản phẩm" required>
            <Select items={Object.fromEntries(products.map((p) => [p.name, p.name]))} name="productName">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn sản phẩm --" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Màu sắc">
            <Select items={Object.fromEntries(WARRANTY_COLORS.map((c) => [c, c]))} name="color">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn màu --" />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_COLORS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Kích thước (Size)">
            <Select items={Object.fromEntries(WARRANTY_SIZES.map((s) => [s, s]))} name="size">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn size --" />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngày mua" required>
            <Input name="purchaseDate" type="date" required max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Kênh mua hàng">
            <Select items={Object.fromEntries(WARRANTY_PURCHASE_CHANNELS.map((c) => [c, c]))} name="purchaseChannel">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn kênh --" />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_PURCHASE_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <input type="hidden" name="agree" value={agree ? "on" : ""} />
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
        Tôi đồng ý với{" "}
        <a href="?tab=policy" className="text-primary hover:underline">
          chính sách bảo hành
        </a>{" "}
        của Vimove
      </label>

      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isPending || !agree}>
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
        {isPending ? "Đang đăng ký..." : "Đăng ký bảo hành ngay"}
      </Button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
