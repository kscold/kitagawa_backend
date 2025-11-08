import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

/**
 * 테스트용 Mongoose 연결
 */
export const getTestMongoConfig = () => {
    return MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/kitagawa-test');
};

/**
 * 테스트 앱 생성
 */
export async function createTestingApp(moduleMetadata: any): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule(moduleMetadata).compile();

    const app = moduleFixture.createNestApplication();

    // Validation Pipe 설정 (프로덕션과 동일)
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    await app.init();
    return app;
}

/**
 * Mock Repository Factory
 */
export const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
});

/**
 * Mock Model Factory (Mongoose)
 */
export const mockModel = () => ({
    new: jest.fn().mockResolvedValue({}),
    constructor: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    exec: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
});

/**
 * 표준 응답 구조 검증
 */
export function expectStandardResponse(response: any, expectedCode: number = 200) {
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('code', expectedCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
}

/**
 * 페이지네이션 응답 구조 검증
 */
export function expectPaginatedResponse(response: any) {
    expectStandardResponse(response);
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('pagination');
    expect(response.body.data.pagination).toHaveProperty('currentPage');
    expect(response.body.data.pagination).toHaveProperty('totalPages');
    expect(response.body.data.pagination).toHaveProperty('totalItems');
    expect(response.body.data.pagination).toHaveProperty('pageSize');
    expect(response.body.data.pagination).toHaveProperty('hasNextPage');
    expect(response.body.data.pagination).toHaveProperty('hasPrevPage');
}

/**
 * JWT 토큰 생성 (테스트용)
 */
export function generateTestToken(payload: any, secret: string = 'test-secret'): string {
    // 실제로는 jwt.sign을 사용하지만, 테스트에서는 간단한 문자열 반환
    return `Bearer test-token-${JSON.stringify(payload)}`;
}

/**
 * 테스트 데이터 정리
 */
export async function cleanupTestData(model: any, filter: any = {}) {
    await model.deleteMany(filter);
}

/**
 * 컨트롤러 테스트용 앱 초기화
 * Global API prefix 설정 포함
 */
export function initializeTestApp(app: INestApplication): void {
    // Global API prefix 설정 (프로덕션과 동일)
    app.setGlobalPrefix('api');
}
