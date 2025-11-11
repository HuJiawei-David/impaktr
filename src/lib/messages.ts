export interface ParsedMessageContent {
  text?: string;
  url?: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

function extractFileName(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const decoded = decodeURIComponent(url);
    const path = decoded.split('?')[0];
    const segments = path.split('/');
    return segments[segments.length - 1] || undefined;
  } catch {
    const fallbackSegments = url.split('?')[0]?.split('/');
    return fallbackSegments?.[fallbackSegments.length - 1] || undefined;
  }
}

export function parseMessageContent(raw: string | null | undefined): ParsedMessageContent {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: ParsedMessageContent = {};
      if (typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
        result.text = parsed.text;
      }
      if (typeof parsed.url === 'string' && parsed.url.length > 0) {
        result.url = parsed.url;
      }
      if (typeof parsed.name === 'string' && parsed.name.length > 0) {
        result.name = parsed.name;
      }
      if (typeof parsed.mimeType === 'string' && parsed.mimeType.length > 0) {
        result.mimeType = parsed.mimeType;
      }
      if (typeof parsed.size === 'number' && Number.isFinite(parsed.size)) {
        result.size = parsed.size;
      }

      if (!result.name) {
        result.name = extractFileName(result.url);
      }

      return result;
    }
  } catch {
    // Fall through to default handling
  }

  return { text: raw };
}

export function getMessagePreview(message: { type?: string | null; content: string }): string {
  const parsed = parseMessageContent(message.content);
  const baseName =
    parsed.name || extractFileName(parsed.url) || (parsed.url ? 'Attachment' : undefined);

  switch (message.type) {
    case 'IMAGE':
      if (parsed.text && parsed.text.trim().length > 0) {
        return parsed.text;
      }
      return baseName ? `📷 ${baseName}` : '📷 Image';
    case 'FILE':
      if (parsed.text && parsed.text.trim().length > 0) {
        return parsed.text;
      }
      return baseName ? `📎 ${baseName}` : '📎 File';
    default:
      return parsed.text || '';
  }
}

