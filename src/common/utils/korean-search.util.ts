/**
 * 한글 검색 유틸리티
 * - 자음 검색 지원 (예: "ㅊㅋ" → "척", "초콜릿" 등 매칭)
 * - 초성, 중성, 종성 분해/조합
 */

// 한글 유니코드 범위
const HANGUL_START = 0xac00; // '가'
const HANGUL_END = 0xd7a3; // '힣'

// 초성, 중성, 종성
const CHOSUNG_LIST = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
];

const JUNGSUNG_LIST = [
    'ㅏ',
    'ㅐ',
    'ㅑ',
    'ㅒ',
    'ㅓ',
    'ㅔ',
    'ㅕ',
    'ㅖ',
    'ㅗ',
    'ㅘ',
    'ㅙ',
    'ㅚ',
    'ㅛ',
    'ㅜ',
    'ㅝ',
    'ㅞ',
    'ㅟ',
    'ㅠ',
    'ㅡ',
    'ㅢ',
    'ㅣ',
];

const JONGSUNG_LIST = [
    '',
    'ㄱ',
    'ㄲ',
    'ㄳ',
    'ㄴ',
    'ㄵ',
    'ㄶ',
    'ㄷ',
    'ㄹ',
    'ㄺ',
    'ㄻ',
    'ㄼ',
    'ㄽ',
    'ㄾ',
    'ㄿ',
    'ㅀ',
    'ㅁ',
    'ㅂ',
    'ㅄ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
];

/**
 * 한글 문자가 완성형 한글인지 확인
 */
export function isHangul(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= HANGUL_START && code <= HANGUL_END;
}

/**
 * 한글 문자가 자음인지 확인
 */
export function isChosung(char: string): boolean {
    return CHOSUNG_LIST.includes(char);
}

/**
 * 한글 문자를 초성, 중성, 종성으로 분해
 */
export function disassembleHangul(char: string): { cho: string; jung: string; jong: string } | null {
    if (!isHangul(char)) {
        return null;
    }

    const code = char.charCodeAt(0) - HANGUL_START;

    const jongIdx = code % 28;
    const jungIdx = ((code - jongIdx) / 28) % 21;
    const choIdx = ((code - jongIdx) / 28 - jungIdx) / 21;

    return {
        cho: CHOSUNG_LIST[choIdx],
        jung: JUNGSUNG_LIST[jungIdx],
        jong: JONGSUNG_LIST[jongIdx],
    };
}

/**
 * 문자열에서 초성만 추출
 */
export function extractChosung(text: string): string {
    return text
        .split('')
        .map((char) => {
            if (isHangul(char)) {
                const decomposed = disassembleHangul(char);
                return decomposed ? decomposed.cho : char;
            }
            return char;
        })
        .join('');
}

/**
 * 검색 키워드가 자음 검색인지 확인
 */
export function isChosungSearch(keyword: string): boolean {
    return keyword.split('').every((char) => isChosung(char) || char === ' ');
}

/**
 * 자음 검색을 위한 정규식 패턴 생성
 * 예: "ㅊㅋ" → /^[차-칳][카-킿]/
 */
export function createChosungPattern(keyword: string): string {
    const patterns = keyword.split('').map((char) => {
        if (isChosung(char)) {
            const choIdx = CHOSUNG_LIST.indexOf(char);
            const startCode = HANGUL_START + choIdx * 21 * 28;
            const endCode = startCode + 21 * 28 - 1;

            // 유니코드 범위를 문자로 변환
            const startChar = String.fromCharCode(startCode);
            const endChar = String.fromCharCode(endCode);

            return `[${startChar}-${endChar}]`;
        } else if (char === ' ') {
            return '\\s*';
        } else {
            // 영어, 숫자 등은 그대로
            return char;
        }
    });

    return patterns.join('');
}

/**
 * 검색 키워드에 맞는 MongoDB 쿼리 생성
 */
export function createSearchQuery(keyword: string): any {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
        return {};
    }

    // 1. 자음 검색인 경우
    if (isChosungSearch(trimmedKeyword)) {
        const pattern = createChosungPattern(trimmedKeyword);
        return { $regex: pattern, $options: 'i' };
    }

    // 2. 일반 검색 (영어, 한글 혼합)
    // 대소문자 구분 없이, 부분 일치 검색
    return { $regex: trimmedKeyword, $options: 'i' };
}

/**
 * 텍스트가 검색 키워드와 매칭되는지 확인 (정확도 계산용)
 * @returns 0-100 사이의 점수 (높을수록 정확히 매칭)
 */
export function calculateMatchScore(text: string, keyword: string): number {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // 1. 완전 일치 (100점)
    if (lowerText === lowerKeyword) {
        return 100;
    }

    // 2. 시작 일치 (90점)
    if (lowerText.startsWith(lowerKeyword)) {
        return 90;
    }

    // 3. 자음 완전 일치 (80점)
    if (isChosungSearch(keyword)) {
        const textChosung = extractChosung(text);
        if (textChosung === keyword) {
            return 80;
        }
    }

    // 4. 단어 시작 일치 (70점)
    const words = lowerText.split(/[\s-_]/);
    if (words.some((word) => word.startsWith(lowerKeyword))) {
        return 70;
    }

    // 5. 포함 (60점)
    if (lowerText.includes(lowerKeyword)) {
        return 60;
    }

    // 6. 자음 부분 일치 (50점)
    if (isChosungSearch(keyword)) {
        const textChosung = extractChosung(text);
        if (textChosung.includes(keyword)) {
            return 50;
        }
    }

    // 7. 매칭 없음 (0점)
    return 0;
}
