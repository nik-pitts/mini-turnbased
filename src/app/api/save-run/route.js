import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  const data = await request.json();
  const dir = path.join(process.cwd(), 'public', 'run');
  await mkdir(dir, { recursive: true });

  const fileName = `run.json`;
  const filePath = path.join(dir, fileName);

  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

  return Response.json({ success: true, file: `/run/${fileName}` });
}