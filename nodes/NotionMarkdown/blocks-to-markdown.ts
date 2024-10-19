import * as md from '../utils/md';

import { NotionBlockWithChildren, NotionBlock, Text, Equation, Annotations } from '../types';

export async function blocksToMarkdown(blocks: NotionBlock[]): Promise<string> {
	const nestedBlocks = createNestedBlocks(blocks);

	let markdown = '';

	for (const block of nestedBlocks) {
		markdown += await blockToMarkdown(block);
		markdown += '\n\n';
	}

	return markdown.trim();
}

export async function blockToMarkdown(block: NotionBlockWithChildren): Promise<string> {
	if (typeof block !== 'object' || !('type' in block)) return '';

	let parsedData = '';
	const { type } = block;

	switch (type) {
		case 'image':
			{
				let blockContent = block.image;
				let image_title = 'image';
				const convertImagesToBase64 = false;

				const image_caption_plain = blockContent.caption
					.map((item: any) => item.plain_text)
					.join('');

				const image_type = blockContent.type;
				let link = '';

				if (image_type === 'external') {
					link = blockContent.external.url;
				}

				if (image_type === 'file') {
					link = blockContent.file.url;
				}

				// image caption with high priority
				if (image_caption_plain.trim().length > 0) {
					image_title = image_caption_plain;
				} else if (image_type === 'file' || image_type === 'external') {
					const matches = link.match(/[^\/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/);
					image_title = matches ? matches[0] : image_title;
				}

				return await md.image(image_title, link, convertImagesToBase64);
			}

		case 'divider': {
			return md.divider();
		}

		case 'equation': {
			return md.equation(block.equation.expression);
		}

		case 'video':
		case 'file':
		case 'pdf':
			{
				let blockContent;
				let title: string = type;

				if (type === 'video') blockContent = block.video;
				if (type === 'file') blockContent = block.file;
				if (type === 'pdf') blockContent = block.pdf;

				const caption = blockContent?.caption.map((item: any) => item.plain_text).join('');

				if (blockContent) {
					const file_type = blockContent.type;
					let link = '';
					if (file_type === 'external') link = blockContent.external.url;
					if (file_type === 'file') link = blockContent.file.url;

					if (caption && caption.trim().length > 0) {
						title = caption;
					} else if (link) {
						const matches = link.match(/[^\/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/);
						title = matches ? matches[0] : type;
					}

					return md.link(title, link);
				}
			}
			break;

		case 'bookmark':
		case 'embed':
		case 'link_preview':
		case 'link_to_page':
			{
				let blockContent;
				let title: string = type;
				if (type === 'bookmark') blockContent = block.bookmark;
				if (type === 'embed') blockContent = block.embed;
				if (type === 'link_preview') blockContent = block.link_preview;
				if (type === 'link_to_page' && block.link_to_page.type === 'page_id') {
					blockContent = { url: block.link_to_page.page_id };
				}

				if (blockContent) return md.link(title, blockContent.url);
			}
			break;

		case 'child_page':
			{
				let pageTitle: string = block.child_page.title;

				return md.heading2(pageTitle);
			}
		case 'child_database':
			{
				let pageTitle = block.child_database.title || `child_database`;
				return pageTitle;
			}

		case 'table': {
			const { has_children, children } = block;
			let tableArr: string[][] = [];

			if (has_children && children) {
				for (const row of children) {
					if (row.type === 'table_row') {
						const cells = row.table_row.cells;

						const cellStringArr = cells.map((cell) => {
							let cellText = '';
							for (const textBlock of cell) {
								cellText += annotatePlainText(textBlock.plain_text, textBlock.annotations);
								if (textBlock.href) {
									cellText = md.link(cellText, textBlock.href);
								}
							}
							return cellText;
						});

						tableArr.push(cellStringArr);
					}
				}
			}
			return md.table(tableArr);
		}
		// Rest of the types
		// "paragraph"
		// "heading_1"
		// "heading_2"
		// "heading_3"
		// "bulleted_list_item"
		// "numbered_list_item"
		// "quote"
		// "to_do"
		// "template"
		// "synced_block"
		// "child_page"
		// "child_database"
		// "code"
		// "callout"
		// "breadcrumb"
		// "table_of_contents"
		// "link_to_page"
		// "audio"
		// "unsupported"

		default: {
			// In this case typescript is not able to index the types properly, hence ignoring the error
			// @ts-ignore

			if (block.content) {
				parsedData = block.content;
			} else {
				// @ts-ignore
				let blockContent = block[type]?.text || [];
				blockContent.map((content: Text | Equation) => {
					if (content.type === 'equation') {
						parsedData += md.inlineEquation(content.equation.expression);
						return;
					}

					const annotations = content.annotations;
					let plain_text = content.plain_text;

					plain_text = annotatePlainText(plain_text, annotations);

					if (content['href']) plain_text = md.link(plain_text, content['href']);

					parsedData += plain_text;
				});
			}
		}
	}

	switch (type) {
		case 'code':
			{
				parsedData = md.codeBlock(parsedData, block[type]?.language);
			}
			break;

		case 'heading_1':
			{
				parsedData = md.heading1(parsedData);
			}
			break;

		case 'heading_2':
			{
				parsedData = md.heading2(parsedData);
			}
			break;

		case 'heading_3':
			{
				parsedData = md.heading3(parsedData);
			}
			break;

		case 'quote':
			{
				parsedData = md.quote(parsedData);
			}
			break;

		case 'callout':
			{
				let callout_string = '';

				// Process the main content of the callout
				callout_string += parsedData + '\n\n';

				// Process children if they exist
				if (block.children && block.children.length > 0) {
					const childrenMd = await Promise.all(
						block.children.map(async (child) => {
							const childMd = await blockToMarkdown(child);
							return childMd.replace(/^/gm, '  ');
						}),
					);
					callout_string += childrenMd.join('\n\n');
				}

				parsedData = md.callout(callout_string.trim(), block[type]?.icon);
			}
			break;

		case 'bulleted_list_item':
			{
				parsedData = md.bullet(parsedData);
			}
			break;

		case 'numbered_list_item':
			{
				parsedData = md.bullet(parsedData);
			}
			break;

		case 'to_do':
			{
				parsedData = md.todo(parsedData, block?.to_do?.checked ?? false);
			}
			break;
	}
	// Process children for other block types if necessary
	if (block.children?.length && type !== 'callout') {
		const childrenMd = await Promise.all(
			block.children.map(async (child) => {
				const childMd = await blockToMarkdown(child);
				return childMd.replace(/^/gm, '  ');
			}),
		);
		parsedData += '\n\n' + childrenMd.join('\n\n');
		parsedData = parsedData.trim();
	}

	return parsedData;
}

function createNestedBlocks(blocks: NotionBlock[]): NotionBlockWithChildren[] {
	const blockMap = new Map<string, NotionBlockWithChildren>();
	const rootBlocks: NotionBlockWithChildren[] = [];

	// First pass: Create all blocks and add them to the map
	blocks.forEach((block) => {
		const notionBlock: NotionBlockWithChildren = {
			...block,
			children: [],
		};
		blockMap.set(block.id, notionBlock);
	});

	// Second pass: Establish parent-child relationships
	blocks.forEach((block) => {
		const notionBlock = blockMap.get(block.id)!;

		if (block.parent.type === 'page_id') {
			rootBlocks.push(notionBlock);
		} else if (block.parent.type === 'block_id') {
			const parentBlock = blockMap.get(block.parent.block_id);
			if (parentBlock) {
				(parentBlock.children ??= []).push(notionBlock);
			} else {
				// If parent is not found, treat it as a root block
				rootBlocks.push(notionBlock);
			}
		}
	});

	return rootBlocks;
}

function annotatePlainText(text: string, annotations: Annotations): string {
	// if text is all spaces, don't annotate
	if (text.match(/^\s*$/)) return text;

	const leadingSpaceMatch = text.match(/^(\s*)/);
	const trailingSpaceMatch = text.match(/(\s*)$/);

	const leading_space = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
	const trailing_space = trailingSpaceMatch ? trailingSpaceMatch[0] : '';

	text = text.trim();

	if (text !== '') {
		if (annotations.code) text = md.inlineCode(text);
		if (annotations.bold) text = md.bold(text);
		if (annotations.italic) text = md.italic(text);
		if (annotations.strikethrough) text = md.strikethrough(text);
		if (annotations.underline) text = md.underline(text);
	}

	return leading_space + text + trailing_space;
}
