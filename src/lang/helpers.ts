import { ar } from './locale/ar';
import { cz } from './locale/cz';
import { da } from './locale/da';
import { de } from './locale/de';
import { en } from './locale/en';
import { es } from './locale/es';
import { fr } from './locale/fr';
import { hi } from './locale/hi';
import { id } from './locale/id';
import { it } from './locale/it';
import { ja } from './locale/ja';
import { ko } from './locale/ko';
import { nl } from './locale/nl';
import { no } from './locale/no';
import { pl } from './locale/pl';
import { pt } from './locale/pt';
import { ptBr } from './locale/ptBr';
import { ro } from './locale/ro';
import { ru } from './locale/ru';
import { sq } from './locale/sq';
import { tr } from './locale/tr';
import { uk } from './locale/uk';
import { zh } from './locale/zh';
import { zhTw } from './locale/zhTw';

export const lang: string | null = window.localStorage.getItem('language');

function normalizeLang(value: string | null): string {
	if (!value) return 'en';
	const [language, ...subtags] = value
		.replace(/_/g, '-')
		.toLowerCase()
		.split('-');
	if (language === 'zh') {
		if (subtags.includes('hans')) return 'zh';
		if (subtags.some((subtag) => ['hant', 'tw', 'hk', 'mo'].includes(subtag)))
			return 'zh-TW';
		return 'zh';
	}
	return value;
}

export const normalizedLang: string = normalizeLang(lang);

const localeMap: { [k: string]: Partial<typeof en> } = {
	ar,
	cz,
	da,
	de,
	en,
	es,
	fr,
	hi,
	id,
	it,
	ja,
	ko,
	nl,
	no,
	pl,
	'pt-BR': ptBr,
	pt,
	ro,
	ru,
	sq,
	tr,
	uk,
	'zh-TW': zhTw,
	zh,
};

const locale = localeMap[normalizedLang];

export function t(
	str: keyof typeof en,
	values: Record<string, string> = {}
): string {
	if (!locale) {
		console.error('Error: Style Settings locale not found', normalizedLang);
	}

	const text = (locale && locale[str]) || en[str];
	return Object.entries(values).reduce(
		(result, [name, value]) => result.split(`{{${name}}}`).join(value),
		text
	);
}
