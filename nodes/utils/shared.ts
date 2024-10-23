import { NotionBlock, NotionBlockWithChildren } from '../types';

export function createNestedBlocks(blocks: NotionBlock[]): NotionBlockWithChildren[] {
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
