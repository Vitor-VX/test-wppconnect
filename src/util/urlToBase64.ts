import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';

export async function urlToBase64(url: string) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = res.headers.get('content-type');
  const base64Data = `data:${contentType};base64,${base64}`;
  return base64Data;
}

export async function fromUrlToPtt(
  url: string
): Promise<{ base64: string; filename: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Erro ao baixar áudio: ${res.status}`);
  }

  const inputBuffer = Buffer.from(await res.arrayBuffer());
  if (inputBuffer.length === 0) {
    throw new Error('O arquivo baixado está vazio.');
  }

  const convertedBuffer = await new Promise<Buffer>((resolve, reject) => {
    const inputStream = new PassThrough();
    inputStream.end(inputBuffer);

    const outputStream = new PassThrough();
    const chunks: Buffer[] = [];

    outputStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    outputStream.on('end', () => {
      const finalBuffer = Buffer.concat(chunks);
      if (finalBuffer.length === 0) {
        return reject(
          new Error('A conversão do FFmpeg resultou em um arquivo vazio.')
        );
      }
      resolve(finalBuffer);
    });

    ffmpeg(inputStream)
      .audioCodec('libopus')
      .format('ogg')
      .on('error', (err: any) => {
        console.error('[FFMPEG] ERRO no processo FFmpeg:', err.message);
        reject(err);
      })
      .pipe(outputStream, { end: true });
  });

  const base64 = convertedBuffer.toString('base64');
  const filename = url.split('/').pop()?.split('?')[0] || 'audio.ogg';

  return { base64, filename };
}
