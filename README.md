# Kitagawa Backend API

기타가와(Kitagawa) 제품 정보를 제공하는 NestJS 기반 백엔드 API 서버입니다.

## 기술 스택

- **Runtime**: Node.js 22
- **Framework**: NestJS
- **Database**: MongoDB Atlas
- **Cloud**: GCP Cloud Functions (Serverless)
- **Language**: TypeScript

## 주요 기능

- 🔍 Kitagawa 제품 정보 크롤링
- 📦 제품 카탈로그 관리
- 🔎 제품 검색 및 필터링
- 📄 제품 사양서 HTML 저장
- 📥 다운로드 링크 관리 (PDF, DXF, DWG, 3D)
- 🔗 매칭 제품 정보 제공

## 프로젝트 구조

```
kitagawa-BE/
├── src/
│   ├── config/               # 설정 파일
│   │   └── database.config.ts
│   ├── modules/
│   │   ├── product/         # 제품 관리 모듈
│   │   │   ├── product.controller.ts
│   │   │   ├── product.service.ts
│   │   │   └── product.module.ts
│   │   └── crawler/         # 크롤러 모듈
│   │       ├── crawler.controller.ts
│   │       ├── crawler.service.ts
│   │       └── crawler.module.ts
│   ├── schemas/             # MongoDB 스키마
│   │   ├── product.schema.ts
│   │   └── category.schema.ts
│   ├── app.module.ts
│   ├── main.ts              # 로컬 개발용
│   └── serverless.ts        # GCP Cloud Functions 엔트리포인트
├── .env.example
├── .nvmrc                   # Node.js 버전 (22)
├── package.json
├── tsconfig.json
├── cloudbuild.yaml          # GCP Cloud Build 설정
└── README.md
```

## MongoDB 스키마 설계

### Product Schema

제품 정보를 저장하는 메인 스키마입니다.

- **productCode**: 제품 코드 (고유값)
- **productName**: 제품명
- **category**: 카테고리 정보 (mainCategory, subCategory, series)
- **specificationHtml**: Product Specifications HTML (원본 그대로 저장)
- **models**: 모델별 사양 정보 배열
- **downloads**: 다운로드 링크 배열 (PDF, DXF, DWG, 3D)
- **matchingProducts**: 매칭되는 제품들 (Cylinder, Jaws 등)
- **imageUrls**: 제품 이미지 URL 배열

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

이미 `.env` 파일이 설정되어 있습니다:
- **MongoDB URI**: mongodb+srv://kitagawa:kitagawakorea@kitagawa.wgg8uob.mongodb.net/
- **PORT**: 8080
- **GCP Project**: tokyo-receiver-444903-m4

### 3. 로컬 개발 서버 실행

```bash
npm run start:dev
```

서버는 `http://localhost:8080/api`에서 실행됩니다.

### 4. 빌드

```bash
npm run build
```

## API 엔드포인트

### 제품 (Products)

- `GET /api/products` - 모든 제품 조회
  - Query: `category`, `subCategory`, `tag`, `isActive`
- `GET /api/products/search?q=keyword` - 제품 검색
- `GET /api/products/code/:productCode` - 제품 코드로 조회
- `GET /api/products/:id` - 제품 ID로 조회
- `GET /api/products/category/:mainCategory` - 카테고리별 제품 조회
- `GET /api/products/:productCode/matching` - 매칭 제품 조회
- `GET /api/products/:productCode/downloads` - 다운로드 링크 조회
- `POST /api/products` - 제품 생성 (관리자)
- `PUT /api/products/:productCode` - 제품 수정 (관리자)
- `DELETE /api/products/:productCode` - 제품 삭제 (관리자)

### 크롤러 (Crawler)

- `POST /api/crawler/crawl` - 특정 URL 크롤링
  - Body: `{ "url": "https://www.kitagawa.com/..." }`
- `POST /api/crawler/crawl/br-plus-series` - BR-PLUS Series 크롤링
- `POST /api/crawler/crawl/category` - 카테고리 전체 크롤링
  - Body: `{ "url": "https://www.kitagawa.com/en/mtools/index.html" }`

## GCP Cloud Functions 배포

### 간단 배포 (추천)

```bash
# 1. MongoDB URI 환경 변수 설정
export MONGODB_URI='mongodb+srv://kitagawa:kitagawakorea@kitagawa.wgg8uob.mongodb.net/'

# 2. 배포 스크립트 실행
./deploy.sh
```

### 수동 배포

```bash
# 빌드 후 배포
npm run build
npm run deploy
```

**자세한 배포 가이드**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 참고

### 현재 GCP 설정

- **계정**: developerkscold@gmail.com
- **프로젝트**: tokyo-receiver-444903-m4
- **리전**: asia-northeast3 (서울)
- **메모리**: 512MB
- **타임아웃**: 60초

## 크롤링 사용법

### BR-PLUS Series 크롤링 예제

```bash
curl -X POST http://localhost:8080/api/crawler/crawl/br-plus-series
```

### 특정 제품 페이지 크롤링

```bash
curl -X POST http://localhost:8080/api/crawler/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.kitagawa.com/en/mtools/csd/brbr-plus_series.html"}'
```

## 제품 조회 예제

### 모든 제품 조회

```bash
curl http://localhost:8080/api/products
```

### 제품 검색

```bash
curl http://localhost:8080/api/products/search?q=BR05
```

### 카테고리별 조회

```bash
curl http://localhost:8080/api/products/category/Chucks
```

## 스키마 특징

1. **specificationHtml 필드**: Product Specifications의 HTML을 원본 그대로 저장하여 프론트엔드에서 직접 렌더링 가능
2. **동적 사양**: `specifications` 필드를 `Record<string, any>` 타입으로 설계하여 다양한 제품 사양을 유연하게 저장
3. **다운로드 링크**: PDF, DXF, DWG, 3D 파일 등 모든 다운로드 링크를 구조화하여 저장
4. **매칭 제품**: Cylinder, Soft Jaws, Hard Jaws 등 관련 제품 정보 저장

## 개발 시 참고사항

- Node.js 22 사용 (`.nvmrc` 파일 참고)
- MongoDB Atlas 사용 권장
- 크롤링 시 서버 부하 방지를 위해 딜레이 적용
- GCP Cloud Functions는 서버리스로 동작하므로 콜드 스타트 고려

## 라이선스

ISC
