import * as path from 'path';
import * as fs from 'fs';
const formatFileName = (originalName: string): string => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');

  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  return `${timestamp}_${base}${ext}`;
};

const getMimeType = (fileName: string): string => {
  if (fileName.endsWith('.mp4')) return 'video/mp4';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))
    return 'image/jpeg';
  if (fileName.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
};

const deleteFile = async (filePath: string) => {
  try {
    await fs.unlinkSync(filePath);
  } catch (error) {
    console.error(error);
  }
};

const deleteFolder = async (folderPath: string) => {
  try {
    await fs.rmSync(folderPath, { recursive: true, force: true });
  } catch (error) {
    console.error(error);
  }
};

export { formatFileName, getMimeType, deleteFile, deleteFolder };
