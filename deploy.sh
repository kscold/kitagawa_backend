#!/bin/bash

# Kitagawa Backend GCP Cloud Functions 배포 스크립트

set -e

echo "🚀 Kitagawa Backend 배포 시작..."

# 1. 빌드
echo "📦 TypeScript 빌드 중..."
npm run build

# 2. GCP 프로젝트 확인
echo "🔍 GCP 프로젝트 확인..."
PROJECT_ID=$(gcloud config get-value project)
echo "현재 프로젝트: $PROJECT_ID"

# 3. MongoDB URI 환경 변수 확인
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI 환경 변수가 설정되지 않았습니다."
    echo "다음 명령어로 설정하세요:"
    echo "export MONGODB_URI='mongodb+srv://kitagawa:kitagawakorea@kitagawa.wgg8uob.mongodb.net/'"
    exit 1
fi

# 4. Cloud Functions 배포
echo "🌐 Cloud Functions 배포 중..."
gcloud functions deploy kitagawa-api \
    --gen2 \
    --runtime=nodejs20 \
    --region=asia-northeast3 \
    --source=. \
    --entry-point=api \
    --trigger-http \
    --allow-unauthenticated \
    --memory=512MB \
    --timeout=60s \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production,PORT=8080,MONGODB_URI=$MONGODB_URI"

echo "✅ 배포 완료!"
echo ""
echo "🔗 배포된 URL 확인:"
gcloud functions describe kitagawa-api --region=asia-northeast3 --gen2 --format="value(serviceConfig.uri)"
