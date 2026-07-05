# Controlled Worktree Cleanup Spec

## Muc tieu

Don dep worktree va repo truoc deploy ma khong lam mat thay doi nghiep vu da test pass. Quy trinh nay uu tien an toan, truy vet duoc, va khong dung lenh reset/clean hang loat.

## Nguyen tac an toan

- Khong dung `git reset --hard`.
- Khong dung `git clean -fd` cho toan repo.
- Khong revert file tracked neu chua xem diff va xac nhan do la artifact/doi sai.
- Chi xoa untracked artifact sau khi da liet ke ro path.
- Moi nhom thay doi phai co muc dich ro truoc khi stage.
- Sau khi stage xong tung nhom, chay lai test toi thieu truoc commit/deploy.

## Hien trang can xu ly

Worktree hien co 4 nhom chinh:

1. Code nguon da sua trong `src/`
   - Bao gom mobile UI cleanup, settings, cache/loading, form ghi chu, nghi buoi, finance/report logic.
   - Day la thay doi san pham can giu va review theo cum.

2. Spec/docs moi
   - `docs/specs/MOBILE_FILTER_CARD_SPEC.md`
   - `docs/specs/OPERATIONS_NOTE_REPORT_FIXES_SPEC.md`
   - `docs/specs/SETTINGS_UNIFIED_SCREEN_SPEC.md`
   - `docs/project/CACHE_FIRST_SWR_SPEC.md`
   - `docs/project/FOREGROUND_INITIAL_LOAD_SPEC.md`
   - Nen giu vi giai thich quyet dinh san pham/ky thuat.

3. Test/domain script
   - `tests/domainRules.test.ts`
   - `package.json` them `test:domain`
   - Nen giu vi la check nghiep vu nhanh truoc deploy.

4. Artifact local
   - `output/`
   - `test-results/`
   - `*.log`
   - `*.job`
   - File xlsx duplicate o root: `LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx`
   - Khong nen commit vao repo.

## Pham vi giu lai

Giu lai cac thay doi co gia tri san pham hoac QA:

- `src/**`
- `package.json`
- `tests/domainRules.test.ts`
- `docs/specs/*.md` lien quan task da lam
- `docs/project/*.md` lien quan task da lam
- `docs/gas/LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx` neu day la template chinh can deploy/luu tru

## Pham vi don/xoa

Chi xoa neu path dung nhu danh sach sau:

- `output/`
- `test-results/`
- `vite-*.log`
- `vite-*.err.log`
- `qa-dev.log`
- `qa-dev.err.log`
- `*.job`
- `LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx` o root repo, neu da xac nhan duplicate voi `docs/gas/LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx`

Khong xoa:

- `docs/gas/LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx`
- `docs/specs/**`
- `docs/project/**`
- `tests/domainRules.test.ts`
- bat ky file `src/**`

## Cap nhat gitignore

Them cac dong sau vao `.gitignore` de tranh artifact quay lai:

```gitignore
output/
test-results/
*.job
playwright-report/
```

`*.log`, `dist/`, `node_modules/`, `.vercel` da co san.

## Quy trinh thuc hien

### Buoc 1: Kiem ke truoc khi xoa

Chay:

```bash
git status --short
git diff --stat
```

Liet ke artifact:

```powershell
Get-ChildItem -Force -File *.log,*.job
Get-ChildItem -Recurse -File output,test-results -ErrorAction SilentlyContinue
```

Ket qua mong doi:

- Nhin ro artifact nao se xoa.
- Khong dua file `src/**` vao danh sach xoa.

### Buoc 2: Cap nhat `.gitignore`

Sua `.gitignore` bang patch nho, chi them artifact patterns.

Sau khi sua:

```bash
git diff -- .gitignore
```

### Buoc 3: Xoa artifact bang path cu the

Chi dung lenh xoa voi literal path da kiem tra.

De xoa thu muc artifact:

```powershell
Remove-Item -LiteralPath output -Recurse -Force
Remove-Item -LiteralPath test-results -Recurse -Force
```

De xoa log/job o root:

