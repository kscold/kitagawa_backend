import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

import { ProductAdminController } from '../product-admin.controller';

import { ProductAdminService } from '../product-admin.service';

describe('ProductAdminController (e2e)', () => {
    let app: INestApplication;

    const mockProductAdminService = {
        findLevel1Categories: jest.fn(),
        reorderLevel1Categories: jest.fn(),
        findCategoryWithSubCategories: jest.fn(),
        updateLevel1Category: jest.fn(),
        reorderSubCategories: jest.fn(),
        updateLevel2Category: jest.fn(),
        findSubCategoryWithProducts: jest.fn(),
        reorderProducts: jest.fn(),
        updateLevel3Product: jest.fn(),
        createProduct: jest.fn(),
        deleteProduct: jest.fn(),
        getProductBySlug: jest.fn(),
        updateProductFiles: jest.fn(),
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

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ────────────────────────────────────────────────
    // Level 1 카테고리
    // ────────────────────────────────────────────────

    describe('GET /api/product-admin/level1', () => {
        it('Level 1 카테고리 목록을 반환한다', async () => {
            const mockCategories = [
                { slug: 'chuck', name: 'CHUCK', order: 0 },
                { slug: 'vise', name: 'VISE', order: 1 },
            ];

            mockProductAdminService.findLevel1Categories.mockResolvedValue(mockCategories);

            const response = await request(app.getHttpServer())
                .get('/api/product-admin/level1')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리 목록 조회 성공');
            expect(response.body.data).toEqual(mockCategories);
        });
    });

    describe('PATCH /api/product-admin/level1/reorder', () => {
        it('Level 1 카테고리 순서를 변경한다', async () => {
            const reorderBody = {
                items: [
                    { slug: 'chuck', order: 0 },
                    { slug: 'vise', order: 1 },
                ],
            };
            const updatedCategories = [
                { slug: 'chuck', name: 'CHUCK', order: 0 },
                { slug: 'vise', name: 'VISE', order: 1 },
            ];

            mockProductAdminService.reorderLevel1Categories.mockResolvedValue(undefined);
            mockProductAdminService.findLevel1Categories.mockResolvedValue(updatedCategories);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level1/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send(reorderBody)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리 순서가 업데이트되었습니다');
            expect(response.body.data).toEqual(updatedCategories);
        });

        it('items 배열이 없으면 400을 반환한다', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level1/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send({})
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toBe('items 배열이 필요합니다');
        });
    });

    describe('PATCH /api/product-admin/level1/:slug', () => {
        it('Level 1 카테고리 정보를 수정한다', async () => {
            const updatedCategory = { slug: 'chuck', name: 'CHUCK UPDATED', isActive: true };

            mockProductAdminService.updateLevel1Category.mockResolvedValue(updatedCategory);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level1/chuck')
                .set('Authorization', 'Bearer mock-token')
                .send({ name: 'CHUCK UPDATED', isActive: true })
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('카테고리가 수정되었습니다');
            expect(response.body.data).toEqual(updatedCategory);
        });
    });

    // ────────────────────────────────────────────────
    // Level 2 서브카테고리
    // ────────────────────────────────────────────────

    describe('GET /api/product-admin/level2/:categorySlug', () => {
        it('Level 2 서브카테고리 목록을 반환한다', async () => {
            const mockData = {
                category: { slug: 'chuck', name: 'CHUCK' },
                subCategories: [
                    { slug: 'chuck-power-chuck', name: 'Power Chuck', order: 0 },
                    { slug: 'chuck-hydraulic', name: 'Hydraulic Chuck', order: 1 },
                ],
            };

            mockProductAdminService.findCategoryWithSubCategories.mockResolvedValue(mockData);

            const response = await request(app.getHttpServer())
                .get('/api/product-admin/level2/chuck')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('서브카테고리 목록 조회 성공');
            expect(response.body.data).toEqual(mockData);
            expect(mockProductAdminService.findCategoryWithSubCategories).toHaveBeenCalledWith('chuck');
        });
    });

    describe('PATCH /api/product-admin/level2/:categorySlug/reorder', () => {
        it('Level 2 서브카테고리 순서를 변경한다', async () => {
            const reorderBody = {
                items: [
                    { slug: 'chuck-power-chuck', order: 0 },
                    { slug: 'chuck-hydraulic', order: 1 },
                ],
            };
            const updatedData = {
                category: { slug: 'chuck', name: 'CHUCK' },
                subCategories: reorderBody.items,
            };

            mockProductAdminService.reorderSubCategories.mockResolvedValue(undefined);
            mockProductAdminService.findCategoryWithSubCategories.mockResolvedValue(updatedData);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level2/chuck/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send(reorderBody)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('서브카테고리 순서가 업데이트되었습니다');
            expect(response.body.data).toEqual(updatedData);
        });

        it('items 배열이 없으면 400을 반환한다', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level2/chuck/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send({})
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('PATCH /api/product-admin/level2/:slug', () => {
        it('Level 2 서브카테고리 정보를 수정한다', async () => {
            const updatedSubCategory = {
                slug: 'chuck-power-chuck',
                name: 'Power Chuck Updated',
                isActive: true,
            };

            mockProductAdminService.updateLevel2Category.mockResolvedValue(updatedSubCategory);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level2/chuck-power-chuck')
                .set('Authorization', 'Bearer mock-token')
                .send({ name: 'Power Chuck Updated', isActive: true })
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('서브카테고리가 수정되었습니다');
            expect(response.body.data).toEqual(updatedSubCategory);
        });
    });

    // ────────────────────────────────────────────────
    // Level 3 제품
    // ────────────────────────────────────────────────

    describe('GET /api/product-admin/level3/:subCategorySlug', () => {
        it('Level 3 제품 목록을 페이지네이션과 함께 반환한다', async () => {
            const mockData = {
                subCategory: { slug: 'chuck-power-chuck', name: 'Power Chuck' },
                products: [{ slug: 'ck-r', productName: 'CK-R', order: 0 }],
                pagination: { page: 1, limit: 20, total: 1 },
            };

            mockProductAdminService.findSubCategoryWithProducts.mockResolvedValue(mockData);

            const response = await request(app.getHttpServer())
                .get('/api/product-admin/level3/chuck-power-chuck?page=1&limit=20')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('서브카테고리 제품 목록 조회 성공');
            expect(response.body.data).toEqual(mockData);
            expect(mockProductAdminService.findSubCategoryWithProducts).toHaveBeenCalledWith('chuck-power-chuck', {
                page: 1,
                limit: 20,
            });
        });

        it('page/limit 파라미터가 없으면 기본값 1, 20을 사용한다', async () => {
            mockProductAdminService.findSubCategoryWithProducts.mockResolvedValue({});

            await request(app.getHttpServer())
                .get('/api/product-admin/level3/chuck-power-chuck')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expect(mockProductAdminService.findSubCategoryWithProducts).toHaveBeenCalledWith('chuck-power-chuck', {
                page: 1,
                limit: 20,
            });
        });
    });

    describe('PATCH /api/product-admin/level3/:subCategorySlug/reorder', () => {
        it('Level 3 제품 순서를 변경한다', async () => {
            const reorderBody = {
                items: [
                    { slug: 'ck-r', order: 0 },
                    { slug: 'ck-s', order: 1 },
                ],
            };

            mockProductAdminService.reorderProducts.mockResolvedValue(undefined);
            mockProductAdminService.findSubCategoryWithProducts.mockResolvedValue({
                subCategory: { slug: 'chuck-power-chuck' },
                products: reorderBody.items,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level3/chuck-power-chuck/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send(reorderBody)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품 순서가 업데이트되었습니다');
            expect(mockProductAdminService.reorderProducts).toHaveBeenCalledWith(
                'chuck-power-chuck',
                reorderBody.items,
            );
        });

        it('items 배열이 없으면 400을 반환한다', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level3/chuck-power-chuck/reorder')
                .set('Authorization', 'Bearer mock-token')
                .send({})
                .expect(HttpStatus.OK);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('PATCH /api/product-admin/level3/:slug', () => {
        it('Level 3 제품 정보를 수정한다', async () => {
            const updateBody = {
                productName: 'CK-R Updated',
                isActive: true,
            };
            const updatedProduct = { slug: 'ck-r', ...updateBody };

            mockProductAdminService.updateLevel3Product.mockResolvedValue(updatedProduct);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/level3/ck-r')
                .set('Authorization', 'Bearer mock-token')
                .send(updateBody)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 수정되었습니다');
            expect(response.body.data).toEqual(updatedProduct);
        });
    });

    // ────────────────────────────────────────────────
    // 제품 CRUD
    // ────────────────────────────────────────────────

    describe('POST /api/product-admin', () => {
        it('제품을 새로 등록한다', async () => {
            const createBody = {
                slug: 'quinte-controller',
                productName: 'Quinte Controller',
                category: {
                    mainCategory: 'NC ROTARY TABLE',
                    subCategory: '퀸테 컨트롤러',
                    series: 'Quinte Series',
                },
            };
            const createdProduct = { _id: 'new-id', ...createBody };

            mockProductAdminService.createProduct.mockResolvedValue(createdProduct);

            const response = await request(app.getHttpServer())
                .post('/api/product-admin')
                .set('Authorization', 'Bearer mock-token')
                .send(createBody)
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);
            expect(response.body.message).toBe('제품이 등록되었습니다');
            expect(response.body.data).toHaveProperty('slug', 'quinte-controller');
            expect(mockProductAdminService.createProduct).toHaveBeenCalledWith(createBody);
        });
    });

    describe('DELETE /api/product-admin/:slug', () => {
        it('제품을 삭제한다', async () => {
            mockProductAdminService.deleteProduct.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .delete('/api/product-admin/quinte-controller')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 삭제되었습니다');
            expect(response.body.data).toBeNull();
            expect(mockProductAdminService.deleteProduct).toHaveBeenCalledWith('quinte-controller');
        });
    });

    describe('GET /api/product-admin/products/:slug', () => {
        it('단일 제품 상세 정보를 반환한다', async () => {
            const mockProduct = {
                _id: 'product-id',
                slug: 'ck-r',
                productName: 'CK-R',
                isActive: true,
            };

            mockProductAdminService.getProductBySlug.mockResolvedValue(mockProduct);

            const response = await request(app.getHttpServer())
                .get('/api/product-admin/products/ck-r')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품 조회 성공');
            expect(response.body.data).toEqual(mockProduct);
            expect(mockProductAdminService.getProductBySlug).toHaveBeenCalledWith('ck-r');
        });
    });

    describe('PATCH /api/product-admin/products/:slug', () => {
        it('단일 제품 정보를 수정한다', async () => {
            const updateBody = { productName: 'CK-R Updated', isActive: false };
            const updatedProduct = { slug: 'ck-r', ...updateBody };

            mockProductAdminService.updateLevel3Product.mockResolvedValue(updatedProduct);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/products/ck-r')
                .set('Authorization', 'Bearer mock-token')
                .send(updateBody)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품이 수정되었습니다');
            expect(response.body.data).toEqual(updatedProduct);
            expect(mockProductAdminService.updateLevel3Product).toHaveBeenCalledWith('ck-r', updateBody);
        });
    });

    describe('PATCH /api/product-admin/:slug/files', () => {
        it('제품 자료 파일을 업데이트한다', async () => {
            const filesBody = {
                files: [
                    {
                        type: 'PDF',
                        category: 'Catalog',
                        title: 'CK-R Catalog',
                        url: 'https://cdn.example.com/ck-r.pdf',
                    },
                ],
            };
            const updatedProduct = { slug: 'ck-r', downloads: filesBody.files };

            mockProductAdminService.updateProductFiles.mockResolvedValue(updatedProduct);

            const response = await request(app.getHttpServer())
                .patch('/api/product-admin/ck-r/files')
                .set('Authorization', 'Bearer mock-token')
                .send(filesBody)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('제품 자료가 업데이트되었습니다');
            expect(response.body.data).toEqual(updatedProduct);
            expect(mockProductAdminService.updateProductFiles).toHaveBeenCalledWith('ck-r', filesBody.files);
        });
    });
});
