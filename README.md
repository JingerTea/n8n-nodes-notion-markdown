![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# Notion Markdown Node

The Notion Markdown Node is a custom node for n8n that allows you to convert between Markdown and Notion blocks. This node is particularly useful for integrating Markdown content with Notion or extracting Notion content as Markdown.

## Author's Note

I initially started using the minhlucvan/n8n-nodes-notionmd project, but realized that while it supported Markdown to Notion conversion, the Notion to Markdown functionality was incomplete. The purpose of this project is to provide a more comprehensive solution that fully supports bidirectional conversion between Markdown and Notion blocks, addressing the limitations of the original implementation.

## Features

- Convert Markdown to Notion blocks
- Convert Notion blocks to Markdown
- Option to convert images to base64 when converting from Notion to Markdown

## Operations

### 1. Markdown to Notion

Converts Markdown text into Notion blocks.

**Input:**
- `inputMarkdown`: The Markdown text to be converted

**Output:**
- Notion blocks in JSON format

### 2. Notion to Markdown

Converts Notion blocks into Markdown text.

**Input:**
- `inputNotion`: The Notion blocks in JSON format to be converted

**Options:**
- `convertImagesToBase64`: When enabled, converts image URLs to base64 strings (useful since Notion URLs expire after 1 hour)

**Output:**
- Markdown text

## Configuration

- `Operation`: Choose between 'Markdown to Notion' or 'Notion to Markdown'
- `Input Markdown` or `Input Notion Blocks`: The input content to be converted
- `Output Key`: The key to use for the output in the JSON object
- `Convert Images to Base64`: (Notion to Markdown only) Option to convert image URLs to base64

## Usage

1. Add the Notion Markdown node to your n8n workflow
2. Configure the node by selecting the operation and providing the necessary input
3. Connect the node to your workflow
4. Run the workflow to convert between Markdown and Notion blocks

## Note

This node uses the `@tryfabric/martian` library for Markdown to Notion conversion and a custom `blocksToMarkdown` function for Notion to Markdown conversion.

## Dependencies

- n8n-workflow
- @tryfabric/martian

## Acknowledgment

This project is inspired & based on the great work of:
- https://github.com/minhlucvan/n8n-nodes-notionmd, minhlucvan/n8n-nodes-notionmd
- https://github.com/souvikinator/notion-to-md, souvikinator/notion-to-md
