import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { CategoryAdminController } from '../category-admin.controller';
import { CategoryAdminService } from '../category-admin.service';
import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

describe('CategoryAdminController (e2e)', () => {
    let app: INestApplication;

    const mockCategoryAdminService = {
        findAll: jest.fn(),
        findBySlug: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deactivate: jest.fn(),
        activate: jest.fn(),
        updateOrder: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [CategoryAdminController],
            providers: [
                {
                    provide: CategoryAdminService,
                    useValue: mockCategoryAdminService,
                },
            ],
        })
            .overrideGuard(AdminJwtAuthGuard)
            .useClass(MockAdminJwtAuthGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/category-admin', () => {
        it('should return all categories with total count', async () => {
            mockCategoryAdminService.findAll.mockResolvedValue({
                categories: [
                    {
                        _id: '1',
                        slug: 'chuck',
                        name: 'Chuck',
                        nameKo: '척',
                        level: 1,
                        isActive: true,
                    },
                    {
                        _id: '2',
                        slug: 'nc-rotary-table',
                        name: 'NC Rotary Table',
                        nameKo: 'NC 로터리 테이블',
                        level: 1,
                        isActive: true,
                    },
                ],
                total: 2,
            });

            const response = await request(app.getHttpServer())
                .get('/api/category-admin')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리 목록 조회 성공');
            expect(response.body.data).toHaveProperty('categories');
            expect(response.body.data).toHaveProperty('total');
            expect(Array.isArray(response.body.data.categories)).toBe(true);
            expect(response.body.data.total).toBe(2);
        });

        it('should filter categories by level', async () => {
            mockCategoryAdminService.findAll.mockResolvedValue({
                categories: [
                    {
                        _id: '1',
                        slug: 'chuck',
                        name: 'Chuck',
                        level: 1,
                        isActive: true,
                    },
                ],
                total: 1,
            });

            const response = await request(app.getHttpServer())
                .get('/api/category-admin?level=1')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.data.categories).toHaveLength(1);
        });
    });

    describe('GET /api/category-admin/:slug', () => {
        it('should return category details', async () => {
            const mockCategory = {
                _id: 'category-id',
                slug: 'chuck',
                name: 'Chuck',
                nameKo: '척',
                level: 1,
                order: 1,
                isActive: true,
            };

            mockCategoryAdminService.findBySlug.mockResolvedValue(mockCategory);

            const response = await request(app.getHttpServer())
                .get('/api/category-admin/chuck')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리 조회 성공');
            expect(response.body.data).toHaveProperty('slug', 'chuck');
        });
    });

    describe('POST /api/category-admin', () => {
        it('should create a new category', async () => {
            const createCategoryDto = {
                slug: 'new-category',
                name: 'New Category',
                nameKo: '새 카테고리',
                level: 1,
                order: 1,
                isActive: true,
            };

            mockCategoryAdminService.create.mockResolvedValue({
                _id: 'new-category-id',
                ...createCategoryDto,
            });

            const response = await request(app.getHttpServer())
                .post('/api/category-admin')
                .set('Authorization', 'Bearer mock-token')
                .send(createCategoryDto)
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);
            expect(response.body.message).toBe('카테고리가 생성되었습니다');
            expect(response.body.data).toHaveProperty('slug', 'new-category');
        });
    });

    describe('PATCH /api/category-admin/:slug', () => {
        it('should update category', async () => {
            const updateCategoryDto = {
                name: 'Updated Category',
                nameKo: '업데이트된 카테고리',
            };

            mockCategoryAdminService.update.mockResolvedValue({
                _id: 'category-id',
                slug: 'chuck',
                ...updateCategoryDto,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/category-admin/chuck')
                .set('Authorization', 'Bearer mock-token')
                .send(updateCategoryDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리가 수정되었습니다');
            expect(response.body.data).toHaveProperty('name', 'Updated Category');
        });
    });

    describe('DELETE /api/category-admin/:slug', () => {
        it('should delete category', async () => {
            mockCategoryAdminService.delete.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .delete('/api/category-admin/chuck')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리가 삭제되었습니다');
            expect(response.body.data).toBeNull();
        });
    });

    describe('PATCH /api/category-admin/:slug/deactivate', () => {
        it('should deactivate category', async () => {
            mockCategoryAdminService.deactivate.mockResolvedValue({
                _id: 'category-id',
                slug: 'chuck',
                isActive: false,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/category-admin/chuck/deactivate')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리가 비활성화되었습니다');
            expect(response.body.data).toHaveProperty('isActive', false);
        });
    });

    describe('PATCH /api/category-admin/:slug/activate', () => {
        it('should activate category', async () => {
            mockCategoryAdminService.activate.mockResolvedValue({
                _id: 'category-id',
                slug: 'chuck',
                isActive: true,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/category-admin/chuck/activate')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리가 활성화되었습니다');
            expect(response.body.data).toHaveProperty('isActive', true);
        });
    });

    describe('PATCH /api/category-admin/:slug/order', () => {
        it('should update category order', async () => {
            mockCategoryAdminService.updateOrder.mockResolvedValue({
                _id: 'category-id',
                slug: 'chuck',
                order: 5,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/category-admin/chuck/order')
                .set('Authorization', 'Bearer mock-token')
                .send({ order: 5 })
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리 순서가 변경되었습니다');
            expect(response.body.data).toHaveProperty('order', 5);
        });
    });
});
