import { NotionBlockWithChildren, NotionBlock } from '../types';
import { createNestedBlocks } from '../utils/shared';

export function blocksToBlocks(blocks: NotionBlock[]): any[] {
	const nestedBlocks = createNestedBlocks(blocks);
	return nestedBlocks.map(block => blockToBlock(block));
}

function blockToBlock(inputBlock: NotionBlockWithChildren): any {
	if (typeof inputBlock !== 'object' || !('type' in inputBlock)) return {};

	const { type } = inputBlock;
	let block: any = {
			object: 'block',
			type: type,
			[type]: {}
	};

	// Determine the content source (either [type] or content)
	const content = inputBlock[type as keyof NotionBlockWithChildren] || inputBlock.content;

	if (typeof content === 'object') {
			Object.assign(block[type], content);
	} else if (typeof content === 'string') {
			// Create rich_text for string content
							// Add language property for code blocks if it doesn't exist
			if (type === 'code') {
					block[type].language = 'plain text';
			}
			block[type].rich_text = [{ type: 'text', text: { content: content } }];
	}

	// Convert 'text' to 'rich_text' if it exists
	if ('text' in block[type]) {
			block[type].rich_text = Array.isArray(block[type].text)
					? block[type].text
					: [{ type: 'text', text: { content: block[type].text } }];
			delete block[type].text;
	}

	// Handle children
	if ('children' in inputBlock && Array.isArray(inputBlock.children) && inputBlock.children.length > 0) {
			block[type].children = inputBlock.children.map(child => blockToBlock(child));
	}

	return block;
}
