# Spec: clasp/CI flow de tu publish Apps Script Web App

## 1. Muc tieu

Tao flow deploy Google Apps Script tu repo bang `clasp` va GitHub Actions, de moi thay doi trong source GAS co the:

1. Duoc kiem tra trong pull request.
2. Duoc push len Apps Script project sau khi merge vao `main`.
3. Duoc tao version bat bien.
4. Duoc update vao dung Web App deployment hien tai, giu on dinh Web App URL frontend dang dung.
5. Co rollback ro rang ve version GAS truoc do.

Flow nay khong doi contract `getData`, action names, Google Sheet headers, frontend data shape, hay nghiep vu hien tai.

## 2. Hien trang repo

Hien tai GAS source nam o:

```text
docs/gas/LOP_TOAN_NK_GAS_2026_2027_FULL.gs
```

Deploy hien tai la thu cong:

```text
copy file .gs -> Apps Script editor -> Deploy Web App
```

Repo chua co:

```text
.github/workflows/
apps-script/
.clasp.json
appsscript.json
.claspignore
```

## 3. Tai lieu tham chieu

- Google Apps Script clasp guide: https://developers.google.com/apps-script/guides/clasp
- google/clasp command reference: https://github.com/google/clasp

Nhung diem can bam:

- `clasp` quan ly Apps Script project tu terminal, ho tro local development, versions va deployments.
- Apps Script API phai duoc bat tai `https://script.google.com/home/usersettings`.
- `clasp` can Node.js 20+.
- `clasp push` upload local files len Apps Script.
- `clasp create-version` tao version bat bien.
- `clasp create-deployment --deploymentId <id>` hoac `clasp update-deployment <id>` update deployment hien co.
- Neu tao deployment moi, Web App co URL moi. Flow production phai update deployment hien co de giu URL on dinh.
- Service account voi clasp hien van nen coi la rui ro/experimental. Phuong an CI mac dinh nen dung OAuth token tu `clasp login`, luu trong GitHub Secrets.

## 4. Kien truc de xuat

### 4.1 Chon source of truth

Tao thu muc deployable rieng:

```text
apps-script/
  Code.gs
  appsscript.json
  .claspignore
.claspignore
```

`apps-script/Code.gs` la source thuc su duoc `clasp push`. File docs hien tai se tro thanh tai lieu/ban copy tham chieu, hoac se duoc thay bang link toi `apps-script/Code.gs` sau khi migrate xong.

Ly do khong dung truc tiep `docs/gas/` lam `rootDir`:

- `docs/gas/` co template Excel va markdown, khong phai deploy bundle sach.
- `clasp` nen co mot root nho, chi gom file can publish.
- Sau nay co the tach GAS thanh nhieu file `.gs` ma khong lam lon thu muc docs.

### 4.2 Khong commit credentials

Khong commit:

```text
.clasprc.json
.clasp.json
client_secret*.json
service-account*.json
```

Commit duoc:

```text
apps-script/Code.gs
apps-script/appsscript.json
apps-script/.claspignore
scripts/prepare-gas-release.mjs
.github/workflows/gas-ci.yml
.github/workflows/gas-deploy.yml
```

`.clasp.json` chua `scriptId` va `rootDir`. No khong phai password, nhung van nen de trong GitHub Secret de tranh lo project id/script id va de tach staging/prod sau nay.

## 5. File can them

### 5.1 `apps-script/appsscript.json`

Manifest toi thieu:

