/**
 * Category 테스트 데이터 팩토리
 */

interface CategoryFactoryOptions {
    name?: string;
    nameKo?: string;
    slug?: string;
    level?: number;
    order?: number;
    isActive?: boolean;
    parentSlug?: string;
}

/**
 * 기본 Category 객체 생성
 */
export function createMockCategory(overrides: CategoryFactoryOptions = {}) {
    const defaults = {
        name: 'Test Category',
        nameKo: '테스트 카테고리',
        slug: 'test-category',
        level: 1,
        order: 0,
        isActive: true,
        parentSlug: null,
    };

    return {
        ...defaults,
        ...overrides,
    };
}

/**
 * Level1 카테고리 생성
 */
export function createMockLevel1Category(slug: string, name: string, order = 0) {
    return createMockCategory({
        name,
        slug,
        level: 1,
        order,
    });
}

/**
 * 여러 카테고리 배치 생성
 */
export function createMockCategories(count: number, baseOverrides: CategoryFactoryOptions = {}): any[] {
    return Array.from({ length: count }, (_, i) =>
        createMockCategory({
            ...baseOverrides,
            name: `${baseOverrides.name || 'Category'} ${i + 1}`,
            slug: `${baseOverrides.slug || 'category'}-${i + 1}`,
            order: i,
        }),
    );
}

/**
 * 자료실 기본 카테고리 세트
 */
export function createDefaultResourceCategories() {
    return [
        createMockLevel1Category('nc-rotary-table', 'NC ROTARY TABLE', 0),
        createMockLevel1Category('vise', 'VISE', 1),
        createMockLevel1Category('chuck', 'CHUCK', 2),
        createMockLevel1Category('cylinder', 'CYLINDER', 3),
        createMockLevel1Category('work-gripper', 'WORK GRIPPER', 4),
    ];
}
