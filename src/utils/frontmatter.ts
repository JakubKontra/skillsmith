import matter from 'gray-matter';

export function parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
  const { data, content: body } = matter(content);
  return { data, body: body.trim() };
}

export function serializeFrontmatter(data: Record<string, unknown>, body: string): string {
  // Filter out undefined values
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }

  if (Object.keys(cleanData).length === 0) {
    return body + '\n';
  }

  return matter.stringify(body + '\n', cleanData);
}
