# Cache-First Stale-While-Revalidate Spec

> Superseded: luong nay da duoc thay bang `FOREGROUND_INITIAL_LOAD_SPEC.md` de uu tien an toan nghiep vu. Khong dung SWR luc khoi dong nua.

## Muc tieu

Khi Google Apps Script cham hoac mat ket noi, app phai uu tien hien thi du lieu cache san co thay vi giu man loading qua lau. Luong moi can dam bao nguoi dung co the vao app nhanh neu `ltn-cache` da co du lieu, dong thoi van dong bo GAS o nen.

## Luong khoi dong

1. `useAppData` doc `ltn-cache` ngay khi hook khoi tao state.
2. Neu cache co it nhat mot nhom du lieu:
   - set data tu cache vao state ngay trong initializer.
   - `loading = false`.
   - `syncState = cache`.
   - render app gan nhu ngay lap tuc.
   - goi GAS o nen voi `silentRef.current = true`.
3. Neu GAS thanh cong:
   - replace data tu GAS vao state.
   - ghi lai `ltn-cache`.
   - cap nhat `meta.cachedAt`, `meta.source = gas`, `meta.version`.
   - `syncState = fresh`.
4. Neu GAS fail nhung dang co cache:
   - giu data cache dang dung.
   - `syncState = cache`.
   - chi hien toast nho: "Dang dung du lieu luu gan nhat."
5. Neu lan dau khong co cache:
   - van hien loading.
   - dung foreground timeout ngan.
   - sau nguong retry, loading screen hien thong bao GAS cham va nut "Thu lai".

## Timeout

- Initial foreground fetch: `RULES.network.initialFetchTimeout` = 8s.
- Silent reload/background fetch: `RULES.network.fetchTimeout` = 30s.
- Loading retry hint: `RULES.network.initialLoadRetryAfter` = 8s.

## Cache metadata

`ltn-cache` luu them:

```ts
meta: {
  cachedAt: string;
  source: 'gas' | 'cache';
  version: number;
}
```

UI dung metadata de hien thi trang thai dong bo o sidebar/mobile header va thoi diem cap nhat trong Settings.

## Acceptance Criteria

- Co cache: app khong bi chan boi loading khi khoi dong.
- Co cache + GAS fail: khong xoa data, khong toast loi do som, chi bao dang dung du lieu gan nhat.
- Khong cache + GAS cham: loading screen hien thong bao ro va nut retry sau khoang 8s.
- GAS thanh cong: data moi thay the cache, metadata duoc cap nhat.
- Khong doi schema GAS, Google Sheets headers, hoac business logic domain.