```json
{
  "timeZone": "Asia/Ho_Chi_Minh",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

Ghi chu:

- `executeAs: USER_DEPLOYING` tuong ung "Execute as: Me" khi deploy thu cong.
- `access: ANYONE_ANONYMOUS` giu Web App goi duoc tu frontend ma khong can login Google.
- Scope phai duoc xac minh lai bang Apps Script editor lan dau. Chi them scope khi code GAS that su dung.

### 5.2 `apps-script/.claspignore`

```gitignore
**/**
!Code.gs
!appsscript.json
```

Neu sau nay tach nhieu file:

```gitignore
**/**
!**/*.gs
!appsscript.json
```

Them cung noi dung nay o repo root `.claspignore`, vi CI se ghi `.clasp.json` tai repo root va nhieu phien ban `clasp` doc ignore file canh `.clasp.json`. Patterns van duoc ap dung theo `rootDir`.

### 5.3 `.gitignore`

Bo sung:

```gitignore
.clasprc.json
.clasp.json
client_secret*.json
service-account*.json
```

### 5.4 `scripts/prepare-gas-release.mjs`

Phase dau co the copy source hien tai sang bundle deploy:

```text
docs/gas/LOP_TOAN_NK_GAS_2026_2027_FULL.gs
-> apps-script/Code.gs
```

Script phai:

1. Doc source `.gs`.
2. Ghi `apps-script/Code.gs`.
3. Dam bao header comment co commit SHA neu CI truyen vao.
4. Khong minify, khong doi business logic.
5. Fail neu source trong `docs/gas` rong hoac thieu entry point `doGet`, `doPost`, `getData`.

Sau khi on dinh, co the doi huong:

```text
apps-script/Code.gs -> source chinh
docs/gas/LOP_TOAN_NK_GAS_2026_2027_FULL.gs -> generated/copy tham chieu
```

## 6. GitHub Secrets

Can tao cac secret trong repo:

```text
CLASPRC_JSON
CLASP_JSON_PROD
GAS_DEPLOYMENT_ID_PROD
GAS_WEB_APP_URL_PROD
```

Noi dung:

### `CLASPRC_JSON`

Noi dung file `~/.clasprc.json` sau khi chay:

```bash
npx @google/clasp login
```

Token nay cho phep CI push/deploy Apps Script. Treat nhu secret nhay cam, rotate dinh ky.

### `CLASP_JSON_PROD`

Noi dung:

```json
{
  "scriptId": "SCRIPT_ID_CUA_APPS_SCRIPT_PROJECT",
  "rootDir": "apps-script"
}
```

### `GAS_DEPLOYMENT_ID_PROD`

Deployment ID cua Web App dang production. Lay bang:

```bash
npx @google/clasp list-deployments
```

Chon deployment dang duoc frontend dung. Khong dung deployment ID cua ban test/staging.

### `GAS_WEB_APP_URL_PROD`

URL production dang set trong app:

```text
https://script.google.com/macros/s/.../exec
```

Dung de smoke test sau deploy.

## 7. Local bootstrap mot lan

Lam mot lan tren may co quyen owner/editor voi Apps Script project:

```bash
npx @google/clasp login
```

Bat Apps Script API:

```text
https://script.google.com/home/usersettings
```

Tao `.clasp.json` tam:

```json
{
  "scriptId": "SCRIPT_ID_CUA_APPS_SCRIPT_PROJECT",
  "rootDir": "apps-script"
}
```

Kiem tra:

```bash
npx @google/clasp list-deployments
npx @google/clasp show-file-status
```

Sau do copy noi dung:

```text
~/.clasprc.json -> GitHub Secret CLASPRC_JSON
.clasp.json    -> GitHub Secret CLASP_JSON_PROD
```

Khong commit hai file nay.

## 8. CI cho pull request

File:

```text
.github/workflows/gas-ci.yml
```

Muc tieu:

- Chay TypeScript lint/build frontend nhu release gate hien tai.
- Chay domain tests.
- Prepare GAS bundle.
- Kiem tra `apps-script/Code.gs` co entry points bat buoc.
- Khong push len Apps Script trong PR.

Workflow de xuat:

```yaml
name: GAS CI

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run test:domain
      - run: npm run build
      - run: npm run gas:prepare
      - run: npm run gas:check
```

Can bo sung scripts:

```json
{
  "scripts": {
    "gas:prepare": "node scripts/prepare-gas-release.mjs",
    "gas:check": "node scripts/check-gas-bundle.mjs"
  }
}
```

## 9. CD deploy production

File:

```text
.github/workflows/gas-deploy.yml
```

Trigger:

- Tu dong khi push vao `main` neu co thay doi trong GAS source hoac workflow.
- Cho phep manual `workflow_dispatch`.

Quan trong:

- Production deploy phai update deployment hien co bang `GAS_DEPLOYMENT_ID_PROD`.
- Khong tao deployment moi trong flow mac dinh.
- Neu `GAS_DEPLOYMENT_ID_PROD` rong, job fail, khong fallback sang create deployment moi.

Workflow de xuat:

```yaml
name: Deploy GAS

on:
  push:
    branches: [main]
    paths:
      - "docs/gas/**"
      - "apps-script/**"
      - "scripts/*gas*.mjs"
      - ".github/workflows/gas-deploy.yml"
  workflow_dispatch:

concurrency:
  group: gas-prod-deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run test:domain
      - run: npm run build
      - run: npm run gas:prepare
      - run: npm run gas:check

      - name: Restore clasp config
        shell: bash
        run: |
          test -n '${{ secrets.CLASPRC_JSON }}'
          test -n '${{ secrets.CLASP_JSON_PROD }}'
          test -n '${{ secrets.GAS_DEPLOYMENT_ID_PROD }}'
          echo '${{ secrets.CLASPRC_JSON }}' > "$HOME/.clasprc.json"
          echo '${{ secrets.CLASP_JSON_PROD }}' > .clasp.json

      - name: Push GAS source
        run: npx @google/clasp push --force

      - name: Create GAS version
        id: version
        shell: bash
        run: |
          DESC="prod ${GITHUB_SHA::7} $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
          OUT="$(npx @google/clasp create-version "$DESC")"
          echo "$OUT"
          VERSION="$(echo "$OUT" | grep -Eo '[0-9]+' | tail -1)"
          test -n "$VERSION"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"

      - name: Update existing Web App deployment
        run: >
          npx @google/clasp create-deployment
          --deploymentId "${{ secrets.GAS_DEPLOYMENT_ID_PROD }}"
          --versionNumber "${{ steps.version.outputs.version }}"
          --description "prod ${GITHUB_SHA::7}"

      - name: Smoke test Web App
        shell: bash
        run: |
          test -n '${{ secrets.GAS_WEB_APP_URL_PROD }}'
          node scripts/smoke-gas-webapp.mjs '${{ secrets.GAS_WEB_APP_URL_PROD }}'
```

## 10. Smoke test production

Them:

```text
scripts/smoke-gas-webapp.mjs
```

Smoke test chi doc, khong ghi.

Yeu cau:

1. Goi `GET` hoac `POST` action `getData` theo dung contract hien tai.
2. Timeout 30s.
3. Fail neu HTTP khong 2xx.
4. Fail neu response khong parse JSON.
5. Fail neu `ok !== true`.
6. Fail neu thieu cac key:

```text
hs
uCls
py
ex
logs
tv
summary
```

7. Log metadata an toan:

```text
counts only, no phone/address/full payload
```

Vi du log:

```text
GAS smoke ok: hs=80, classes=10, payments=13, logs=32
```

Khong in toan bo payload vi co du lieu that cua hoc sinh/phu huynh.

## 11. Rollback

Rollback mac dinh:

```bash
npx @google/clasp list-versions
npx @google/clasp create-deployment \
  --deploymentId "$GAS_DEPLOYMENT_ID_PROD" \
  --versionNumber "$PREVIOUS_GOOD_VERSION" \
  --description "rollback to version $PREVIOUS_GOOD_VERSION"
```

Can tao manual workflow:

```text
.github/workflows/gas-rollback.yml
```

Input:

```yaml
inputs:
  version:
    description: "GAS version number to redeploy"
    required: true
```

Gate:

- Chay trong `environment: production`.
- Bat GitHub environment approval truoc khi rollback.
- Sau rollback, chay smoke test `getData`.

## 12. Staging de giam rui ro

Phase 1 co the deploy thang prod neu app noi bo va co rollback nhanh.

Phase tot hon:

```text
CLASP_JSON_STAGING
GAS_DEPLOYMENT_ID_STAGING
GAS_WEB_APP_URL_STAGING
```

Flow:

1. PR merge vao `main` deploy staging truoc.
2. Smoke test staging.
3. Production deploy can manual approval.
4. Production smoke test.

Neu chua co staging Google Sheet, khong cho workflow test ghi. Chi smoke read-only.

## 13. Security

### 13.1 Secret handling

- `CLASPRC_JSON` la credential nhay cam.
- Chi luu trong GitHub Secrets.
- Khong echo token ra log.
- Khong upload `.clasprc.json` lam artifact.
- Rotate token khi nguoi quan ly roi khoi project hoac moi 90-180 ngay.

### 13.2 Quyen Google

Tai khoan OAuth dung cho CI nen:

- La tai khoan workspace rieng, vi du `deploy@nkmaths...` neu co.
- Co Editor tren Apps Script project.
- Co quyen voi Google Sheet ma GAS can truy cap.
- Khong dung tai khoan ca nhan neu co the tranh.

### 13.3 Khong dung service account mac dinh

Khong chon service account lam phase dau vi:

- clasp service account/ADC van duoc upstream danh dau la experimental/khong on dinh.
- Service account khong own script; van can share script/project dung role.
- OAuth token tu `clasp login` la duong on dinh hon cho pipeline nho.

Co the xem lai service account khi Google/clasp ho tro chinh thuc hon.

## 14. Release policy

### PR

Bat buoc pass:

```text
npm run lint
npm run test:domain
npm run build
npm run gas:prepare
npm run gas:check
```

### Production

Bat buoc:

```text
update existing deployment ID
smoke getData ok
no full payload in logs
```

### Manual edits

Sau khi CI active:

- Khong sua code truc tiep tren Apps Script editor.
- Neu bat buoc hotfix trong editor, phai pull/copy nguoc vao repo ngay va tao PR hop thuc hoa.
- Repo la source of truth.

## 15. Acceptance criteria

Flow duoc coi la dat khi:

1. `apps-script/Code.gs` va `appsscript.json` push duoc len Apps Script bang `clasp`.
2. CI PR fail neu GAS bundle thieu `doGet`, `doPost`, hoac `getData`.
3. Merge vao `main` tao GAS version moi.
4. Deployment ID production duoc update, khong tao Web App URL moi.
5. `GAS_WEB_APP_URL_PROD` sau deploy tra `ok: true`.
6. Frontend production khong can doi Apps Script URL.
7. Rollback ve version cu thanh cong bang manual workflow.
8. Khong co secret nao duoc commit vao git.

## 16. Ke hoach trien khai

### Phase 0: Chot thong tin Google

- Lay `SCRIPT_ID`.
- Lay `DEPLOYMENT_ID` production.
- Xac dinh tai khoan OAuth dung cho CI.
- Bat Apps Script API.
- Chay `clasp login`.

### Phase 1: Repo scaffolding

- Tao `apps-script/Code.gs`.
- Tao `apps-script/appsscript.json`.
- Tao `apps-script/.claspignore`.
- Tao scripts `gas:prepare`, `gas:check`, `smoke-gas-webapp`.
- Bo sung `.gitignore`.

### Phase 2: PR CI

- Tao `.github/workflows/gas-ci.yml`.
- Test PR chi check, khong deploy.

### Phase 3: Production CD co approval

- Tao GitHub environment `production`.
- Them secrets.
- Tao `.github/workflows/gas-deploy.yml`.
- Chay manual dispatch lan dau.
- Smoke test.

### Phase 4: Rollback workflow

- Tao `.github/workflows/gas-rollback.yml`.
- Test rollback ve version vua deploy truoc do.

### Phase 5: Don lai source

- Quyet dinh `apps-script/Code.gs` la source chinh.
- Update `docs/gas/GAS_IMPLEMENTATION_NOTES.md` de bo huong dan copy thu cong.
- Neu can giu ban docs, generate tu source chinh.

## 17. Rui ro va cach giam

| Rui ro | Giam thieu |
| --- | --- |
| Tao deployment moi lam doi Web App URL | Bat buoc co `GAS_DEPLOYMENT_ID_PROD`; job fail neu thieu |
| Secret OAuth bi lo | GitHub Secrets, rotate token, khong log token |
| CI deploy source khac source doc | Phase 1 copy mot chieu co check; Phase 5 chot source chinh |
| Apps Script editor bi sua tay | Repo source of truth, `clasp push --force`, policy hotfix |
| Smoke test log du lieu nhay cam | Chi log counts, khong log payload |
| GAS deploy thanh cong nhung contract hong | `gas:check` + smoke `getData` validate keys |
| Can rollback nhanh | Manual rollback workflow theo version number |

## 18. Viec khong lam trong spec nay

- Khong migrate frontend sang API/schema moi.
- Khong doi Google Sheet headers.
- Khong doi Apps Script business logic.
- Khong tach GAS thanh nhieu module ngay lap tuc.
- Khong them service account CI trong phase dau.
- Khong tu dong update `SCRIPT_URL_DEFAULT`, vi production deployment ID phai giu URL on dinh.
