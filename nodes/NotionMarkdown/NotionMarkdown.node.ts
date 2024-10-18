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
		displayName: 'Example Node',
		name: 'notionMarkdown',
		group: ['transform'],
		version: 1,
		description: 'Basic Example Node',
		defaults: {
			name: 'Example Node',
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
				displayName: 'Input',
				name: 'input',
				type: 'string',
				default: '',
				placeholder: 'Place your markdown or notion blocks here',
				description: 'The input to be transformed',
			},
			{
				displayName: 'Output Key',
				name: 'outputKey',
				type: 'string',
				default: 'output',
				description: 'Key to use for the output object',
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
		let input: string;
		let outputKey: string;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				operation = this.getNodeParameter('operation', itemIndex, '') as string;
				input = this.getNodeParameter('input', itemIndex, '') as string;
				outputKey = this.getNodeParameter('outputKey', itemIndex, '') as string;
				item = items[itemIndex];

				if (operation === 'markdownToNotion') {
					item.json[outputKey] = await markdownToNotion.call(this, input);
				} else if (operation === 'notionToMarkdown') {
					item.json[outputKey] = await notionToMarkdown.call(this, input);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not known!`,
					);
				}
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
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

async function notionToMarkdown(this: IExecuteFunctions, input: string): Promise<any> {
	const notionBlocks: NotionBlock[] = JSON.parse(input);
	return blocksToMarkdown(notionBlocks);
}
