import { ResourceType } from '../../src/schemas/resource.schema';

/**
 * Resource 테스트 데이터 팩토리
 *
 * 베스트 프랙티스: 테스트 데이터 생성 책임을 별도로 분리
 * - 하드코딩 방지
 * - 재사용성 향상
 * - 유지보수 용이
 */

interface ResourceFactoryOptions {
    title?: string;
    titleKo?: string;
    type?: ResourceType;
    categories?: string[];
    tags?: string[];
    fileUrl?: string;
    fileName?: string;
    thumbnailUrl?: string;
    productName?: string;
    model?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    order?: number;
}

/**
 * 기본 Resource 객체 생성
 */
export function createMockResource(overrides: ResourceFactoryOptions = {}) {
    const defaults = {
        title: 'Test Resource',
        titleKo: '테스트 자료',
        type: ResourceType.CATALOG,
        categories: ['chuck'],
        tags: ['test'],
        file: {
            url: 'http://example.com/test.pdf',
            fileName: 'test.pdf',
        },
        thumbnailUrl: 'http://example.com/test.jpg',
        metadata: {
            productName: 'Test Product',
            model: 'TEST001',
        },
        isActive: true,
        isFeatured: false,
        order: 0,
        viewCount: 0,
        downloadCount: 0,
    };

    return {
        ...defaults,
        title: overrides.title || defaults.title,
        titleKo: overrides.titleKo || defaults.titleKo,
        type: overrides.type || defaults.type,
        categories: overrides.categories || defaults.categories,
        tags: overrides.tags || defaults.tags,
        file: {
            url: overrides.fileUrl || defaults.file.url,
            fileName: overrides.fileName || defaults.file.fileName,
        },
        thumbnailUrl: overrides.thumbnailUrl || defaults.thumbnailUrl,
        metadata: {
            productName: overrides.productName || defaults.metadata.productName,
            model: overrides.model || defaults.metadata.model,
        },
        isActive: overrides.isActive !== undefined ? overrides.isActive : defaults.isActive,
        isFeatured: overrides.isFeatured !== undefined ? overrides.isFeatured : defaults.isFeatured,
        order: overrides.order !== undefined ? overrides.order : defaults.order,
        viewCount: defaults.viewCount,
        downloadCount: defaults.downloadCount,
    };
}

/**
 * PDF Resource 생성
 */
export function createMockPdfResource(overrides: ResourceFactoryOptions = {}) {
    return createMockResource({
        ...overrides,
        fileUrl: 'http://example.com/test.pdf',
        fileName: 'test.pdf',
    });
}

/**
 * DWG Resource 생성
 */
export function createMockDwgResource(overrides: ResourceFactoryOptions = {}) {
    return createMockResource({
        ...overrides,
        fileUrl: 'http://example.com/test.dwg',
        fileName: 'test.dwg',
    });
}

/**
 * 같은 모델의 PDF + DWG 쌍 생성
 */
export function createMockResourcePair(model: string, productName: string) {
    const base = {
        productName,
        model,
        thumbnailUrl: `http://example.com/${model}.jpg`,
    };

    return {
        pdf: createMockPdfResource(base),
        dwg: createMockDwgResource(base),
    };
}

/**
 * 여러 Resource 배치 생성
 */
export function createMockResources(count: number, baseOverrides: ResourceFactoryOptions = {}): any[] {
    return Array.from({ length: count }, (_, i) =>
        createMockResource({
            ...baseOverrides,
            title: `${baseOverrides.title || 'Test Resource'} ${i + 1}`,
            model: `${baseOverrides.model || 'TEST'}${String(i + 1).padStart(3, '0')}`,
        }),
    );
}

/**
 * 그룹화된 Resource 응답 생성 (API 응답용)
 */
export function createMockGroupedResourceResponse(items: any[], currentPage = 1, totalItems?: number) {
    const itemsPerPage = 50;
    const total = totalItems || items.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
        items,
        pagination: {
            currentPage,
            totalPages,
            totalItems: total,
            itemsPerPage,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
    };
}
