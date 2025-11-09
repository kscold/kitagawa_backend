import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * E2E 테스트용 헬퍼 유틸리티
 */

/**
 * 테스트용 MongoDB URI 반환
 */
export function getTestMongoUri(): string {
    return process.env.MONGODB_TEST_URI || '';
}

/**
 * E2E 테스트용 NestJS 앱 생성
 */
export async function createE2ETestApp(
    imports: any[],
    controllers: any[],
    providers: any[],
): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [MongooseModule.forRoot(getTestMongoUri()), ...imports],
        controllers,
        providers,
    }).compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    return app;
}

/**
 * 특정 컬렉션의 모든 데이터 삭제
 */
export async function clearCollection(app: INestApplication, collectionName: string): Promise<void> {
    const connection = app.get<Connection>(getConnectionToken());
    const collection = connection.collection(collectionName);
    await collection.deleteMany({});
}

/**
 * 모든 컬렉션 데이터 삭제
 */
export async function clearAllCollections(app: INestApplication): Promise<void> {
    const connection = app.get<Connection>(getConnectionToken());
    const collections = await connection.db.collections();

    for (const collection of collections) {
        await collection.deleteMany({});
    }
}

/**
 * 테스트 데이터 시드 헬퍼
 */
export async function seedCollection(app: INestApplication, collectionName: string, data: any[]): Promise<void> {
    const connection = app.get<Connection>(getConnectionToken());
    const collection = connection.collection(collectionName);
    if (data.length > 0) {
        await collection.insertMany(data);
    }
}

/**
 * 특정 컬렉션의 데이터 개수 조회
 */
export async function getCollectionCount(app: INestApplication, collectionName: string): Promise<number> {
    const connection = app.get<Connection>(getConnectionToken());
    const collection = connection.collection(collectionName);
    return await collection.countDocuments();
}
