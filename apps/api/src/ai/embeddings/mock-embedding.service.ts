import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.interface';

@Injectable()
export class MockEmbeddingService implements EmbeddingService {
  private readonly logger = new Logger(MockEmbeddingService.name);
  private readonly dimension = 1536;

  constructor() {
    this.logger.log(`Initialized Mock Embedding Service (dim: ${this.dimension})`);
  }

  getDimension(): number {
    return this.dimension;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateDeterministicVector(t));
  }

  private generateDeterministicVector(text: string): number[] {
    const vec = new Array(this.dimension).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % this.dimension;
      vec[index] += 1;
    }

    // Normalize vector (L2 norm)
    let norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) norm = 1;
    return vec.map((v) => v / norm);
  }
}

