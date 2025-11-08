import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ProductAdminController } from '../product-admin.controller';
import { ProductAdminService } from '../product-admin.service';
import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

describe('ProductAdminController (e2e)', () => {
    let app: INestApplication;

    const mockProductAdminService = {
        findAll: jest.fn(),
        create: jest.fn(),
        findBySlug: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deactivate: jest.fn(),
        activate: jest.fn(),
        updateOrderByLevel: jest.fn(),
        reorderBatch: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ProductAdminController],
            providers: [
                {
                    provide: ProductAdminService,
                    useValue: mockProductAdminService,
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

    describe('GET /api/product-admin', () => {
        it('should return paginated products with admin structure', async () => {
            mockProductAdminService.findAll.mockResolvedValue({
                products: [
                    {
                        _id: '1',
                        slug: 'test-product',
                        productName: 'Test Product',
                        isActive: true,
                    },
                ],
                total: 1,
            });

            const response = await request(app.getHttpServer())
                .get('/api/product-admin?page=1&limit=10')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품 목록 조회 성공');
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
            expect(response.body.data.pagination).toHaveProperty('currentPage');
            expect(response.body.data.pagination).toHaveProperty('totalPages');
            expect(response.body.data.pagination).toHaveProperty('totalItems');
            expect(response.body.data.pagination).toHaveProperty('pageSize');
            expect(response.body.data.pagination).toHaveProperty('hasNextPage');
            expect(response.body.data.pagination).toHaveProperty('hasPrevPage');
        });
    });

    describe('POST /api/product-admin', () => {
        it('should create a new product', async () => {
            const createProductDto = {
                slug: 'new-product',
                productName: 'New Product',
                productNameKo: '새 제품',
                category: {
                    mainCategory: 'Chuck',
                    subCategory: 'Power Chuck',
                    series: 'CK Series',
                },
                isActive: true,
            };

            mockProductAdminService.create.mockResolvedValue({
                _id: 'new-product-id',
                ...createProductDto,
            });

            const response = await request(app.getHttpServer())
                .post('/api/product-admin')
                .set('Authorization', 'Bearer mock-token')
                .send(createProductDto)
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);
            expect(response.body.message).toBe('제품이 생성되었습니다');
            expect(response.body.data).toHaveProperty('slug', 'new-product');
        });
    });

    describe('GET /api/product-admin/:slug', () => {
        it('should return product details', async () => {
            const mockProduct = {
                _id: 'product-id',
                slug: 'test-product',
                productName: 'Test Product',
                productNameKo: '테스트 제품',
                category: {
                    mainCategory: 'Chuck',
                    subCategory: 'Power Chuck',
                    series: 'CK Series',
                },
                isActive: true,
            };

            mockProductAdminService.findBySlug.mockResolvedValue(mockProduct);

            const response = await request(app.getHttpServer())
                .get('/api/product-admin/test-product')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품 조회 성공');
            expect(response.body.data).toHaveProperty('slug', 'test-product');
        });
    });

    describe('PATCH /api/product-admin/:slug', () => {
        it('should update product', async () => {
            const updateProductDto = {
                productName: 'Updated Product',
                productNameKo: '업데이트된 제품',
            };

            mockProductAdminService.update.mockResolvedValue({
                _id: 'product-id',
                slug: 'test-product',
                ...updateProductDto,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/test-product')
                .set('Authorization', 'Bearer mock-token')
                .send(updateProductDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 수정되었습니다');
            expect(response.body.data).toHaveProperty('productName', 'Updated Product');
        });
    });

    describe('DELETE /api/product-admin/:slug', () => {
        it('should delete product', async () => {
            mockProductAdminService.delete.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .delete('/api/product-admin/test-product')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 삭제되었습니다');
            expect(response.body.data).toBeNull();
        });
    });

    describe('PATCH /api/product-admin/:slug/deactivate', () => {
        it('should deactivate product', async () => {
            mockProductAdminService.deactivate.mockResolvedValue({
                _id: 'product-id',
                slug: 'test-product',
                isActive: false,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/test-product/deactivate')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 비활성화되었습니다');
            expect(response.body.data).toHaveProperty('isActive', false);
        });
    });

    describe('PATCH /api/product-admin/:slug/activate', () => {
        it('should activate product', async () => {
            mockProductAdminService.activate.mockResolvedValue({
                _id: 'product-id',
                slug: 'test-product',
                isActive: true,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/test-product/activate')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 활성화되었습니다');
            expect(response.body.data).toHaveProperty('isActive', true);
        });
    });

    describe('PATCH /api/product-admin/product/order', () => {
        it('should update product order by level', async () => {
            const orderDto = {
                slug: 'test-product',
                level: 1,
                categorySlug: 'chuck',
                order: 5,
            };

            mockProductAdminService.updateOrderByLevel.mockResolvedValue({
                _id: 'product-id',
                slug: 'test-product',
                order: 5,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/product/order')
                .set('Authorization', 'Bearer mock-token')
                .send(orderDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품 순서가 업데이트되었습니다');
            expect(response.body.data).toHaveProperty('order', 5);
        });
    });

    describe('PATCH /api/product-admin/category/reorder', () => {
        it('should reorder multiple products in batch', async () => {
            const reorderDto = {
                level: 1,
                categorySlug: 'chuck',
                items: [
                    { slug: 'product-1', order: 0 },
                    { slug: 'product-2', order: 1 },
                    { slug: 'product-3', order: 2 },
                ],
            };

            mockProductAdminService.reorderBatch.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/category/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send(reorderDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('3개 제품의 순서가 업데이트되었습니다');
            expect(response.body.data).toBeNull();
        });
    });
});
