import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { markdownToBlocks } from '@tryfabric/martian';
import { blocksToMarkdown } from './blocks-to-markdown';

import { NotionBlock } from '../types';

export class NotionMarkdown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Notion Markdown',
		name: 'notionMarkdown',
		icon: 'file:notion-markdown-icon.svg',
		group: ['transform'],
		version: 1,
		description: 'Node to transform markdown and notion blocks',
		defaults: {
			name: 'Notion Markdown',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Markdown to Notion',
						value: 'markdownToNotion',
					},
					{
						name: 'Notion to Markdown',
						value: 'notionToMarkdown',
					},
				],
				default: 'markdownToNotion',
				description: 'Choose whether you want to convert markdown to notion or vice versa',
			},
			{
				displayName: 'Input Markdown',
				name: 'inputMarkdown',
				type: 'string',
				default: '',
				placeholder: 'Place your markdown here',
				description: 'The markdown to be transformed to notion blocks',
				displayOptions: {
					show: {
						operation: [
							'markdownToNotion',
						],
					},
				},
			},
			{
				displayName: 'Input Notion Blocks',
				name: 'inputNotion',
				type: 'string',
				default: '',
				placeholder: 'Place your notion blocks here',
				description: 'The notion blocks to be transformed to markdown',
				displayOptions: {
					show: {
						operation: [
							'notionToMarkdown',
						],
					},
				},
			},
			{
				displayName: 'Output Key',
				name: 'outputKey',
				type: 'string',
				default: 'output',
				description: 'Key to use for the output object',
			},
			{
				displayName: 'Convert Images to Base64',
				name: 'convertImagesToBase64',
				type: 'boolean',
				default: false,
				description: 'Whether to convert images to base64 since Notion URLs expire in 1 hour',
				displayOptions: {
					show: {
						operation: [
							'notionToMarkdown',
						],
					},
				},
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let operation: string;
		let input: string | NotionBlock[];
		let outputKey: string;
		let convertImagesToBase64: boolean;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				operation = this.getNodeParameter('operation', itemIndex, '') as string;
				outputKey = this.getNodeParameter('outputKey', itemIndex, '') as string;
				convertImagesToBase64 = this.getNodeParameter('convertImagesToBase64', itemIndex, false) as boolean;
				item = items[itemIndex];

				if (operation === 'markdownToNotion') {
					// Markdown to Notion Blocks
					input = this.getNodeParameter('inputMarkdown', itemIndex, '') as string;
					item.json[outputKey] = await markdownToNotion.call(this, input);
				} else if (operation === 'notionToMarkdown') {
					// Notion Blocks to Markdown
					input = this.getNodeParameter('inputNotion', itemIndex, '') as NotionBlock[];
					item.json[outputKey] = await notionToMarkdown.call(this, input, convertImagesToBase64);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Create a more informative error message
					const errorMessage = error.message || 'An unknown error occurred';
					throw new NodeOperationError(this.getNode(), `Error processing item ${itemIndex}: ${errorMessage}`, {
						itemIndex,
						description: error.description,
					});
				}
			}
		}
		return this.prepareOutputData(items);
	}
}

async function markdownToNotion(this: IExecuteFunctions, input: string): Promise<any> {
	return markdownToBlocks(input);
}

async function notionToMarkdown(this: IExecuteFunctions, input: NotionBlock[], convertImagesToBase64: boolean = false): Promise<string> {
	const markdown = await blocksToMarkdown(input, convertImagesToBase64);
  return markdown;
}