```powershell
Remove-Item -LiteralPath vite-mobile-fab.err.log,vite-mobile-fab.log,vite-preview-ui.err.log,vite-preview-ui.log,vite-qa-5176.err.log,vite-qa-5176.log,vite-qa-preview.err.log,vite-qa-preview.log,vite-qa-preview.job,vite-smoke-preview.err.log,vite-smoke-preview.log,vite-ui-check.err.log,vite-ui-check.log,qa-dev.err.log,qa-dev.log -Force
```

De xoa xlsx duplicate o root sau khi xac nhan:

```powershell
Remove-Item -LiteralPath LOP_TOAN_NK_SHEET_2026_2027_TEMPLATE.xlsx -Force
```

Khong dung wildcard xoa truc tiep neu chua liet ke ket qua.

### Buoc 4: Kiem tra lai worktree

Chay:

```bash
git status --short
git diff --stat
```

Ket qua mong doi:

- Artifact khong con trong status.
- Worktree chi con code/docs/tests can commit.
- `.gitignore` hien la file modified neu vua them patterns.

### Buoc 5: Chay test truoc khi stage

Chay:

```bash
npm.cmd run lint
npm.cmd run test:domain
npm.cmd run build
```

Yeu cau:

- Ca 3 lenh pass.
- Build warning chunk size lon hon 500 kB duoc chap nhan, khong chan deploy.

## Chien luoc stage/commit

Khong stage tat ca bang `git add .` o lan dau. Stage theo cum de review duoc.

### Commit 1: Domain test guard

Files:

- `package.json`
- `tests/domainRules.test.ts`

Noi dung:

- Them script `test:domain`.
- Them test nghiep vu canh bao truoc deploy.

### Commit 2: Loading/cache/settings UX

Files du kien:

- `src/useAppData.ts`
- `src/LoadingScreen.tsx`
- `src/Layout.tsx`
- `src/SettingsTab.tsx`
- `src/helpers.ts`
- `src/rules.ts`
- docs cache/settings lien quan

Noi dung:

- Dieu chinh co che loading/cache theo quyet dinh hien tai.
- Don tab cai dat thanh man gop.

### Commit 3: Mobile/UI cleanup

Files du kien:

- `src/StudentsTab.tsx`
- `src/FinanceTab.tsx`
- `src/OperationsTab.tsx`
- `src/AppComponents.tsx`
- `src/uiSystem.tsx`
- `src/dsComponents.tsx`
- `src/index.css`
- cac modal mobile lien quan
- docs mobile lien quan

Noi dung:

- Can filter mobile 1/2-1/2.
- On dinh chip/card mobile.
- Sua font/form mobile.

### Commit 4: Nghi buoi va logic bao cao

Files du kien:

- `src/App.tsx`
- `src/OperationsTab.tsx`
- `src/ModalDiary.tsx`
- `src/helpers.ts`
- `src/measures.ts`
- `src/useDomains.ts`
- `docs/specs/OPERATIONS_NOTE_REPORT_FIXES_SPEC.md`

Noi dung:

- Luu nghi buoi bang teaching log dac biet.
- `attendanceList` rong.
- Khong tinh hoc sinh vang/co phep.
- Khong tinh buoi nghi vao KPI/buoi can diem danh/bao cao.

## Review truoc deploy

Truoc deploy can co checklist:

- `git status --short` khong con artifact local.
- `npm.cmd run lint` pass.
- `npm.cmd run test:domain` pass.
- `npm.cmd run build` pass.
- Preview local mo duoc.
- Chrome smoke test flow:
  - Vao `Van hanh`.
  - Bam `Nghi`.
  - Nhap ly do.
  - Xac nhan.
  - UI hien `Da nghi`.
  - KPI `Da ghi buoi` khong tang vi buoi nghi.

## Tieu chi hoan thanh

- Repo sach artifact.
- `.gitignore` chan artifact sinh lai.
- Thay doi duoc commit theo cum co y nghia.
- Test/build pass sau khi don.
- San sang deploy Vercel.

## Rui ro va cach giam rui ro

- Rui ro xoa nham file can giu: chi xoa path literal da liet ke, khong dung `git clean -fd`.
- Rui ro commit qua rong: stage theo cum, xem `git diff --cached --stat` truoc moi commit.
- Rui ro thay doi docs/spec khong duoc commit: kiem tra `git status --short docs`.
- Rui ro template xlsx bi duplicate: giu ban trong `docs/gas`, xoa ban root neu xac nhan trung lap.

