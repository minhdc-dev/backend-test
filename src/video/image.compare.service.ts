import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import * as fs from 'fs';

@Injectable()
export class ImageCompareService {
  private openai: OpenAI;
  private openaiModel: string;
  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.openaiModel = this.configService.get('OPENAI_MODEL');
  }

  async compareFrameWithLogo(
    logoPath: string,
    framePath: string,
  ): Promise<boolean> {
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
    const frameBase64 = fs.readFileSync(framePath, { encoding: 'base64' });
    const response = await this.openai.chat.completions.create({
      model: this.openaiModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Does this video frame contain the brand shown in the logo? Answer only YES or NO.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${frameBase64}`,
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${logoBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 5,
    });

    const answer = response.choices[0]?.message?.content?.trim().toUpperCase();
    return answer === 'YES';
  }
}
