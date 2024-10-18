// Source: https://github.com/souvikinator/notion-to-md/blob/master/src/utils/notion.ts

import { BlockObjectResponse } from './notion-sdk.types';

export type Annotations = {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color:
		| 'default'
		| 'gray'
		| 'brown'
		| 'orange'
		| 'yellow'
		| 'green'
		| 'blue'
		| 'purple'
		| 'pink'
		| 'red'
		| 'gray_background'
		| 'brown_background'
		| 'orange_background'
		| 'yellow_background'
		| 'green_background'
		| 'blue_background'
		| 'purple_background'
		| 'pink_background'
		| 'red_background';
};

export type TextRequest = string;

export type Text = {
	type: 'text';
	text: {
		content: string;
		link: {
			url: TextRequest;
		} | null;
	};
	annotations: Annotations;
	plain_text: string;
	href: string | null;
};

export type Equation = {
	type: 'equation';
	equation: {
		expression: string;
	};
	annotations: {
		bold: false;
		italic: false;
		strikethrough: false;
		underline: false;
		code: false;
		color: 'default';
	};
	plain_text: string;
	href: null;
};

export type CalloutIcon =
	| { type: 'emoji'; emoji?: string }
	| { type: 'external'; external?: { url: string } }
	| { type: 'file'; file: { url: string; expiry_time: string } }
	| null;

export type NotionBlock = BlockObjectResponse & {
	parent_id: string;
	root_id?: string;
};

export type NotionBlockWithChildren = NotionBlock & {
	children?: NotionBlockWithChildren[];
};
